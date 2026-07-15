<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    use ApiResponse;

    /**
     * Tampilkan daftar audit log (read-only, super_admin only).
     * Filter: user_id, tabel_terkait, aksi, tanggal_mulai, tanggal_selesai.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,nama_lengkap,email')
            ->orderBy('created_at', 'desc');

        // Filter berdasarkan user_id
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter berdasarkan tabel terkait
        if ($request->has('tabel_terkait')) {
            $query->where('tabel_terkait', $request->input('tabel_terkait'));
        }

        // Filter berdasarkan aksi (created/updated/deleted)
        if ($request->has('aksi')) {
            $query->where('aksi', $request->input('aksi'));
        }

        // Filter berdasarkan rentang tanggal
        if ($request->has('tanggal_mulai')) {
            $query->where('created_at', '>=', $request->input('tanggal_mulai'));
        }

        if ($request->has('tanggal_selesai')) {
            $query->where('created_at', '<=', $request->input('tanggal_selesai') . ' 23:59:59');
        }

        $logs = $query->paginate($request->input('per_page', 20));

        return $this->successResponse($logs, 'Data audit log berhasil diambil');
    }
}
