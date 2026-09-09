<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$units = DB::table('units')->select('id','name','code')->orderBy('id')->get();
foreach ($units as $u) {
    $count = DB::table('aset_inventaris')->where('unit_id', $u->id)->count();
    echo "Unit {$u->id} ({$u->code} - {$u->name}) => {$count} aset_inventaris\n";
}

echo "\nSample aset_inventaris for Unit 1:\n";
$rows = DB::table('aset_inventaris')->where('unit_id', 1)->limit(10)->pluck('kode_aset');
foreach ($rows as $r) echo " - {$r}\n";
