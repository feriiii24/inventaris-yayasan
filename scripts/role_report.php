<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

if (!DB::getSchemaBuilder()->hasTable('roles')) {
    echo "roles table not found\n";
    exit(1);
}

$roles = DB::table('roles')->get();
foreach ($roles as $r) {
    $c = DB::table('users')->where('role_id', $r->id)->count();
    echo "$r->id $r->name => $c\n";
}

// Also check for any users with null or invalid role_id
$nulls = DB::table('users')->whereNull('role_id')->count();
if ($nulls) echo "Users with NULL role_id: $nulls\n";

$invalid = DB::table('users')
    ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
    ->whereNull('roles.id')
    ->count();
if ($invalid) echo "Users with invalid role_id (no matching role): $invalid\n";

echo "Done\n";
