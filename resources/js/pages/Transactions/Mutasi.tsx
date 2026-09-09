import { router, usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'


const statusColors: Record<string, { bg: string; color: string }> = {
  sukses: { bg: '#dcfce7', color: '#166534' },
  proses: { bg: '#dbeafe', color: '#1d4ed8' },
  gagal: { bg: '#fee2e2', color: '#b91c1c' },
  Sukses: { bg: '#dcfce7', color: '#166534' },
  Proses: { bg: '#dbeafe', color: '#1d4ed8' },
  Gagal: { bg: '#fee2e2', color: '#b91c1c' },
}

const normalizeStatus = (value: any) => String(value ?? '').trim().toLowerCase()
const statusLabel = (value: any) => {
  const normalized = normalizeStatus(value)
  if (!normalized) return 'Proses'

  const map: Record<string, string> = {
    sukses: 'Sukses',
    proses: 'Proses',
    ditolak: 'Gagal',
    gagal: 'Gagal',
    selesai: 'Sukses',
  }

  return map[normalized] ?? String(value)
}

function StatusBadge({ label }: { label: string }) {
  const normalized = normalizeStatus(label)
  const style = statusColors[normalized] ?? statusColors[label] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  )
}

function MutasiEmptyState({ kind = 'empty', onReset, onAdd }: { kind?: 'empty' | 'filter'; onReset?: () => void; onAdd?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-10 5h7M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada mutasi aset' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty ? 'Transaksi pemindahan dan mutasi aset akan muncul di sini.' : 'Tidak ada transaksi mutasi yang sesuai dengan pencarian atau filter.'}
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
          Tambah Mutasi
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

export default function MutasiPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const authUser = usePage<{ auth?: { user?: any } }>().props.auth?.user ?? null
  const currentUserRole = String(authUser?.roleModel?.name ?? authUser?.role ?? authUser?.roles?.[0]?.name ?? authUser?.roles?.[0] ?? 'super_admin').trim().toLowerCase()
  const currentUnitId = String(authUser?.unit_id ?? authUser?.unit?.id ?? '').trim()

  const [rows, setRows] = useState(() => (initialRows ?? []).map((r, i) => ({
    no: i + 1,
    id: r.id,
    kode: r.kode ?? r.asset_code ?? '-',
    aset: r.aset ?? r.asset ?? r.asset_name ?? '-',
    jenis: r.jenis ?? r.movement_type ?? '-',
    dari: r.dari ?? r.from ?? r.fromUnit ?? '-',
    ke: r.ke ?? r.to ?? r.toUnit ?? '-',
    from_unit_id: r.from_unit_id ?? r.fromUnitId ?? '',
    to_unit_id: r.to_unit_id ?? r.toUnitId ?? '',
    tanggal: r.tanggal ?? r.mutation_date ?? '-',
    status: r.status ?? '-',
  })))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('Semua Jenis Mutasi')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [selectedDate, setSelectedDate] = useState('')
  const [confirmation, setConfirmation] = useState<{
    title: string
    message: string
    confirmLabel: string
    tone: 'danger' | 'info'
    onConfirm: () => void
  } | null>(null)

  const askConfirmation = (action: Omit<NonNullable<typeof confirmation>, 'onConfirm'>, onConfirm: () => void) => {
    setConfirmation({ ...action, onConfirm })
  }

  const closeConfirmation = () => setConfirmation(null)

  const confirmAction = () => {
    const action = confirmation
    setConfirmation(null)
    action?.onConfirm()
  }

  const stats = useMemo(
    () => ({
      total: rows.length,
      sukses: rows.filter((row) => normalizeStatus(row.status) === 'sukses').length,
      proses: rows.filter((row) => normalizeStatus(row.status) === 'proses').length,
    }),
    [rows],
  )

  const allTypes = useMemo(
    () => [...new Set(rows.map((row) => row.jenis))],
    [rows],
  )

  const allStatuses = useMemo(
    () => [...new Set(rows.map((row) => statusLabel(row.status)))],
    [rows],
  )

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.kode, row.aset, row.jenis, row.dari, row.ke].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesType = selectedType === 'Semua Jenis Mutasi' || row.jenis === selectedType
      const matchesStatus = selectedStatus === 'Semua Status' || statusLabel(row.status) === selectedStatus
      const matchesDate = !selectedDate || row.tanggal === selectedDate

      return matchesQuery && matchesType && matchesStatus && matchesDate
    })
  }, [rows, searchTerm, selectedType, selectedStatus, selectedDate])

  const handleDelete = (row: Record<string, any>) => {
    askConfirmation({
      title: 'Hapus mutasi aset',
      message: `Apakah Anda yakin ingin menghapus mutasi aset ${row.aset ?? row.asset ?? row.kode ?? 'ini'}? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, hapus',
      tone: 'danger',
    }, () => router.delete(`/mutasi/${row.id}`))
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedType('Semua Jenis Mutasi')
    setSelectedStatus('Semua Status')
    setSelectedDate('')
  }

  return (
    <SidebarPage
      title=""
      subtitle=""
      currentPage='mutasi-aset'
    >
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title ?? 'Konfirmasi tindakan'}
        message={confirmation?.message ?? 'Apakah Anda yakin ingin melanjutkan tindakan ini?'}
        confirmLabel={confirmation?.confirmLabel ?? 'Ya, lanjutkan'}
        cancelLabel="Batal"
        onConfirm={confirmAction}
        onCancel={closeConfirmation}
        tone={confirmation?.tone ?? 'info'}
      />
      <div className="w-full min-w-0 space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_22px_40px_rgba(5,150,105,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Transaksi</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/mutasi/create')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Mutasi
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Total',
              value: stats.total,
              note: 'Total seluruh mutasi',
              accent: '#10b981',
              bg: '#ecfdf5',
              color: '#166534',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )
            },
            {
              label: 'Sukses',
              value: stats.sukses,
              note: 'Mutasi berhasil diselesaikan',
              accent: '#22c55e',
              bg: '#dcfce7',
              color: '#166534',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              label: 'Proses',
              value: stats.proses,
              note: 'Dalam proses pemindahan',
              accent: '#0ea5e9',
              bg: '#e0f2fe',
              color: '#075985',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            }
          ].map((card) => (
            <div key={card.label} className="group relative min-h-[120px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-[24px] font-bold tracking-tight text-slate-900 leading-none">{card.value}</p>
              <p className="mt-2 text-[11px] text-slate-500 leading-snug">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Data</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-800">Data Mutasi Aset</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {filteredRows.length} transaksi
            </div>
          </div>

          <div className="bg-slate-50 p-4 sm:p-5">
            <AssetPageTable
              rows={filteredRows}
              columns={[
                { key: 'no', label: '#', className: 'w-[60px]' },
                { key: 'kode', label: 'Kode Aset', className: 'w-[150px]' },
                { key: 'aset', label: 'Nama Aset', className: 'w-[220px]' },
                { key: 'jenis', label: 'Jenis Mutasi', className: 'w-[180px]' },
                { key: 'tanggal', label: 'Tanggal', className: 'w-[120px]' },
                {
                  key: 'status',
                  label: 'Status',
                  className: 'w-[110px]',
                  render: (value: string) => <StatusBadge label={statusLabel(value)} />,
                },
              ]}
              pageSize={4}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              emptyContent={rows.length === 0 ? (
                <MutasiEmptyState
                  kind="empty"
                  onAdd={() => router.visit('/mutasi/create')}
                />
              ) : <MutasiEmptyState kind="filter" onReset={resetFilters} />}
              toolbar={(
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-0 xl:max-w-[420px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari aset, kode, unit, jenis..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={selectedType}
                    onChange={(value) => setSelectedType(value || 'Semua Jenis Mutasi')}
                    options={allTypes.filter((type) => type !== 'Semua Jenis Mutasi')}
                    placeholder="Semua Jenis Mutasi"
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
              renderQuickActions={(row) => {
                const rowStatus = normalizeStatus(row.status)
                const canApprove = currentUserRole === 'admin_unit' && row.jenis === 'Pemindahan Unit' && rowStatus === 'proses' && String(row.to_unit_id || '') === String(currentUnitId)

                if (!canApprove) return null

                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Setujui Mutasi"
                      aria-label="Setujui Mutasi"
                      onClick={() => {
                        askConfirmation({
                          title: 'Setujui mutasi aset',
                          message: `Apakah Anda yakin menyetujui mutasi aset ${row.aset} ke unit ${row.ke}?`,
                          confirmLabel: 'Ya, setujui',
                          tone: 'info',
                        }, () => router.post(`/mutasi/${row.id}/approve`))
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
                      title="Tolak Mutasi"
                      aria-label="Tolak Mutasi"
                      onClick={() => askConfirmation({
                        title: 'Tolak mutasi aset',
                        message: `Apakah Anda yakin ingin menolak mutasi aset ${row.aset}?`,
                        confirmLabel: 'Ya, tolak',
                        tone: 'danger',
                      }, () => router.post(`/mutasi/${row.id}/reject`))}
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
              renderActions={(row) => (
                <>
                    <ActionButton title="Lihat Detail" onClick={() => router.visit(`/mutasi/${row.id}`)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </ActionButton>
                    <ActionButton title="Edit Mutasi" onClick={() => router.visit(`/mutasi/${row.id}/edit`)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </ActionButton>
                    <ActionButton title="Hapus Mutasi" variant="danger" onClick={() => handleDelete(row)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </ActionButton>
                </>
              )}
            />
          </div>
        </div>
      </div>
    </SidebarPage>
  )
}
