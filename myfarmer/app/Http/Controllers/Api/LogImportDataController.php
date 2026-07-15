<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LogImportData;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogImportDataController extends Controller
{
    use ApiResponse;

    /**
     * Tampilkan histori import data BMKG (read-only, paginasi, filter status & sumber).
     */
    public function index(Request $request): JsonResponse
    {
        $query = LogImportData::with('triggeredBy:id,nama_lengkap')
            ->orderBy('waktu_mulai', 'desc');

        // Filter berdasarkan status (sukses/gagal)
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter berdasarkan sumber
        if ($request->has('sumber')) {
            $query->where('sumber', $request->input('sumber'));
        }

        // Filter berdasarkan rentang waktu
        if ($request->has('tanggal_mulai')) {
            $query->where('waktu_mulai', '>=', $request->input('tanggal_mulai'));
        }

        if ($request->has('tanggal_selesai')) {
            $query->where('waktu_mulai', '<=', $request->input('tanggal_selesai') . ' 23:59:59');
        }

        $logs = $query->paginate($request->input('per_page', 15));

        return $this->successResponse($logs, 'Histori import data berhasil diambil');
    }
}
