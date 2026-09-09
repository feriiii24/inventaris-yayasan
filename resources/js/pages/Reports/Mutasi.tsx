import { router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import { getAssetDetailRoute } from '../../config/pageRoutes'
import { usePage } from '@inertiajs/react'

type MutationRow = {
  id: string
  no: number
  aset: string
  kode: string
  jenis: string
  dari: string
  ke: string
  tanggal: string
  status: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Sukses: { bg: '#dcfce7', color: '#166534' },
  Proses: { bg: '#dbeafe', color: '#1d4ed8' },
  Selesai: { bg: '#f1f5f9', color: '#475569' },
}

const typeColors: Record<string, { bg: string; color: string }> = {
  'Pemindahan Unit': { bg: '#dcfce7', color: '#166534' },
  'Perbaikan': { bg: '#fef3c7', color: '#b45309' },
  'Peminjaman Antar Unit': { bg: '#dbeafe', color: '#1d4ed8' },
}

function StatusBadge({ label }: { label: string }) {
  const style = statusColors[label] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  )
}

function TypeBadge({ label }: { label: string }) {
  const style = typeColors[label] ?? { bg: '#f1f5f9', color: '#475569' }

  return (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  )
}

function SummaryCard({ label, value, subtitle, accent, icon }: { label: string; value: number; subtitle: string; accent: string; icon: React.ReactNode }) {
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

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8M8 17h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada riwayat mutasi' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty ? 'Riwayat mutasi aset akan muncul setelah transaksi mutasi tercatat.' : 'Tidak ada mutasi yang sesuai dengan filter yang dipilih.'}
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

export default function LaporanMutasiPage() {
  const [selectedType, setSelectedType] = useState('Semua Jenis')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [selectedUnit, setSelectedUnit] = useState('Semua Unit')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pageSize, setPageSize] = useState<number | 'all'>(10)
  const [currentPage, setCurrentPage] = useState(1)

  const props = usePage().props as any
  const serverRows = props.rows || []

  const rows = useMemo(() => {
    return serverRows.map((item: any, index: number) => ({
      id: item.id,
      no: index + 1,
      aset: item.aset || item.nama || item.asset_name || '-',
      kode: item.kode || item.asset_code || '-',
      jenis: item.jenis || item.movement_type || 'Pemindahan Unit',
      dari: item.dari || item.from || item.from_unit || 'Unit Utama',
      ke: item.ke || item.to || item.to_unit || 'Unit Tujuan',
      tanggal: item.tanggal || item.mutation_date || item.tanggalPerolehan || item.created_at || '2024-01-01',
      status: item.status || 'Proses',
    }))
  }, [serverRows])

  const uniqueValues = (values: string[]) => Array.from(new Map(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .map((value) => [value.toLocaleLowerCase(), value]),
  ).values())
  const allTypes = useMemo(() => ['Semua Jenis', ...uniqueValues(rows.map((row) => row.jenis))], [rows])
  const allStatuses = useMemo(() => ['Semua Status', ...uniqueValues(rows.map((row) => row.status))], [rows])
  const allUnits = useMemo(() => ['Semua Unit', ...uniqueValues(rows.flatMap((row) => [row.dari, row.ke]))], [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesType = selectedType === 'Semua Jenis' || row.jenis === selectedType
      const matchesStatus = selectedStatus === 'Semua Status' || row.status === selectedStatus
      const matchesUnit = selectedUnit === 'Semua Unit' || row.dari === selectedUnit || row.ke === selectedUnit
      const matchesStart = !startDate || row.tanggal >= startDate
      const matchesEnd = !endDate || row.tanggal <= endDate
      return matchesType && matchesStatus && matchesUnit && matchesStart && matchesEnd
    })
  }, [rows, selectedType, selectedStatus, selectedUnit, startDate, endDate])

  const pageSizeOptions = ['10 / halaman', '50 / halaman', '100 / halaman', 'Tampilkan semua']
  const pageSizeLabel = pageSize === 'all' ? 'Tampilkan semua' : `${pageSize} / halaman`
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') {
      return filteredRows
    }

    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  const resetFilters = () => {
    setSelectedType('Semua Jenis')
    setSelectedStatus('Semua Status')
    setSelectedUnit('Semua Unit')
    setStartDate('')
    setEndDate('')
    setPageSize(10)
    setCurrentPage(1)
  }

  const goToPage = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(1, nextPage), totalPages))
  }

  const tableColumns: DataTableColumn<MutationRow>[] = [
    { key: 'no', label: '#', className: 'w-[56px]' },
    {
      key: 'aset',
      label: 'Aset',
      className: 'min-w-[260px]',
      render: (_value: string | number | null | undefined, row: MutationRow) => (
        <div className="space-y-0.5">
          <p className="text-[13px] font-semibold text-slate-800">{row.aset}</p>
          <p className="text-[12px] text-slate-500">{row.kode}</p>
        </div>
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      className: 'min-w-[160px]',
      render: (value: string | number | null | undefined) => <TypeBadge label={String(value)} />,
    },
    { key: 'dari', label: 'Dari Unit', className: 'min-w-[150px]' },
    { key: 'ke', label: 'Ke Unit', className: 'min-w-[150px]' },
    {
      key: 'tanggal',
      label: 'Tanggal',
      className: 'min-w-[120px]',
      render: (value: string | number | null | undefined) => <span className="whitespace-nowrap text-[13px] text-slate-700">{String(value || '-')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      className: 'min-w-[110px]',
      render: (value: string | number | null | undefined) => <StatusBadge label={String(value)} />,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      className: 'w-[72px]',
      render: (_value: string | number | null | undefined, row: MutationRow) => (
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
      title="Laporan Mutasi"
      subtitle="Laporan riwayat mutasi aset"
      currentPage='laporan-mutasi'
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Executive overview</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Laporan mutasi aset</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Update real-time
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="TOTAL MUTASI"
            value={rows.length}
            subtitle="Total seluruh mutasi aset"
            accent="#166534"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <SummaryCard
            label="SUKSES"
            value={rows.filter((row) => row.status === 'Sukses').length}
            subtitle="Mutasi berhasil selesai"
            accent="#16a34a"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <SummaryCard
            label="PROSES"
            value={rows.filter((row) => row.status === 'Proses').length}
            subtitle="Mutasi dalam proses"
            accent="#2563eb"
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Riwayat</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-800">Mutasi Aset Terakhir</h3>
              <p className="text-[12px] text-slate-500">Daftar riwayat mutasi aset terbaru</p>
            </div>

            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-end xl:flex-wrap">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <AnimatedSelect
                  value={selectedType}
                  onChange={(value) => {
                    setSelectedType(value || 'Semua Jenis')
                    setCurrentPage(1)
                  }}
                  options={allTypes}
                  placeholder="Semua Jenis"
                  minWidth="170px"
                />

                <AnimatedSelect
                  value={selectedStatus}
                  onChange={(value) => {
                    setSelectedStatus(value || 'Semua Status')
                    setCurrentPage(1)
                  }}
                  options={allStatuses}
                  placeholder="Semua Status"
                  minWidth="170px"
                />

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
                      setPageSize('all')
                    } else {
                      const nextValue = Number(String(value).split(' / ')[0]) || 10
                      setPageSize(Math.max(10, nextValue))
                    }
                    setCurrentPage(1)
                  }}
                  options={pageSizeOptions}
                  placeholder="10 / halaman"
                  minWidth="170px"
                />

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

          {filteredRows.length === 0 ? (
            <EmptyState kind="filter" onReset={resetFilters} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable columns={tableColumns} rows={paginatedRows} emptyMessage={<EmptyState kind="filter" onReset={resetFilters} />} />
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-slate-600">
                  {pageSize === 'all'
                    ? `Menampilkan semua ${filteredRows.length} data`
                    : `Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, filteredRows.length)}–${Math.min(currentPage * pageSize, filteredRows.length)} dari ${filteredRows.length} data`}
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
