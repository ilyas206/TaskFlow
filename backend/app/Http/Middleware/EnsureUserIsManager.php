<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsManager
{
    public function handle(Request $request, Closure $next): Response
    {
        // The auth:sanctum middleware runs first, so the user is always set here
        if (! $request->user()?->isManager()) {
            return response()->json(['message' => 'Forbidden. Managers only.'], 403);
        }

        return $next($request);
    }
}