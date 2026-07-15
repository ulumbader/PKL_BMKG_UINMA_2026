<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    /**
     * Hanya created_at, tidak ada updated_at (log tidak boleh diubah).
     */
    const UPDATED_AT = null;

    protected $table = 'audit_log';

    protected $fillable = [
        'user_id',
        'aksi',
        'tabel_terkait',
        'id_terkait',
        'detail',
        'ip_address',
    ];

    protected $casts = [
        'detail' => 'array',
    ];

    /**
     * User yang melakukan aksi.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
