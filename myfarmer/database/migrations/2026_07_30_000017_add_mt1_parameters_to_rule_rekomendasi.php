<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Lengkapi JSON parameter rule existing dengan rentang kalender MT1.
     */
    public function up(): void
    {
        DB::table('rule_rekomendasi')
            ->select(['id', 'parameter'])
            ->orderBy('id')
            ->each(function (object $rule): void {
                $parameter = json_decode($rule->parameter, true);

                if (! is_array($parameter)) {
                    return;
                }

                $parameter += [
                    'mt1_bulan_mulai' => 11,
                    'mt1_dasarian_mulai' => 1,
                    'mt1_bulan_selesai' => 4,
                    'mt1_dasarian_selesai' => 2,
                ];

                DB::table('rule_rekomendasi')
                    ->where('id', $rule->id)
                    ->update([
                        'parameter' => json_encode($parameter, JSON_UNESCAPED_UNICODE),
                    ]);
            });
    }

    /**
     * Data parameter tidak dihapus saat rollback agar konfigurasi admin aman.
     */
    public function down(): void
    {
        // No-op: menghapus key JSON dapat merusak konfigurasi yang sudah disunting admin.
    }
};
