<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait ApiResponse
 *
 * Helper methods untuk standarisasi format response API.
 * Semua controller WAJIB menggunakan trait ini agar format response konsisten
 * sesuai aturan di AGENTS.md bagian 5.
 */
trait ApiResponse
{
    /**
     * Return a success JSON response.
     *
     * @param mixed       $data    Data yang dikembalikan (object, array, null)
     * @param string      $message Pesan sukses
     * @param int         $code    HTTP status code (default 200)
     * @return JsonResponse
     */
    protected function successResponse(mixed $data = null, string $message = 'Berhasil', int $code = 200): JsonResponse
    {
        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    /**
     * Return an error JSON response.
     *
     * @param string     $message Pesan error
     * @param mixed      $errors  Detail error (validasi, dsb)
     * @param int        $code    HTTP status code (default 400)
     * @return JsonResponse
     */
    protected function errorResponse(string $message = 'Terjadi kesalahan', mixed $errors = null, int $code = 400): JsonResponse
    {
        $response = [
            'status'  => 'error',
            'message' => $message,
        ];

        if (!is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }
}
