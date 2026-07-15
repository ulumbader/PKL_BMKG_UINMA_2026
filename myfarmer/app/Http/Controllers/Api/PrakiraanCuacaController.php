<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PrakiraanCuacaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Controller untuk admin mengelola fetch prakiraan cuaca real-time dari API BMKG.
 *
 * Data prakiraan cuaca TERPISAH dari data_iklim_harian (historis)
 * dan TIDAK dipakai sebagai input rule engine.
 * Khusus untuk widget cuaca real-time di landing page.
 */
class PrakiraanCuacaController extends Controller
{
    use ApiResponse;

    /**
     * Trigger fetch prakiraan cuaca dari API BMKG.
     *
     * Mengambil kode_adm4 dari config('myfarmer.kode_adm4_default'),
     * memanggil PrakiraanCuacaService::fetchAndStore(),
     * dan mengembalikan ringkasan hasil.
     *
     * Endpoint ini bisa juga dipanggil secara terjadwal
     * lewat Laravel Scheduler (artisan command).
     */
    public function fetch(PrakiraanCuacaService $service): JsonResponse
    {
        $kodeAdm4 = config('myfarmer.kode_adm4_default');

        if (empty($kodeAdm4)) {
            return $this->errorResponse(
                'Kode ADM4 belum dikonfigurasi. Set BMKG_KODE_ADM4 di file .env atau config/myfarmer.php.',
                null,
                422
            );
        }

        $result = $service->fetchAndStore($kodeAdm4);

        // Jika ada error dari service (API down, timeout, dll)
        if (isset($result['error'])) {
            // Tetap kembalikan partial result jika ada data yang berhasil
            if ($result['sukses'] > 0) {
                return $this->successResponse($result,
                    "Fetch sebagian berhasil. {$result['sukses']} slot prakiraan disimpan, tapi ada error: {$result['error']}");
            }

            return $this->errorResponse(
                "Gagal mengambil data prakiraan cuaca dari API BMKG: {$result['error']}",
                $result,
                502
            );
        }

        $message = "Prakiraan cuaca berhasil diambil dari API BMKG. "
            . "{$result['sukses']} slot prakiraan disimpan, {$result['gagal']} gagal.";

        if ($result['nama_wilayah']) {
            $message .= " Wilayah: {$result['nama_wilayah']}.";
        }

        return $this->successResponse($result, $message, 201);
    }
}
