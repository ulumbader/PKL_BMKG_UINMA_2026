<?php

namespace App\Services;

use App\Models\DataIklimDasarian;
use App\Models\HasilRekomendasi;
use App\Models\RuleRekomendasi;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Service untuk mengevaluasi rule rekomendasi terhadap data dasarian.
 *
 * Semua threshold dan parameter DIBACA dari kolom `parameter` (JSON)
 * di tabel rule_rekomendasi. TIDAK ADA angka threshold yang di-hardcode
 * di service ini (Golden Rule #5).
 *
 * Alur: data_iklim_dasarian -> (evaluasi rule) -> hasil_rekomendasi
 */
class RuleEngineService
{
    public function __construct(
        private readonly KalenderMt1Service $kalenderMt1Service
    ) {}

    /**
     * Evaluasi semua rule aktif terhadap satu dasarian.
     *
     * @param  int  $dasarianId  ID record di data_iklim_dasarian
     * @return array Daftar HasilRekomendasi yang baru dibuat/diupdate
     */
    public function evaluate(int $dasarianId): array
    {
        $dasarian = DataIklimDasarian::findOrFail($dasarianId);
        $rules = RuleRekomendasi::where('is_active', true)->get();
        $hasilList = [];

        foreach ($rules as $rule) {
            $result = $this->evaluateRule($rule, $dasarian);

            $hasil = HasilRekomendasi::updateOrCreate(
                [
                    'dasarian_id' => $dasarianId,
                    'rule_id' => $rule->id,
                ],
                [
                    'status_rekomendasi' => $result['status'],
                    'catatan_teknis' => $result['catatan'],
                    'generated_at' => Carbon::now(),
                ]
            );

            $hasil->load([
                'rule:id,nama_rule',
                'dasarian:id,tahun,bulan,dasarian_ke,total_curah_hujan_mm,jumlah_hari_hujan',
            ]);
            $hasilList[] = $hasil;
        }

        return $hasilList;
    }

    /**
     * Evaluasi satu rule terhadap satu jendela dasarian.
     *
     * Kriteria utama:
     *   - Semua N dasarian memiliki CH >= min_curah_hujan_dasarian.
     *
     * Kriteria alternatif (hanya diperiksa jika kriteria utama gagal):
     *   - Jika toggle aktif, total CH seluruh jendela >= total_alternatif_mm.
     *
     * Penguatan hari hujan (opsional):
     *   - Jika toggle aktif, semua N dasarian memiliki
     *     HH >= min_hari_hujan_dasarian.
     *
     * Guard kalender MT1:
     *   - Dasarian yang sedang direkomendasikan harus berada di antara
     *     awal dan akhir MT1. Rentang dapat melintasi pergantian tahun.
     *
     * @return array{status: string, catatan: string}
     */
    private function evaluateRule(RuleRekomendasi $rule, DataIklimDasarian $dasarian): array
    {
        $parameter = $rule->parameter;
        $minCurahHujan = $parameter['min_curah_hujan_dasarian'] ?? null;
        $minBerturut = $parameter['min_dasarian_berturut'] ?? null;
        $totalAlternatif = $parameter['total_alternatif_mm'] ?? null;
        $pakaiKriteriaTotalAlternatif = $parameter['pakai_kriteria_total_alternatif'] ?? null;
        $pakaiKriteriaHariHujan = $parameter['pakai_kriteria_hari_hujan'] ?? null;
        $minHariHujan = $parameter['min_hari_hujan_dasarian'] ?? null;
        $mt1BulanMulai = $parameter['mt1_bulan_mulai'] ?? null;
        $mt1DasarianMulai = $parameter['mt1_dasarian_mulai'] ?? null;
        $mt1BulanSelesai = $parameter['mt1_bulan_selesai'] ?? null;
        $mt1DasarianSelesai = $parameter['mt1_dasarian_selesai'] ?? null;

        if (
            $minCurahHujan === null
            || $minBerturut === null
            || $totalAlternatif === null
            || $pakaiKriteriaTotalAlternatif === null
            || $pakaiKriteriaHariHujan === null
            || $minHariHujan === null
            || $mt1BulanMulai === null
            || $mt1DasarianMulai === null
            || $mt1BulanSelesai === null
            || $mt1DasarianSelesai === null
        ) {
            return [
                'status' => 'tunggu',
                'catatan' => "Parameter rule '{$rule->nama_rule}' tidak lengkap. "
                    .'Dibutuhkan: min_curah_hujan_dasarian, min_dasarian_berturut, '
                    .'total_alternatif_mm, pakai_kriteria_total_alternatif, '
                    .'pakai_kriteria_hari_hujan, dan '
                    .'min_hari_hujan_dasarian, mt1_bulan_mulai, mt1_dasarian_mulai, '
                    .'mt1_bulan_selesai, dan mt1_dasarian_selesai. Parameter saat ini: '
                    .json_encode($parameter, JSON_UNESCAPED_UNICODE),
            ];
        }

        $minCurahHujan = (float) $minCurahHujan;
        $minBerturut = (int) $minBerturut;
        $totalAlternatif = (float) $totalAlternatif;
        $pakaiKriteriaTotalAlternatif = (bool) $pakaiKriteriaTotalAlternatif;
        $pakaiKriteriaHariHujan = (bool) $pakaiKriteriaHariHujan;
        $minHariHujan = (int) $minHariHujan;

        $dasarianBerturut = $this->getDasarianBerturut(
            $dasarian->stasiun_id,
            $dasarian->tahun,
            $dasarian->bulan,
            $dasarian->dasarian_ke,
            $minBerturut
        );

        $jumlahDitemukan = $dasarianBerturut->count();

        if ($jumlahDitemukan < $minBerturut) {
            return [
                'status' => 'tunggu',
                'catatan' => 'Data dasarian berturut-turut tidak cukup. '
                    ."Dibutuhkan {$minBerturut} dasarian, tersedia {$jumlahDitemukan}. "
                    .'Menunggu data lebih lengkap.',
            ];
        }

        // Collection diurutkan kronologis dan elemen terakhir adalah periode
        // yang sedang dievaluasi.
        $dasarianTerkini = $dasarianBerturut->last();
        $totalCurahHujan = (float) $dasarianBerturut->sum('total_curah_hujan_mm');
        $dalamRentangMt1 = $this->kalenderMt1Service->dalamRentang(
            $parameter,
            (int) $dasarianTerkini->bulan,
            (int) $dasarianTerkini->dasarian_ke
        );
        $labelRentangMt1 = $this->kalenderMt1Service->labelRentang($parameter);

        $kondisiUtama = $dasarianBerturut->every(
            fn (DataIklimDasarian $item) => (float) $item->total_curah_hujan_mm >= $minCurahHujan
        );

        // Kriteria alternatif adalah fallback. Jika kriteria utama sudah lulus,
        // nilai total alternatif tidak ikut menentukan jenis kelulusan.
        $kondisiAlternatif = $pakaiKriteriaTotalAlternatif
            && ! $kondisiUtama
            && $totalCurahHujan >= $totalAlternatif;

        $kondisiCurahHujanTerpenuhi = $kondisiUtama || $kondisiAlternatif;
        $jenisKriteriaCurahHujan = $kondisiUtama
            ? 'utama'
            : ($kondisiAlternatif ? 'alternatif' : null);

        $kondisiHariHujan = ! $pakaiKriteriaHariHujan || $dasarianBerturut->every(
            fn (DataIklimDasarian $item) => (int) $item->jumlah_hari_hujan >= $minHariHujan
        );

        $isAmhFinal = $kondisiCurahHujanTerpenuhi && $kondisiHariHujan && $dalamRentangMt1;
        $catatanDetail = $this->formatDetailDasarian(
            $dasarianBerturut,
            $minCurahHujan,
            $pakaiKriteriaHariHujan,
            $minHariHujan
        );

        if (! $dalamRentangMt1) {
            $keteranganCurahHujan = $kondisiCurahHujanTerpenuhi
                ? "Kriteria {$jenisKriteriaCurahHujan} curah hujan terpenuhi, tetapi"
                : 'Kriteria curah hujan belum terpenuhi dan';

            return [
                'status' => 'tidak_disarankan',
                'catatan' => "Rule '{$rule->nama_rule}': TIDAK DISARANKAN - {$keteranganCurahHujan} "
                    ."dasarian evaluasi berada di luar rentang MT1 ({$labelRentangMt1}). "
                    ."Detail kronologis: {$catatanDetail}",
            ];
        }

        if ($isAmhFinal) {
            $keteranganKriteria = $kondisiUtama
                ? "semua {$minBerturut} dasarian memiliki CH >= {$minCurahHujan}mm"
                : "kriteria utama tidak terpenuhi; total CH {$totalCurahHujan}mm "
                    .">= {$totalAlternatif}mm";
            $keteranganHariHujan = $pakaiKriteriaHariHujan
                ? " Kriteria HH juga terpenuhi (setiap dasarian >= {$minHariHujan} hari)."
                : ' Kriteria HH dinonaktifkan.';

            return [
                'status' => 'optimal_tanam',
                'catatan' => "Rule '{$rule->nama_rule}': OPTIMAL - kriteria {$jenisKriteriaCurahHujan} "
                    ."terpenuhi ({$keteranganKriteria}).{$keteranganHariHujan} "
                    ."Dasarian evaluasi berada dalam rentang MT1 ({$labelRentangMt1}). "
                    ."Detail kronologis: {$catatanDetail}",
            ];
        }

        if ($kondisiCurahHujanTerpenuhi && ! $kondisiHariHujan) {
            return [
                'status' => 'tunggu',
                'catatan' => "Rule '{$rule->nama_rule}': TUNGGU - kriteria "
                    ."{$jenisKriteriaCurahHujan} curah hujan "
                    .'terpenuhi, tetapi kriteria HH tidak terpenuhi pada seluruh dasarian '
                    ."(minimum {$minHariHujan} hari per dasarian). "
                    ."Dasarian evaluasi berada dalam rentang MT1 ({$labelRentangMt1}). "
                    ."Detail kronologis: {$catatanDetail}",
            ];
        }

        // Pertahankan semantik status lama: jika periode terkini sudah memenuhi
        // minimum, tunggu konfirmasi jendela; jika belum, tanam tidak disarankan.
        $terkiniMemenuhi = (float) $dasarianTerkini->total_curah_hujan_mm >= $minCurahHujan;
        $keteranganAlternatifGagal = $pakaiKriteriaTotalAlternatif
            ? "total CH {$totalCurahHujan}mm masih di bawah minimum alternatif {$totalAlternatif}mm"
            : 'kriteria total CH alternatif dinonaktifkan';

        if ($terkiniMemenuhi) {
            return [
                'status' => 'tunggu',
                'catatan' => "Rule '{$rule->nama_rule}': TUNGGU - dasarian terkini memiliki "
                    ."CH >= {$minCurahHujan}mm, tetapi kriteria utama gagal dan "
                    ."{$keteranganAlternatifGagal}. Detail kronologis: {$catatanDetail}",
            ];
        }

        return [
            'status' => 'tidak_disarankan',
            'catatan' => "Rule '{$rule->nama_rule}': TIDAK DISARANKAN - dasarian terkini "
                ."memiliki CH < {$minCurahHujan}mm, kriteria utama gagal, dan "
                ."{$keteranganAlternatifGagal}. "
                ."Detail kronologis: {$catatanDetail}",
        ];
    }

    /**
     * Susun detail evaluasi per dasarian untuk audit dan perbandingan metodologi.
     */
    private function formatDetailDasarian(
        Collection $dasarianBerturut,
        float $minCurahHujan,
        bool $pakaiKriteriaHariHujan,
        int $minHariHujan
    ): string {
        return $dasarianBerturut
            ->map(function (DataIklimDasarian $item) use (
                $minCurahHujan,
                $pakaiKriteriaHariHujan,
                $minHariHujan
            ): string {
                $statusCurahHujan = (float) $item->total_curah_hujan_mm >= $minCurahHujan
                    ? 'CH lulus'
                    : 'CH gagal';
                $statusHariHujan = ! $pakaiKriteriaHariHujan
                    ? 'HH diabaikan'
                    : ((int) $item->jumlah_hari_hujan >= $minHariHujan ? 'HH lulus' : 'HH gagal');

                return sprintf(
                    'D%d %02d/%d: CH %.1fmm (%s), HH %d hari (%s)',
                    $item->dasarian_ke,
                    $item->bulan,
                    $item->tahun,
                    $item->total_curah_hujan_mm,
                    $statusCurahHujan,
                    $item->jumlah_hari_hujan,
                    $statusHariHujan
                );
            })
            ->implode(' | ');
    }

    /**
     * Ambil N dasarian berturut-turut mundur dari titik referensi.
     *
     * Hasil diurutkan kronologis dari terlama ke terbaru agar elemen pertama
     * merepresentasikan kandidat awal musim hujan.
     *
     * @return Collection<int, DataIklimDasarian>
     */
    private function getDasarianBerturut(
        int $stasiunId,
        int $tahun,
        int $bulan,
        int $dasarianKe,
        int $jumlah
    ): Collection {
        $periodes = [];
        $currentTahun = $tahun;
        $currentBulan = $bulan;
        $currentDasarian = $dasarianKe;

        for ($i = 0; $i < $jumlah; $i++) {
            $periodes[] = [
                'tahun' => $currentTahun,
                'bulan' => $currentBulan,
                'dasarian_ke' => $currentDasarian,
            ];

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

        $query = DataIklimDasarian::where('stasiun_id', $stasiunId);

        $query->where(function ($query) use ($periodes): void {
            foreach ($periodes as $periode) {
                $query->orWhere(function ($subQuery) use ($periode): void {
                    $subQuery->where('tahun', $periode['tahun'])
                        ->where('bulan', $periode['bulan'])
                        ->where('dasarian_ke', $periode['dasarian_ke']);
                });
            }
        });

        return $query->orderBy('tahun')
            ->orderBy('bulan')
            ->orderBy('dasarian_ke')
            ->get();
    }
}
