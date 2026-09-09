<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        if (!Schema::hasTable('users') || !Schema::hasTable('roles')) {
            return;
        }

        // 1) Reassign any users with legacy role 'staff' to 'admin_unit'
        $targetRoleId = DB::table('roles')->where('name', 'admin_unit')->value('id');
        if (!$targetRoleId) {
            // create admin_unit role if missing
            $targetRoleId = DB::table('roles')->insertGetId([
                'name' => 'admin_unit',
                'label' => 'Admin Unit',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Update legacy enum column
        if (Schema::hasColumn('users', 'role')) {
            DB::table('users')->where('role', 'staff')->update(['role' => 'admin_unit']);
        }

        // Update role_id for users who still point to staff (best-effort)
        $staffRoleId = DB::table('roles')->where('name', 'staff')->value('id');
        if ($staffRoleId) {
            DB::table('users')->where('role_id', $staffRoleId)->update(['role_id' => $targetRoleId]);
        }

        // 2) Modify enum to remove 'staff' and any legacy roles — keep only allowed three (MySQL)
        try {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('super_admin','admin_pusat','admin_unit') DEFAULT 'admin_unit'");
        } catch (\Exception $e) {
            // ignore if not MySQL or cannot modify
        }

        // 3) Remove any 'staff' role row in roles table if present and empty
        if (Schema::hasTable('roles')) {
            $staffRole = DB::table('roles')->where('name', 'staff')->first();
            if ($staffRole) {
                $hasUsers = DB::table('users')->where('role_id', $staffRole->id)->exists();
                if (!$hasUsers) {
                    DB::table('roles')->where('id', $staffRole->id)->delete();
                }
            }
        }
    }

    public function down()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        // Revert: best-effort — restore 'staff' to enum and map admin_unit back to staff where appropriate
        try {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('super_admin','admin_pusat','admin_unit','staff') DEFAULT 'admin_unit'");
        } catch (\Exception $e) {
            // ignore
        }

        if (Schema::hasTable('roles')) {
            $staffRoleId = DB::table('roles')->where('name', 'staff')->value('id');
            $unitRoleId = DB::table('roles')->where('name', 'admin_unit')->value('id');

            if ($unitRoleId && $staffRoleId) {
                DB::table('users')->where('role', 'admin_unit')->update(['role' => 'staff']);
                DB::table('users')->where('role_id', $unitRoleId)->update(['role_id' => $staffRoleId]);
            }
        }
    }
};
