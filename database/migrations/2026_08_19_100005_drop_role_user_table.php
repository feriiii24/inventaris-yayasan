<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('role_user')) {
            Schema::dropIfExists('role_user');
        }
    }

    public function down(): void
    {
        // recreate pivot table if needed
        Schema::create('role_user', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->unique(['user_id', 'role_id']);
            $table->timestamps();
        });
    }
};
