<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_mutations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('from_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('to_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->string('movement_type');
            $table->string('reference_number')->nullable();
            $table->date('mutation_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['proses', 'sukses', 'selesai'])->default('proses');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_mutations');
    }
};
