import { router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect, { optionLabelKey, normalizeOptionLabel } from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'


const statusColors: Record<string, { bg: string; color: string }> = {
  Dipinjam: { bg: '#dbeafe', color: '#1d4ed8' },
  Selesai: { bg: '#dcfce7', color: '#166534' },
  'Menunggu Pengembalian': { bg: '#fef3c7', color: '#b45309' },
  'Terlambat': { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ label }: { label: string }) {
  const style = statusColors[label] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  )
}

function getDisplayStatus(row: { status?: string; tanggalJatuhTempo?: string; tanggalKembali?: string }) {
  const today = new Date()
  const dueDateValue = row.tanggalJatuhTempo || row.tanggalKembali
  const dueDate = dueDateValue ? new Date(`${dueDateValue}T00:00:00`) : null

  if (row.status === 'Menunggu Pengembalian' || row.status === 'pengembalian') {
    return 'Menunggu Pengembalian'
  }

  if (row.status === 'Dipinjam' && dueDate && dueDate < today) {
    return 'Terlambat'
  }

  return row.status || 'Dipinjam'
}

function EmptyState({ kind = 'empty', onReset, onAdd }: { kind?: 'empty' | 'filter'; onReset?: () => void; onAdd?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2zm2-2h6" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">{isEmpty ? 'Belum ada riwayat peminjaman' : 'Data tidak ditemukan'}</p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty ? 'Riwayat peminjaman aset akan muncul di sini.' : 'Tidak ada riwayat peminjaman yang sesuai dengan pencarian atau filter.'}
        </p>
      </div>
      {isEmpty ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Peminjaman
        </button>
      ) : (
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

export default function PeminjamanPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState(() => (initialRows ?? []).map((r, i) => ({
    no: i + 1,
    id: r.id,
    aset: r.namaAset ?? r.nama_aset ?? '-',
    jumlah: Number(r.jumlah ?? r.quantity ?? 1),
    namaPeminjam: r.peminjam ?? r.borrower_name ?? '-',
    unitPeminjam: r.unit ?? r.unitPeminjam ?? r.borrowerUnit ?? '-',
    unitDiPinjam: r.unitDiPinjam ?? r.unit_dipinjam ?? r.assetUnit ?? '-',
    tanggalPinjam: r.tanggalPinjam ?? r.loan_date ?? '-',
    tanggalJatuhTempo: r.tanggalJatuhTempo ?? r.due_date ?? r.dueDate ?? '-',
    tanggalKembali: r.tanggalKembali ?? r.return_date ?? '-',
    status: (r.status ?? '').toString(),
  })))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('Semua Unit Peminjam')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [selectedDate, setSelectedDate] = useState('')
  const [confirmation, setConfirmation] = useState<{
    title: string
    message: string
    confirmLabel: string
    tone: 'danger' | 'info'
    onConfirm: () => void
  } | null>(null)

  const askConfirmation = (
    action: Omit<NonNullable<typeof confirmation>, 'onConfirm'>,
    onConfirm: () => void,
  ) => setConfirmation({ ...action, onConfirm })

  const allUnits = useMemo(() => Array.from(new Map(
    rows
      .map((row) => String(row.unitPeminjam ?? '').trim())
      .filter(Boolean)
      .map((unit) => [optionLabelKey(unit), normalizeOptionLabel(unit)]),
  ).values()), [rows])
  const allStatuses = useMemo(() => Array.from(new Map(
    rows
      .map((row) => getDisplayStatus(row).trim())
      .filter(Boolean)
      .map((status) => [optionLabelKey(status), normalizeOptionLabel(status)]),
  ).values()), [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const displayStatus = getDisplayStatus(row)
      const haystack = [row.aset, row.namaPeminjam, row.unitPeminjam].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesUnit = selectedUnit === 'Semua Unit Peminjam' || row.unitPeminjam === selectedUnit
      const matchesStatus = selectedStatus === 'Semua Status' || displayStatus === selectedStatus
      const matchesDate = !selectedDate || row.tanggalPinjam === selectedDate

      return matchesQuery && matchesUnit && matchesStatus && matchesDate
    })
  }, [searchTerm, selectedUnit, selectedStatus, selectedDate])

  const stats = useMemo(() => {
    const aktif = rows.filter((row) => getDisplayStatus(row) === 'Dipinjam').length
    const selesai = rows.filter((row) => getDisplayStatus(row) === 'Selesai').length
    const terlambat = rows.filter((row) => getDisplayStatus(row) === 'Terlambat').length

    return { aktif, selesai, terlambat }
  }, [rows])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedUnit('Semua Unit Peminjam')
    setSelectedStatus('Semua Status')
    setSelectedDate('')
  }

  const summaryCards = [
    {
      label: 'Aktif',
      value: stats.aktif,
      note: 'Peminjaman sedang berjalan',
      accent: '#10b981',
      bg: '#ecfdf5',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      label: 'Selesai',
      value: stats.selesai,
      note: 'Peminjaman telah selesai',
      accent: '#22c55e',
      bg: '#dcfce7',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Terlambat',
      value: stats.terlambat,
      note: 'Lewat batas pengembalian',
      accent: '#ef4444',
      bg: '#fee2e2',
      color: '#991b1b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      ),
    },
  ]

  return (
    <SidebarPage
      title=""
      subtitle=""
      currentPage='peminjaman-aset'
    >
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? 'Konfirmasi tindakan'}
        message={confirmation?.message ?? 'Apakah Anda yakin ingin melanjutkan tindakan ini?'}
        confirmLabel={confirmation?.confirmLabel ?? 'Ya, lanjutkan'}
        cancelLabel="Batal"
        onConfirm={() => {
          const action = confirmation
          setConfirmation(null)
          action?.onConfirm()
        }}
        onCancel={() => setConfirmation(null)}
        tone={confirmation?.tone ?? 'info'}
      />
      <div className="w-full min-w-0 space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_22px_40px_rgba(5,150,105,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Transaksi</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/peminjaman/create')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Peminjaman
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: card.accent + '55' }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: card.color }}>{card.label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</div>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.color + '18', color: card.color, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: card.color }}>{card.note}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-none border-0 bg-transparent shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Data</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-800">Riwayat Peminjaman</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {filteredRows.length} riwayat
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <AssetPageTable
              rows={filteredRows}
              columns={[
                { key: 'no', label: '#', className: 'w-[60px]' },
                { key: 'aset', label: 'Aset', className: 'min-w-[210px]' },
                { key: 'jumlah', label: 'Jumlah', className: 'w-[90px]' },
                { key: 'namaPeminjam', label: 'Nama Peminjam', className: 'min-w-[170px]' },
                { key: 'unitPeminjam', label: 'Unit Peminjam', className: 'min-w-[180px]' },
                { key: 'unitDiPinjam', label: 'Aset Milik', className: 'min-w-[180px]' },
                { key: 'tanggalPinjam', label: 'Tanggal Pinjam', className: 'min-w-[130px]' },
                { key: 'tanggalJatuhTempo', label: 'Jatuh Tempo', className: 'min-w-[130px]' },
                { key: 'tanggalKembali', label: 'Tanggal Kembali', className: 'min-w-[135px]' },
                {
                  key: 'status',
                  label: 'Status',
                  className: 'w-[110px]',
                  render: (value, row) => <StatusBadge label={getDisplayStatus(row as (typeof rows)[number])} />,
                },
              ]}
              getRowClassName={(row) => {
                const displayStatus = getDisplayStatus(row)
                if (displayStatus === 'Menunggu Pengembalian') {
                  return 'bg-amber-50/80 hover:bg-amber-100/80 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]'
                }
                if (displayStatus === 'Terlambat') {
                  return 'bg-rose-50/80 hover:bg-rose-100/80 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.14)]'
                }
                return 'hover:bg-slate-50/80'
              }}
              pageSize={4}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              emptyContent={rows.length === 0 ? (
                <EmptyState
                  kind="empty"
                  onAdd={() => router.visit('/peminjaman/create')}
                />
              ) : <EmptyState kind="filter" onReset={resetFilters} />}
              toolbar={(
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-0 xl:max-w-[420px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari aset, peminjam, atau unit..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={selectedUnit}
                    onChange={(value) => setSelectedUnit(value || 'Semua Unit Peminjam')}
                    options={allUnits.filter((unit) => unit !== 'Semua Unit Peminjam')}
                    placeholder="Semua Unit Peminjam"
                    minWidth="170px"
                  />

                  <AnimatedSelect
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value || 'Semua Status')}
                    options={allStatuses.filter((status) => status !== 'Semua Status')}
                    placeholder="Semua Status"
                    minWidth="120px"
                  />

                  <div className="relative min-w-[150px]">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[13px] font-medium text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.2 9A7 7 0 0119 15.8M18.8 15A7 7 0 015 8.2" />
                    </svg>
                    Reset
                  </button>
                </div>
              )}
              renderQuickActions={(row) =>
                row.status === 'Dipinjam' ? (
                  <button
                    type="button"
                    title="Kembalikan"
                    onClick={() => {
                      askConfirmation({
                        title: 'Ajukan pengembalian',
                        message: `Ajukan pengembalian aset ${row.aset}?`,
                        confirmLabel: 'Ya, ajukan',
                        tone: 'info',
                      }, () => router.post(`/peminjaman/${row.id}/return`))
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h12m0 0l-3-3m3 3l-3 3m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Kembalikan
                  </button>
                ) : null
              }
              renderActions={(row) => [
                <ActionButton
                  key="detail"
                  title="Lihat Detail"
                  onClick={() => router.visit(`/peminjaman/${row.id}`)}
                >
                  <span className="flex items-center gap-2 text-[11px] font-medium">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.628C3.423 7.51 7.36 4.5 12 4.5s8.577 3.01 9.964 7.194a1.012 1.012 0 010 .628C20.577 16.49 16.64 19.5 12 19.5s-8.577-3.01-9.964-7.178zM12 15a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                    Detail
                  </span>
                </ActionButton>,
                <ActionButton
                  key="edit"
                  title="Edit Peminjaman"
                  onClick={() => router.visit(`/peminjaman/${row.id}/edit`)}
                >
                  <span className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                </ActionButton>,
                <ActionButton
                  key="delete"
                  title="Hapus Peminjaman"
                  onClick={() => {
                    askConfirmation({
                      title: 'Hapus peminjaman aset',
                      message: `Apakah Anda yakin ingin menghapus peminjaman ${row.aset}? Tindakan ini tidak dapat dibatalkan.`,
                      confirmLabel: 'Ya, hapus',
                      tone: 'danger',
                    }, () => router.delete(`/peminjaman/${row.id}`))
                  }}
                >
                  <span className="flex items-center gap-2 text-[11px] font-medium text-red-700">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M3 7h18m-5 0V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3" />
                    </svg>
                    Hapus
                  </span>
                </ActionButton>,
              ]}
            />
          </div>
        </div>
      </div>
    </SidebarPage>
  )
}
