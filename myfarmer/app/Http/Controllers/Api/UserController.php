<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * List semua user admin (untuk super_admin).
     */
    public function index(): JsonResponse
    {
        $users = User::with('role')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (User $user) {
                return [
                    'id'            => $user->id,
                    'nama_lengkap'  => $user->nama_lengkap,
                    'email'         => $user->email,
                    'nama_role'     => $user->role->nama_role,
                    'is_active'     => $user->is_active,
                    'last_login'    => $user->last_login,
                    'created_at'    => $user->created_at,
                ];
            });

        return $this->successResponse($users, 'Daftar user berhasil diambil.');
    }

    /**
     * Buat akun admin baru.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        $user->load('role');

        return $this->successResponse([
            'id'            => $user->id,
            'nama_lengkap'  => $user->nama_lengkap,
            'email'         => $user->email,
            'nama_role'     => $user->role->nama_role,
            'is_active'     => $user->is_active,
            'created_at'    => $user->created_at,
        ], 'User berhasil dibuat.', 201);
    }

    /**
     * Update data admin.
     */
    public function update(UpdateUserRequest $request, int $user): JsonResponse
    {
        $targetUser = User::find($user);

        if (!$targetUser) {
            return $this->errorResponse('User tidak ditemukan.', null, 404);
        }

        $targetUser->update($request->validated());
        $targetUser->load('role');

        return $this->successResponse([
            'id'            => $targetUser->id,
            'nama_lengkap'  => $targetUser->nama_lengkap,
            'email'         => $targetUser->email,
            'nama_role'     => $targetUser->role->nama_role,
            'is_active'     => $targetUser->is_active,
            'last_login'    => $targetUser->last_login,
            'updated_at'    => $targetUser->updated_at,
        ], 'User berhasil diperbarui.');
    }

    /**
     * Nonaktifkan (soft) atau hapus admin.
     * Default: nonaktifkan (set is_active = false). Tambah query param ?force=true untuk hapus permanen.
     */
    public function destroy(int $user): JsonResponse
    {
        $targetUser = User::find($user);

        if (!$targetUser) {
            return $this->errorResponse('User tidak ditemukan.', null, 404);
        }

        // Jangan izinkan super_admin menghapus diri sendiri
        if ($targetUser->id === auth()->id()) {
            return $this->errorResponse('Anda tidak bisa menonaktifkan/menghapus akun Anda sendiri.', null, 400);
        }

        if (request()->query('force') === 'true') {
            $targetUser->delete();
            return $this->successResponse(null, 'User berhasil dihapus permanen.');
        }

        // Soft deactivation
        $targetUser->update(['is_active' => false]);

        return $this->successResponse(null, 'User berhasil dinonaktifkan.');
    }
}
