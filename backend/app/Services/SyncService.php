<?php

namespace App\Services;

use App\Models\DiaryEntry;
use App\Models\FoodItem;
use App\Models\GlobalFoodItem;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\UserProfile;
use App\Models\WaterEntry;
use App\Models\WeightEntry;
use App\Support\Sync\SyncableTable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class SyncService
{
    private const PROFILE_FIELDS = [
        'name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'goal',
        'calorie_goal', 'protein_goal_g', 'carbs_goal_g', 'fat_goal_g', 'unit_system',
        'water_goal_ml', 'dark_mode', 'adaptive_calories_enabled',
        'adaptive_calories_last_adjusted_at', 'adaptive_calories_last_delta_kcal', 'locale',
    ];

    /**
     * @return SyncableTable[]
     */
    public function tables(): array
    {
        return [
            new SyncableTable('food_items', FoodItem::class, [
                'name', 'brand', 'barcode', 'calories_per_100g', 'protein_per_100g',
                'carbs_per_100g', 'fat_per_100g', 'fiber_per_100g', 'sugar_per_100g',
                'source', 'is_favorite', 'last_used_at',
            ]),
            new SyncableTable('recipes', Recipe::class, [
                'name', 'description', 'servings', 'image_url',
            ]),
            new SyncableTable('recipe_ingredients', RecipeIngredient::class, [
                'recipe_id', 'food_item_id', 'amount_g',
            ]),
            new SyncableTable('diary_entries', DiaryEntry::class, [
                'date', 'meal_type', 'food_item_id', 'recipe_id', 'amount_g', 'servings',
                'calories_total', 'protein_total_g', 'carbs_total_g', 'fat_total_g', 'logged_at',
            ]),
            new SyncableTable('weight_entries', WeightEntry::class, [
                'date', 'weight_kg', 'note',
            ]),
            new SyncableTable('water_entries', WaterEntry::class, [
                'date', 'amount_ml', 'logged_at',
            ]),
        ];
    }

    /**
     * Upsert incoming rows for one table, resolving conflicts via last-write-wins on `updated_at`.
     *
     * @return array<int, array{id: ?string, status: string, server?: array}>
     */
    public function pushRows(SyncableTable $table, int $userId, array $rows): array
    {
        $results = [];

        foreach ($rows as $row) {
            if (! is_array($row) || empty($row['id']) || empty($row['updated_at'])) {
                $results[] = ['id' => $row['id'] ?? null, 'status' => 'invalid'];

                continue;
            }

            /** @var Model|null $existing */
            $existing = $table->modelClass::query()
                ->where('id', $row['id'])
                ->where('user_id', $userId)
                ->first();

            $incomingUpdatedAt = Carbon::parse($row['updated_at']);

            if ($existing && $incomingUpdatedAt->lessThanOrEqualTo($existing->client_updated_at)) {
                $results[] = ['id' => $row['id'], 'status' => 'superseded', 'server' => $this->serialize($table, $existing)];

                continue;
            }

            $attributes = Arr::only($row, $table->fillableFields);
            $attributes['client_updated_at'] = $incomingUpdatedAt;
            $attributes['deleted_at'] = $row['deleted_at'] ?? null;
            $attributes['user_id'] = $userId;

            $table->modelClass::query()->updateOrCreate(
                ['id' => $row['id'], 'user_id' => $userId],
                $attributes,
            );

            $results[] = ['id' => $row['id'], 'status' => 'applied'];
        }

        return $results;
    }

    /**
     * Queues newly-pushed, manually-entered food items for admin review in the global database.
     * Only fires once per local food item (deduped via `source_food_item_id`) and never for
     * items sourced from Open Food Facts, a barcode link, or the global database itself.
     *
     * @param  array<int, array<string, mixed>>  $rows  The raw request rows for the food_items table
     * @param  array<int, array{id: ?string, status: string}>  $results  This table's push results
     */
    public function submitManualFoodItemsToGlobalDatabase(int $userId, array $rows, array $results): void
    {
        $appliedIds = collect($results)
            ->where('status', 'applied')
            ->pluck('id')
            ->filter()
            ->all();

        if (empty($appliedIds)) {
            return;
        }

        $rowsById = collect($rows)->keyBy('id');

        foreach ($appliedIds as $id) {
            $row = $rowsById->get($id);
            if (! $row || ($row['source'] ?? null) !== 'manual') {
                continue;
            }

            $alreadySubmitted = GlobalFoodItem::query()->where('source_food_item_id', $id)->exists();
            if ($alreadySubmitted) {
                continue;
            }

            GlobalFoodItem::query()->create([
                'id' => (string) Str::uuid(),
                'name' => $row['name'] ?? '',
                'brand' => $row['brand'] ?? null,
                'barcode' => $row['barcode'] ?? null,
                'calories_per_100g' => $row['calories_per_100g'] ?? 0,
                'protein_per_100g' => $row['protein_per_100g'] ?? 0,
                'carbs_per_100g' => $row['carbs_per_100g'] ?? 0,
                'fat_per_100g' => $row['fat_per_100g'] ?? 0,
                'fiber_per_100g' => $row['fiber_per_100g'] ?? null,
                'sugar_per_100g' => $row['sugar_per_100g'] ?? null,
                'status' => 'pending',
                'submitted_by' => $userId,
                'source_food_item_id' => $id,
            ]);
        }
    }

    /**
     * @return array<int, array>
     */
    public function pullRows(SyncableTable $table, int $userId, ?Carbon $since): array
    {
        return $table->modelClass::query()
            ->where('user_id', $userId)
            ->when($since, fn ($query) => $query->where('updated_at', '>', $since))
            ->get()
            ->map(fn (Model $model) => $this->serialize($table, $model))
            ->all();
    }

    public function pushProfile(int $userId, array $data): array
    {
        if (empty($data['id']) || empty($data['updated_at'])) {
            return ['status' => 'invalid'];
        }

        $existing = UserProfile::query()->where('user_id', $userId)->first();
        $incomingUpdatedAt = Carbon::parse($data['updated_at']);

        if ($existing && $incomingUpdatedAt->lessThanOrEqualTo($existing->client_updated_at)) {
            return ['status' => 'superseded', 'server' => $this->serializeProfile($existing)];
        }

        $attributes = Arr::only($data, self::PROFILE_FIELDS);
        $attributes['client_updated_at'] = $incomingUpdatedAt;
        $attributes['deleted_at'] = $data['deleted_at'] ?? null;

        // Each device generates its own local profile UUID, but `user_id` is the true
        // one-per-account identity — look up (and keep) the profile by user_id, not id,
        // so a second device syncing the same account updates the existing row instead
        // of colliding with the unique user_id constraint on insert.
        if ($existing) {
            $existing->update($attributes);
        } else {
            UserProfile::query()->create(array_merge($attributes, [
                'id' => $data['id'],
                'user_id' => $userId,
            ]));
        }

        return ['status' => 'applied'];
    }

    public function pullProfile(int $userId, ?Carbon $since): ?array
    {
        $profile = UserProfile::query()
            ->where('user_id', $userId)
            ->when($since, fn ($query) => $query->where('updated_at', '>', $since))
            ->first();

        return $profile ? $this->serializeProfile($profile) : null;
    }

    private function serialize(SyncableTable $table, Model $model): array
    {
        return array_merge(
            ['id' => $model->id],
            Arr::only($model->toArray(), $table->fillableFields),
            [
                'updated_at' => optional($model->client_updated_at)->toISOString(),
                'deleted_at' => optional($model->deleted_at)->toISOString(),
            ],
        );
    }

    private function serializeProfile(UserProfile $profile): array
    {
        return array_merge(
            ['id' => $profile->id],
            Arr::only($profile->toArray(), self::PROFILE_FIELDS),
            [
                'updated_at' => optional($profile->client_updated_at)->toISOString(),
                'deleted_at' => optional($profile->deleted_at)->toISOString(),
            ],
        );
    }
}
