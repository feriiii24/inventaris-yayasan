<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UsahaYayasan extends Model
{
    use HasFactory;

    protected $table = 'usaha_yayasan';

    protected $fillable = [
        'bentuk_usaha',
        'lokasi',
        'pengelola',
        'mulai_operasional',
        'dasar_perjanjian',
        'gambar',
        'dokumen',
        'keterangan',
    ];

    protected $casts = [
        'mulai_operasional' => 'date',
    ];
}
