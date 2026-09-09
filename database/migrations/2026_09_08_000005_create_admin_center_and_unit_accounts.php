<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Create the requested administration structure with one account per unit.
     */
    public function up(): void
    {
        DB::transaction(function (): void {
            $adminPusatRoleId = DB::table('roles')->where('name', 'admin_pusat')->value('id');
            $adminUnitRoleId = DB::table('roles')->where('name', 'admin_unit')->value('id');

            if ($adminPusatRoleId === null || $adminUnitRoleId === null) {
                throw new RuntimeException('Role admin_pusat atau admin_unit belum tersedia.');
            }

            $now = now();
            $adminPusatPassword = Str::password(20);
            $adminPusatEmail = 'admin.pusat@yayasan.id';

            DB::table('users')->updateOrInsert(
                ['email' => $adminPusatEmail],
                [
                    'name' => 'Admin Pusat',
                    'password' => Hash::make($adminPusatPassword),
                    'role_id' => $adminPusatRoleId,
                    'unit_id' => null,
                    'status' => 'aktif',
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            $this->printCredentials($adminPusatEmail, $adminPusatPassword);

            for ($number = 1; $number <= 10; $number++) {
                $suffix = str_pad((string) $number, 2, '0', STR_PAD_LEFT);
                $unitCode = "UNIT-{$suffix}";
                $unitName = "Unit {$suffix}";
                $email = "admin.unit{$suffix}@yayasan.id";
                $password = Str::password(20);

                DB::table('units')->updateOrInsert(
                    ['code' => $unitCode],
                    [
                        'name' => $unitName,
                        'status' => 'aktif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );

                $unitId = DB::table('units')->where('code', $unitCode)->value('id');

                DB::table('users')->updateOrInsert(
                    ['email' => $email],
                    [
                        'name' => "Admin {$unitName}",
                        'password' => Hash::make($password),
                        'role_id' => $adminUnitRoleId,
                        'unit_id' => $unitId,
                        'status' => 'aktif',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );

                $this->printCredentials($email, $password);
            }
        });
    }

    public function down(): void
    {
        $emails = ['admin.pusat@yayasan.id'];

        for ($number = 1; $number <= 10; $number++) {
            $suffix = str_pad((string) $number, 2, '0', STR_PAD_LEFT);
            $emails[] = "admin.unit{$suffix}@yayasan.id";
        }

        DB::table('users')->whereIn('email', $emails)->delete();
        DB::table('units')->whereIn('code', array_map(
            fn (int $number): string => 'UNIT-' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            range(1, 10),
        ))->delete();
    }

    private function printCredentials(string $email, string $password): void
    {
        echo "Akun dibuat: {$email} | Password sementara: {$password}" . PHP_EOL;
    }
};
