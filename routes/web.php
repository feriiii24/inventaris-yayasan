<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AsetBergerakController;
use App\Http\Controllers\AsetInventarisController;
use App\Http\Controllers\AsetTidakBergerakController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UsahaYayasanController;
use App\Http\Controllers\UserController;
use App\Models\Asset;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Auth/Login');
})->name('home');

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/ai-assistant', [AiAssistantController::class, 'answer'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/unit', [MasterController::class, 'units'])->middleware('role:super_admin,admin_pusat');
    Route::get('/unit/distribusi', [MasterController::class, 'distribution'])->middleware('role:super_admin,admin_pusat');
    Route::get('/unit/create', [MasterController::class, 'create'])->middleware('role:super_admin,admin_pusat');
    Route::post('/unit', [MasterController::class, 'store'])->middleware('role:super_admin,admin_pusat');
    Route::get('/unit/{unit}', [MasterController::class, 'show'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/unit/{unit}/edit', [MasterController::class, 'edit'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::put('/unit/{unit}', [MasterController::class, 'update'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::delete('/unit/{unit}', [MasterController::class, 'destroy'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/laporan', [ReportController::class, 'index'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/laporan/kondisi', [ReportController::class, 'condition'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/laporan/nilai', [ReportController::class, 'value'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/laporan/mutasi', [ReportController::class, 'mutation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/lokasi', [MasterController::class, 'locations'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::post('/master/lokasi', [MasterController::class, 'storeLocation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::delete('/master/lokasi/{location}', [MasterController::class, 'destroyLocation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/lokasi/{location}/edit', [MasterController::class, 'editLocation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::put('/master/lokasi/{location}', [MasterController::class, 'updateLocation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/lokasi/{location}', [MasterController::class, 'showLocation'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/ruangan', [MasterController::class, 'rooms'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/ruangan/create', [MasterController::class, 'createRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::post('/master/ruangan', [MasterController::class, 'storeRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/ruangan/{room}/edit', [MasterController::class, 'editRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::put('/master/ruangan/{room}', [MasterController::class, 'updateRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::delete('/master/ruangan/{room}', [MasterController::class, 'destroyRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/master/ruangan/{room}', [MasterController::class, 'showRoom'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/pengguna', [UserController::class, 'index'])->middleware('role:super_admin')->name('users.index');
    Route::get('/pengguna/{user}', [UserController::class, 'show'])->middleware('role:super_admin');
    Route::get('/pengguna/{user}/edit', [UserController::class, 'edit'])->middleware('role:super_admin');
    Route::put('/pengguna/{user}', [UserController::class, 'update'])->middleware('role:super_admin');
    Route::delete('/pengguna/{user}', [UserController::class, 'destroy'])->middleware('role:super_admin');
    Route::post('/pengguna', [UserController::class, 'store'])->middleware('role:super_admin');
    Route::get('/aktivitas', [ActivityController::class, 'index'])->middleware('role:super_admin,admin_pusat');
    Route::get('/pengaturan', function () {
        return Inertia::render('Settings/Index');
    })->middleware('role:super_admin');

});

Route::middleware('auth')->group(function () {
Route::get('/inventaris/aset-inventaris', [AsetInventarisController::class, 'index'])->name('aset-inventaris.index');
Route::get('/inventaris/aset-inventaris/create', [AsetInventarisController::class, 'create'])->name('aset-inventaris.create');
Route::post('/inventaris/aset-inventaris', [AsetInventarisController::class, 'store'])->name('aset-inventaris.store');
Route::get('/inventaris/aset-inventaris/{asetInventaris}', [AsetInventarisController::class, 'show'])->name('aset-inventaris.show');
Route::get('/inventaris/aset-inventaris/{asetInventaris}/edit', [AsetInventarisController::class, 'edit'])->name('aset-inventaris.edit');
Route::put('/inventaris/aset-inventaris/{asetInventaris}', [AsetInventarisController::class, 'update'])->name('aset-inventaris.update');
Route::post('/inventaris/aset-inventaris/{asetInventaris}/repair', [AsetInventarisController::class, 'repair'])->name('aset-inventaris.repair');
Route::delete('/inventaris/aset-inventaris/{asetInventaris}', [AsetInventarisController::class, 'destroy'])->name('aset-inventaris.destroy');
});
Route::get('/inventaris', [AsetInventarisController::class, 'publicIndex'])->name('assets.inventory.index');
Route::get('/ajukan-peminjaman', [AsetInventarisController::class, 'publicBorrowing'])->name('assets.public.borrowing');
Route::post('/ajukan-peminjaman', [AsetInventarisController::class, 'storePublicBorrowing'])->name('assets.public.borrowing.store');
Route::middleware(['auth', 'role:super_admin,admin_pusat'])->group(function () {
    Route::get('/inventaris/aset-bergerak', [AsetBergerakController::class, 'index'])->name('aset-bergerak.index');
    Route::get('/inventaris/aset-bergerak/create', [AsetBergerakController::class, 'create'])->name('aset-bergerak.create');
    Route::post('/inventaris/aset-bergerak', [AsetBergerakController::class, 'store'])->name('aset-bergerak.store');
    Route::get('/inventaris/aset-bergerak/{asetBergerak}', [AsetBergerakController::class, 'show'])->name('aset-bergerak.show');
    Route::get('/inventaris/aset-bergerak/{asetBergerak}/edit', [AsetBergerakController::class, 'edit'])->name('aset-bergerak.edit');
    Route::put('/inventaris/aset-bergerak/{asetBergerak}', [AsetBergerakController::class, 'update'])->name('aset-bergerak.update');
    Route::delete('/inventaris/aset-bergerak/{asetBergerak}', [AsetBergerakController::class, 'destroy'])->name('aset-bergerak.destroy');
});
Route::middleware(['auth', 'role:super_admin,admin_pusat'])->group(function () {
    Route::get('/inventaris/aset-tidak-bergerak', [AsetTidakBergerakController::class, 'index'])->name('aset-tidak-bergerak.index');
    Route::get('/inventaris/aset-tidak-bergerak/create', [AsetTidakBergerakController::class, 'create'])->name('aset-tidak-bergerak.create');
    Route::post('/inventaris/aset-tidak-bergerak', [AsetTidakBergerakController::class, 'store'])->name('aset-tidak-bergerak.store');
    Route::get('/inventaris/aset-tidak-bergerak/{asetTidakBergerak}', [AsetTidakBergerakController::class, 'show'])->name('aset-tidak-bergerak.show');
    Route::get('/inventaris/aset-tidak-bergerak/{asetTidakBergerak}/edit', [AsetTidakBergerakController::class, 'edit'])->name('aset-tidak-bergerak.edit');
    Route::put('/inventaris/aset-tidak-bergerak/{asetTidakBergerak}', [AsetTidakBergerakController::class, 'update'])->name('aset-tidak-bergerak.update');
    Route::delete('/inventaris/aset-tidak-bergerak/{asetTidakBergerak}', [AsetTidakBergerakController::class, 'destroy'])->name('aset-tidak-bergerak.destroy');
});
Route::middleware(['auth', 'role:super_admin,admin_pusat'])->group(function () {
    Route::get('/inventaris/usaha-yayasan', [UsahaYayasanController::class, 'index'])->name('usaha-yayasan.index');
    Route::get('/inventaris/usaha-yayasan/create', [UsahaYayasanController::class, 'create'])->name('usaha-yayasan.create');
    Route::post('/inventaris/usaha-yayasan', [UsahaYayasanController::class, 'store'])->name('usaha-yayasan.store');
    Route::get('/inventaris/usaha-yayasan/{usahaYayasan}', [UsahaYayasanController::class, 'show'])->name('usaha-yayasan.show');
    Route::get('/inventaris/usaha-yayasan/{usahaYayasan}/edit', [UsahaYayasanController::class, 'edit'])->name('usaha-yayasan.edit');
    Route::put('/inventaris/usaha-yayasan/{usahaYayasan}', [UsahaYayasanController::class, 'update'])->name('usaha-yayasan.update');
    Route::delete('/inventaris/usaha-yayasan/{usahaYayasan}', [UsahaYayasanController::class, 'destroy'])->name('usaha-yayasan.destroy');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/peminjaman', [TransactionController::class, 'borrowings']);
    Route::get('/peminjaman/create', [TransactionController::class, 'createBorrowing']);
    Route::post('/peminjaman', [TransactionController::class, 'storeBorrowing']);
    Route::get('/peminjaman/{assetBorrowing}', [TransactionController::class, 'showBorrowing']);
    Route::get('/peminjaman/{assetBorrowing}/edit', [TransactionController::class, 'editBorrowing']);
    Route::put('/peminjaman/{assetBorrowing}', [TransactionController::class, 'updateBorrowing']);
    Route::delete('/peminjaman/{assetBorrowing}', [TransactionController::class, 'destroyBorrowing']);
    Route::post('/peminjaman/{assetBorrowing}/return', [TransactionController::class, 'requestReturnBorrowing']);
    Route::post('/peminjaman/{assetBorrowing}/approve', [TransactionController::class, 'approveBorrowing'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::post('/peminjaman/{assetBorrowing}/reject', [TransactionController::class, 'rejectBorrowing'])->middleware('role:super_admin,admin_pusat,admin_unit');
    Route::get('/mutasi', [TransactionController::class, 'mutations']);
    Route::get('/mutasi/create', [TransactionController::class, 'create']);
    Route::post('/mutasi', [TransactionController::class, 'store']);
    Route::post('/mutasi/{assetMutation}/approve', [TransactionController::class, 'approveMutation'])->middleware('role:admin_unit');
    Route::post('/mutasi/{assetMutation}/reject', [TransactionController::class, 'rejectMutation'])->middleware('role:admin_unit');
    Route::get('/mutasi/{assetMutation}', [TransactionController::class, 'show']);
    Route::get('/mutasi/{assetMutation}/edit', [TransactionController::class, 'edit']);
    Route::put('/mutasi/{assetMutation}', [TransactionController::class, 'update']);
    Route::delete('/mutasi/{assetMutation}', [TransactionController::class, 'destroy']);
    Route::get('/pengembalian', [TransactionController::class, 'returns']);
    Route::get('/pengembalian/{assetBorrowing}', [TransactionController::class, 'showBorrowing']);
});
