<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('borrower_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->string('borrower_name');
            $table->date('loan_date');
            $table->date('due_date')->nullable();
            $table->date('return_date')->nullable();
            $table->string('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'dipinjam', 'dikembalikan', 'ditolak'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_borrowings');
    }
};
