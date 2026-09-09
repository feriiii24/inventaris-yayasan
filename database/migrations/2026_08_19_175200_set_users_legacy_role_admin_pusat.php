<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('roles')) {
            return;
        }

        $roleId = DB::table('roles')->where('name', 'admin_pusat')->value('id');
        if (!$roleId) {
            return;
        }

        // No-op: canonical central admin role is 'admin_pusat' — nothing to remap here
        // (This migration previously attempted to remap to 'admin_yayasan' but project now uses 'admin_pusat')
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('roles')) {
            return;
        }

        $roleId = DB::table('roles')->where('name', 'admin_pusat')->value('id');
        if (!$roleId) {
            return;
        }

        if (Schema::hasColumn('users', 'role')) {
            // Revert to 'staff' only for those we changed (best-effort)
            DB::table('users')->where('role_id', $roleId)->update(['role' => 'staff']);
        }
    }
};
