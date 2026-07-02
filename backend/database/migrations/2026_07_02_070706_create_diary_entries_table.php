<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diary_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
            $table->uuid('food_item_id')->nullable();
            $table->uuid('recipe_id')->nullable();
            $table->float('amount_g');
            $table->float('servings');
            $table->float('calories_total');
            $table->float('protein_total_g');
            $table->float('carbs_total_g');
            $table->float('fat_total_g');
            $table->timestamp('logged_at');
            $table->timestamp('client_updated_at');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->foreign('food_item_id')->references('id')->on('food_items')->nullOnDelete();
            $table->foreign('recipe_id')->references('id')->on('recipes')->nullOnDelete();
            $table->index('user_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diary_entries');
    }
};
