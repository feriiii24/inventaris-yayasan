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
        // Accounts must be created through the secured user-management flow.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No account is created by this migration.
    }
};
