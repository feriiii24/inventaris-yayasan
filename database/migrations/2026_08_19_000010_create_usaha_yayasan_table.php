<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usaha_yayasan', function (Blueprint $table) {
            $table->id();
            $table->string('bentuk_usaha');
            $table->string('lokasi')->nullable();
            $table->string('pengelola')->nullable();
            $table->date('mulai_operasional')->nullable();
            $table->string('dasar_perjanjian')->nullable();
            $table->string('gambar')->nullable();
            $table->string('dokumen')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usaha_yayasan');
    }
};
