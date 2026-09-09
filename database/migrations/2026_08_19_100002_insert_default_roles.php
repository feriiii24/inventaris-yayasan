<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $roles = [
            ['name' => 'super_admin', 'label' => 'Super Admin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'admin_pusat', 'label' => 'Admin Pusat', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'admin_unit', 'label' => 'Admin Unit', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('roles')->insertOrIgnore($roles);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('roles')->whereIn('name', ['super_admin', 'admin_pusat', 'admin_unit'])->delete();
    }
};
