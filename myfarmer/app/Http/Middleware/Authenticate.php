<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * Backend API-only — selalu return null agar mengembalikan 401 JSON,
     * bukan redirect ke route 'login' yang tidak ada.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}
