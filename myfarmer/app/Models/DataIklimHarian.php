<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataIklimHarian extends Model
{
    /**
     * Hanya created_at, tidak ada updated_at (raw data tidak boleh diubah).
     */
    const UPDATED_AT = null;

    protected $table = 'data_iklim_harian';

    protected $fillable = [
        'stasiun_id',
        'tanggal',
        'curah_hujan_mm',
        'kode_status',
        'sumber_data',
        'dibuat_oleh',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'curah_hujan_mm' => 'decimal:1',
    ];

    /**
     * Stasiun tempat data ini direkam.
     */
    public function stasiun(): BelongsTo
    {
        return $this->belongsTo(StasiunIklim::class, 'stasiun_id');
    }

    /**
     * User yang memasukkan data ini.
     */
    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
