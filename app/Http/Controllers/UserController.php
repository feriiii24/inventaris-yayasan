<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();

            if ($user && $user->hasRole('admin_unit')) {
                $routeUser = $request->route('user') ?? null;
                if ($routeUser) {
                    $targetUser = $routeUser instanceof \App\Models\User ? $routeUser : \App\Models\User::find($routeUser);
                    if ($targetUser && ($targetUser->unit_id ?? null) !== ($user->unit_id ?? null)) {
                        abort(403);
                    }
                }
            }

            return $next($request);
        })->only(['show', 'edit', 'update', 'destroy']);
    }

    public function index()
    {
        $query = User::with('unit')->latest();
        $authUser = auth()->user();
        if ($authUser && $authUser->hasRole('admin_unit')) {
            $query->where('unit_id', $authUser->unit_id);
        }

        $rows = $query->get()->map(fn ($user, $index) => [
            'id' => (string) $user->id,
            'no' => $index + 1,
            'nama' => $user->name,
            'email' => $user->email,
            'role' => $user->roleLabel(),
            'unit' => $user->unit?->name ?? '',
            'status' => match ($user->status) {
                'pending' => 'Pending',
                'nonaktif' => 'Nonaktif',
                default => 'Aktif',
            },
        ]);

        $unitsQuery = \App\Models\Unit::query()->select('id', 'name')->orderBy('name');
        $authUser = auth()->user();
        if ($authUser && $authUser->hasRole('admin_unit')) {
            $unitsQuery->where('id', $authUser->unit_id);
        }
        $units = $unitsQuery->get()->map(fn ($unit) => [
            'id' => (string) $unit->id,
            'name' => $unit->name,
        ]);

        return Inertia::render('Users/Index', [
            'rows' => $rows,
            'units' => $units,
        ]);
    }

    public function show(User $user)
    {
        $user->load('unit');

        return Inertia::render('Users/Detail', [
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roleLabel(),
                'unit' => $user->unit?->name ?? '',
                'status' => match ($user->status) {
                    'pending' => 'Pending',
                    'nonaktif' => 'Nonaktif',
                    default => 'Aktif',
                },
                'created_at' => $user->created_at?->format('d M Y') ?? '-',
                'last_login' => $user->updated_at?->format('d M Y, H:i') ?? '-',
            ],
        ]);
    }

    public function edit(User $user)
    {
        $user->load('unit');

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roleModel?->name ?? null,
                'unit_id' => $user->unit_id,
                'status' => $user->status,
                'unit' => $user->unit?->name ?? '',
            ],
            'units' => \App\Models\Unit::query()->select('id', 'name')->orderBy('name')->get()->map(fn ($unit) => [
                'id' => (string) $unit->id,
                'name' => $unit->name,
            ]),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role' => ['required', 'in:super_admin,admin_pusat,admin_unit'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'status' => ['required', 'in:aktif,pending,nonaktif'],
        ]);

        try {
            $user->fill([
                'name' => $data['name'],
                'email' => $data['email'],
                'role_id' => DB::table('roles')->where('name',$data['role'])->value('id'),
                'unit_id' => $data['unit_id'] ?? null,
                'status' => $data['status'],
            ]);
            $user->save();
            $this->logActivity('update', 'Memperbarui pengguna "' . $user->name . '".', User::class, (int) $user->id);

            return redirect()->route('users.index')->with('success', 'Pengguna berhasil diperbarui.');
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Gagal memperbarui pengguna.']);
        }
    }

    public function destroy(User $user)
    {
        try {
            $userName = $user->name;
            $user->delete();
            $this->logActivity('delete', 'Menghapus pengguna "' . $userName . '".', User::class, (int) $user->id);

            return redirect()->route('users.index')->with('success', 'Pengguna berhasil dihapus.');
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Gagal menghapus pengguna.']);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/'],
            'role' => ['required', 'in:super_admin,admin_pusat,admin_unit'],
            'unit_id' => ['nullable', 'exists:units,id'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => DB::table('roles')->where('name',$data['role'])->value('id'),
            'unit_id' => $data['unit_id'] ?? null,
            'status' => 'aktif',
        ]);
        $this->logActivity('create', 'Menambah pengguna "' . $user->name . '".', User::class, (int) $user->id);

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }
}
