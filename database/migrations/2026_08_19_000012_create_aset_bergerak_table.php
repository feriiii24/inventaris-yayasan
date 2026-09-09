<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aset_bergerak', function (Blueprint $table) {
            $table->id();
            $table->string('bentuk_aset');
            $table->string('dasar_hak')->nullable();
            $table->string('atas_nama')->nullable();
            $table->integer('tahun_perolehan')->nullable();
            $table->string('nomor_registrasi')->nullable();
            $table->string('foto')->nullable();
            $table->string('dokumen_pdf')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aset_bergerak');
    }
};
