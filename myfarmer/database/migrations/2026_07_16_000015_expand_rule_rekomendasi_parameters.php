<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Lengkapi JSON parameter rule existing tanpa mengubah skema database.
     */
    public function up(): void
    {
        DB::table('rule_rekomendasi')
            ->select(['id', 'nama_rule', 'parameter'])
            ->orderBy('id')
            ->each(function (object $rule): void {
                $parameter = json_decode($rule->parameter, true);

                if (! is_array($parameter)) {
                    return;
                }

                $minCurahHujan = (float) ($parameter['min_curah_hujan_dasarian'] ?? 0);
                $minDasarian = (int) ($parameter['min_dasarian_berturut'] ?? 0);

                $parameter += [
                    'total_alternatif_mm' => $minCurahHujan * $minDasarian,
                    'pakai_kriteria_hari_hujan' => $rule->nama_rule === 'Rule Awal Musim Tanam',
                    'min_hari_hujan_dasarian' => 3,
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
