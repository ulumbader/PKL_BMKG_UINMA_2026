<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogImportData extends Model
{
    public $timestamps = false;

    protected $table = 'log_import_data';

    protected $fillable = [
        'sumber',
        'status',
        'jumlah_data_masuk',
        'pesan_error',
        'waktu_mulai',
        'waktu_selesai',
        'triggered_by',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
    ];

    /**
     * User yang men-trigger proses import.
     */
    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
