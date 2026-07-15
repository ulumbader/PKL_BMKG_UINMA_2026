<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Login admin/super_admin dan kembalikan Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return $this->errorResponse('Email atau password salah.', null, 401);
        }

        $user = Auth::user();

        // Cek apakah akun masih aktif
        if (!$user->is_active) {
            Auth::logout();
            return $this->errorResponse('Akun Anda telah dinonaktifkan. Hubungi super admin.', null, 403);
        }

        // Update last_login
        $user->update(['last_login' => now()]);

        // Buat Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user'  => [
                'id'            => $user->id,
                'nama_lengkap'  => $user->nama_lengkap,
                'email'         => $user->email,
                'nama_role'     => $user->role->nama_role,
                'is_active'     => $user->is_active,
                'last_login'    => $user->last_login,
            ],
            'token' => $token,
        ], 'Login berhasil.');
    }

    /**
     * Logout — revoke token yang sedang dipakai.
     */
    public function logout(Request $request): JsonResponse
    {
        // Hapus token yang dipakai untuk request ini
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout berhasil.');
    }
}
