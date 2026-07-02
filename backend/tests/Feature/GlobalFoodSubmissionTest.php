<?php

namespace Tests\Feature;

use App\Models\GlobalFoodItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GlobalFoodSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function foodItemPayload(array $overrides = []): array
    {
        return array_merge([
            'id' => (string) Str::uuid(),
            'name' => 'Apfel',
            'calories_per_100g' => 52,
            'protein_per_100g' => 0.3,
            'carbs_per_100g' => 14,
            'fat_per_100g' => 0.2,
            'source' => 'manual',
            'is_favorite' => false,
            'updated_at' => '2026-01-01T00:00:00.000Z',
        ], $overrides);
    }

    public function test_pushing_a_manual_food_item_creates_a_pending_global_submission(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => ['food_items' => [$this->foodItemPayload(['id' => $id])]],
        ])->assertOk();

        $this->assertDatabaseHas('global_food_items', [
            'source_food_item_id' => $id,
            'status' => 'pending',
            'submitted_by' => $user->id,
            'name' => 'Apfel',
        ]);
    }

    public function test_pushing_the_same_food_item_again_does_not_duplicate_the_submission(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => ['food_items' => [$this->foodItemPayload(['id' => $id, 'updated_at' => '2026-01-01T00:00:00.000Z'])]],
        ])->assertOk();

        // Same device pushes an edit to the same item later.
        $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => ['food_items' => [$this->foodItemPayload(['id' => $id, 'name' => 'Roter Apfel', 'updated_at' => '2026-01-02T00:00:00.000Z'])]],
        ])->assertOk();

        $this->assertDatabaseCount('global_food_items', 1);
        $this->assertDatabaseHas('global_food_items', ['source_food_item_id' => $id, 'name' => 'Apfel']);
    }

    public function test_food_items_from_openfoodfacts_are_not_submitted_to_the_global_database(): void
    {
        $user = User::factory()->create();
        $id = (string) Str::uuid();

        $this->actingAs($user, 'sanctum')->postJson('/api/sync', [
            'tables' => ['food_items' => [$this->foodItemPayload(['id' => $id, 'source' => 'openfoodfacts'])]],
        ])->assertOk();

        $this->assertDatabaseCount('global_food_items', 0);
    }

    public function test_search_only_returns_approved_submissions(): void
    {
        $user = User::factory()->create();
        $submitter = User::factory()->create();

        GlobalFoodItem::factory()->create(['name' => 'Pending Apfel', 'status' => 'pending', 'submitted_by' => $submitter->id]);
        GlobalFoodItem::factory()->create(['name' => 'Approved Apfel', 'status' => 'approved', 'submitted_by' => $submitter->id]);
        GlobalFoodItem::factory()->create(['name' => 'Rejected Apfel', 'status' => 'rejected', 'submitted_by' => $submitter->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/global-foods?q=Apfel');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertEquals(['Approved Apfel'], $names);
    }

    public function test_search_requires_authentication(): void
    {
        $this->getJson('/api/global-foods')->assertStatus(401);
    }
}
