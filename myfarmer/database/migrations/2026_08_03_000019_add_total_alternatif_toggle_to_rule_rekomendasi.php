<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Lengkapi parameter total alternatif dan toggle-nya pada rule existing.
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

                $minCurahHujan = (float) ($parameter['min_curah_hujan_dasarian'] ?? 0);
                $minDasarian = (int) ($parameter['min_dasarian_berturut'] ?? 0);

                $parameter += [
                    'total_alternatif_mm' => $minCurahHujan * $minDasarian,
                    'pakai_kriteria_total_alternatif' => true,
                ];

                DB::table('rule_rekomendasi')
                    ->where('id', $rule->id)
                    ->update([
                        'parameter' => json_encode($parameter, JSON_UNESCAPED_UNICODE),
                    ]);
            });
    }

    /**
     * Data parameter dipertahankan agar konfigurasi admin tidak rusak saat rollback.
     */
    public function down(): void
    {
        // No-op: aplikasi lama mengabaikan key toggle yang belum dikenalnya.
    }
};
