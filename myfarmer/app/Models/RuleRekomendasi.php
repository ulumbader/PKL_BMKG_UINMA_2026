<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RuleRekomendasi extends Model
{
    /**
     * Hanya updated_at, tidak ada created_at.
     */
    const CREATED_AT = null;

    protected $table = 'rule_rekomendasi';

    protected $fillable = [
        'nama_rule',
        'deskripsi',
        'parameter',
        'is_active',
        'dibuat_oleh',
        'diubah_oleh',
    ];

    protected $casts = [
        'parameter' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * User yang membuat rule ini.
     */
    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    /**
     * User yang terakhir mengubah rule ini.
     */
    public function diubahOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diubah_oleh');
    }

    /**
     * Hasil rekomendasi yang dihasilkan dari rule ini.
     */
    public function hasilRekomendasi(): HasMany
    {
        return $this->hasMany(HasilRekomendasi::class, 'rule_id');
    }
}
