<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProsesAgregatRequest;
use App\Models\DataIklimDasarian;
use App\Services\AggregationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AggregationController extends Controller
{
    use ApiResponse;

    /**
     * List data iklim dasarian (hasil agregasi) dengan filter opsional.
     *
     * Query params:
     *   - stasiun_id  : filter per stasiun
     *   - tahun       : filter per tahun
     *   - bulan       : filter per bulan
     *   - dasarian_ke : filter per dasarian (1, 2, 3)
     *   - per_page    : jumlah per halaman (default 50, max 200)
     */
    public function index(Request $request): JsonResponse
    {
        $query = DataIklimDasarian::with('stasiun:id,kode_wmo,nama_stasiun');

        if ($request->filled('stasiun_id')) {
            $query->where('stasiun_id', $request->input('stasiun_id'));
        }

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->input('tahun'));
        }

        if ($request->filled('bulan')) {
            $query->where('bulan', $request->input('bulan'));
        }

        if ($request->filled('dasarian_ke')) {
            $query->where('dasarian_ke', $request->input('dasarian_ke'));
        }

        // Urut dari terbaru: tahun desc, bulan desc, dasarian_ke desc
        $query->orderBy('tahun', 'desc')
              ->orderBy('bulan', 'desc')
              ->orderBy('dasarian_ke', 'desc');

        $perPage = min((int) $request->input('per_page', 50), 200);
        $data = $query->paginate($perPage);

        return $this->successResponse($data, 'Data iklim dasarian berhasil diambil.');
    }

    /**
     * Proses agregasi dasarian.
     *
     * Jika dasarian_ke tidak dikirim, proses ketiga dasarian (1, 2, 3) di bulan tersebut.
     */
    public function proses(ProsesAgregatRequest $request, AggregationService $aggregationService): JsonResponse
    {
        $stasiunId = (int) $request->input('stasiun_id');
        $tahun = (int) $request->input('tahun');
        $bulan = (int) $request->input('bulan');
        $dasarianKe = $request->input('dasarian_ke');

        $hasil = [];

        if ($dasarianKe !== null) {
            // Proses satu dasarian spesifik
            $record = $aggregationService->generateDasarian($stasiunId, $tahun, $bulan, (int) $dasarianKe);
            $record->load('stasiun:id,kode_wmo,nama_stasiun');

            $hasil[] = $record;
            $message = "Agregasi dasarian ke-{$dasarianKe} bulan {$bulan}/{$tahun} berhasil diproses.";
        } else {
            // Proses semua dasarian (1, 2, 3) di bulan tersebut
            for ($ke = 1; $ke <= 3; $ke++) {
                $record = $aggregationService->generateDasarian($stasiunId, $tahun, $bulan, $ke);
                $record->load('stasiun:id,kode_wmo,nama_stasiun');
                $hasil[] = $record;
            }

            $message = "Agregasi 3 dasarian bulan {$bulan}/{$tahun} berhasil diproses.";
        }

        return $this->successResponse($hasil, $message, 201);
    }
}
