<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/admin/users')->assertStatus(401);
    }

    public function test_regular_user_is_forbidden_from_admin_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertStatus(403);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertOk();
    }

    public function test_admin_can_create_a_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
            'name' => 'New User',
            'email' => 'new-user@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);

        $response->assertCreated()->assertJsonPath('data.email', 'new-user@example.com');
        $this->assertDatabaseHas('users', ['email' => 'new-user@example.com', 'role' => 'user']);
    }
}
