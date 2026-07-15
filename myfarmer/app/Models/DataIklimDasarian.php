<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataIklimDasarian extends Model
{
    public $timestamps = false;

    protected $table = 'data_iklim_dasarian';

    protected $fillable = [
        'stasiun_id',
        'tahun',
        'bulan',
        'dasarian_ke',
        'tanggal_mulai',
        'tanggal_selesai',
        'total_curah_hujan_mm',
        'jumlah_hari_hujan',
        'jumlah_hari_valid',
        'jumlah_hari_missing',
        'status_musim',
        'dihitung_pada',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'total_curah_hujan_mm' => 'decimal:1',
        'dihitung_pada' => 'datetime',
    ];

    /**
     * Stasiun tempat data ini diagregasi.
     */
    public function stasiun(): BelongsTo
    {
        return $this->belongsTo(StasiunIklim::class, 'stasiun_id');
    }

    /**
     * Hasil rekomendasi yang dihasilkan dari data dasarian ini.
     */
    public function hasilRekomendasi(): HasMany
    {
        return $this->hasMany(HasilRekomendasi::class, 'dasarian_id');
    }
}
