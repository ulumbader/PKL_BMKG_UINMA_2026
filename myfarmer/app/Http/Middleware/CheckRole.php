<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Menerima parameter role, contoh: middleware('role:admin') atau middleware('role:super_admin').
     * super_admin adalah superset dari admin — bisa mengakses endpoint admin juga.
     *
     * Hierarki role:
     *   super_admin > admin
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $userRole = $user->role->nama_role;

        // super_admin bisa akses semua endpoint (superset dari admin)
        if ($userRole === 'super_admin') {
            return $next($request);
        }

        // Cek apakah role user sesuai dengan yang diminta
        if ($userRole === $role) {
            return $next($request);
        }

        return response()->json([
            'status'  => 'error',
            'message' => 'Anda tidak memiliki akses ke resource ini.',
        ], 403);
    }
}
