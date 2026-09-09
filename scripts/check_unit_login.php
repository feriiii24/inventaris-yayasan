<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$roleId = DB::table('roles')->where('name', 'admin_unit')->value('id');
if (! $roleId) {
    echo "Role 'admin_unit' not found\n";
    exit(1);
}

$users = DB::table('users')->where('role_id', $roleId)->get();
if ($users->isEmpty()) {
    echo "No users found with role admin_unit\n";
    exit(0);
}

foreach ($users as $u) {
    $matches = Hash::check('unit123', $u->password) ? 'OK' : 'FAIL';
    echo "{$u->id} {$u->email} unit_id={$u->unit_id} password_check={$matches}\n";
}

echo "Done\n";
