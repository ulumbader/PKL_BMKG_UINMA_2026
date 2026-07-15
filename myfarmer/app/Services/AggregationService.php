<?php

namespace App\Services;

use App\Models\DataIklimDasarian;
use App\Models\DataIklimHarian;
use Carbon\Carbon;

/**
 * Service untuk agregasi data iklim harian menjadi data dasarian.
 *
 * Proses agregasi hanya MEMBACA dari raw layer (data_iklim_harian)
 * dan MENULIS ke aggregated layer (data_iklim_dasarian).
 * Data mentah TIDAK PERNAH dihapus atau ditimpa (Golden Rule #6).
 *
 * Periode dasarian:
 *   - Dasarian 1: tanggal 1–10
 *   - Dasarian 2: tanggal 11–20
 *   - Dasarian 3: tanggal 21–akhir bulan
 *
 * Threshold status_musim (perkiraan awal, bisa disesuaikan tim):
 *   - >= 150mm  → 'basah'
 *   - 50–149mm  → 'normal'
 *   - < 50mm    → 'kering'
 */
class AggregationService
{
    /**
     * Generate atau update satu record dasarian.
     *
     * @param int $stasiunId  ID stasiun_iklim
     * @param int $tahun      Tahun (misal 2025)
     * @param int $bulan      Bulan (1–12)
     * @param int $dasarianKe Nomor dasarian (1, 2, atau 3)
     * @return DataIklimDasarian Record yang di-upsert
     */
    public function generateDasarian(int $stasiunId, int $tahun, int $bulan, int $dasarianKe): DataIklimDasarian
    {
        // Tentukan rentang tanggal dasarian
        [$tanggalMulai, $tanggalSelesai] = $this->hitungRentangDasarian($tahun, $bulan, $dasarianKe);

        // Ambil semua data harian pada rentang tersebut (READ only dari raw layer)
        $dataHarian = DataIklimHarian::where('stasiun_id', $stasiunId)
            ->whereBetween('tanggal', [$tanggalMulai, $tanggalSelesai])
            ->get();

        // Hitung metrik agregasi
        $dataValid = $dataHarian->where('kode_status', 'normal');

        $totalCurahHujan = $dataValid->sum('curah_hujan_mm');
        $jumlahHariHujan = $dataValid->where('curah_hujan_mm', '>', 0)->count();
        $jumlahHariValid = $dataValid->count();
        $jumlahHariMissing = $dataHarian->where('kode_status', '!=', 'normal')->count();

        // Tentukan status musim berdasarkan total curah hujan
        $statusMusim = $this->tentukanStatusMusim((float) $totalCurahHujan);

        // Upsert ke data_iklim_dasarian berdasarkan unique constraint
        return DataIklimDasarian::updateOrCreate(
            [
                'stasiun_id'  => $stasiunId,
                'tahun'       => $tahun,
                'bulan'       => $bulan,
                'dasarian_ke' => $dasarianKe,
            ],
            [
                'tanggal_mulai'        => $tanggalMulai,
                'tanggal_selesai'      => $tanggalSelesai,
                'total_curah_hujan_mm' => $totalCurahHujan,
                'jumlah_hari_hujan'    => $jumlahHariHujan,
                'jumlah_hari_valid'    => $jumlahHariValid,
                'jumlah_hari_missing'  => $jumlahHariMissing,
                'status_musim'         => $statusMusim,
                'dihitung_pada'        => Carbon::now(),
            ]
        );
    }

    /**
     * Generate dasarian untuk rentang bulan sekaligus.
     *
     * Berguna untuk memproses data historis (misal 1 tahun penuh).
     *
     * @param int $stasiunId   ID stasiun_iklim
     * @param int $tahunMulai  Tahun awal
     * @param int $bulanMulai  Bulan awal (1–12)
     * @param int $tahunAkhir  Tahun akhir
     * @param int $bulanAkhir  Bulan akhir (1–12)
     * @return array Ringkasan: ['total_diproses' => int, 'hasil' => array]
     */
    public function generateForRange(
        int $stasiunId,
        int $tahunMulai,
        int $bulanMulai,
        int $tahunAkhir,
        int $bulanAkhir
    ): array {
        $hasil = [];
        $totalDiproses = 0;

        // Iterasi dari bulan awal ke bulan akhir
        $current = Carbon::create($tahunMulai, $bulanMulai, 1);
        $end = Carbon::create($tahunAkhir, $bulanAkhir, 1)->endOfMonth();

        while ($current->lte($end)) {
            $tahun = $current->year;
            $bulan = $current->month;

            for ($dasarianKe = 1; $dasarianKe <= 3; $dasarianKe++) {
                $record = $this->generateDasarian($stasiunId, $tahun, $bulan, $dasarianKe);

                $hasil[] = [
                    'tahun'                => $tahun,
                    'bulan'                => $bulan,
                    'dasarian_ke'          => $dasarianKe,
                    'total_curah_hujan_mm' => $record->total_curah_hujan_mm,
                    'status_musim'         => $record->status_musim,
                ];

                $totalDiproses++;
            }

            $current->addMonth();
        }

        return [
            'total_diproses' => $totalDiproses,
            'hasil'          => $hasil,
        ];
    }

    /**
     * Hitung tanggal mulai dan selesai untuk suatu dasarian.
     *
     * @param int $tahun
     * @param int $bulan
     * @param int $dasarianKe (1, 2, atau 3)
     * @return array [tanggal_mulai (string Y-m-d), tanggal_selesai (string Y-m-d)]
     */
    private function hitungRentangDasarian(int $tahun, int $bulan, int $dasarianKe): array
    {
        switch ($dasarianKe) {
            case 1:
                $tanggalMulai = sprintf('%04d-%02d-01', $tahun, $bulan);
                $tanggalSelesai = sprintf('%04d-%02d-10', $tahun, $bulan);
                break;

            case 2:
                $tanggalMulai = sprintf('%04d-%02d-11', $tahun, $bulan);
                $tanggalSelesai = sprintf('%04d-%02d-20', $tahun, $bulan);
                break;

            case 3:
                $tanggalMulai = sprintf('%04d-%02d-21', $tahun, $bulan);
                // Akhir bulan (28, 29, 30, atau 31 tergantung bulan/tahun)
                $tanggalSelesai = Carbon::create($tahun, $bulan, 1)->endOfMonth()->format('Y-m-d');
                break;

            default:
                throw new \InvalidArgumentException("dasarian_ke harus 1, 2, atau 3. Diterima: {$dasarianKe}");
        }

        return [$tanggalMulai, $tanggalSelesai];
    }

    /**
     * Tentukan status musim berdasarkan total curah hujan dasarian.
     *
     * Threshold ini adalah PERKIRAAN AWAL dan bisa disesuaikan oleh tim.
     * Ke depan, threshold sebaiknya dipindah ke konfigurasi database
     * agar bisa diubah tanpa deploy ulang.
     *
     * @param float $totalCurahHujan Total curah hujan dalam mm
     * @return string 'basah', 'normal', atau 'kering'
     */
    private function tentukanStatusMusim(float $totalCurahHujan): string
    {
        if ($totalCurahHujan >= 150) {
            return 'basah';
        }

        if ($totalCurahHujan >= 50) {
            return 'normal';
        }

        return 'kering';
    }
}
