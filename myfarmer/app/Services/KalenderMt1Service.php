<?php

namespace App\Services;

/**
 * Pemeriksaan rentang Musim Tanam Pertama (MT1) berdasarkan parameter rule.
 *
 * Rentang memakai indeks dasarian tahunan 1-36 dan mendukung periode yang
 * melintasi pergantian tahun, misalnya November I sampai April II.
 */
class KalenderMt1Service
{
    /**
     * @var array<int, string>
     */
    private const PARAMETER_WAJIB = [
        'mt1_bulan_mulai',
        'mt1_dasarian_mulai',
        'mt1_bulan_selesai',
        'mt1_dasarian_selesai',
    ];

    /**
     * @param  array<string, mixed>  $parameter
     */
    public function parameterLengkap(array $parameter): bool
    {
        foreach (self::PARAMETER_WAJIB as $key) {
            if (! array_key_exists($key, $parameter)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $parameter
     */
    public function dalamRentang(array $parameter, int $bulan, int $dasarianKe): bool
    {
        $periode = $this->toIndex($bulan, $dasarianKe);
        $mulai = $this->toIndex(
            (int) $parameter['mt1_bulan_mulai'],
            (int) $parameter['mt1_dasarian_mulai']
        );
        $selesai = $this->toIndex(
            (int) $parameter['mt1_bulan_selesai'],
            (int) $parameter['mt1_dasarian_selesai']
        );

        if ($mulai <= $selesai) {
            return $periode >= $mulai && $periode <= $selesai;
        }

        return $periode >= $mulai || $periode <= $selesai;
    }

    /**
     * @param  array<string, mixed>  $parameter
     */
    public function labelRentang(array $parameter): string
    {
        return sprintf(
            '%s periode %d sampai %s periode %d',
            $this->namaBulan((int) $parameter['mt1_bulan_mulai']),
            (int) $parameter['mt1_dasarian_mulai'],
            $this->namaBulan((int) $parameter['mt1_bulan_selesai']),
            (int) $parameter['mt1_dasarian_selesai']
        );
    }

    /**
     * Keterangan kalender yang sederhana untuk card rekomendasi petani.
     */
    public function keteranganRekomendasi(bool $dalamMt1, string $statusRekomendasi): string
    {
        if (! $dalamMt1) {
            return 'Di luar musim tanam';
        }

        return $statusRekomendasi === 'optimal_tanam'
            ? 'Sudah memasuki musim tanam'
            : 'Walaupun sudah memasuki musim tanam, kondisi hujan belum mencukupi';
    }

    private function toIndex(int $bulan, int $dasarianKe): int
    {
        return (($bulan - 1) * 3) + $dasarianKe;
    }

    private function namaBulan(int $bulan): string
    {
        return match ($bulan) {
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
            default => 'Bulan tidak valid',
        };
    }
}
