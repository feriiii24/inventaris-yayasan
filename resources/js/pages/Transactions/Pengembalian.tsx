import { router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'


const conditionColors: Record<string, { bg: string; color: string }> = {
  Baik: { bg: '#dcfce7', color: '#166534' },
  'Sedang Dicek': { bg: '#fef3c7', color: '#b45309' },
  Rusak: { bg: '#fee2e2', color: '#b91c1c' },
  'Perlu Perbaikan': { bg: '#dbeafe', color: '#1d4ed8' },
}

const statusColors: Record<string, { bg: string; color: string }> = {
  'Menunggu Persetujuan': { bg: '#dbeafe', color: '#1d4ed8' },
  'Dipinjam': { bg: '#dcfce7', color: '#166534' },
  'Selesai': { bg: '#dcfce7', color: '#166534' },
  'Ditolak': { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ label }: { label: string }) {
  const style = statusColors[label] ?? { bg: '#f1f5f9', color: '#64748b' }
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.color }}>{label}</span>
}

function ConditionBadge({ label }: { label: string }) {
  const style = conditionColors[label] ?? { bg: '#f1f5f9', color: '#64748b' }
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.color }}>{label}</span>
}

function RequestTypeBadge({ rawStatus }: { rawStatus?: string }) {
  const type = rawStatus === 'pengembalian' ? 'Pengembalian' : 'Pengajuan'
  const style = rawStatus === 'pengembalian'
    ? { bg: '#fef3c7', color: '#b45309' }
    : { bg: '#e0f2fe', color: '#075985' }

  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ background: style.bg, color: style.color }}>
      {type}
    </span>
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
        <p className="text-base font-semibold text-slate-800">{isEmpty ? 'Belum ada aset dipinjam' : 'Data tidak ditemukan'}</p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty ? 'Data aset yang sedang dipinjam akan muncul di sini.' : 'Tidak ada aset dipinjam yang sesuai dengan pencarian atau filter.'}
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

export default function PengembalianPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows] = useState(() => (initialRows ?? []).map((r, i) => ({
    no: i + 1,
    id: r.id,
    aset: r.namaAset ?? r.aset ?? '-',
    unitPemilik: r.unitPemilik ?? r.unitDiPinjam ?? r.unit ?? r.unitPemilik ?? '-',
    unitPeminjam: r.unitPeminjam ?? r.unit ?? r.unitDiPinjam ?? r.unitPeminjam ?? '-',
    tanggalPinjam: r.tanggalPinjam ?? r.loan_date ?? '-',
    tanggalKembali: r.tanggalKembali ?? r.return_date ?? r.tanggalJatuhTempo ?? r.due_date ?? '-',
    kondisi: r.kondisi ?? r.condition ?? '-',
    status: r.status ?? 'Menunggu Persetujuan',
    statusRaw: r.statusRaw ?? r.status_code ?? r.status ?? 'pending',
  })))

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('Semua Unit Pemilik')
  const [selectedBorrowerUnit, setSelectedBorrowerUnit] = useState('Semua Unit Peminjam')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [selectedCondition, setSelectedCondition] = useState('Semua Kondisi')
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

  const uniqueValues = (values: string[]) => Array.from(new Map(
    values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .map((value) => [value.toLocaleLowerCase(), value]),
  ).values())
  const allUnits = useMemo(() => uniqueValues(rows.map((row) => row.unitPemilik)), [rows])
  const allBorrowerUnits = useMemo(() => uniqueValues(rows.map((row) => row.unitPeminjam)), [rows])
  const allStatuses = useMemo(() => uniqueValues(rows.map((row) => row.status)), [rows])
  const allConditions = useMemo(() => uniqueValues(rows.map((row) => row.kondisi)), [rows])

  const stats = useMemo(() => ({
    menunggu: rows.filter((row) => row.status === 'Menunggu Persetujuan').length,
    dipinjam: rows.filter((row) => row.status === 'Dipinjam').length,
    selesai: rows.filter((row) => row.status === 'Selesai').length,
    ditolak: rows.filter((row) => row.status === 'Ditolak').length,
  }), [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return rows.filter((row) => {
      const haystack = [row.aset, row.unitPemilik, row.unitPeminjam, row.kondisi].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesUnit = selectedUnit === 'Semua Unit Pemilik' || row.unitPemilik === selectedUnit
      const matchesBorrowerUnit = selectedBorrowerUnit === 'Semua Unit Peminjam' || row.unitPeminjam === selectedBorrowerUnit
      const matchesStatus = selectedStatus === 'Semua Status' || row.status === selectedStatus
      const matchesCondition = selectedCondition === 'Semua Kondisi' || row.kondisi === selectedCondition
      const matchesDate = !selectedDate || row.tanggalKembali === selectedDate

      return matchesQuery && matchesUnit && matchesBorrowerUnit && matchesStatus && matchesCondition && matchesDate
    })
  }, [rows, searchTerm, selectedUnit, selectedBorrowerUnit, selectedStatus, selectedCondition, selectedDate])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedUnit('Semua Unit Pemilik')
    setSelectedBorrowerUnit('Semua Unit Peminjam')
    setSelectedStatus('Semua Status')
    setSelectedCondition('Semua Kondisi')
    setSelectedDate('')
  }

  const summaryCards = [
    {
      label: 'Menunggu Persetujuan',
      value: stats.menunggu,
      note: 'Permintaan peminjaman yang belum diputuskan',
      accent: '#2563eb',
      bg: '#ffffff',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Dipinjam',
      value: stats.dipinjam,
      note: 'Aset yang sudah disetujui dan sedang dipinjam',
      accent: '#10b981',
      bg: '#ffffff',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Selesai / Ditolak',
      value: stats.selesai + stats.ditolak,
      note: 'Riwayat yang sudah selesai atau ditolak',
      accent: '#f59e0b',
      bg: '#ffffff',
      color: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      ),
    },
  ]

  return (
    <SidebarPage
      title=""
      subtitle=""
      currentPage='pengembalian-aset'
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Riwayat</p>
                <h1 className="mt-2 text-2xl font-bold text-white">Aset Dipinjam</h1>
              </div>
            </div>
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
              <h2 className="mt-1 text-xl font-semibold text-slate-800">Riwayat Aset Dipinjam</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {filteredRows.length} data
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <AssetPageTable
              rows={filteredRows}
              columns={[
                { key: 'no', label: '#', className: 'w-[60px]' },
                { key: 'aset', label: 'Aset', className: 'min-w-[220px]' },
                { key: 'unitPeminjam', label: 'Unit Peminjam', className: 'min-w-[180px]' },
                { key: 'tanggalKembali', label: 'Tanggal Kembali', className: 'min-w-[140px]' },
                { key: 'kondisi', label: 'Kondisi', className: 'min-w-[150px]', render: (value: string) => <ConditionBadge label={value} /> },
                {
                  key: 'status',
                  label: 'Status',
                  className: 'min-w-[180px]',
                  render: (value: string, row: any) => (
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge label={value} />
                      <RequestTypeBadge rawStatus={row.statusRaw ?? row.status_code ?? row.status ?? 'pending'} />
                    </div>
                  ),
                },
              ]}
              getRowClassName={(row) => {
                const rawStatus = row.statusRaw ?? row.status_code ?? row.status ?? 'pending'
                return rawStatus === 'pending' || rawStatus === 'pengembalian'
                  ? 'bg-amber-50/80 hover:bg-amber-100/80 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]'
                  : 'hover:bg-slate-50/80'
              }}
              pageSize={4}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              emptyContent={rows.length === 0 ? <EmptyState kind="empty" /> : <EmptyState kind="filter" onReset={resetFilters} />}
              toolbar={(
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-0 xl:max-w-[420px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari aset, unit, atau kondisi..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={selectedUnit}
                    onChange={(value) => setSelectedUnit(value || 'Semua Unit Pemilik')}
                    options={allUnits.filter((unit) => unit !== 'Semua Unit Pemilik')}
                    placeholder="Semua Unit Pemilik"
                    minWidth="170px"
                  />

                  <AnimatedSelect
                    value={selectedBorrowerUnit}
                    onChange={(value) => setSelectedBorrowerUnit(value || 'Semua Unit Peminjam')}
                    options={allBorrowerUnits.filter((unit) => unit !== 'Semua Unit Peminjam')}
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

                  <AnimatedSelect
                    value={selectedCondition}
                    onChange={(value) => setSelectedCondition(value || 'Semua Kondisi')}
                    options={allConditions.filter((condition) => condition !== 'Semua Kondisi')}
                    placeholder="Semua Kondisi"
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
              renderQuickActions={(row) => {
                if (row.status !== 'Menunggu Persetujuan') return null

                const isReturnRequest = row.statusRaw === 'pengembalian'
                const actionLabel = isReturnRequest ? 'Pengembalian' : 'Pengajuan'
                const confirmApprove = isReturnRequest
                  ? `Setujui pengembalian aset ${row.aset} dari unit ${row.unitPeminjam}?`
                  : `Setujui pengajuan peminjaman aset ${row.aset} dari unit ${row.unitPeminjam}?`
                const confirmReject = isReturnRequest
                  ? `Tolak pengembalian aset ${row.aset} dari unit ${row.unitPeminjam}?`
                  : `Tolak pengajuan peminjaman aset ${row.aset} dari unit ${row.unitPeminjam}?`

                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title={`Setujui ${actionLabel}`}
                      onClick={() => {
                        askConfirmation({
                          title: `Setujui ${actionLabel.toLowerCase()}`,
                          message: confirmApprove,
                          confirmLabel: 'Ya, setujui',
                          tone: 'info',
                        }, () => router.post(`/peminjaman/${row.id}/approve`))
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
                      </svg>
                      Setujui
                    </button>

                    <button
                      type="button"
                      title={`Tolak ${actionLabel}`}
                      onClick={() => {
                        askConfirmation({
                          title: `Tolak ${actionLabel.toLowerCase()}`,
                          message: confirmReject,
                          confirmLabel: 'Ya, tolak',
                          tone: 'danger',
                        }, () => router.post(`/peminjaman/${row.id}/reject`))
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak
                    </button>
                  </div>
                )
              }}
              renderActions={(row) => [
                <ActionButton
                  key="detail"
                  title="Lihat Detail"
                  onClick={() => router.visit(`/pengembalian/${row.id}`)}
                >
                  <span className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                    Detail
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
