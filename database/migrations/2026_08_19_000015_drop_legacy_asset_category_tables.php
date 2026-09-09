<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('asset_activities');
        Schema::dropIfExists('asset_borrowings');
        Schema::dropIfExists('asset_mutations');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('asset_types');
        Schema::dropIfExists('asset_categories');

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });

        Schema::create('asset_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_category_id')->constrained('asset_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });

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
};
