<?php

namespace Database\Factories;

use App\Models\GlobalFoodItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GlobalFoodItem>
 */
class GlobalFoodItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'calories_per_100g' => fake()->numberBetween(20, 600),
            'protein_per_100g' => fake()->randomFloat(1, 0, 30),
            'carbs_per_100g' => fake()->randomFloat(1, 0, 80),
            'fat_per_100g' => fake()->randomFloat(1, 0, 40),
            'status' => 'pending',
            'submitted_by' => User::factory(),
        ];
    }
}
