<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetActivity;
use App\Models\AssetBorrowing;
use App\Models\AssetMutation;
use App\Models\AsetBergerak;
use App\Models\AsetInventaris;
use App\Models\AsetTidakBergerak;
use App\Models\Unit;
use App\Models\UsahaYayasan;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected function activeAssetQuery()
    {
        return Schema::hasTable('assets') ? Asset::query() : AsetInventaris::query();
    }

    public function index()
    {
        $user = auth()->user();

        $assetQuery = $this->activeAssetQuery();
        $this->applyUnitFilter($assetQuery);

        // totals per model (apply unit filter where applicable)
        $invQuery = AsetInventaris::query();
        $this->applyUnitFilter($invQuery);
        $inventarisTotal = Schema::hasTable('aset_inventaris') ? (int) $invQuery->sum('jumlah') : 0;

        $bergerakQuery = AsetBergerak::query();
        $this->applyUnitFilter($bergerakQuery);
        $bergerakTotal = Schema::hasTable('aset_bergerak') ? $bergerakQuery->count() : 0;

        $tidakBergerakQuery = AsetTidakBergerak::query();
        $this->applyUnitFilter($tidakBergerakQuery);
        $tidakBergerakTotal = Schema::hasTable('aset_tidak_bergerak') ? $tidakBergerakQuery->count() : 0;

        $usahaQuery = UsahaYayasan::query();
        $this->applyUnitFilter($usahaQuery);
        $usahaTotal = Schema::hasTable('usaha_yayasan') ? $usahaQuery->count() : 0;

        // condition summary
        $conditionSummary = Schema::hasTable('aset_inventaris') ? (function () use ($invQuery) {
            $summarizeFromCondition = function () use ($invQuery) {
                return (clone $invQuery)
                    ->selectRaw('COALESCE(SUM(CASE WHEN kondisi = ? THEN COALESCE(jumlah, 0) ELSE 0 END), 0) as baik', ['Baik'])
                    ->selectRaw('COALESCE(SUM(CASE WHEN kondisi = ? THEN COALESCE(jumlah, 0) ELSE 0 END), 0) as rusak_ringan', ['Rusak Ringan'])
                    ->selectRaw('COALESCE(SUM(CASE WHEN kondisi = ? THEN COALESCE(jumlah, 0) ELSE 0 END), 0) as rusak_berat', ['Rusak Berat'])
                    ->selectRaw('COALESCE(SUM(CASE WHEN kondisi = ? THEN COALESCE(jumlah, 0) ELSE 0 END), 0) as dalam_perbaikan', ['Dalam Perbaikan'])
                    ->first();
            };

            $summarizeFromBreakdown = function () use ($invQuery) {
                return (clone $invQuery)
                    ->selectRaw('COALESCE(SUM(COALESCE(jumlah_baik, 0)), 0) as baik')
                    ->selectRaw('COALESCE(SUM(COALESCE(jumlah_rusak_ringan, 0)), 0) as rusak_ringan')
                    ->selectRaw('COALESCE(SUM(COALESCE(jumlah_rusak_berat, 0)), 0) as rusak_berat')
                    ->selectRaw('COALESCE(SUM(COALESCE(jumlah_dalam_perbaikan, 0)), 0) as dalam_perbaikan')
                    ->first();
            };

            if (!Schema::hasColumn('aset_inventaris', 'kondisi')) {
                return $summarizeFromBreakdown();
            }

            $summaryFromCondition = $summarizeFromCondition();
            $summaryFromBreakdown = (Schema::hasColumn('aset_inventaris', 'jumlah_baik') && Schema::hasColumn('aset_inventaris', 'jumlah_rusak_ringan') && Schema::hasColumn('aset_inventaris', 'jumlah_rusak_berat') && Schema::hasColumn('aset_inventaris', 'jumlah_dalam_perbaikan'))
                ? $summarizeFromBreakdown()
                : null;

            $totalBreakdown = $summaryFromBreakdown ? ((int) ($summaryFromBreakdown->baik ?? 0) + (int) ($summaryFromBreakdown->rusak_ringan ?? 0) + (int) ($summaryFromBreakdown->rusak_berat ?? 0) + (int) ($summaryFromBreakdown->dalam_perbaikan ?? 0)) : 0;

            if ($totalBreakdown > 0) {
                return $summaryFromBreakdown;
            }

            return $summaryFromCondition;
        })() : null;

        // stats with unit scoping where applicable
        $stats = [
            'total_assets' => Schema::hasTable('aset_inventaris') ? $inventarisTotal : $assetQuery->count(),
            'total_users' => User::count(),
            'total_units' => Unit::count(),
            'active_loans' => ($user && $user->hasRole('admin_unit')) ? AssetBorrowing::where('status', 'dipinjam')->where('borrower_unit_id', $user->unit_id)->count() : AssetBorrowing::where('status', 'dipinjam')->count(),
            'mutations' => ($user && $user->hasRole('admin_unit')) ? AssetMutation::where(function ($q) use ($user) { $q->where('from_unit_id', $user->unit_id)->orWhere('to_unit_id', $user->unit_id); })->count() : AssetMutation::count(),
            'total_value' => (float) $assetQuery->sum(Schema::hasTable('assets') ? 'purchase_value' : 'harga_perolehan'),
            'inventaris_total' => $inventarisTotal,
            'bergerak_total' => $bergerakTotal,
            'tidak_bergerak_total' => $tidakBergerakTotal,
            'usaha_total' => $usahaTotal,
            'needs_review' => $conditionSummary ? (int) (($conditionSummary->rusak_ringan ?? 0) + ($conditionSummary->rusak_berat ?? 0)) : 0,
            'asset_damaged' => $conditionSummary ? (int) (($conditionSummary->rusak_ringan ?? 0) + ($conditionSummary->rusak_berat ?? 0)) : 0,
            'no_photo' => Schema::hasTable('aset_inventaris') ? (clone $invQuery)->where(function ($query) { $query->whereNull('gambar')->orWhere('gambar', '')->orWhere('gambar', '[]'); })->sum('jumlah') : 0,
            'no_location' => Schema::hasTable('aset_inventaris') ? (clone $invQuery)->where(function ($query) { $query->whereNull('lokasi_id')->orWhere('lokasi_id', 0); })->sum('jumlah') : 0,
            'borrowed_count' => ($user && $user->hasRole('admin_unit')) ? AssetBorrowing::whereIn('status', ['dipinjam', 'disetujui'])->where('borrower_unit_id', $user->unit_id)->count() : AssetBorrowing::whereIn('status', ['dipinjam', 'disetujui'])->count(),
            'overdue_loans' => ($user && $user->hasRole('admin_unit')) ? AssetBorrowing::whereIn('status', ['dipinjam', 'disetujui'])->where('borrower_unit_id', $user->unit_id)->whereNotNull('due_date')->whereDate('due_date', '<', now()->toDateString())->count() : AssetBorrowing::whereIn('status', ['dipinjam', 'disetujui'])->whereNotNull('due_date')->whereDate('due_date', '<', now()->toDateString())->count(),
            'mutation_pending' => ($user && $user->hasRole('admin_unit')) ? AssetMutation::whereIn('status', ['pending', 'diproses', 'proses'])->where(function ($q) use ($user) { $q->where('from_unit_id', $user->unit_id)->orWhere('to_unit_id', $user->unit_id); })->count() : AssetMutation::whereIn('status', ['pending', 'diproses', 'proses'])->count(),
            'condition_summary' => $conditionSummary ? [
                'baik' => (int) ($conditionSummary->baik ?? 0),
                'rusak_ringan' => (int) ($conditionSummary->rusak_ringan ?? 0),
                'rusak_berat' => (int) ($conditionSummary->rusak_berat ?? 0),
                'dalam_perbaikan' => (int) ($conditionSummary->dalam_perbaikan ?? 0),
            ] : ['baik' => 0, 'rusak_ringan' => 0, 'rusak_berat' => 0, 'dalam_perbaikan' => 0],
        ];

        $usesLegacyInventory = !Schema::hasTable('assets');
        $recentAssets = $assetQuery
            ->with($usesLegacyInventory ? ['unit', 'lokasi'] : ['unit', 'category'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($asset) => [
                'id' => $asset->id,
                'name' => $asset->name ?? $asset->nama_aset ?? '-',
                'code' => $asset->asset_code ?? $asset->kode_aset ?? '-',
                'source' => $usesLegacyInventory ? ($asset->asal_barang ?? '-') : ($asset->category?->name ?? '-'),
                'unit' => $usesLegacyInventory ? ($asset->lokasi?->name ?? '-') : ($asset->unit?->name ?? '-'),
                'status' => $asset->status ?? $asset->kondisi ?? 'Belum diatur',
                'condition' => $asset->condition_status ?? $asset->kondisi ?? 'Belum diatur',
                'value' => (float) ($asset->purchase_value ?? $asset->harga_perolehan ?? 0),
                'quantity' => (int) ($asset->jumlah ?? 1),
                'updated_at' => optional($asset->updated_at)->format('d M Y'),
            ]);

        $inventoryRows = Schema::hasTable('aset_inventaris') ? (clone $invQuery)->with(['lokasi', 'unit'])->get() : collect();
        $sourceData = $inventoryRows
            ->groupBy(fn ($asset) => trim((string) ($asset->asal_barang ?: 'Umum')))
            ->map(fn ($items, $name) => [
                'name' => $name,
                'total' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)),
                'baik' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_baik ?? ($asset->kondisi === 'Baik' ? $asset->jumlah : 0))),
                'rusak_ringan' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_rusak_ringan ?? ($asset->kondisi === 'Rusak Ringan' ? $asset->jumlah : 0))),
                'rusak_berat' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_rusak_berat ?? ($asset->kondisi === 'Rusak Berat' ? $asset->jumlah : 0))),
                'perbaikan' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_dalam_perbaikan ?? ($asset->kondisi === 'Dalam Perbaikan' ? $asset->jumlah : 0))),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(8)
            ->all();

        $locationData = $inventoryRows
            ->groupBy(fn ($asset) => $asset->lokasi?->name ?? 'Belum ditentukan')
            ->map(fn ($items, $name) => [
                'name' => $name,
                'total' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(10)
            ->all();

        $assetComposition = [
            ['name' => 'Inventaris', 'total' => $inventarisTotal],
            ['name' => 'Aset Bergerak', 'total' => $bergerakTotal],
            ['name' => 'Aset Tidak Bergerak', 'total' => $tidakBergerakTotal],
            ['name' => 'Usaha Yayasan', 'total' => $usahaTotal],
        ];

        $conditionByUnit = $inventoryRows
            ->groupBy(fn ($asset) => $asset->unit?->name ?? 'Belum ditentukan')
            ->map(fn ($items, $name) => [
                'name' => $name,
                'baik' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_baik ?? ($asset->kondisi === 'Baik' ? $asset->jumlah : 0))),
                'rusak_ringan' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_rusak_ringan ?? ($asset->kondisi === 'Rusak Ringan' ? $asset->jumlah : 0))),
                'rusak_berat' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_rusak_berat ?? ($asset->kondisi === 'Rusak Berat' ? $asset->jumlah : 0))),
                'perbaikan' => (int) $items->sum(fn ($asset) => (int) ($asset->jumlah_dalam_perbaikan ?? ($asset->kondisi === 'Dalam Perbaikan' ? $asset->jumlah : 0))),
            ])
            ->sortByDesc(fn ($item) => $item['baik'] + $item['rusak_ringan'] + $item['rusak_berat'] + $item['perbaikan'])
            ->values()
            ->take(10)
            ->all();

        $borrowingStatus = Schema::hasTable('asset_borrowings')
            ? AssetBorrowing::query()
                ->when($user && $user->hasRole('admin_unit'), fn ($query) => $query->where('borrower_unit_id', $user->unit_id))
                ->selectRaw('status as name, COUNT(*) as total')
                ->groupBy('status')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['name' => ucfirst((string) $row->name), 'total' => (int) $row->total])
                ->values()
                ->all()
            : [];

        $mutationStatus = Schema::hasTable('asset_mutations')
            ? AssetMutation::query()
                ->when($user && $user->hasRole('admin_unit'), fn ($query) => $query->where(function ($subQuery) use ($user) {
                    $subQuery->where('from_unit_id', $user->unit_id)->orWhere('to_unit_id', $user->unit_id);
                }))
                ->selectRaw('status as name, COUNT(*) as total')
                ->groupBy('status')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($row) => ['name' => ucfirst((string) $row->name), 'total' => (int) $row->total])
                ->values()
                ->all()
            : [];

        $totalRows = $inventoryRows->count();
        $completeRows = $inventoryRows->filter(fn ($asset) => filled($asset->kode_aset) && filled($asset->nama_aset) && filled($asset->lokasi_id) && filled($asset->unit_id))->count();
        $verifiedRows = $inventoryRows->filter(fn ($asset) => filled($asset->gambar) && filled($asset->dokumen))->count();
        $stats['data_quality'] = [
            'complete_percent' => $totalRows > 0 ? (int) round($completeRows / $totalRows * 100) : 0,
            'incomplete_percent' => $totalRows > 0 ? (int) round(($totalRows - $completeRows) / $totalRows * 100) : 0,
            'verified_percent' => $totalRows > 0 ? (int) round($verifiedRows / $totalRows * 100) : 0,
            'no_photo' => (int) ($stats['no_photo'] ?? 0),
            'no_location' => (int) ($stats['no_location'] ?? 0),
            'no_document' => $totalRows > 0 ? (int) $inventoryRows->filter(fn ($asset) => blank($asset->dokumen))->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)) : 0,
        ];

        if ($user && $user->hasRole('admin_unit')) {
            $units = Unit::with('assets')->where('id', $user->unit_id)->get()->map(fn ($unit) => [
                'name' => $unit->name,
                'total' => $unit->assets->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)),
            ])->filter(fn ($unit) => (int) ($unit['total'] ?? 0) > 0)->sortByDesc('total')->values()->all();
        } else {
            $units = Unit::with('assets')->get()->map(fn ($unit) => [
                'name' => $unit->name,
                'total' => $unit->assets->sum(fn ($asset) => (int) ($asset->jumlah ?? 0)),
            ])->filter(fn ($unit) => (int) ($unit['total'] ?? 0) > 0)->sortByDesc('total')->values()->all();
        }
        $unitData = $units;

        $valueTrend = $assetQuery
            ->selectRaw('COALESCE(' . (Schema::hasTable('assets') ? 'acquisition_year' : 'tahun_pengadaan') . ', YEAR(created_at)) as tahun')
            ->selectRaw('SUM(' . (Schema::hasTable('assets') ? 'purchase_value' : 'harga_perolehan') . ') as total_nilai')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->map(fn ($row) => [
                'tahun' => (string) ($row->tahun ?? '0'),
                'nilai' => (float) ($row->total_nilai ?? 0),
            ])
            ->toArray();

        $activities = Schema::hasTable('asset_activities')
            ? AssetActivity::with('user.unit')->latest()->limit(5)->get()->map(fn ($activity) => [
                'id' => (string) $activity->id,
                'user' => $activity->user?->name ?? 'Sistem',
                'activity' => $activity->description ?? 'memperbarui data aset',
                'asset' => 'Aset',
                'unit' => $activity->user?->unit?->name ?? 'Yayasan',
                'time' => $activity->created_at?->format('H:i') ?? 'Baru saja',
                'status' => 'Sukses',
            ])
            : [];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentAssets' => $recentAssets,
            'units' => $units,
            'activities' => $activities,
            'value_trend' => $valueTrend,
            'source_data' => $sourceData,
            'location_data' => $locationData,
            'asset_composition' => $assetComposition,
            'unit_data' => $unitData,
            'condition_by_unit' => $conditionByUnit,
            'borrowing_status' => $borrowingStatus,
            'mutation_status' => $mutationStatus,
        ]);
    }
}
