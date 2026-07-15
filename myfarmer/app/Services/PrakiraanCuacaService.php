<?php

namespace App\Services;

use App\Models\PrakiraanCuacaBmkg;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk mengambil dan menyimpan data prakiraan cuaca real-time dari API BMKG.
 *
 * Data ini TERPISAH dari data_iklim_harian (data historis) dan
 * TIDAK dipakai sebagai input rule engine (AGENTS.md bagian 8a).
 * Dipakai khusus untuk widget "cuaca real-time" di landing page.
 *
 * API BMKG: https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah}
 * - Response berisi prakiraan per 3 jam untuk beberapa hari ke depan
 * - Data diupdate 2x sehari oleh BMKG
 * - Rate limit: max 60 request/menit/IP
 */
class PrakiraanCuacaService
{
    /**
     * Fetch data prakiraan cuaca dari API BMKG dan simpan ke database.
     *
     * Method ini:
     * 1. HTTP GET ke API BMKG dengan kode adm4
     * 2. Parse response JSON (nested: data[].cuaca[][] → array slot prakiraan)
     * 3. Upsert ke prakiraan_cuaca_bmkg berdasarkan unique (kode_adm4, datetime_prakiraan)
     * 4. Set fetched_at ke waktu saat ini
     *
     * @param string $kodeAdm4 Kode wilayah administratif level 4 (format: "xx.xx.xx.xxxx")
     * @return array Ringkasan hasil fetch: ['sukses' => int, 'gagal' => int, 'nama_wilayah' => string|null]
     *
     * @throws \Exception TIDAK throw exception — error ditangkap oleh try-catch dan di-log
     */
    public function fetchAndStore(string $kodeAdm4): array
    {
        $result = [
            'sukses'        => 0,
            'gagal'         => 0,
            'nama_wilayah'  => null,
            'kode_adm4'     => $kodeAdm4,
        ];

        try {
            $baseUrl = config('myfarmer.bmkg_api.base_url');
            $timeout = config('myfarmer.bmkg_api.timeout', 30);

            // HTTP GET ke API BMKG
            $response = Http::timeout($timeout)
                ->acceptJson()
                ->get($baseUrl, [
                    'adm4' => $kodeAdm4,
                ]);

            // Cek apakah request berhasil
            if (!$response->successful()) {
                Log::error('PrakiraanCuacaService: API BMKG mengembalikan HTTP error', [
                    'status_code' => $response->status(),
                    'kode_adm4'   => $kodeAdm4,
                    'body'        => $response->body(),
                ]);

                $result['error'] = "API BMKG mengembalikan HTTP {$response->status()}";
                return $result;
            }

            $json = $response->json();

            // Parsing response JSON BMKG
            // Struktur: { lokasi: {...}, data: [{ lokasi: {...}, cuaca: [[{...}, ...], ...] }] }
            $dataEntries = $json['data'] ?? [];

            if (empty($dataEntries)) {
                Log::warning('PrakiraanCuacaService: Response BMKG kosong (tidak ada data)', [
                    'kode_adm4' => $kodeAdm4,
                ]);

                $result['error'] = 'Response API BMKG kosong — kemungkinan kode adm4 salah';
                return $result;
            }

            // Ambil nama wilayah dari lokasi utama
            $lokasi = $json['lokasi'] ?? $dataEntries[0]['lokasi'] ?? [];
            $namaWilayah = $this->buildNamaWilayah($lokasi);
            $result['nama_wilayah'] = $namaWilayah;

            $fetchedAt = Carbon::now();

            // Iterasi setiap entry data (biasanya hanya 1 untuk adm4 tunggal)
            foreach ($dataEntries as $entry) {
                $cuacaHarian = $entry['cuaca'] ?? [];

                // cuaca berisi array per hari, masing-masing berisi array slot prakiraan
                foreach ($cuacaHarian as $slotPerHari) {
                    foreach ($slotPerHari as $slot) {
                        try {
                            $this->upsertSlotPrakiraan($slot, $kodeAdm4, $namaWilayah, $fetchedAt);
                            $result['sukses']++;
                        } catch (\Exception $e) {
                            Log::warning('PrakiraanCuacaService: Gagal upsert satu slot prakiraan', [
                                'kode_adm4' => $kodeAdm4,
                                'slot'      => $slot,
                                'error'     => $e->getMessage(),
                            ]);
                            $result['gagal']++;
                        }
                    }
                }
            }

            Log::info('PrakiraanCuacaService: Fetch prakiraan cuaca selesai', [
                'kode_adm4'    => $kodeAdm4,
                'nama_wilayah' => $namaWilayah,
                'sukses'       => $result['sukses'],
                'gagal'        => $result['gagal'],
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('PrakiraanCuacaService: Timeout/koneksi gagal ke API BMKG', [
                'kode_adm4' => $kodeAdm4,
                'error'     => $e->getMessage(),
            ]);
            $result['error'] = 'Koneksi ke API BMKG gagal (timeout atau jaringan). Coba lagi nanti.';

        } catch (\Exception $e) {
            Log::error('PrakiraanCuacaService: Error tidak terduga saat fetch prakiraan cuaca', [
                'kode_adm4' => $kodeAdm4,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            $result['error'] = 'Terjadi kesalahan: ' . $e->getMessage();
        }

        return $result;
    }

    /**
     * Upsert satu slot prakiraan cuaca ke database.
     *
     * Mapping field API BMKG → kolom database:
     *   - datetime / utc_datetime → datetime_prakiraan (UTC)
     *   - t                      → suhu (°C)
     *   - tp                     → curah_hujan_3jam (mm, total presipitasi per 3 jam)
     *   - hu                     → kelembapan (%)
     *   - ws                     → kecepatan_angin (km/jam)
     *   - weather_desc           → kondisi_cuaca (Bahasa Indonesia)
     *   - analysis_date          → analysis_date
     *
     * @param array    $slot         Data prakiraan satu slot waktu dari API BMKG
     * @param string   $kodeAdm4     Kode wilayah
     * @param string   $namaWilayah  Nama wilayah gabungan
     * @param Carbon   $fetchedAt    Waktu fetch
     */
    private function upsertSlotPrakiraan(array $slot, string $kodeAdm4, string $namaWilayah, Carbon $fetchedAt): void
    {
        // Parse datetime prakiraan — prioritaskan UTC datetime
        $datetimePrakiraan = $slot['datetime'] ?? $slot['utc_datetime'] ?? null;

        if (!$datetimePrakiraan) {
            throw new \InvalidArgumentException('Slot prakiraan tidak memiliki datetime');
        }

        // Parse analysis_date jika ada
        $analysisDate = isset($slot['analysis_date']) ? Carbon::parse($slot['analysis_date']) : null;

        // Upsert berdasarkan unique constraint (kode_adm4, datetime_prakiraan)
        PrakiraanCuacaBmkg::updateOrCreate(
            [
                'kode_adm4'           => $kodeAdm4,
                'datetime_prakiraan'  => Carbon::parse($datetimePrakiraan),
            ],
            [
                'nama_wilayah'        => $namaWilayah,
                'suhu'                => $slot['t'] ?? null,
                'curah_hujan_3jam'    => $slot['tp'] ?? null,
                'kelembapan'          => $slot['hu'] ?? null,
                'kecepatan_angin'     => $slot['ws'] ?? null,
                'kondisi_cuaca'       => $slot['weather_desc'] ?? null,
                'analysis_date'       => $analysisDate,
                'fetched_at'          => $fetchedAt,
            ]
        );
    }

    /**
     * Bangun string nama wilayah dari data lokasi BMKG.
     *
     * @param array $lokasi Data lokasi dari response API
     * @return string Nama wilayah gabungan: "Desa, Kecamatan, Kotkab"
     */
    private function buildNamaWilayah(array $lokasi): string
    {
        $parts = array_filter([
            $lokasi['desa'] ?? null,
            $lokasi['kecamatan'] ?? null,
            $lokasi['kotkab'] ?? null,
        ]);

        return implode(', ', $parts) ?: 'Wilayah tidak diketahui';
    }
}
