<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Accounts must be created through the secured user-management flow.
    }

    public function down(): void
    {
        // No account is created by this migration.
    }
};
