<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shared = [
            ...parent::share($request),
        ];

        $user = $request->user();

        if ($user) {
            // Eager load unit and role relation if available
            try {
                $user->load(['unit', 'roleModel']);
            } catch (\Throwable $e) {
                // ignore if relation not present
            }

            // Prefer the normalized role name from relation (roleModel), fall back to legacy 'role' if present
            $roleName = null;
            $roleLabel = null;
            try {
                if ($user->relationLoaded('roleModel') && $user->roleModel) {
                    $roleName = $user->roleModel->name;
                    $roleLabel = $user->roleModel->label ?? ucfirst(str_replace('_', ' ', $roleName));
                } else {
                    $roleName = $user->role ?? null;
                    $roleLabel = match ($user->role) {
                        'super_admin' => 'Super Admin',
                        'admin_pusat' => 'Admin Pusat',
                        'admin_unit' => 'Admin Unit',
                        default => null,
                    };
                }
            } catch (\Throwable $e) {
                // ignore
            }

            $shared['auth'] = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $roleName,
                    'role_label' => $roleLabel,
                    'unit' => $user->unit ? [
                        'id' => $user->unit->id,
                        'name' => $user->unit->name,
                    ] : null,
                ],
            ];
        } else {
            $shared['auth'] = ['user' => null];
        }

        // Share flash messages (success, error) to Inertia props so frontend can display alerts.
        // Use pull() so each message is consumed exactly once and does not keep showing on every page render.
        $shared['flash'] = [
            'success' => session()->pull('success'),
            'error' => session()->pull('error'),
        ];

        return $shared;
    }
}
