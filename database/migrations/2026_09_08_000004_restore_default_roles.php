<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Restore the authorization roles while keeping application data empty.
     */
    public function up(): void
    {
        $roles = [
            ['name' => 'super_admin', 'label' => 'Super Admin'],
            ['name' => 'admin_pusat', 'label' => 'Admin Pusat'],
            ['name' => 'admin_unit', 'label' => 'Admin Unit'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                [...$role, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        $superAdminId = DB::table('roles')
            ->where('name', 'super_admin')
            ->value('id');

        if ($superAdminId !== null) {
            DB::table('users')
                ->whereNull('role_id')
                ->update(['role_id' => $superAdminId]);
        }
    }

    /**
     * Keep authorization roles available when rolling back data cleanup.
     */
    public function down(): void
    {
        DB::table('users')->update(['role_id' => null]);
        DB::table('roles')
            ->whereIn('name', ['super_admin', 'admin_pusat', 'admin_unit'])
            ->delete();
    }
};
