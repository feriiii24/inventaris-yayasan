import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

type RoomRow = {
  id: string
  no: number
  nama: string
  location_id: string
  unit_id: string
  kode: string
  lantai: string
  deskripsi: string
  status: string
  lokasi: string
  unit: string
  created_at: string
  updated_at: string
}

function NotificationToast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  const palette = type === 'success'
    ? { bg: '#ecfdf5', border: '#a7f3d0', icon: '#166534', text: '#14532d' }
    : { bg: '#fef2f2', border: '#fecaca', icon: '#b91c1c', text: '#7f1d1d' }

  return (
    <div className="fixed right-5 top-5 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border shadow-lg" style={{ background: palette.bg, borderColor: palette.border }}>
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: palette.icon + '1A', color: palette.icon }}>
          {type === 'success' ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: palette.text }}>
            {type === 'success' ? 'Berhasil' : 'Gagal'}
          </p>
          <p className="mt-1 text-sm" style={{ color: palette.text }}>{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium" style={{ color: palette.icon }} aria-label="Tutup notifikasi">
          ✕
        </button>
      </div>
    </div>
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
          {isEmpty ? 'Belum ada ruangan' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Ruangan aset yang ditambahkan akan muncul di sini.'
            : 'Tidak ada ruangan yang sesuai dengan pencarian.'}
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

export default function RuanganPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState<RoomRow[]>(() => (initialRows ?? []).map((row, index) => ({
    id: String(row.id ?? index + 1),
    no: Number(row.no ?? index + 1),
    nama: String(row.nama ?? row.name ?? '-'),
    location_id: String(row.location_id ?? row.locationId ?? '-'),
    unit_id: String(row.unit_id ?? row.unitId ?? '-'),
    kode: String(row.kode ?? row.code ?? '-'),
    lantai: String(row.lantai ?? row.floor ?? '-'),
    deskripsi: String(row.deskripsi ?? row.description ?? '-'),
    status: String(row.status ?? 'Aktif'),
    lokasi: String(row.lokasi ?? row.location ?? '-'),
    unit: String(row.unit ?? row.unit_name ?? '-'),
    created_at: String(row.created_at ?? '-'),
    updated_at: String(row.updated_at ?? '-'),
  })))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedLokasi, setSelectedLokasi] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [pageSize, setPageSize] = useState<number | 'all'>(10)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoomRow | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('room-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('room-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    setRows((initialRows ?? []).map((row, index) => ({
      id: String(row.id ?? index + 1),
      no: Number(row.no ?? index + 1),
      nama: String(row.nama ?? row.name ?? '-'),
      location_id: String(row.location_id ?? row.locationId ?? '-'),
      unit_id: String(row.unit_id ?? row.unitId ?? '-'),
      kode: String(row.kode ?? row.code ?? '-'),
      lantai: String(row.lantai ?? row.floor ?? '-'),
      deskripsi: String(row.deskripsi ?? row.description ?? '-'),
      status: String(row.status ?? 'Aktif'),
      lokasi: String(row.lokasi ?? row.location ?? '-'),
      unit: String(row.unit ?? row.unit_name ?? '-'),
      created_at: String(row.created_at ?? '-'),
      updated_at: String(row.updated_at ?? '-'),
    })))
  }, [initialRows])

  const unitOptions = useMemo(() => Array.from(new Map(
    rows
      .map((row) => String(row.unit ?? '').trim())
      .filter(Boolean)
      .map((unit) => [unit.toLocaleLowerCase(), unit]),
  ).values()), [rows])
  const lokasiOptions = useMemo(() => Array.from(new Map(
    rows
      .map((row) => String(row.lokasi ?? '').trim())
      .filter(Boolean)
      .map((location) => [location.toLocaleLowerCase(), location]),
  ).values()), [rows])
  const statusOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.status).filter(Boolean))), [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.nama, row.lokasi, row.unit, row.kode, row.lantai, row.deskripsi, row.status].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesUnit = !selectedUnit || row.unit === selectedUnit
      const matchesLokasi = !selectedLokasi || row.lokasi === selectedLokasi
      const matchesStatus = !selectedStatus || row.status === selectedStatus

      return matchesSearch && matchesUnit && matchesLokasi && matchesStatus
    })
  }, [rows, searchTerm, selectedUnit, selectedLokasi, selectedStatus])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedUnit('')
    setSelectedLokasi('')
    setSelectedStatus('')
    setPageSize(10)
  }

  const handleDetail = (row: RoomRow) => {
    router.visit(`/master/ruangan/${row.id}`)
  }

  const handleEdit = (row: RoomRow) => {
    router.visit(`/master/ruangan/${row.id}/edit`)
  }

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('room-toast')
      window.localStorage.setItem('room-toast', JSON.stringify(nextNotice))
    }
  }

  const handleDelete = (row: RoomRow) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    router.delete(`/master/ruangan/${deleteTarget.id}`, {
      onSuccess: () => {
        setRows((currentRows) => currentRows.filter((item) => item.id !== deleteTarget.id).map((item, index) => ({ ...item, no: index + 1 })))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Ruangan berhasil dihapus.' })
        router.visit('/master/ruangan')
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus ruangan.' })
      },
    })
  }

  const pageSizeOptions = ['10', '50', '100', 'Tampilkan semua']
  const summaryStats = useMemo(() => {
    const total = rows.length
    const activeRooms = rows.filter((row) => String(row.status || '').toLowerCase() === 'aktif').length
    const units = new Set(rows.map((row) => row.unit).filter(Boolean)).size
    const locations = new Set(rows.map((row) => row.lokasi).filter(Boolean)).size

    return [
      { label: 'TOTAL RUANGAN', value: total, subtitle: 'Seluruh ruangan terdaftar', accent: '#166534', icon: 'room' },
      { label: 'AKTIF', value: activeRooms, subtitle: 'Ruangan berstatus aktif', accent: '#2563eb', icon: 'status' },
      { label: 'TERHUBUNG', value: `${units}/${locations}`, subtitle: 'Unit / lokasi terdata', accent: '#7c3aed', icon: 'link' },
    ]
  }, [rows])

  return (
    <DashboardLayout role='super_admin' currentPage='master-ruangan'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Master data</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Ruangan</h1>
                <p className="mt-2 text-sm text-emerald-50">Kelola semua ruangan di seluruh unit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Data terupdate
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {summaryStats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 100}ms backwards` }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: stat.accent }} />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                  <p className="mt-4 text-3xl font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-3 text-xs text-slate-500">{stat.subtitle}</p>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all duration-300 group-hover:scale-110" style={{ background: `${stat.accent}12`, color: stat.accent }}>
                  {stat.icon === 'room' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" /></svg>
                  )}
                  {stat.icon === 'status' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {stat.icon === 'link' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L9.5 4.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07l2.83-2.83" /></svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Table Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Daftar</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Ruangan</h2>
              <p className="text-[13px] text-slate-500">Kelola {rows.length} ruangan terdaftar</p>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/master/ruangan/create')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-[13px] font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Ruangan
            </button>
          </div>

          <div className="mb-5 space-y-3">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[220px]">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari nama, kode, lantai..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-1 gap-2 md:flex-none">
                <AnimatedSelect
                  value={selectedUnit}
                  onChange={setSelectedUnit}
                  options={unitOptions}
                  placeholder="Unit"
                  minWidth="140px"
                  className="flex-1 md:flex-none"
                />

                <AnimatedSelect
                  value={selectedLokasi}
                  onChange={setSelectedLokasi}
                  options={lokasiOptions}
                  placeholder="Lokasi"
                  minWidth="140px"
                  className="flex-1 md:flex-none"
                />

                <AnimatedSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  placeholder="Status"
                  minWidth="130px"
                  className="flex-1 md:flex-none"
                />
              </div>

              <div className="flex gap-2">
                <AnimatedSelect
                  value={pageSize === 'all' ? 'Tampilkan semua' : String(pageSize)}
                  onChange={(value) => setPageSize(value === 'Tampilkan semua' ? 'all' : Math.max(10, Number(value) || 10))}
                  options={pageSizeOptions}
                  placeholder="10"
                  minWidth="140px"
                  className="flex-1 md:flex-none"
                />

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[12px] font-medium text-emerald-700 transition-all hover:bg-emerald-50 active:scale-95"
                  title="Reset semua filter"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Active Filters Info */}
            {(searchTerm || selectedUnit || selectedLokasi || selectedStatus) && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                <span className="font-medium">Filter aktif diterapkan ({(searchTerm ? 1 : 0) + (selectedUnit ? 1 : 0) + (selectedLokasi ? 1 : 0) + (selectedStatus ? 1 : 0)})</span>
              </div>
            )}
          </div>

          <div className="">
            <AssetPageTable
              rows={filteredRows}
              pageSize={pageSize === 'all' ? Math.max(filteredRows.length || 10, 10) : Math.max(10, Number(pageSize) || 10)}
              pageSizeOptions={[10, 50, 100, 'all']}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                { key: 'no', label: '#', className: 'w-[56px]' },
                { key: 'id', label: 'ID Ruangan', className: 'w-[100px]' },
                { key: 'nama', label: 'Nama Ruangan', className: 'min-w-[200px]', render: (value) => <span className="text-[13px] font-semibold text-slate-800">{String(value ?? '-')}</span> },
                { key: 'lokasi', label: 'Lokasi', className: 'min-w-[180px]' },
                { key: 'unit', label: 'Unit', className: 'min-w-[150px]' },
                { key: 'kode', label: 'Kode Ruangan', className: 'w-[130px]' },
                { key: 'lantai', label: 'Lantai', className: 'w-[90px]' },
                { key: 'deskripsi', label: 'Deskripsi', className: 'min-w-[220px]', render: (value) => <span className="text-[13px] text-slate-600">{String(value ?? '-')}</span> },
                { key: 'status', label: 'Status', className: 'w-[110px]', render: (value) => {
                  const status = String(value ?? '').toLowerCase()
                  const statusClass = status === 'aktif'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'aktif & full'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  return (
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>
                      {value}
                    </span>
                  )
                } },
                { key: 'created_at', label: 'Created At', className: 'w-[110px]' },
                { key: 'updated_at', label: 'Updated At', className: 'w-[110px]' },
              ]}
              toolbar={null}
              renderActions={(row) => (
                <div className="flex items-center gap-1.5">
                  <ActionButton title="Detail ruangan" onClick={() => handleDetail(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit ruangan" onClick={() => handleEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus ruangan" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionButton>
                </div>
              )}
              emptyContent={
                rows.length === 0
                  ? <EmptyState kind="empty" />
                  : <EmptyState kind="filter" onReset={resetFilters} />
              }
            />
          </div>
        </div>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" style={{ border: '1px solid #fecaca' }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">Hapus Ruangan</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{deleteTarget.nama}</span>?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Batal</button>
                <button type="button" onClick={confirmDelete} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: '#dc2626' }}>Hapus</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
