<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KontenLandingPage extends Model
{
    protected $table = 'konten_landing_page';

    protected $fillable = [
        'judul',
        'isi',
        'tipe',
        'is_active',
        'urutan_tampil',
        'dibuat_oleh',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * User yang membuat konten ini.
     */
    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
