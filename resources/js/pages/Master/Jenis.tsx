import { useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import DashboardLayout from '../../Layouts/DashboardLayout'

type AssetTypeRow = {
  id: string
  no: number
  jenis: string
  kategori: string
  status: 'Aktif' | 'Nonaktif'
}

const initialRows: AssetTypeRow[] = [
  { id: '1', no: 1, jenis: 'Perangkat Komputer', kategori: 'Inventaris', status: 'Aktif' },
  { id: '2', no: 2, jenis: 'Perangkat Elektronik', kategori: 'Inventaris', status: 'Aktif' },
  { id: '3', no: 3, jenis: 'Kendaraan', kategori: 'Bergerak', status: 'Aktif' },
  { id: '4', no: 4, jenis: 'Bangunan', kategori: 'Tidak Bergerak', status: 'Aktif' },
  { id: '5', no: 5, jenis: 'Unit Usaha', kategori: 'Usaha Yayasan', status: 'Aktif' },
]

const statusColors: Record<string, { bg: string; color: string }> = {
  Aktif: { bg: '#dcfce7', color: '#166534' },
  Nonaktif: { bg: '#f1f5f9', color: '#475569' },
}

function StatusBadge({ value }: { value: string }) {
  const style = statusColors[value] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
  )
}

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada jenis aset' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Jenis aset yang ditambahkan akan muncul di sini.'
            : 'Tidak ada jenis aset yang sesuai dengan pencarian.'}
        </p>
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
        >
          Reset Pencarian
        </button>
      )}
    </div>
  )
}

export default function JenisPage() {
  const [rows] = useState<AssetTypeRow[]>(initialRows)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.jenis, row.kategori, row.status].join(' ').toLowerCase()
      return !query || haystack.includes(query)
    })
  }, [rows, searchTerm])

  const handleEdit = (row: AssetTypeRow) => {
    window.alert(`Edit jenis aset: ${row.jenis}`)
  }

  const handleMore = (row: AssetTypeRow) => {
    window.alert(`Menu alternatif untuk jenis aset: ${row.jenis}`)
  }

  return (
    <DashboardLayout role='super_admin' currentPage='master-jenis'>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold leading-none text-slate-900">Jenis Aset</h1>
            <p className="mt-1 text-[13px] text-slate-500">Kelola jenis aset</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Master Jenis Aset</h2>
              <p className="mt-1 text-[13px] text-slate-500">Daftar seluruh jenis aset</p>
            </div>
          </div>

          <div className="mt-4">
            <AssetPageTable
              rows={filteredRows}
              pageSize={5}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                { key: 'no', label: '#', className: 'w-[56px]' },
                {
                  key: 'jenis',
                  label: 'Jenis Aset',
                  className: 'min-w-[220px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="text-[13px] font-semibold text-slate-800">{String(value ?? '-')}</span>
                  ),
                },
                {
                  key: 'kategori',
                  label: 'Kategori',
                  className: 'min-w-[180px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="text-[13px] text-slate-600">{String(value ?? '-')}</span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  className: 'min-w-[120px]',
                  render: (value: string | number | null | undefined) => <StatusBadge value={String(value ?? 'Aktif')} />,
                },
              ]}
              toolbar={(
                <div className="relative max-w-full lg:max-w-[420px]">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari jenis aset..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              )}
              renderActions={(row) => (
                <div className="flex items-center gap-1.5">
                  <ActionButton title="Edit Jenis Aset" onClick={() => handleEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.5 16.5 8 17l.5-3.5L17.586 5.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Menu Jenis Aset" onClick={() => handleMore(row)}>
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </ActionButton>
                </div>
              )}
              emptyContent={
                rows.length === 0
                  ? <EmptyState kind="empty" />
                  : <EmptyState kind="filter" onReset={() => setSearchTerm('')} />
              }
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
