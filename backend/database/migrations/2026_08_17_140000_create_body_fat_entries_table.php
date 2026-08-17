<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('body_fat_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('gender');
            $table->float('height_cm');
            $table->float('neck_cm');
            $table->float('waist_cm');
            $table->float('hip_cm')->nullable();
            $table->float('body_fat_percent');
            $table->string('category');
            $table->timestamp('client_updated_at');
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('body_fat_entries');
    }
};
