<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RingkasanAi extends Model
{
    public $timestamps = false;

    protected $table = 'ringkasan_ai';

    protected $fillable = [
        'hasil_rekomendasi_id',
        'ringkasan_text',
        'status',
        'is_edited_manual',
        'direview_oleh',
        'generated_at',
        'published_at',
    ];

    protected $casts = [
        'is_edited_manual' => 'boolean',
        'generated_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    /**
     * Hasil rekomendasi yang diringkas.
     */
    public function hasilRekomendasi(): BelongsTo
    {
        return $this->belongsTo(HasilRekomendasi::class, 'hasil_rekomendasi_id');
    }

    /**
     * User yang mereview ringkasan ini.
     */
    public function direviewOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'direview_oleh');
    }
}
