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
        'jenis_media',
        'path_file',
        'path_thumbnail',
        'url_sumber',
        'alt_text',
        'is_active',
        'urutan_tampil',
        'dibuat_oleh',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'file_url',
        'thumbnail_url',
    ];

    public function getFileUrlAttribute(): ?string
    {
        return $this->path_file
            ? asset('storage/'.$this->path_file)
            : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->path_thumbnail
            ? asset('storage/'.$this->path_thumbnail)
            : null;
    }

    /**
     * User yang membuat konten ini.
     */
    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
