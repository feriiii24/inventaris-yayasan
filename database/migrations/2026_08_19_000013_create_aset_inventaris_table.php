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
        if (!Schema::hasTable('aset_inventaris')) {
            Schema::create('aset_inventaris', function (Blueprint $table) {
                $table->id();
                $table->string('kode_aset')->nullable();
                $table->string('nama_aset');
                $table->text('spesifikasi')->nullable();
                $table->integer('jumlah')->default(0);
                $table->string('satuan')->nullable();
                $table->string('asal_barang')->nullable();
                $table->integer('tahun_pengadaan')->nullable();
                $table->decimal('harga_perolehan', 15, 2)->default(0);
                $table->enum('kondisi', ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Dalam Perbaikan'])->default('Baik');
                $table->unsignedBigInteger('lokasi_id')->nullable();
                $table->unsignedBigInteger('unit_id')->nullable();
                $table->text('deskripsi')->nullable();
                $table->string('gambar')->nullable();
                $table->string('dokumen')->nullable();
                $table->timestamps();

                $table->foreign('lokasi_id')->references('id')->on('locations')->nullOnDelete();
                $table->foreign('unit_id')->references('id')->on('units')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aset_inventaris');
    }
};
