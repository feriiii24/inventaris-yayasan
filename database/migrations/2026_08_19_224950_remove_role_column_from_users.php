<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure canonical roles exist
        $super = DB::table('roles')->where('name', 'super_admin')->first();
        if (!$super) {
            $superId = DB::table('roles')->insertGetId([
                'name' => 'super_admin',
                'label' => 'Super Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $superId = $super->id;
        }

        $yayasan = DB::table('roles')->where('name', 'admin_pusat')->first();
        if (!$yayasan) {
            $yayasanId = DB::table('roles')->insertGetId([
                'name' => 'admin_pusat',
                'label' => 'Admin Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $yayasanId = $yayasan->id;
        }

        $unit = DB::table('roles')->where('name', 'admin_unit')->first();
        if (!$unit) {
            $unitId = DB::table('roles')->insertGetId([
                'name' => 'admin_unit',
                'label' => 'Admin Unit',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $unitId = $unit->id;
        }

        // Map legacy role strings to role_id for users that have null role_id
        // Common legacy values: 'super_admin', 'admin_pusat', 'admin_yayasan', 'admin_unit', 'staff', 'pengguna'
        DB::table('users')
            ->whereNull('role_id')
            ->where('role', 'super_admin')
            ->update(['role_id' => $superId]);

        DB::table('users')
            ->whereNull('role_id')
            ->whereIn('role', ['admin_yayasan', 'admin_pusat'])
            ->update(['role_id' => $yayasanId]);

        DB::table('users')
            ->whereNull('role_id')
            ->whereIn('role', ['admin_unit', 'staff', 'pengguna'])
            ->update(['role_id' => $unitId]);

        // For any remaining users with null role_id, set to admin_unit by default
        DB::table('users')
            ->whereNull('role_id')
            ->update(['role_id' => $unitId]);

        // Finally drop the legacy 'role' column if it exists
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-create the 'role' column as nullable string
        if (!Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->nullable()->after('role_id');
            });

            // Map role_id back to role string where possible
            $roles = DB::table('roles')->select('id', 'name')->get();
            foreach ($roles as $r) {
                DB::table('users')->where('role_id', $r->id)->update(['role' => $r->name]);
            }
        }
    }
};
