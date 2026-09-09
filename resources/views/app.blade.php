<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    {{-- Server-side fallback flash: tampilkan notifikasi jika session flash ada dan JS belum aktif --}}
    @if(session('success'))
        <div style="position:fixed;right:1rem;top:1rem;z-index:9999;max-width:360px;background:#ecfdf5;border:1px solid #a7f3d0;padding:12px;border-radius:12px;color:#14532d;font-family:Inter,system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial;">
            <strong style="display:block;font-size:0.95rem;margin-bottom:4px;">Berhasil</strong>
            <div style="font-size:0.9rem;">{{ session('success') }}</div>
        </div>
    @endif

    @if(session('error'))
        <div style="position:fixed;right:1rem;top:1rem;z-index:9999;max-width:360px;background:#fff1f2;border:1px solid #fecaca;padding:12px;border-radius:12px;color:#7f1d1d;font-family:Inter,system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial;">
            <strong style="display:block;font-size:0.95rem;margin-bottom:4px;">Gagal</strong>
            <div style="font-size:0.9rem;">{{ session('error') }}</div>
        </div>
    @endif

    @inertia
</body>
</html>
