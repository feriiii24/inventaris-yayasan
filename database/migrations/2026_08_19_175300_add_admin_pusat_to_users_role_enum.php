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
        if (!Schema::hasTable('users')) {
            return;
        }

        // Ensure users.role enum has only the three allowed roles (MySQL)
        try {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('super_admin','admin_pusat','admin_unit') DEFAULT 'admin_unit'");
        } catch (\Exception $e) {
            // ignore if DB doesn't support or column missing
        }

        // No-op: canonical role should be 'admin_pusat'; do not remap to 'admin_yayasan'.
        // (Previous migrations attempted remapping; this project uses 'admin_pusat' as the central admin role.)
    }

    public function down()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        if (!Schema::hasTable('users')) {
            return;
        }

        // Revert: remove admin_pusat from enum if possible (note: this may fail if values exist)
        try {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('super_admin','admin_pusat','admin_unit','staff') DEFAULT 'staff'");
        } catch (\Exception $e) {
            // ignore
        }
    }
};
