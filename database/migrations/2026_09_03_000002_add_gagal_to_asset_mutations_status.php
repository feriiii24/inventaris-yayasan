<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (!Schema::hasTable('asset_mutations')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE asset_mutations MODIFY COLUMN status ENUM('proses', 'sukses', 'selesai', 'ditolak', 'gagal') NOT NULL DEFAULT 'proses'");
        } else {
            Schema::table('asset_mutations', function ($table) {
                $table->string('status')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        if (!Schema::hasTable('asset_mutations')) {
            return;
        }

        DB::table('asset_mutations')->where('status', 'gagal')->update(['status' => 'ditolak']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE asset_mutations MODIFY COLUMN status ENUM('proses', 'sukses', 'selesai', 'ditolak') NOT NULL DEFAULT 'proses'");
        }
    }
};
