<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Observer generik untuk audit log.
 *
 * Otomatis menulis entry ke tabel `audit_log` setiap kali
 * model yang di-observe mengalami event created/updated/deleted.
 *
 * Diterapkan pada: DataIklimHarian, RuleRekomendasi, KontenLandingPage, RingkasanAi.
 */
class AuditLogObserver
{
    /**
     * Handle the "created" event.
     */
    public function created(Model $model): void
    {
        $this->writeLog($model, 'created', [
            'new' => $model->getAttributes(),
        ]);
    }

    /**
     * Handle the "updated" event.
     */
    public function updated(Model $model): void
    {
        $changes = $model->getChanges();
        $original = [];

        // Catat nilai sebelum perubahan (before) hanya untuk field yang berubah
        foreach (array_keys($changes) as $key) {
            $original[$key] = $model->getOriginal($key);
        }

        $this->writeLog($model, 'updated', [
            'before' => $original,
            'after'  => $changes,
        ]);
    }

    /**
     * Handle the "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->writeLog($model, 'deleted', [
            'old' => $model->getAttributes(),
        ]);
    }

    /**
     * Tulis entry ke tabel audit_log.
     */
    private function writeLog(Model $model, string $aksi, array $detail): void
    {
        // Hanya catat jika ada user yang sedang login
        // (proses seeder/console tanpa auth tidak dicatat)
        $userId = auth()->id();

        if (is_null($userId)) {
            return;
        }

        AuditLog::create([
            'user_id'       => $userId,
            'aksi'          => $aksi,
            'tabel_terkait' => $model->getTable(),
            'id_terkait'    => $model->getKey(),
            'detail'        => $detail,
            'ip_address'    => request()?->ip(),
        ]);
    }
}
