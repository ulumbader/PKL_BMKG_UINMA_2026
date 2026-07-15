<?php

namespace App\Services;

use App\Models\DataIklimDasarian;
use App\Models\HasilRekomendasi;
use App\Models\RuleRekomendasi;
use Carbon\Carbon;

/**
 * Service untuk mengevaluasi rule rekomendasi terhadap data dasarian.
 *
 * Semua threshold dan parameter DIBACA dari kolom `parameter` (JSON)
 * di tabel rule_rekomendasi. TIDAK ADA angka threshold yang di-hardcode
 * di service ini (Golden Rule #5).
 *
 * Alur: data_iklim_dasarian → (evaluasi rule) → hasil_rekomendasi
 */
class RuleEngineService
{
    /**
     * Evaluasi semua rule aktif terhadap satu dasarian.
     *
     * @param int $dasarianId ID record di data_iklim_dasarian
     * @return array Daftar HasilRekomendasi yang baru dibuat/diupdate
     */
    public function evaluate(int $dasarianId): array
    {
        $dasarian = DataIklimDasarian::findOrFail($dasarianId);

        // Ambil semua rule yang aktif
        $rules = RuleRekomendasi::where('is_active', true)->get();

        $hasilList = [];

        foreach ($rules as $rule) {
            $result = $this->evaluateRule($rule, $dasarian);

            // Upsert hasil: satu dasarian + satu rule = satu record hasil
            $hasil = HasilRekomendasi::updateOrCreate(
                [
                    'dasarian_id' => $dasarianId,
                    'rule_id'     => $rule->id,
                ],
                [
                    'status_rekomendasi' => $result['status'],
                    'catatan_teknis'     => $result['catatan'],
                    'generated_at'       => Carbon::now(),
                ]
            );

            $hasil->load(['rule:id,nama_rule', 'dasarian:id,tahun,bulan,dasarian_ke,total_curah_hujan_mm']);
            $hasilList[] = $hasil;
        }

        return $hasilList;
    }

    /**
     * Evaluasi satu rule terhadap satu dasarian.
     *
     * Parameter dibaca dari $rule->parameter (JSON, sudah di-cast ke array).
     * Logika rule default "Awal Musim Tanam":
     *   - Cek apakah N dasarian berturut-turut (termasuk yang dievaluasi)
     *     memiliki total_curah_hujan_mm >= threshold
     *   - N = parameter['min_dasarian_berturut']
     *   - threshold = parameter['min_curah_hujan_dasarian']
     *
     * @param RuleRekomendasi  $rule
     * @param DataIklimDasarian $dasarian
     * @return array ['status' => string, 'catatan' => string]
     */
    private function evaluateRule(RuleRekomendasi $rule, DataIklimDasarian $dasarian): array
    {
        $param = $rule->parameter;

        // Ambil parameter dari database (Golden Rule #5 — TIDAK hardcode)
        $minCurahHujan = $param['min_curah_hujan_dasarian'] ?? null;
        $minBerturut = $param['min_dasarian_berturut'] ?? null;

        // Jika parameter tidak lengkap, tandai sebagai tidak bisa dievaluasi
        if ($minCurahHujan === null || $minBerturut === null) {
            return [
                'status'  => 'tunggu',
                'catatan' => "Parameter rule '{$rule->nama_rule}' tidak lengkap. "
                    . "Dibutuhkan: min_curah_hujan_dasarian, min_dasarian_berturut. "
                    . "Parameter saat ini: " . json_encode($param),
            ];
        }

        // Ambil N dasarian berturut-turut mundur dari dasarian yang dievaluasi
        $dasarianBerturut = $this->getDasarianBerturut(
            $dasarian->stasiun_id,
            $dasarian->tahun,
            $dasarian->bulan,
            $dasarian->dasarian_ke,
            (int) $minBerturut
        );

        $jumlahDitemukan = count($dasarianBerturut);

        // Cek apakah cukup data dasarian berturut-turut
        if ($jumlahDitemukan < $minBerturut) {
            return [
                'status'  => 'tunggu',
                'catatan' => "Data dasarian berturut-turut tidak cukup. "
                    . "Dibutuhkan {$minBerturut} dasarian, tersedia {$jumlahDitemukan}. "
                    . "Menunggu data lebih lengkap.",
            ];
        }

        // Evaluasi: semua N dasarian harus memenuhi threshold
        $semuaMemenuhi = true;
        $detailDasarian = [];

        foreach ($dasarianBerturut as $d) {
            $memenuhi = (float) $d->total_curah_hujan_mm >= (float) $minCurahHujan;
            $detailDasarian[] = sprintf(
                'D%d %02d/%d: %.1fmm %s %.1fmm (%s)',
                $d->dasarian_ke,
                $d->bulan,
                $d->tahun,
                $d->total_curah_hujan_mm,
                $memenuhi ? '>=' : '<',
                $minCurahHujan,
                $memenuhi ? 'LULUS' : 'GAGAL'
            );

            if (!$memenuhi) {
                $semuaMemenuhi = false;
            }
        }

        $catatanDetail = implode(' | ', $detailDasarian);

        if ($semuaMemenuhi) {
            return [
                'status'  => 'optimal_tanam',
                'catatan' => "Rule '{$rule->nama_rule}': OPTIMAL — "
                    . "{$minBerturut} dasarian berturut-turut memenuhi threshold "
                    . ">= {$minCurahHujan}mm. Detail: {$catatanDetail}",
            ];
        }

        // Cek apakah dasarian terbaru (yang dievaluasi) memenuhi threshold
        $dasarianTerbaru = $dasarianBerturut[0]; // paling baru, urutan desc
        $terbaruMemenuhi = (float) $dasarianTerbaru->total_curah_hujan_mm >= (float) $minCurahHujan;

        if ($terbaruMemenuhi) {
            // Dasarian terbaru lulus tapi belum berturut-turut cukup
            return [
                'status'  => 'tunggu',
                'catatan' => "Rule '{$rule->nama_rule}': TUNGGU — "
                    . "Dasarian terkini memenuhi threshold >= {$minCurahHujan}mm "
                    . "tapi belum {$minBerturut} dasarian berturut-turut. "
                    . "Detail: {$catatanDetail}",
            ];
        }

        return [
            'status'  => 'tidak_disarankan',
            'catatan' => "Rule '{$rule->nama_rule}': TIDAK DISARANKAN — "
                . "Dasarian terkini tidak memenuhi threshold >= {$minCurahHujan}mm. "
                . "Detail: {$catatanDetail}",
        ];
    }

    /**
     * Ambil N dasarian berturut-turut mundur dari titik referensi.
     *
     * Dasarian diurutkan dari terbaru ke terlama, berdasarkan (tahun, bulan, dasarian_ke).
     *
     * @param int $stasiunId
     * @param int $tahun       Tahun referensi
     * @param int $bulan       Bulan referensi
     * @param int $dasarianKe  Dasarian referensi
     * @param int $jumlah      Jumlah dasarian yang dibutuhkan
     * @return \Illuminate\Support\Collection
     */
    private function getDasarianBerturut(
        int $stasiunId,
        int $tahun,
        int $bulan,
        int $dasarianKe,
        int $jumlah
    ) {
        // Hitung semua posisi dasarian mundur dari titik referensi
        $periodes = [];
        $currentTahun = $tahun;
        $currentBulan = $bulan;
        $currentDasarian = $dasarianKe;

        for ($i = 0; $i < $jumlah; $i++) {
            $periodes[] = [
                'tahun'       => $currentTahun,
                'bulan'       => $currentBulan,
                'dasarian_ke' => $currentDasarian,
            ];

            // Mundur satu dasarian
            $currentDasarian--;
            if ($currentDasarian < 1) {
                $currentDasarian = 3;
                $currentBulan--;
                if ($currentBulan < 1) {
                    $currentBulan = 12;
                    $currentTahun--;
                }
            }
        }

        // Query semua dasarian yang dibutuhkan
        $query = DataIklimDasarian::where('stasiun_id', $stasiunId);

        $query->where(function ($q) use ($periodes) {
            foreach ($periodes as $p) {
                $q->orWhere(function ($sq) use ($p) {
                    $sq->where('tahun', $p['tahun'])
                       ->where('bulan', $p['bulan'])
                       ->where('dasarian_ke', $p['dasarian_ke']);
                });
            }
        });

        return $query->orderBy('tahun', 'desc')
                     ->orderBy('bulan', 'desc')
                     ->orderBy('dasarian_ke', 'desc')
                     ->get();
    }
}
