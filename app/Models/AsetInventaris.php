<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsetInventaris extends Model
{
    use HasFactory;

    protected $table = 'aset_inventaris';

    protected $fillable = [
        'kode_aset',
        'tanggal_pembukuan',
        'nama_aset',
        'spesifikasi',
        'jumlah',
        'jumlah_baik',
        'jumlah_rusak_ringan',
        'jumlah_rusak_berat',
        'jumlah_dalam_perbaikan',
        'satuan',
        'asal_barang',
        'tahun_pengadaan',
        'harga_perolehan',
        'kondisi',
        'lokasi_id',
        'unit_id',
        'room_id',
        'deskripsi',
        'gambar',
        'dokumen',
    ];

    protected $casts = [
        'tanggal_pembukuan' => 'date',
        'jumlah' => 'integer',
        'jumlah_baik' => 'integer',
        'jumlah_rusak_ringan' => 'integer',
        'jumlah_rusak_berat' => 'integer',
        'jumlah_dalam_perbaikan' => 'integer',
        'tahun_pengadaan' => 'integer',
        'harga_perolehan' => 'float',
    ];

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'lokasi_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }
}
