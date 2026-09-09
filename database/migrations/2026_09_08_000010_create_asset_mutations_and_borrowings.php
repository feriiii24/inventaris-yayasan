<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create linked mutation and borrowing records for the inventory dataset.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();
            $units = DB::table('units')->orderBy('id')->get(['id', 'code']);
            $assets = DB::table('aset_inventaris')
                ->where('kode_aset', 'like', 'UNIT-%-AST-%')
                ->orderBy('id')
                ->get(['id', 'unit_id']);
            $roomsByUnit = DB::table('rooms')
                ->join('locations', 'rooms.location_id', '=', 'locations.id')
                ->where('rooms.code', 'like', 'ROOM-%')
                ->get([
                    'locations.unit_id',
                    'locations.id as location_id',
                    'rooms.id as room_id',
                ])
                ->groupBy('unit_id');

            if ($units->count() < 2 || $assets->count() < 100) {
                throw new RuntimeException('Unit atau aset inventaris belum cukup untuk membuat transaksi.');
            }

            $mutations = [];
            $borrowings = [];

            for ($number = 1; $number <= 100; $number++) {
                $asset = $assets->get($number - 1);
                $fromUnit = $units->get(($number - 1) % $units->count());
                $toUnit = $units->get($number % $units->count());
                $fromRoom = $roomsByUnit->get($fromUnit->id)->get(($number - 1) % $roomsByUnit->get($fromUnit->id)->count());
                $toRoom = $roomsByUnit->get($toUnit->id)->get(($number - 1) % $roomsByUnit->get($toUnit->id)->count());
                $date = now()->subDays(100 - $number)->toDateString();
                $suffix = str_pad((string) $number, 3, '0', STR_PAD_LEFT);

                $mutations[] = [
                    'asset_id' => $asset->id,
                    'asset_type' => 'AsetInventaris',
                    'from_unit_id' => $fromUnit->id,
                    'from_location_id' => $fromRoom->location_id,
                    'from_room_id' => $fromRoom->room_id,
                    'to_unit_id' => $toUnit->id,
                    'to_location_id' => $toRoom->location_id,
                    'to_room_id' => $toRoom->room_id,
                    'movement_type' => 'Mutasi Internal',
                    'reference_number' => "MUT-{$suffix}",
                    'mutation_date' => $date,
                    'notes' => "Mutasi aset {$asset->id} dari {$fromUnit->code} ke {$toUnit->code}.",
                    'status' => $number % 5 === 0 ? 'proses' : 'selesai',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $borrowerUnit = $units->get(($number + 2) % $units->count());
                $quantity = (($number * 7) % 100) + 1;
                $borrowings[] = [
                    'asset_id' => $asset->id,
                    'quantity' => $quantity,
                    'borrower_unit_id' => $borrowerUnit->id,
                    'borrower_name' => "Peminjam Unit {$borrowerUnit->code}",
                    'borrower_names' => "Petugas Peminjaman {$suffix}",
                    'loan_date' => $date,
                    'loan_time' => sprintf('%02d:00:00', 8 + ($number % 8)),
                    'due_date' => now()->subDays(100 - $number)->addDays(14)->toDateString(),
                    'due_time' => '16:00:00',
                    'return_date' => $number % 3 === 0 ? now()->subDays(100 - $number)->addDays(10)->toDateString() : null,
                    'return_time' => $number % 3 === 0 ? '15:30:00' : null,
                    'purpose' => "Kegiatan operasional Unit {$borrowerUnit->code}",
                    'notes' => "Peminjaman aset {$asset->id} dengan jumlah {$quantity} unit.",
                    'status' => $number % 3 === 0 ? 'dikembalikan' : 'dipinjam',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('asset_mutations')->insert($mutations);
            DB::table('asset_borrowings')->insert($borrowings);
        });
    }

    public function down(): void
    {
        DB::table('asset_mutations')
            ->where('reference_number', 'like', 'MUT-%')
            ->delete();

        DB::table('asset_borrowings')
            ->where('notes', 'like', 'Peminjaman aset %')
            ->delete();
    }
};
