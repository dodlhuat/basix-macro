<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('age');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->float('height_cm');
            $table->float('weight_kg');
            $table->enum('activity_level', ['sedentary', 'light', 'moderate', 'active', 'very_active']);
            $table->enum('goal', ['cut', 'light_cut', 'maintain', 'lean_bulk', 'bulk']);
            $table->unsignedInteger('calorie_goal');
            $table->unsignedInteger('protein_goal_g');
            $table->unsignedInteger('carbs_goal_g');
            $table->unsignedInteger('fat_goal_g');
            $table->enum('unit_system', ['metric', 'imperial']);
            $table->unsignedInteger('water_goal_ml');
            $table->boolean('dark_mode')->default(false);
            $table->boolean('adaptive_calories_enabled')->default(false);
            $table->timestamp('adaptive_calories_last_adjusted_at')->nullable();
            $table->integer('adaptive_calories_last_delta_kcal')->nullable();
            $table->enum('locale', ['de', 'en'])->nullable();
            $table->timestamp('client_updated_at');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
