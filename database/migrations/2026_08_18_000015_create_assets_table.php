<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_category_id')->constrained('asset_categories')->cascadeOnDelete();
            $table->foreignId('asset_type_id')->nullable()->constrained('asset_types')->nullOnDelete();
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('unit_measure')->nullable();
            $table->string('acquisition_source')->nullable();
            $table->year('acquisition_year')->nullable();
            $table->string('condition_status')->nullable();
            $table->decimal('purchase_value', 18, 2)->nullable();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->string('owner_name')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('legal_basis')->nullable();
            $table->date('start_operation_date')->nullable();
            $table->boolean('is_movable')->default(true);
            $table->json('metadata')->nullable();
            $table->enum('status', ['aktif', 'dipinjam', 'perbaikan', 'mutasi', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
