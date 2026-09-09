import { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  )
}

export default function DetailTidakBergerakPage({ asetTidakBergerak }: { asetTidakBergerak?: Record<string, any> }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const data = asetTidakBergerak ?? {
    id: '-',
    bentuk_aset: '-',
    dasar_hak: '-',
    atas_nama: '-',
    tahun_perolehan: '-',
    jangka_waktu: '-',
    keterangan: '-',
    created_at: '-',
    updated_at: '-',
  }

  const normalizePublicUrl = (value?: string | null) => {
    if (!value || value === 'null' || value === 'undefined') return null
    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value)
        return parsed.pathname + parsed.search
      } catch {
        return value
      }
    }
    if (value.startsWith('/')) return value
    return `/storage/${String(value).replace(/\\/g, '/')}`
  }

  const imageUrl = normalizePublicUrl(data.foto_url ?? data.foto ?? data.gambar_url ?? data.gambar)
  const documentUrl = normalizePublicUrl(data.dokumen_pdf_url ?? data.dokumen_url ?? data.dokumenPdf ?? data.dokumen_pdf ?? data.dokumen)
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

  const summaryCards = [
    {
      label: 'Bentuk Aset',
      value: data.bentuk_aset ?? data.bentukAset ?? '-',
      accent: '#10b981',
      bg: '#ecfdf5',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18" />
        </svg>
      ),
    },
    {
      label: 'Dasar Hak',
      value: data.dasar_hak ?? data.dasarHak ?? '-',
      accent: '#3b82f6',
      bg: '#dbeafe',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10H7zM9 9h6v6H9z" />
        </svg>
      ),
    },
    {
      label: 'Atas Nama',
      value: data.atas_nama ?? data.atasNama ?? '-',
      accent: '#8b5cf6',
      bg: '#ede9fe',
      color: '#6d28d9',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
        </svg>
      ),
    },
    {
      label: 'Tahun Perolehan',
      value: data.tahun_perolehan ?? data.tahunPerolehan ?? '-',
      accent: '#f59e0b',
      bg: '#fef3c7',
      color: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage='asset-tidak-bergerak'>
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7a2 2 0 012-2h12a2 2 0 012 2v12M9 7V4m6 3V4M8 11h8M8 15h8" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Properti</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Detail Aset Tidak Bergerak</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/inventaris/aset-tidak-bergerak')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>
              <button
                type="button"
                onClick={() => router.visit(`/inventaris/aset-tidak-bergerak/${data.id}/edit`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Aset
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative min-h-[118px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-base font-bold tracking-tight text-slate-900 break-words">{String(card.value || '-')}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr,0.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a2 2 0 011.414.586l5.414 5.414A2 2 0 0119 9.414V17a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ringkasan</p>
                <h2 className="text-base font-semibold text-slate-900">Keterangan aset</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{data.keterangan || 'Belum ada keterangan untuk aset ini.'}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Dibuat" value={String(data.created_at ?? '-')} />
                <InfoCard label="Diperbarui" value={String(data.updated_at ?? '-')} />
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            {imageUrl && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Foto aset</h3>
                  <button
                    type="button"
                    onClick={() => setIsImageFullscreen(true)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Lihat penuh
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImageFullscreen(true)}
                  className="block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition-transform duration-200 hover:scale-[1.01]"
                  aria-label="Lihat foto aset penuh"
                >
                  <img
                    src={imageUrl}
                    alt="Foto aset tidak bergerak"
                    className="h-56 w-full object-cover"
                  />
                </button>
              </div>
            )}

            {documentUrl && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Dokumen</h3>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l-3-3m3 3l3-3M7 18a2 2 0 01-2-2V7a2 2 0 012-2h8l4 4v7a2 2 0 01-2 2H7z" />
                  </svg>
                  Lihat Dokumen PDF
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m2-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi detail</p>
              <h2 className="text-base font-semibold text-slate-900">Data utama aset</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="ID" value={String(data.id ?? '-')} />
            <InfoCard label="Bentuk aset" value={String(data.bentuk_aset ?? data.bentukAset ?? '-')} />
            <InfoCard label="Dasar hak" value={String(data.dasar_hak ?? data.dasarHak ?? '-')} />
            <InfoCard label="Atas nama" value={String(data.atas_nama ?? data.atasNama ?? '-')} />
            <InfoCard label="Tahun perolehan" value={String(data.tahun_perolehan ?? data.tahunPerolehan ?? '-')} />
            <InfoCard label="Jangka waktu" value={String(data.jangka_waktu ?? data.jangkaWaktu ?? '-')} />
            <InfoCard label="Status" value={String(data.status ?? '-')} />
            <InfoCard label="Terakhir diubah" value={String(data.updated_at ?? '-')} />
          </div>
        </div>
      </div>

      {isImageFullscreen && imageUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsImageFullscreen(false)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Tutup foto full screen"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imageUrl}
              alt="Foto aset tidak bergerak fullscreen"
              className="max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
