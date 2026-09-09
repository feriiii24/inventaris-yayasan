<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql' || !Schema::hasTable('asset_borrowings')) {
            return;
        }

        DB::statement("ALTER TABLE asset_borrowings MODIFY COLUMN status ENUM('pending', 'dipinjam', 'pengembalian', 'dikembalikan', 'ditolak') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql' || !Schema::hasTable('asset_borrowings')) {
            return;
        }

        DB::statement("ALTER TABLE asset_borrowings MODIFY COLUMN status ENUM('pending', 'dipinjam', 'dikembalikan', 'ditolak') NOT NULL DEFAULT 'pending'");
    }
};
