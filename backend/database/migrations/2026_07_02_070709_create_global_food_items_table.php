<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global_food_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->string('barcode')->nullable();
            $table->float('calories_per_100g');
            $table->float('protein_per_100g');
            $table->float('carbs_per_100g');
            $table->float('fat_per_100g');
            $table->float('fiber_per_100g')->nullable();
            $table->float('sugar_per_100g')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->uuid('source_food_item_id')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('barcode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global_food_items');
    }
};
