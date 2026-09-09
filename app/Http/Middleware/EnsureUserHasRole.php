<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        if ($roles === [] || ! $user->hasRole($roles)) {
            abort(403, 'Akses tidak diizinkan untuk role ini.');
        }

        return $next($request);
    }
}
