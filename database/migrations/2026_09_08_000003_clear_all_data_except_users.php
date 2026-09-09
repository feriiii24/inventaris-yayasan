<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Remove all application data while preserving user accounts.
     */
    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('users')) {
            return;
        }

        DB::table('users')->update([
            'role_id' => null,
            'unit_id' => null,
        ]);

        $tables = DB::select(
            'SELECT TABLE_NAME
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_TYPE = ?
               AND TABLE_NAME NOT IN (?, ?)',
            ['BASE TABLE', 'users', 'migrations'],
        );

        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            foreach ($tables as $table) {
                $name = str_replace('`', '``', $table->TABLE_NAME);
                DB::statement("TRUNCATE TABLE `{$name}`");
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        }
    }

    /**
     * Data removed by this migration is intentionally not restored.
     */
    public function down(): void
    {
    }
};
