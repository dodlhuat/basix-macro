<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->string('barcode')->nullable();
            $table->float('calories_per_100g');
            $table->float('protein_per_100g');
            $table->float('carbs_per_100g');
            $table->float('fat_per_100g');
            $table->float('fiber_per_100g')->nullable();
            $table->float('sugar_per_100g')->nullable();
            $table->enum('source', ['manual', 'openfoodfacts', 'user_barcode_link']);
            $table->boolean('is_favorite')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('client_updated_at');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('barcode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_items');
    }
};
