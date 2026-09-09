import SidebarPage from '../../components/SidebarPage'
import { usePage } from '@inertiajs/react'

function formatCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'Rp 0'

  if (value >= 1_000_000_000) {
    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} M`
  }

  if (value >= 1_000_000) {
    return `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value / 1_000_000)} Jt`
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'Rp 0'

  const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

  if (value >= 1_000_000_000) {
    return `Rp ${formatter.format(value / 1_000_000_000)} M`
  }

  if (value >= 1_000_000) {
    return `Rp ${formatter.format(value / 1_000_000)} Jt`
  }

  return `Rp ${formatter.format(value)}`
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(1)}%`
}

function getAssetValueSummary(rows: any[] = [], valueData: any[] = []) {
  const totalValue = rows.reduce((sum, asset) => sum + (Number(asset.nilai || asset.nilaiPerolehan || asset.nilai_perolehan || 0) * (typeof asset.jumlah === 'number' ? asset.jumlah : 1)), 0)
  const inventoryValue = rows
    .filter((asset) => (asset.kategori || asset.kategori_nama || asset.category) === 'Inventaris')
    .reduce((sum, asset) => sum + (Number(asset.nilai || asset.nilaiPerolehan || asset.nilai_perolehan || 0) * (typeof asset.jumlah === 'number' ? asset.jumlah : 1)), 0)
  const fixedValue = totalValue - inventoryValue

  const currentYear = valueData && valueData.length ? valueData[valueData.length - 1] : null
  const previousYear = valueData && valueData.length > 1 ? valueData[valueData.length - 2] : null
  const growth = currentYear && previousYear && previousYear.nilai !== 0
    ? ((currentYear.nilai - previousYear.nilai) / previousYear.nilai) * 100
    : null

  const unitMap = new Map<string, number>()
  rows.forEach((asset) => {
    const unit = asset.unit || 'Lainnya'
    const quantity = typeof asset.jumlah === 'number' ? asset.jumlah : 1
    unitMap.set(unit, (unitMap.get(unit) ?? 0) + (Number(asset.nilai || asset.nilaiPerolehan || asset.nilai_perolehan || 0) * quantity))
  })

  const unitValues = [...unitMap.entries()].map(([unit, value]) => ({
    unit,
    value,
    percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
  })).sort((a, b) => b.value - a.value)

  const yearlyTrend = (valueData || []).map((row, index) => {
    const prev = valueData[index - 1]
    const growthValue = prev && prev.nilai !== 0 ? ((row.nilai - prev.nilai) / prev.nilai) * 100 : null

    return {
      tahun: String(row.tahun),
      nilai: row.nilai,
      growth: growthValue,
    }
  })

  return {
    totalValue,
    inventoryValue,
    fixedValue,
    growth,
    unitValues,
    yearlyTrend,
  }
}

function StatCard({
  label,
  value,
  subtitle,
  accent,
  icon,
}: {
  label: string
  value: string
  subtitle: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function UnitValueRow({ item }: { item: { unit: string; value: number; percent: number } }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-800">{item.unit}</p>
        <p className="whitespace-nowrap text-[13px] font-semibold text-slate-800">{formatCompactValue(item.value)}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
          />
        </div>
        <span className="w-12 text-right text-[12px] font-semibold text-emerald-600">{formatPercent(item.percent)}</span>
      </div>
    </div>
  )
}

function TrendRow({ row, maxValue }: { row: { tahun: string; nilai: number; growth: number | null }; maxValue: number }) {
  const growthColor = row.growth === null ? 'text-slate-500' : row.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
  const growthText = row.growth === null ? '—' : `${row.growth >= 0 ? '+' : ''}${row.growth.toFixed(1)}%`
  const barWidth = maxValue > 0 ? (row.nilai / maxValue) * 100 : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-slate-800">{row.tahun}</span>
        <span className={`text-[12px] font-semibold ${growthColor}`}>{growthText}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 transition-all duration-300"
            style={{ width: `${Math.min(100, barWidth)}%` }}
          />
        </div>
        <span className="min-w-[96px] text-right text-[12px] font-semibold text-slate-700">{formatCompactValue(row.nilai)}</span>
      </div>
    </div>
  )
}

export default function NilaiPage() {
  const props = usePage().props as any
  const serverRows = props.rows || []
  const summary = getAssetValueSummary(serverRows, props.valueData || [])
  const inventoryPercent = summary.totalValue > 0 ? (summary.inventoryValue / summary.totalValue) * 100 : 0
  const fixedPercent = summary.totalValue > 0 ? (summary.fixedValue / summary.totalValue) * 100 : 0

  const positiveTrend = summary.yearlyTrend.length >= 2 && summary.yearlyTrend.some((row: any) => row.growth !== null && row.growth > 0)
  const highestUnit = summary.unitValues[0]
  const maxTrendValue = Math.max(...summary.yearlyTrend.map((row: any) => Number(row.nilai) || 0), 1)

  return (
    <SidebarPage
      title="Laporan Nilai Aset"
      subtitle="Analisis nilai aset"
      currentPage='laporan-nilai'
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Executive overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Laporan nilai aset</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Update real-time
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="TOTAL NILAI"
            value={formatCompactValue(summary.totalValue)}
            subtitle="Total nilai seluruh aset"
            accent="#166534"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="ASET LANCAR"
            value={formatCompactValue(summary.inventoryValue)}
            subtitle={summary.totalValue > 0 ? `${inventoryPercent.toFixed(1)}% dari total nilai` : 'Data belum tersedia'}
            accent="#2563eb"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12l2 2 4-4m4 6l2-2 6 6M6 8h12m-6-4h.01" /></svg>}
          />
          <StatCard
            label="ASET TETAP"
            value={formatCompactValue(summary.fixedValue)}
            subtitle={summary.totalValue > 0 ? `${fixedPercent.toFixed(1)}% dari total nilai` : 'Data belum tersedia'}
            accent="#7c3aed"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A1.5 1.5 0 014.5 6H7V3h10v3h2.5A1.5 1.5 0 0121 7.5V21M7 9h10M7 13h10M7 17h10" /></svg>}
          />
          <StatCard
            label="PERTUMBUHAN"
            value={summary.growth === null ? '—' : `${summary.growth >= 0 ? '+' : ''}${summary.growth.toFixed(1)}%`}
            subtitle={summary.growth === null ? 'Data perbandingan belum tersedia' : 'vs tahun lalu'}
            accent="#d97706"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l5-5 4 4 7-8" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7h2v2" /></svg>}
          />
        </div>

        {highestUnit && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Insight</p>
                <p className="mt-1 text-sm font-semibold">Unit dengan nilai aset tertinggi saat ini: {highestUnit.unit}</p>
              </div>
              <p className="text-lg font-bold">{formatCompactValue(highestUnit.value)}</p>
            </div>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Komposisi</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-800">Nilai per Unit</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{summary.unitValues.length} unit</span>
            </div>

            {summary.unitValues.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18V6m8 12V8m8 10V4" /></svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Belum ada nilai aset per unit</p>
                  <p className="mt-1 text-sm text-slate-500">Data nilai aset per unit akan muncul setelah aset memiliki nilai perolehan dan unit pemilik.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.unitValues.map((item) => (
                  <UnitValueRow key={item.unit} item={item} />
                ))}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total nilai</span>
                    <span className="text-[13px] font-semibold text-slate-800">{formatCompactValue(summary.totalValue)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Trend</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-800">Trend Nilai Aset</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{summary.yearlyTrend.length} periode</span>
            </div>

            {summary.yearlyTrend.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18V6m8 12V8m8 10V4" /></svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-800">Belum ada data tren</p>
                  <p className="mt-1 text-sm text-slate-500">Data tren nilai aset akan muncul setelah tersedia data dari lebih dari satu periode.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.yearlyTrend.map((row) => (
                  <TrendRow key={row.tahun} row={row} maxValue={maxTrendValue} />
                ))}

                {positiveTrend && (
                  <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l5-5 4 4 7-8" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 7h2v2" /></svg>
                    <span>Nilai aset mengalami pertumbuhan positif dalam beberapa tahun terakhir.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarPage>
  )
}
