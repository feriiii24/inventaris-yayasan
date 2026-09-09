import { router } from '@inertiajs/react'
import type { ReactNode } from 'react'
import SidebarPage from '../../components/SidebarPage'
import { getPageRoute } from '../../config/pageRoutes'
import { usePage } from '@inertiajs/react'

const statusStyles: Record<string, { bg: string; color: string }> = {
  Aktif: { bg: '#dcfce7', color: '#166534' },
  Siap: { bg: '#dbeafe', color: '#1d4ed8' },
  Update: { bg: '#fef3c7', color: '#b45309' },
  Baru: { bg: '#ecfeff', color: '#0f766e' },
}

const noteStyles = {
  critical: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
  info: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  positive: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
}

const moneyCurrency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const noCurrency = new Intl.NumberFormat('id-ID')

const findUsedReportMeta = (rows: any[] = [], activities: any[] = [], summary: any = null) => {
  const totalAssets = Number(summary?.total_assets ?? rows.reduce((sum, asset) => sum + (typeof asset.jumlah === 'number' ? asset.jumlah : 1), 0))
  const totalValue = Number(summary?.total_value ?? rows.reduce((sum, asset) => sum + Number(asset.nilaiPerolehan || 0), 0))
  const inRepair = Number(summary?.in_repair ?? rows.reduce((sum, asset) => sum + Number(asset.jumlahDalamPerbaikan ?? (/(perbaikan|repair)/i.test(String(asset.kondisi ?? '')) ? (typeof asset.jumlah === 'number' ? asset.jumlah : 1) : 0)), 0))
  const successfulMutations = activities.filter((activity) => activity.status === 'Sukses').length
  const processingMutations = activities.filter((activity) => activity.status === 'Proses').length

  const unitValues = new Map<string, number>()
  rows.forEach((asset) => {
    const quantity = typeof asset.jumlah === 'number' ? asset.jumlah : 1
    const current = unitValues.get(asset.unit ?? 'Lainnya') ?? 0
    unitValues.set(asset.unit ?? 'Lainnya', current + Number(asset.nilaiPerolehan || 0) * quantity)
  })

  const topUnit = [...unitValues.entries()].sort((a, b) => b[1] - a[1])[0]
  const criticalAssets = Number(summary?.critical_assets ?? rows.reduce((sum, asset) => sum + Number(asset.jumlahRusakRingan ?? (/(rusak ringan)/i.test(String(asset.kondisi ?? '')) ? (typeof asset.jumlah === 'number' ? asset.jumlah : 1) : 0)) + Number(asset.jumlahRusakBerat ?? (/(rusak berat)/i.test(String(asset.kondisi ?? '')) ? (typeof asset.jumlah === 'number' ? asset.jumlah : 1) : 0)), 0))

  return {
    totalAssets,
    totalValue,
    inRepair,
    successfulMutations,
    processingMutations,
    topUnit,
    criticalAssets,
  }
}

function formatMoney(value: number) {
  const compact = value >= 1_000_000_000 ? `${(value / 1_000_000_000).toFixed(1)} M` : value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)} Jt` : moneyCurrency.format(value)
  if (value >= 1_000_000_000) return `Rp ${compact.replace('M', 'M')}`
  if (value >= 1_000_000) return `Rp ${compact.replace(' Jt', ' jt')}`
  return moneyCurrency.format(value)
}

function ImportantNote({
  title,
  tone,
}: {
  title: string
  tone: 'critical' | 'info' | 'positive'
}) {
  const palette = noteStyles[tone]

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: palette.dot }} />
      <p className="text-[12px] leading-5 text-slate-600">{title}</p>
    </div>
  )
}

export default function ReportsPage() {
  const props = usePage().props as any
  const rowsProp = props.rows || []
  const activitiesProp = props.activities || []
  const summaryProp = props.summary || null
  const meta = findUsedReportMeta(rowsProp, activitiesProp, summaryProp)
  const reportTypes = [
    { name: 'Laporan Kondisi Aset', detail: 'Status Baik / Rusak Ringan / Rusak Berat', status: 'Aktif', route: 'laporan-kondisi', accent: '#16a34a', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm3 0h10M8 10h8m-8 4h6" /></svg>) },
    { name: 'Laporan Nilai Aset', detail: 'Rekap nilai per unit dan total perolehan', status: 'Siap', route: 'laporan-nilai', accent: '#2563eb', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) },
    { name: 'Laporan Mutasi', detail: 'Mutasi internal dan antar unit', status: 'Update', route: 'laporan-mutasi', accent: '#7c3aed', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10M5 5h.01M19 5h.01M5 19h.01M19 19h.01" /></svg>) },
    { name: 'Laporan Inventaris', detail: 'Daftar aset aktif dan nonaktif', status: 'Aktif', route: 'asset-inventaris', accent: '#16a34a', icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>) },
  ]

  const lastUpdated = activitiesProp[0]?.waktu || 'Hari ini'
  const notes = [
    { text: `${meta.criticalAssets} aset memerlukan perhatian segera.`, tone: 'critical' },
    { text: `${meta.topUnit ? meta.topUnit[0] : 'Unit utama'} memiliki nilai aset tertinggi saat ini.`, tone: 'info' },
    { text: `${meta.successfulMutations} mutasi berhasil diselesaikan dan ${meta.processingMutations} masih diproses.`, tone: 'positive' },
  ]

  const summaryCards = [
    {
      label: 'Total Aset',
      value: noCurrency.format(meta.totalAssets),
      subtitle: 'Total aset tercatat',
      accent: '#166534',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    },
    {
      label: 'Nilai Aset',
      value: formatMoney(meta.totalValue),
      subtitle: 'Akumulasi nilai aset',
      accent: '#2563eb',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: 'Aset Dalam Perbaikan',
      value: String(meta.inRepair),
      subtitle: meta.inRepair ? 'Unit sedang ditangani' : 'Tidak ada aset dalam perbaikan',
      accent: '#d97706',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 011.4 0l1.6 1.6a1 1 0 010 1.4l-8 8-3.5 1.1 1.1-3.5 8-8zM13 7l4 4M5 19h.01" /></svg>,
    },
    {
      label: 'Mutasi Bulan Ini',
      value: String(meta.successfulMutations + meta.processingMutations),
      subtitle: `${meta.successfulMutations} selesai, ${meta.processingMutations} proses`,
      accent: '#7c3aed',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" /></svg>,
    },
  ]

  return (
    <SidebarPage
      title="Laporan Aset"
      subtitle="Ringkasan dan laporan aset"
      currentPage='laporan-aset'
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Executive summary</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Laporan aset yayasan</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Terakhir update: {lastUpdated}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${card.accent}18`, color: card.accent }}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Laporan</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-800">Ringkasan laporan</h3>
              </div>
            </div>

            <div className="space-y-3">
              {reportTypes.map((report) => (
                <button
                  type="button"
                  key={report.name}
                  onClick={() => router.visit(getPageRoute(report.route))}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" style={{ background: `${report.accent}12`, color: report.accent }}>
                    {report.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{report.name}</p>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: statusStyles[report.status]?.bg ?? '#f1f5f9', color: statusStyles[report.status]?.color ?? '#64748b' }}>
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">{report.detail}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.visit(getPageRoute('laporan-kondisi'))}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2zm2-2h6" />
              </svg>
              Lihat semua laporan
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Insight</p>
                <h3 className="text-lg font-semibold text-slate-800">Catatan penting</h3>
              </div>
            </div>

            <div className="space-y-3">
              {notes.map((note) => (
                <ImportantNote key={note.text} title={note.text} tone={note.tone as 'critical' | 'info' | 'positive'} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarPage>
  )
}
