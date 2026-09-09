<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            DB::table('users')
                ->where('email', 'like', 'admin.u%@yayasan.id')
                ->delete();
        }

        if (!Schema::hasTable('units')) {
            return;
        }

        $unitIds = DB::table('units')
            ->whereIn('name', ['Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8', 'Unit 9', 'Unit 10'])
            ->pluck('id');

        if ($unitIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('rooms')) {
            DB::table('rooms')->whereIn('unit_id', $unitIds)->delete();
        }
        if (Schema::hasTable('locations')) {
            DB::table('locations')->whereIn('unit_id', $unitIds)->delete();
        }
        DB::table('units')->whereIn('id', $unitIds)->delete();
    }

    public function down(): void
    {
        // Default accounts and units are intentionally not recreated.
    }
};
