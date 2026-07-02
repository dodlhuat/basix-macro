<?php

namespace Tests\Feature;

use App\Models\FoodItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_push_creates_a_food_item_scoped_to_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => [
                'food_items' => [[
                    'id' => $id,
                    'name' => 'Apfel',
                    'calories_per_100g' => 52,
                    'protein_per_100g' => 0.3,
                    'carbs_per_100g' => 14,
                    'fat_per_100g' => 0.2,
                    'source' => 'manual',
                    'is_favorite' => false,
                    'updated_at' => '2026-01-01T00:00:00.000Z',
                ]],
            ],
        ]);

        $response->assertOk()->assertJsonPath('push_results.food_items.0.status', 'applied');
        $this->assertDatabaseHas('food_items', ['id' => $id, 'user_id' => $user->id, 'name' => 'Apfel']);
    }

    public function test_older_update_is_superseded_by_last_write_wins(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        FoodItem::query()->create([
            'id' => $id,
            'user_id' => $user->id,
            'name' => 'Apfel',
            'calories_per_100g' => 52,
            'protein_per_100g' => 0.3,
            'carbs_per_100g' => 14,
            'fat_per_100g' => 0.2,
            'source' => 'manual',
            'is_favorite' => false,
            'client_updated_at' => '2026-01-02T00:00:00.000Z',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => [
                'food_items' => [[
                    'id' => $id,
                    'name' => 'Veralteter Name',
                    'calories_per_100g' => 52,
                    'protein_per_100g' => 0.3,
                    'carbs_per_100g' => 14,
                    'fat_per_100g' => 0.2,
                    'source' => 'manual',
                    'is_favorite' => false,
                    'updated_at' => '2026-01-01T00:00:00.000Z',
                ]],
            ],
        ]);

        $response->assertOk()->assertJsonPath('push_results.food_items.0.status', 'superseded');
        $this->assertDatabaseHas('food_items', ['id' => $id, 'name' => 'Apfel']);
        $this->assertDatabaseMissing('food_items', ['id' => $id, 'name' => 'Veralteter Name']);
    }

    public function test_newer_update_overwrites_the_stored_row(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        FoodItem::query()->create([
            'id' => $id,
            'user_id' => $user->id,
            'name' => 'Apfel',
            'calories_per_100g' => 52,
            'protein_per_100g' => 0.3,
            'carbs_per_100g' => 14,
            'fat_per_100g' => 0.2,
            'source' => 'manual',
            'is_favorite' => false,
            'client_updated_at' => '2026-01-01T00:00:00.000Z',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => [
                'food_items' => [[
                    'id' => $id,
                    'name' => 'Grüner Apfel',
                    'calories_per_100g' => 52,
                    'protein_per_100g' => 0.3,
                    'carbs_per_100g' => 14,
                    'fat_per_100g' => 0.2,
                    'source' => 'manual',
                    'is_favorite' => false,
                    'updated_at' => '2026-01-02T00:00:00.000Z',
                ]],
            ],
        ]);

        $response->assertOk()->assertJsonPath('push_results.food_items.0.status', 'applied');
        $this->assertDatabaseHas('food_items', ['id' => $id, 'name' => 'Grüner Apfel']);
    }

    public function test_pull_only_returns_rows_changed_since_the_given_cursor(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        FoodItem::query()->create([
            'id' => $id,
            'user_id' => $user->id,
            'name' => 'Altes Lebensmittel',
            'calories_per_100g' => 52,
            'protein_per_100g' => 0.3,
            'carbs_per_100g' => 14,
            'fat_per_100g' => 0.2,
            'source' => 'manual',
            'is_favorite' => false,
            'client_updated_at' => now(),
        ]);
        // Backdate via the query builder so it bypasses Eloquent's automatic
        // "touch to now" behaviour that Model::create()/save() would apply.
        FoodItem::query()->where('id', $id)->update(['updated_at' => now()->subDays(2)]);

        $since = now()->subDay()->toISOString();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'since' => $since,
        ]);

        $response->assertOk()->assertJsonCount(0, 'changes.food_items');
    }

    public function test_a_user_cannot_see_or_modify_another_users_data_via_sync(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $id = (string) Str::uuid();

        FoodItem::query()->create([
            'id' => $id,
            'user_id' => $owner->id,
            'name' => 'Privates Lebensmittel',
            'calories_per_100g' => 52,
            'protein_per_100g' => 0.3,
            'carbs_per_100g' => 14,
            'fat_per_100g' => 0.2,
            'source' => 'manual',
            'is_favorite' => false,
            'client_updated_at' => '2026-01-01T00:00:00.000Z',
        ]);

        $response = $this->actingAs($intruder, 'sanctum')->postJson('/api/sync', []);

        $response->assertOk()->assertJsonCount(0, 'changes.food_items');
    }

    private function profilePayload(array $overrides = []): array
    {
        return array_merge([
            'id' => (string) Str::uuid(),
            'name' => 'Test User',
            'age' => 30,
            'gender' => 'male',
            'height_cm' => 180,
            'weight_kg' => 80,
            'activity_level' => 'moderate',
            'goal' => 'maintain',
            'calorie_goal' => 2200,
            'protein_goal_g' => 150,
            'carbs_goal_g' => 250,
            'fat_goal_g' => 70,
            'unit_system' => 'metric',
            'water_goal_ml' => 2000,
            'dark_mode' => false,
            'adaptive_calories_enabled' => false,
            'locale' => 'de',
            'updated_at' => '2026-01-01T00:00:00.000Z',
        ], $overrides);
    }

    public function test_a_second_device_pushing_its_own_profile_id_updates_the_same_account_profile(): void
    {
        // Each device generates its own local UUID for the "user" record during onboarding,
        // but they must all resolve to the single per-account profile row on the server.
        $user = User::factory()->create();

        $deviceAResponse = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'profile' => $this->profilePayload(['name' => 'From Device A', 'updated_at' => '2026-01-01T00:00:00.000Z']),
        ]);
        $deviceAResponse->assertOk()->assertJsonPath('push_results.profile.status', 'applied');

        $this->assertDatabaseCount('user_profiles', 1);

        $deviceBResponse = $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'profile' => $this->profilePayload(['name' => 'From Device B', 'updated_at' => '2026-01-02T00:00:00.000Z']),
        ]);

        $deviceBResponse->assertOk()->assertJsonPath('push_results.profile.status', 'applied');
        $this->assertDatabaseCount('user_profiles', 1);
        $this->assertDatabaseHas('user_profiles', ['user_id' => $user->id, 'name' => 'From Device B']);
    }

    public function test_pulled_date_fields_are_plain_dates_not_full_timestamps(): void
    {
        // The client stores/queries `date` on diary/weight/water entries as bare
        // YYYY-MM-DD; Eloquent's default array serialization would otherwise turn
        // the `date`-cast column into a full ISO timestamp on the way out.
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => ['weight_entries' => [[
                'id' => $id,
                'date' => '2026-03-15',
                'weight_kg' => 80,
                'updated_at' => '2026-01-01T00:00:00.000Z',
            ]]],
        ])->assertOk();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/sync', []);

        $response->assertOk()->assertJsonPath('changes.weight_entries.0.date', '2026-03-15');
    }
}
