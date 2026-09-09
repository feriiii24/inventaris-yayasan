<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('users')) {
            return;
        }

        $mapping = [
            'super_admin' => 'super_admin',
            'admin_yayasan' => 'admin_pusat',
            'admin_unit' => 'admin_unit',
            'staff' => 'admin_unit',
        ];

        foreach (DB::table('users')->whereNotNull('role')->get() as $u) {
            $old = $u->role;
            if (! $old) continue;
            $new = $mapping[$old] ?? null;
            if (! $new) continue;
            $role = DB::table('roles')->where('name', $new)->first();
            if (! $role) continue;
            DB::table('users')->where('id', $u->id)->update(['role_id' => $role->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users')) return;
        DB::table('users')->update(['role_id' => null]);
    }
};
