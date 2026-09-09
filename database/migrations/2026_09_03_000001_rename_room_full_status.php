<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE rooms MODIFY status ENUM('aktif', 'full', 'penuh', 'nonaktif') NOT NULL DEFAULT 'aktif'");

        DB::table('rooms')->where('status', 'penuh')->update(['status' => 'full']);

        DB::statement("ALTER TABLE rooms MODIFY status ENUM('aktif', 'full', 'nonaktif') NOT NULL DEFAULT 'aktif'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE rooms MODIFY status ENUM('aktif', 'full', 'penuh', 'nonaktif') NOT NULL DEFAULT 'aktif'");

        DB::table('rooms')->where('status', 'full')->update(['status' => 'penuh']);

        DB::statement("ALTER TABLE rooms MODIFY status ENUM('aktif', 'penuh', 'nonaktif') NOT NULL DEFAULT 'aktif'");
    }
};
