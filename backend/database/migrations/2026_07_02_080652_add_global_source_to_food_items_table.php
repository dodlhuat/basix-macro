<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE food_items MODIFY source ENUM('manual', 'openfoodfacts', 'user_barcode_link', 'global') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE food_items MODIFY source ENUM('manual', 'openfoodfacts', 'user_barcode_link') NOT NULL");
    }
};
