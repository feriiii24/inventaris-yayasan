import { router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import { getAssetDetailRoute } from '../../config/pageRoutes'
import { usePage } from '@inertiajs/react'

type ConditionRow = {
  id: string
  no: number
  aset: string
  kode: string
  kondisi: string
  pemilik: string
  catatan: string
  tanggal: string
}

const conditionStyleMap: Record<string, { bg: string; color: string }> = {
  Baik: { bg: '#dcfce7', color: '#166534' },
  'Rusak Ringan': { bg: '#fef3c7', color: '#b45309' },
  'Rusak Berat': { bg: '#fee2e2', color: '#b91c1c' },
  'Dalam Perbaikan': { bg: '#dbeafe', color: '#1d4ed8' },
}

const conditionCards = [
  { label: 'BAIK', valueKey: 'Baik', subtitle: 'Aset dalam kondisi baik', accent: '#16a34a', icon: 'check' },
  { label: 'RUSAK RINGAN', valueKey: 'Rusak Ringan', subtitle: 'Aset rusak ringan', accent: '#d97706', icon: 'alert' },
  { label: 'RUSAK BERAT', valueKey: 'Rusak Berat', subtitle: 'Aset rusak berat', accent: '#dc2626', icon: 'danger' },
  { label: 'DALAM PERBAIKAN', valueKey: 'Dalam Perbaikan', subtitle: 'Aset sedang diperbaiki', accent: '#2563eb', icon: 'repair' },
] as const

function ConditionIcon({ type }: { type: 'check' | 'alert' | 'danger' | 'repair' }) {
  const commonProps = { className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }

  if (type === 'check') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  if (type === 'alert') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    )
  }

  if (type === 'danger') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M8.24 3.75L2.9 6.91a2 2 0 00-1.1 1.78v6.62a2 2 0 001.1 1.78l5.34 3.16a2 2 0 001.8 0l5.34-3.16a2 2 0 001.1-1.78V8.69a2 2 0 00-1.1-1.78l-5.34-3.16a2 2 0 00-1.8 0z" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 011.4 0l1.6 1.6a1 1 0 010 1.4l-8 8-3.5 1.1 1.1-3.5 8-8zM13 7l4 4M5 19h.01" />
    </svg>
  )
}

function ConditionBadge({ label }: { label: string }) {
  const style = conditionStyleMap[label] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  )
}

function SummaryCard({ label, value, subtitle, accent, icon }: { label: string; value: number; subtitle: string; accent: string; icon: 'check' | 'alert' | 'danger' | 'repair' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" style={{ background: `${accent}18`, color: accent }}>
          <ConditionIcon type={icon} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada riwayat kondisi aset' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Data kondisi aset akan muncul setelah pemeriksaan atau perubahan kondisi tercatat.'
            : 'Tidak ada aset yang sesuai dengan filter kondisi, unit, atau tanggal.'}
        </p>
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
        >
          Reset Filter
        </button>
      )}
    </div>
  )
}

function normalizeConditionValue(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return 'Baik'

  const normalized = raw.toLowerCase().replace(/[_-]/g, ' ')

  if (normalized.includes('rusak berat')) return 'Rusak Berat'
  if (normalized.includes('perbaikan') || normalized.includes('repair')) return 'Dalam Perbaikan'
  if (normalized.includes('rusak ringan')) return 'Rusak Ringan'
  if (normalized.includes('baik') || normalized.includes('good')) return 'Baik'

  return 'Baik'
}

function resolveAssetCondition(asset: any) {
  const rawCondition = asset?.kondisi ?? asset?.condition_status ?? ''
  return normalizeConditionValue(rawCondition)
}

export default function KondisiPage() {
  const [selectedUnit, setSelectedUnit] = useState('Semua Unit')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number | 'all'>(10)

  const props = (usePage().props as any) || {}
  const serverRows = props.rows || []

  const allUnits = useMemo(() => ['Semua Unit', ...Array.from(new Map(
    serverRows
      .map((asset: any) => String(asset.unit ?? '').trim())
      .filter(Boolean)
      .map((unit) => [unit.toLocaleLowerCase(), unit]),
  ).values())], [serverRows])
  const pageSizeOptions = ['10 / halaman', '50 / halaman', '100 / halaman', 'Tampilkan semua']
  const pageSizeLabel = pageSize === 'all' ? 'Tampilkan semua' : `${pageSize} / halaman`

  const summary = useMemo(() => {
    const totals = { Baik: 0, 'Rusak Ringan': 0, 'Rusak Berat': 0, 'Dalam Perbaikan': 0 }

    serverRows.forEach((asset: any) => {
      const good = Number(asset?.jumlahBaik ?? asset?.jumlah_baik ?? (resolveAssetCondition(asset) === 'Baik' ? asset?.jumlah ?? 0 : 0))
      const ringan = Number(asset?.jumlahRusakRingan ?? asset?.jumlah_rusak_ringan ?? (resolveAssetCondition(asset) === 'Rusak Ringan' ? asset?.jumlah ?? 0 : 0))
      const berat = Number(asset?.jumlahRusakBerat ?? asset?.jumlah_rusak_berat ?? (resolveAssetCondition(asset) === 'Rusak Berat' ? asset?.jumlah ?? 0 : 0))
      const perbaikan = Number(asset?.jumlahDalamPerbaikan ?? asset?.jumlah_dalam_perbaikan ?? (resolveAssetCondition(asset) === 'Dalam Perbaikan' ? asset?.jumlah ?? 0 : 0))

      totals.Baik += good
      totals['Rusak Ringan'] += ringan
      totals['Rusak Berat'] += berat
      totals['Dalam Perbaikan'] += perbaikan
    })

    return totals
  }, [serverRows])

  const tableRows = useMemo(
    () =>
      serverRows.map((asset: any, index: number) => ({
        id: asset.id,
        no: index + 1,
        aset: asset.nama ?? asset.name ?? '',
        kode: asset.kode ?? asset.asset_code ?? '',
        kondisi: resolveAssetCondition(asset),
        pemilik: asset.unit,
        catatan: asset.keterangan ?? asset.deskripsi ?? 'Tidak ada catatan',
        tanggal: asset.tanggalPerolehan ?? asset.dibuat ?? asset.created_at ?? '',
      })),
    [serverRows],
  )

  const filteredRows = useMemo(() => {
    return tableRows.filter((row) => {
      const matchesUnit = selectedUnit === 'Semua Unit' || row.pemilik === selectedUnit
      const matchesStartDate = !startDate || row.tanggal >= startDate
      const matchesEndDate = !endDate || row.tanggal <= endDate

      return matchesUnit && matchesStartDate && matchesEndDate
    })
  }, [tableRows, selectedUnit, startDate, endDate])

  const itemsPerPage = pageSize === 'all' ? filteredRows.length : Number(pageSize)
  const totalPages = Math.max(1, pageSize === 'all' ? 1 : Math.ceil(filteredRows.length / itemsPerPage))
  const pageRows = useMemo(() => {
    if (pageSize === 'all') return filteredRows

    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRows.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRows, currentPage, itemsPerPage, pageSize])

  const resetFilters = () => {
    setSelectedUnit('Semua Unit')
    setStartDate('')
    setEndDate('')
    setPageSize(10)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (nextSize: number | 'all') => {
    setPageSize(nextSize)
    setCurrentPage(1)
  }

  const goToPage = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(1, nextPage), totalPages))
  }

  const tableColumns: DataTableColumn<ConditionRow>[] = [
    { key: 'no', label: '#', className: 'w-[56px]' },
    {
      key: 'aset',
      label: 'Aset',
      className: 'min-w-[260px]',
      render: (_value: string | number | null | undefined, row: ConditionRow) => (
        <div className="space-y-0.5">
          <p className="text-[13px] font-semibold text-slate-800">{row.aset}</p>
          <p className="text-[12px] text-slate-500">{row.kode}</p>
        </div>
      ),
    },
    {
      key: 'kondisi',
      label: 'Kondisi',
      className: 'min-w-[140px]',
      render: (value: string | number | null | undefined) => <ConditionBadge label={String(value)} />,
    },
    { key: 'pemilik', label: 'Pemilik', className: 'min-w-[160px]' },
    {
      key: 'catatan',
      label: 'Catatan',
      className: 'min-w-[220px]',
      render: (value: string | number | null | undefined) => <span className="line-clamp-2 text-[13px] text-slate-600">{String(value ?? '-')}</span>,
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      className: 'min-w-[130px]',
      render: (value: string | number | null | undefined) => <span className="whitespace-nowrap text-[13px] text-slate-700">{String(value || '-')}</span>,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'w-[72px]',
      render: (_value: string | number | null | undefined, row: ConditionRow) => (
        <button
          type="button"
          aria-label="Lihat Detail"
          title="Lihat Detail"
          onClick={() => router.visit(getAssetDetailRoute(row.id))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-emerald-200 hover:text-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.943 7.5 5 12 5s8.577 2.943 9.964 6.683a1.012 1.012 0 010 .639C20.577 16.057 16.5 19 12 19s-8.577-2.943-9.964-6.678z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      ),
    },
  ]

  return (
    <SidebarPage
      title="Laporan Kondisi"
      subtitle="Laporan kondisi aset"
      currentPage='laporan-kondisi'
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Executive overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Laporan kondisi aset</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Update real-time
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {conditionCards.map((item) => (
            <SummaryCard
              key={item.label}
              label={item.label}
              value={summary[item.valueKey] ?? 0}
              subtitle={item.subtitle}
              accent={item.accent}
              icon={item.icon}
            />
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Riwayat</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-800">Riwayat kondisi aset</h3>
              <p className="text-[12px] text-slate-500">Daftar aset berdasarkan kondisi terakhir</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <AnimatedSelect
                value={selectedUnit}
                onChange={(value) => {
                  setSelectedUnit(value || 'Semua Unit')
                  setCurrentPage(1)
                }}
                options={allUnits}
                placeholder="Semua Unit"
                minWidth="180px"
              />

              <AnimatedSelect
                value={pageSizeLabel}
                onChange={(value) => {
                  if (value === 'Tampilkan semua') {
                    handlePageSizeChange('all')
                  } else {
                    const nextValue = Number(String(value).split(' / ')[0]) || 10
                    handlePageSizeChange(Math.max(10, nextValue))
                  }
                }}
                options={pageSizeOptions}
                placeholder="10 / halaman"
                minWidth="170px"
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative block">
                  <span className="sr-only">Tanggal mulai</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-emerald-300 sm:w-[150px]"
                  />
                </label>
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">s/d</span>
                <label className="relative block">
                  <span className="sr-only">Tanggal akhir</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-10 w-full min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-emerald-300 sm:w-[150px]"
                  />
                </label>
              </div>
            </div>
          </div>

          {tableRows.length === 0 ? (
            <EmptyState kind="empty" />
          ) : filteredRows.length === 0 ? (
            <EmptyState kind="filter" onReset={resetFilters} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={tableColumns}
                  rows={pageRows}
                  emptyMessage={<EmptyState kind="filter" onReset={resetFilters} />}
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-slate-600">
                  {pageSize === 'all'
                    ? `Semua ${filteredRows.length} data`
                    : `${Math.min((currentPage - 1) * itemsPerPage + 1, filteredRows.length)}–${Math.min(currentPage * itemsPerPage, filteredRows.length)} dari ${filteredRows.length} data`}
                </p>

                {pageSize !== 'all' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
                      const pageNumber = index + 1
                      const isActive = pageNumber === currentPage

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => goToPage(pageNumber)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${isActive ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}

                    {totalPages > 3 && <span className="px-1 text-[12px] text-slate-500">...</span>}
                    {totalPages > 3 && (
                      <button
                        type="button"
                        onClick={() => goToPage(totalPages)}
                        className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${currentPage === totalPages ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SidebarPage>
  )
}
