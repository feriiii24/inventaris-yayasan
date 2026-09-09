import { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

type InventarisRecord = {
  id: string
  tanggal_pembukuan?: string
  tanggalPembukuan?: string
  kode_aset?: string
  kodeAset?: string
  nama_aset?: string
  namaAset?: string
  spesifikasi?: string
  jumlah?: number | string
  jumlah_baik?: number | string
  jumlahBaik?: number | string
  jumlah_rusak_ringan?: number | string
  jumlahRusakRingan?: number | string
  jumlah_rusak_berat?: number | string
  jumlahRusakBerat?: number | string
  jumlah_dalam_perbaikan?: number | string
  jumlahDalamPerbaikan?: number | string
  satuan?: string
  asal_barang?: string
  asalBarang?: string
  tahun_pengadaan?: number | string
  tahunPengadaan?: number | string
  harga_perolehan?: number | string
  hargaPerolehan?: number | string
  kondisi?: string
  lokasi?: string
  lokasi_id?: number | string
  lokasiId?: number | string
  unit?: string
  unit_id?: number | string
  unitId?: number | string
  ruangan?: string
  room_id?: number | string
  roomId?: number | string
  deskripsi?: string
  gambar_url?: string | null
  dokumen_url?: string | null
  created_at?: string
  updated_at?: string
}

export default function DetailInventarisPage({ asetInventaris }: { asetInventaris: InventarisRecord }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImageFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const detail = {
    tanggalPembukuan: asetInventaris?.tanggal_pembukuan ?? asetInventaris?.tanggalPembukuan ?? '-',
    kode: asetInventaris?.kode_aset ?? asetInventaris?.kodeAset ?? '-',
    nama: asetInventaris?.nama_aset ?? asetInventaris?.namaAset ?? '-',
    spesifikasi: asetInventaris?.spesifikasi ?? '-',
    jumlah: asetInventaris?.jumlah ?? '-',
    jumlahBaik: asetInventaris?.jumlah_baik ?? asetInventaris?.jumlahBaik ?? 0,
    jumlahRusakRingan: asetInventaris?.jumlah_rusak_ringan ?? asetInventaris?.jumlahRusakRingan ?? 0,
    jumlahRusakBerat: asetInventaris?.jumlah_rusak_berat ?? asetInventaris?.jumlahRusakBerat ?? 0,
    jumlahDalamPerbaikan: asetInventaris?.jumlah_dalam_perbaikan ?? asetInventaris?.jumlahDalamPerbaikan ?? 0,
    satuan: asetInventaris?.satuan ?? '-',
    asalBarang: asetInventaris?.asal_barang ?? asetInventaris?.asalBarang ?? '-',
    tahunPengadaan: asetInventaris?.tahun_pengadaan ?? asetInventaris?.tahunPengadaan ?? '-',
    hargaPerolehan: asetInventaris?.harga_perolehan ?? asetInventaris?.hargaPerolehan ?? 0,
    kondisi: asetInventaris?.kondisi ?? 'Baik',
    lokasi: asetInventaris?.lokasi ?? '-',
    unit: asetInventaris?.unit ?? '-',
    ruangan: asetInventaris?.ruangan ?? '-',
    deskripsi: asetInventaris?.deskripsi ?? '-',
    gambarUrl: asetInventaris?.gambar_url ?? null,
    dokumenUrl: asetInventaris?.dokumen_url ?? null,
    createdAt: asetInventaris?.created_at ?? '-',
  }

  const conditionStyle = {
    Baik: { bg: '#dcfce7', color: '#166534' },
    'Rusak Ringan': { bg: '#fef3c7', color: '#b45309' },
    'Rusak Berat': { bg: '#fee2e2', color: '#b91c1c' },
    'Dalam Perbaikan': { bg: '#ede9fe', color: '#6d28d9' },
  }[detail.kondisi] ?? { bg: '#f1f5f9', color: '#475569' }

  function AnimatedNumber({ value, duration = 1100 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
      let frameId = 0
      let startTime: number | null = null

      const tick = (timestamp: number) => {
        if (startTime === null) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.round(value * eased))

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick)
        }
      }

      frameId = window.requestAnimationFrame(tick)
      return () => window.cancelAnimationFrame(frameId)
    }, [value, duration])

    return <span>{displayValue}</span>
  }

  const summaryCards = [
    {
      label: 'Jumlah',
      value: Number(detail.jumlah) || 0,
      detail: detail.satuan !== '-' ? detail.satuan : 'Unit',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm-8 6l-8-4v8l8 4 8-4v-8l-8 4z" />
        </svg>
      ),
    },
    {
      label: 'Baik',
      value: Number(detail.jumlahBaik) || 0,
      detail: 'Prima',
      accent: '#16a34a',
      iconBg: '#dcfce7',
      iconColor: '#166534',
      cardBg: '#f0fdf4',
      textColor: '#166534',
      detailColor: '#15803d',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      ),
    },
    {
      label: 'Rusak Ringan',
      value: Number(detail.jumlahRusakRingan) || 0,
      detail: 'Perlu cek',
      accent: '#d97706',
      iconBg: '#fef3c7',
      iconColor: '#b45309',
      cardBg: '#fffbeb',
      textColor: '#b45309',
      detailColor: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      ),
    },
    {
      label: 'Rusak Berat',
      value: Number(detail.jumlahRusakBerat) || 0,
      detail: 'Urgent',
      accent: '#dc2626',
      iconBg: '#fee2e2',
      iconColor: '#b91c1c',
      cardBg: '#fef2f2',
      textColor: '#b91c1c',
      detailColor: '#b91c1c',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Perbaikan',
      value: Number(detail.jumlahDalamPerbaikan) || 0,
      detail: 'Diproses',
      accent: '#7c3aed',
      iconBg: '#ede9fe',
      iconColor: '#6d28d9',
      cardBg: '#f5f3ff',
      textColor: '#6d28d9',
      detailColor: '#7c3aed',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 011.4 0l2.6 2.6a1 1 0 010 1.4l-7.3 7.3-4.2 1.1 1.1-4.2 7.4-7.2zM13 5l2 2M3 21l3.5-1" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage="asset-inventaris">
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm-8 6l-8-4v8l8 4 8-4v-8l-8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Aset Inventaris</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">{detail.nama}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit(`/inventaris/aset-inventaris/${asetInventaris.id}/edit`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => router.visit('/inventaris/aset-inventaris')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((item) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: item.accent + '55', background: item.cardBg }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: item.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: item.detailColor }}>{item.label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight" style={{ color: item.textColor }}>
                    <AnimatedNumber value={Number(item.value) || 0} />
                  </div>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: item.iconBg, color: item.iconColor, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                >
                  {item.icon}
                </div>
              </div>
              <div className="mt-2 text-xs" style={{ color: item.detailColor }}>{item.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Identitas Aset</p>
                <div className="mt-1 text-sm font-mono text-slate-500">{detail.kode}</div>
              </div>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{ background: conditionStyle.bg, color: conditionStyle.color }}>
                {detail.kondisi}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tanggal Pembukuan</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.tanggalPembukuan}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Harga Perolehan</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(detail.hargaPerolehan) || 0)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Asal Barang</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.asalBarang}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tahun Pengadaan</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.tahunPengadaan}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lokasi</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.lokasi}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Unit</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.unit}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ruangan</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.ruangan}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Spesifikasi</div>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{detail.spesifikasi}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Deskripsi</div>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{detail.deskripsi}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Foto Aset</p>
                  <p className="text-sm font-semibold text-slate-800">Dokumentasi visual</p>
                </div>
              </div>

              {detail.gambarUrl ? (
               <button
                 type="button"
                 onClick={() => setIsImageFullscreen(true)}
                 className="group relative mt-4 block w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 shadow-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
               >
                 <img
                   src={detail.gambarUrl}
                   alt={detail.nama}
                   className="h-64 w-full object-cover transition-all duration-500 ease-out group-hover:scale-110 group-hover:brightness-105"
                 />
                 <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-950/50 via-slate-900/10 to-transparent p-3 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100">
                   <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                     Lihat foto penuh
                   </span>
                 </div>
               </button>
              ) : (
                <div className="mt-4 flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  Belum ada foto aset
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V7.5L13.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2zM13 3v5h5M9 12h6M9 16h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dokumen</p>
                  <p className="text-sm font-semibold text-slate-800">Lampiran aset</p>
                </div>
              </div>

              {detail.dokumenUrl ? (
                <a
                  href={detail.dokumenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  Buka Dokumen
                </a>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Belum ada dokumen lampiran
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tanggal dibuat</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{detail.createdAt}</div>
            </div>
          </div>
        </div>
      </div>

      {detail.gambarUrl && isImageFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setIsImageFullscreen(false)}
        >
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60 p-3 shadow-[0_30px_90px_rgba(15,23,42,0.7)]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsImageFullscreen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Tutup foto"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={detail.gambarUrl}
              alt={detail.nama}
              className="max-h-[90vh] w-full rounded-2xl object-contain shadow-[0_20px_40px_rgba(15,23,42,0.35)]"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
