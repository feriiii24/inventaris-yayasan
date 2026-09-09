<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetMutation;
use App\Models\AsetInventaris;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ReportController extends Controller
{
    protected function assetQuery()
    {
        return Schema::hasTable('assets') ? Asset::query() : AsetInventaris::query();
    }

    protected function applyRoleFilter($query)
    {
        try {
            $user = auth()->user();
            if ($user && $user->hasRole('admin_unit')) {
                $table = $query->getModel()->getTable();
                if (Schema::hasColumn($table, 'unit_id')) {
                    $query->where('unit_id', $user->unit_id);
                } elseif (Schema::hasColumn($table, 'unitId')) {
                    $query->where('unitId', $user->unit_id);
                }
            }
        } catch (\Throwable $e) {
            // ignore filtering on errors
        }

        return $query;
    }

    public function index()
    {
        $assets = $this->applyRoleFilter($this->assetQuery()->with('unit'))->get();

        $rows = $assets->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'nama' => $asset->name ?? $asset->nama_aset ?? '-',
            'kategori' => method_exists($asset, 'category') ? ($asset->category?->name ?? '-') : '-',
            'unit' => $asset->unit?->name ?? '-',
            'jumlah' => (int) ($asset->jumlah ?? 1),
            'nilaiPerolehan' => (float) ($asset->purchase_value ?? $asset->harga_perolehan ?? 0),
            'nilai' => 'Rp ' . number_format((float) ($asset->purchase_value ?? $asset->harga_perolehan ?? 0), 0, ',', '.'),
            'kondisi' => $this->resolveAssetCondition($asset),
            'jumlahBaik' => (int) ($asset->jumlah_baik ?? 0),
            'jumlahRusakRingan' => (int) ($asset->jumlah_rusak_ringan ?? 0),
            'jumlahRusakBerat' => (int) ($asset->jumlah_rusak_berat ?? 0),
            'jumlahDalamPerbaikan' => (int) ($asset->jumlah_dalam_perbaikan ?? 0),
        ]);

        $summary = [
            'total_assets' => (int) $rows->sum(fn ($asset) => (int) ($asset['jumlah'] ?? 1)),
            'total_value' => (float) $rows->sum(fn ($asset) => (float) ($asset['nilaiPerolehan'] ?? 0)),
            'in_repair' => (int) $rows->sum(fn ($asset) => (int) ($asset['jumlahDalamPerbaikan'] ?? 0)),
            'critical_assets' => (int) $rows->sum(fn ($asset) => (int) (($asset['jumlahRusakRingan'] ?? 0) + ($asset['jumlahRusakBerat'] ?? 0))),
        ];

        return Inertia::render('Reports/Index', ['rows' => $rows, 'summary' => $summary]);
    }

    protected function normalizeCondition($value): string
    {
        if ($value === null || $value === '') {
            return 'Baik';
        }

        $normalized = strtolower(trim((string) $value));
        $normalized = str_replace(['_', '-'], ' ', $normalized);

        if (str_contains($normalized, 'rusak berat')) {
            return 'Rusak Berat';
        }

        if (str_contains($normalized, 'perbaikan') || str_contains($normalized, 'repair')) {
            return 'Dalam Perbaikan';
        }

        if (str_contains($normalized, 'rusak ringan')) {
            return 'Rusak Ringan';
        }

        if (str_contains($normalized, 'baik') || str_contains($normalized, 'good')) {
            return 'Baik';
        }

        return 'Baik';
    }

    protected function resolveAssetCondition($asset): string
    {
        $candidate = $asset->kondisi ?? $asset->condition_status ?? null;

        if ($candidate !== null && trim((string) $candidate) !== '') {
            return $this->normalizeCondition($candidate);
        }

        $good = (int) ($asset->jumlah_baik ?? 0);
        $ringan = (int) ($asset->jumlah_rusak_ringan ?? 0);
        $berat = (int) ($asset->jumlah_rusak_berat ?? 0);
        $perbaikan = (int) ($asset->jumlah_dalam_perbaikan ?? 0);

        if ($berat > 0) return 'Rusak Berat';
        if ($perbaikan > 0) return 'Dalam Perbaikan';
        if ($ringan > 0) return 'Rusak Ringan';
        if ($good > 0 || (int) ($asset->jumlah ?? 0) > 0) return 'Baik';

        return 'Baik';
    }

    public function condition()
    {
        $rows = $this->applyRoleFilter($this->assetQuery()->latest())->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'nama' => $asset->name ?? $asset->nama_aset ?? '-',
            'kategori' => method_exists($asset, 'category') ? ($asset->category?->name ?? '-') : '-',
            'kondisi' => $this->resolveAssetCondition($asset),
            'unit' => $asset->unit?->name ?? '-',
            'jumlah' => (int) ($asset->jumlah ?? 0),
            'jumlahRusakBerat' => (int) ($asset->jumlah_rusak_berat ?? 0),
            'jumlahDalamPerbaikan' => (int) ($asset->jumlah_dalam_perbaikan ?? 0),
            'jumlahRusakRingan' => (int) ($asset->jumlah_rusak_ringan ?? 0),
            'jumlahBaik' => (int) ($asset->jumlah_baik ?? 0),
        ]);

        return Inertia::render('Reports/Kondisi', ['rows' => $rows]);
    }

    public function value()
    {
        $rows = $this->applyRoleFilter($this->assetQuery()->latest())->get()->map(fn ($asset, $index) => [
            'id' => (string) $asset->id,
            'no' => $index + 1,
            'nama' => $asset->name ?? $asset->nama_aset ?? '-',
            'kategori' => method_exists($asset, 'category') ? ($asset->category?->name ?? '-') : '-',
            'nilai' => (float) ($asset->purchase_value ?? $asset->harga_perolehan ?? 0),
            'unit' => $asset->unit?->name ?? '-',
        ]);

        return Inertia::render('Reports/Nilai', ['rows' => $rows]);
    }

    public function mutation()
    {
        $mutations = AssetMutation::with(['asset', 'fromUnit', 'toUnit'])->latest();

        try {
            $user = auth()->user();
            if ($user && $user->hasRole('admin_unit')) {
                $mutations->where(function($q) use ($user) {
                    $q->where('from_unit_id', $user->unit_id)
                      ->orWhere('to_unit_id', $user->unit_id);
                });
            }
        } catch (\Throwable $e) {
            // ignore
        }

        $rows = $mutations->get()->map(fn ($item, $index) => [
            'id' => (string) $item->id,
            'no' => $index + 1,
            'aset' => $item->asset?->nama_aset ?? $item->asset?->name ?? '-',
            'kode' => $item->asset?->kode_aset ?? $item->asset?->asset_code ?? '-',
            'jenis' => $item->movement_type ?? 'Pemindahan Unit',
            'dari' => $item->fromUnit?->name ?? 'Unit Utama',
            'ke' => $item->toUnit?->name ?? 'Unit Tujuan',
            'tanggal' => $item->mutation_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
            'status' => $item->status,
        ]);

        return Inertia::render('Reports/Mutasi', ['rows' => $rows]);
    }
}
