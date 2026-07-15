<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class HasilRekomendasi extends Model
{
    public $timestamps = false;

    protected $table = 'hasil_rekomendasi';

    protected $fillable = [
        'dasarian_id',
        'rule_id',
        'status_rekomendasi',
        'catatan_teknis',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    /**
     * Data dasarian yang menjadi input rekomendasi ini.
     */
    public function dasarian(): BelongsTo
    {
        return $this->belongsTo(DataIklimDasarian::class, 'dasarian_id');
    }

    /**
     * Rule yang dipakai untuk menghasilkan rekomendasi ini.
     */
    public function rule(): BelongsTo
    {
        return $this->belongsTo(RuleRekomendasi::class, 'rule_id');
    }

    /**
     * Ringkasan AI yang dihasilkan dari rekomendasi ini.
     */
    public function ringkasanAi(): HasOne
    {
        return $this->hasOne(RingkasanAi::class, 'hasil_rekomendasi_id');
    }
}
