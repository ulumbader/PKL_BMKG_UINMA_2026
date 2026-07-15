<?php

namespace App\Services;

use App\Models\DataIklimHarian;
use App\Models\LogImportData;
use Carbon\Carbon;
use Exception;

/**
 * Service untuk mengimpor data iklim harian dari file CSV BMKG.
 *
 * Format CSV BMKG non-standar:
 *  - Delimiter: titik koma (;)
 *  - Desimal: koma (10,8 → 10.8)
 *  - Baris header/metadata dan footer keterangan → di-skip
 *  - Hanya baris dengan tanggal format dd/mm/yyyy yang diproses
 *  - Kode 8888 = tidak_terukur, 9999 = tidak_ada_data → curah_hujan_mm = null
 *
 * Data mentah (data_iklim_harian) TIDAK diambil dari API BMKG manapun.
 * Sumber hanya: input manual admin atau import file CSV dari Data Online BMKG.
 */
class CsvImportService
{
    /**
     * Import data dari file CSV BMKG ke tabel data_iklim_harian.
     *
     * @param string $filePath  Path absolut ke file CSV yang sudah di-upload
     * @param int    $stasiunId ID stasiun_iklim tujuan import
     * @param int    $userId    ID user yang men-trigger import
     * @return array Ringkasan hasil: ['sukses' => int, 'dilewati' => int, 'gagal' => int, 'total_baris' => int]
     */
    public function importFromFile(string $filePath, int $stasiunId, int $userId): array
    {
        $waktuMulai = Carbon::now();
        $sukses = 0;
        $gagal = 0;
        $dilewati = 0;
        $totalBaris = 0;
        $errors = [];

        try {
            $handle = fopen($filePath, 'r');

            if ($handle === false) {
                throw new Exception('Tidak dapat membuka file CSV.');
            }

            while (($line = fgets($handle)) !== false) {
                $totalBaris++;
                $line = trim($line);

                // Skip baris kosong
                if (empty($line)) {
                    $dilewati++;
                    continue;
                }

                // Parse baris dengan delimiter titik koma
                $columns = str_getcsv($line, ';');

                // Skip jika kolom pertama bukan format tanggal dd/mm/yyyy
                if (!$this->isValidDateFormat($columns[0] ?? '')) {
                    $dilewati++;
                    continue;
                }

                try {
                    $result = $this->processRow($columns, $stasiunId, $userId);

                    if ($result) {
                        $sukses++;
                    } else {
                        $gagal++;
                        $errors[] = "Baris {$totalBaris}: Gagal menyimpan data.";
                    }
                } catch (Exception $e) {
                    $gagal++;
                    $errors[] = "Baris {$totalBaris}: {$e->getMessage()}";
                }
            }

            fclose($handle);

        } catch (Exception $e) {
            // Log error fatal (tidak bisa buka file, dsb.)
            $this->createLog(
                status: 'gagal',
                jumlahDataMasuk: $sukses,
                pesanError: $e->getMessage(),
                waktuMulai: $waktuMulai,
                userId: $userId
            );

            return [
                'sukses'      => $sukses,
                'dilewati'    => $dilewati,
                'gagal'       => $gagal,
                'total_baris' => $totalBaris,
                'errors'      => [$e->getMessage()],
            ];
        }

        // Catat log hasil import
        $status = $gagal > 0 && $sukses === 0 ? 'gagal' : 'sukses';
        $pesanError = !empty($errors) ? implode("\n", array_slice($errors, 0, 50)) : null;

        $this->createLog(
            status: $status,
            jumlahDataMasuk: $sukses,
            pesanError: $pesanError,
            waktuMulai: $waktuMulai,
            userId: $userId
        );

        return [
            'sukses'      => $sukses,
            'dilewati'    => $dilewati,
            'gagal'       => $gagal,
            'total_baris' => $totalBaris,
            'errors'      => $errors,
        ];
    }

    /**
     * Cek apakah string sesuai format tanggal dd/mm/yyyy.
     */
    private function isValidDateFormat(string $value): bool
    {
        $value = trim($value);

        return (bool) preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $value);
    }

    /**
     * Proses satu baris CSV dan upsert ke data_iklim_harian.
     *
     * Asumsi kolom CSV BMKG (berdasarkan format Data Online BMKG):
     *   [0] = Tanggal (dd/mm/yyyy)
     *   [1] = Curah Hujan (mm), bisa berisi 8888 atau 9999
     *
     * @param array $columns  Array kolom dari satu baris CSV
     * @param int   $stasiunId
     * @param int   $userId
     * @return bool True jika berhasil upsert
     */
    private function processRow(array $columns, int $stasiunId, int $userId): bool
    {
        // Parse tanggal
        $tanggalRaw = trim($columns[0]);
        $tanggal = $this->parseDate($tanggalRaw);

        if (!$tanggal) {
            throw new Exception("Format tanggal tidak valid: {$tanggalRaw}");
        }

        // Parse curah hujan (kolom kedua)
        $curahHujanRaw = isset($columns[1]) ? trim($columns[1]) : '';
        $curahHujanMm = null;
        $kodeStatus = 'normal';

        if ($curahHujanRaw === '8888') {
            // Kode 8888 = data tidak terukur
            $kodeStatus = 'tidak_terukur';
            $curahHujanMm = null;
        } elseif ($curahHujanRaw === '9999') {
            // Kode 9999 = tidak ada data
            $kodeStatus = 'tidak_ada_data';
            $curahHujanMm = null;
        } elseif ($curahHujanRaw !== '') {
            // Konversi desimal koma ke titik (format BMKG: 10,8 → 10.8)
            $curahHujanMm = (float) str_replace(',', '.', $curahHujanRaw);

            if ($curahHujanMm < 0) {
                throw new Exception("Curah hujan negatif tidak valid: {$curahHujanRaw}");
            }
        } else {
            // Kolom kosong = tidak ada data
            $kodeStatus = 'tidak_ada_data';
            $curahHujanMm = null;
        }

        // Upsert berdasarkan unique constraint (stasiun_id, tanggal)
        DataIklimHarian::updateOrCreate(
            [
                'stasiun_id' => $stasiunId,
                'tanggal'    => $tanggal,
            ],
            [
                'curah_hujan_mm' => $curahHujanMm,
                'kode_status'    => $kodeStatus,
                'sumber_data'    => 'import_csv',
                'dibuat_oleh'    => $userId,
            ]
        );

        return true;
    }

    /**
     * Parse tanggal dari format dd/mm/yyyy ke Y-m-d.
     */
    private function parseDate(string $raw): ?string
    {
        $parts = explode('/', $raw);

        if (count($parts) !== 3) {
            return null;
        }

        $day   = (int) $parts[0];
        $month = (int) $parts[1];
        $year  = (int) $parts[2];

        if (!checkdate($month, $day, $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    /**
     * Catat hasil import ke tabel log_import_data.
     */
    private function createLog(
        string $status,
        int $jumlahDataMasuk,
        ?string $pesanError,
        Carbon $waktuMulai,
        int $userId
    ): void {
        LogImportData::create([
            'sumber'            => 'import_csv',
            'status'            => $status,
            'jumlah_data_masuk' => $jumlahDataMasuk,
            'pesan_error'       => $pesanError,
            'waktu_mulai'       => $waktuMulai,
            'waktu_selesai'     => Carbon::now(),
            'triggered_by'      => $userId,
        ]);
    }
}
