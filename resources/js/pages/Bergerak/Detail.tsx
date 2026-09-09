import { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

type BergerakRecord = {
  id?: string | number
  bentuk_aset?: string
  bentukAset?: string
  dasar_hak?: string
  dasarHak?: string
  atas_nama?: string
  atasNama?: string
  tahun_perolehan?: number | string
  tahunPerolehan?: number | string
  nomor_registrasi?: string
  nomorRegistrasi?: string
  foto?: string | null
  foto_url?: string | null
  dokumen_pdf?: string | null
  dokumenPdf?: string | null
  dokumen_pdf_url?: string | null
  dokumen_url?: string | null
  keterangan?: string
  created_at?: string
  updated_at?: string
  dibuat?: string
}

export default function DetailBergerakPage({ asetBergerak }: { asetBergerak?: BergerakRecord }) {
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
    id: asetBergerak?.id ?? '-',
    bentuk: asetBergerak?.bentuk_aset ?? asetBergerak?.bentukAset ?? '-',
    dasarHak: asetBergerak?.dasar_hak ?? asetBergerak?.dasarHak ?? '-',
    atasNama: asetBergerak?.atas_nama ?? asetBergerak?.atasNama ?? '-',
    tahunPerolehan: asetBergerak?.tahun_perolehan ?? asetBergerak?.tahunPerolehan ?? '-',
    nomorRegistrasi: asetBergerak?.nomor_registrasi ?? asetBergerak?.nomorRegistrasi ?? '-',
    keterangan: asetBergerak?.keterangan ?? '-',
    fotoUrl: asetBergerak?.foto_url ?? (asetBergerak?.foto ? `/storage/${String(asetBergerak.foto).replace(/\\/g, '/')}` : null),
    dokumenUrl: asetBergerak?.dokumen_pdf_url ?? asetBergerak?.dokumen_url ?? (asetBergerak?.dokumenPdf ? `/storage/${String(asetBergerak.dokumenPdf).replace(/\\/g, '/')}` : null),
    createdAt: asetBergerak?.created_at ?? asetBergerak?.dibuat ?? '-',
  }

  const infoCards = [
    { label: 'Bentuk Aset', value: detail.bentuk },
    { label: 'Dasar Hak', value: detail.dasarHak },
    { label: 'Atas Nama', value: detail.atasNama },
    { label: 'Tahun Perolehan', value: detail.tahunPerolehan },
    { label: 'Nomor Registrasi', value: detail.nomorRegistrasi },
    { label: 'Tanggal Pembukuan', value: detail.createdAt },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage="asset-bergerak">
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9zm3 4.5h12M8 5v3m8-3v3" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Aset Bergerak</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">{detail.bentuk}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit(`/inventaris/aset-bergerak/${detail.id}/edit`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => router.visit('/inventaris/aset-bergerak')}
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {infoCards.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
              <div className="mt-2 text-lg font-semibold text-slate-800">{item.value || '-'}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Keterangan</p>
              </div>
            </div>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{detail.keterangan || '-'}</p>
          </div>

          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            {detail.fotoUrl && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Foto Aset</h3>
                <button
                  type="button"
                  aria-label="Lihat foto penuh"
                  onClick={() => setIsImageFullscreen(true)}
                  className="group relative block h-60 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <img
                    src={detail.fotoUrl}
                    alt={String(detail.bentuk)}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/10 group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">Lihat foto penuh</span>
                  </div>
                </button>
              </div>
            )}

            {detail.dokumenUrl && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Dokumen Pendukung</h3>
                <a
                  href={detail.dokumenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
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
      </div>

      {isImageFullscreen && detail.fotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setIsImageFullscreen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsImageFullscreen(false)
              }}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Tutup
            </button>
            <img src={detail.fotoUrl} alt={String(detail.bentuk)} className="max-h-[85vh] w-full object-contain" />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
