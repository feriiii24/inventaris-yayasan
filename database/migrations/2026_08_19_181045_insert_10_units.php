<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Units are managed by administrators and are never seeded automatically.
    }

    public function down(): void
    {
        // No units are created by this migration.
    }
};
