<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StasiunIklim;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class StasiunIklimController extends Controller
{
    use ApiResponse;

    /**
     * Tampilkan seluruh stasiun iklim untuk opsi pilihan admin.
     */
    public function index(): JsonResponse
    {
        $stasiun = StasiunIklim::all([
            'id',
            'kode_wmo',
            'nama_stasiun',
            'lintang',
            'bujur',
            'elevasi_meter',
        ]);

        return $this->successResponse($stasiun, 'Data stasiun berhasil diambil');
    }
}
