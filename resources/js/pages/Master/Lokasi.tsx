import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

type LocationRow = {
  id: string
  no: number
  nama: string
  alamat: string
  unit: string
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

function EmptyState({ kind = 'empty', onReset, onAdd }: { kind?: 'empty' | 'filter'; onReset?: () => void; onAdd?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.5s-7-4.35-7-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3c0 6.15-7 10.5-7 10.5z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada lokasi' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Lokasi aset yang ditambahkan akan muncul di sini.'
            : 'Tidak ada lokasi yang sesuai dengan pencarian.'}
        </p>
      </div>
      {isEmpty ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Lokasi
        </button>
      ) : (
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

export default function LokasiPage({ rows: initialRowsFromProps = [], units = [] }: { rows?: Array<Record<string, any>>; units?: Array<{ id: string; name: string }> }) {
  const [rows, setRows] = useState<LocationRow[]>(() => {
    if (!initialRowsFromProps || initialRowsFromProps.length === 0) {
      return []
    }

    return initialRowsFromProps.map((row, index) => ({
      id: String(row.id ?? index + 1),
      no: Number(row.no ?? index + 1),
      nama: String(row.nama ?? row.name ?? '-'),
      alamat: String(row.alamat ?? row.description ?? row.address ?? '-'),
      unit: String(row.unit ?? row.parent ?? row.parent_name ?? ''),
    }))
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [pageSize, setPageSize] = useState<number | 'all'>(10)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const pageSizeOptions = ['10', '50', '100', 'Tampilkan semua']
  const summaryStats = useMemo(() => {
    const total = rows.length
    const activeUnits = new Set(rows.map((row) => row.unit).filter(Boolean)).size
    const withAddress = rows.filter((row) => row.alamat && row.alamat !== '-').length

    return [
      { label: 'TOTAL LOKASI', value: total, subtitle: 'Seluruh lokasi terdaftar', accent: '#166534', icon: 'pin' },
      { label: 'UNIT TERHUBUNG', value: activeUnits, subtitle: 'Unit yang memiliki lokasi', accent: '#2563eb', icon: 'unit' },
      { label: 'ALAMAT TERCATAT', value: withAddress, subtitle: 'Lokasi dengan alamat lengkap', accent: '#7c3aed', icon: 'map' },
    ]
  }, [rows])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null)
  const [newLocation, setNewLocation] = useState({ nama: '', alamat: '', unit: '', status: 'aktif' })

  useEffect(() => {
    if (!initialRowsFromProps || initialRowsFromProps.length === 0) {
      setRows([])
      return
    }

    setRows(initialRowsFromProps.map((row, index) => ({
      id: String(row.id ?? index + 1),
      no: Number(row.no ?? index + 1),
      nama: String(row.nama ?? row.name ?? '-'),
      alamat: String(row.alamat ?? row.description ?? row.address ?? '-'),
      unit: String(row.unit ?? row.parent ?? row.parent_name ?? ''),
    })))
  }, [initialRowsFromProps])

  useEffect(() => {
    const saved = window.localStorage.getItem('location-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('location-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const unitOptions = useMemo(() => Array.from(new Map(
    rows
      .map((row) => String(row.unit ?? '').trim())
      .filter(Boolean)
      .map((unit) => [unit.toLocaleLowerCase(), unit]),
  ).values()), [rows])
  const uniqueUnits = useMemo(() => Array.from(new Map(
    units
      .map((unit) => ({ ...unit, name: String(unit.name ?? '').trim() }))
      .filter((unit) => unit.name.length > 0)
      .map((unit) => [unit.name.toLocaleLowerCase(), unit]),
  ).values()), [units])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.nama, row.alamat, row.unit].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesUnit = !selectedUnit || row.unit === selectedUnit

      return matchesSearch && matchesUnit
    })
  }, [rows, searchTerm, selectedUnit])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedUnit('')
    setPageSize(10)
  }

  const handleDetail = (row: LocationRow) => {
    router.visit(`/master/lokasi/${row.id}`)
  }

  const handleEdit = (row: LocationRow) => {
    router.visit(`/master/lokasi/${row.id}/edit`)
  }

  const handleDelete = (row: LocationRow) => {
    setDeleteTarget(row)
  }

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('location-toast')
      window.localStorage.setItem('location-toast', JSON.stringify(nextNotice))
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    router.delete(`/master/lokasi/${deleteTarget.id}`, {
      onSuccess: () => {
        setRows((currentRows) => currentRows.filter((row) => row.id !== deleteTarget.id).map((row, index) => ({ ...row, no: index + 1 })))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Lokasi berhasil dihapus.' })
        router.visit('/master/lokasi')
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus lokasi.' })
        router.visit('/master/lokasi')
      },
    })
  }

  const handleAddLocation = () => {
    const nama = newLocation.nama.trim()
    const alamat = newLocation.alamat.trim()
    const unit = newLocation.unit.trim()

    if (!nama || !alamat) {
      persistNotice({ type: 'error', message: 'Nama lokasi dan alamat wajib diisi.' })
      return
    }

    const payload = {
      name: nama,
      description: alamat,
      unit_id: unit || '',
      status: newLocation.status,
    }

    router.post('/master/lokasi', payload, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Lokasi berhasil ditambah.' })
        router.visit('/master/lokasi')
      },
      onError: () => {
        persistNotice({ type: 'error', message: 'Gagal menambah lokasi. Periksa data yang diisi.' })
      },
      onFinish: () => {
        setNewLocation({ nama: '', alamat: '', unit: '', status: 'aktif' })
        setIsEditMode(false)
        setEditingId(null)
        setIsAddOpen(false)
      },
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='master-lokasi'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.5s-7-4.35-7-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3c0 6.15-7 10.5-7 10.5z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Master data</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Lokasi</h1>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Data terupdate
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: stat.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" style={{ background: `${stat.accent}18`, color: stat.accent }}>
                  {stat.icon === 'pin' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.5s-7-4.35-7-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3c0 6.15-7 10.5-7 10.5z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  )}
                  {stat.icon === 'unit' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A1.5 1.5 0 015.5 6H9V3h6v3h3.5A1.5 1.5 0 0120 7.5V19M7 10h10M7 14h10M7 18h10" /></svg>
                  )}
                  {stat.icon === 'map' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l-5 2V5l5-2 6 2 5-2v14l-5 2-6-2zM9 5v12M15 7v12" /></svg>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Daftar</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-800">Master Lokasi</h2>
              <p className="text-[13px] text-slate-500">Daftar seluruh lokasi aset</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Lokasi
            </button>
          </div>

          <div className="mt-4">
            <AssetPageTable
              rows={filteredRows}
              pageSize={pageSize === 'all' ? Math.max(filteredRows.length || 10, 10) : Math.max(10, Number(pageSize) || 10)}
              pageSizeOptions={[10, 50, 100, 'all']}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                { key: 'no', label: '#', className: 'w-[56px]' },
                {
                  key: 'nama',
                  label: 'Nama Lokasi',
                  className: 'min-w-[180px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="text-[13px] font-semibold text-slate-800">{String(value ?? '-')}</span>
                  ),
                },
                {
                  key: 'alamat',
                  label: 'Alamat',
                  className: 'min-w-[260px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="line-clamp-2 text-[13px] text-slate-600">{String(value ?? '-')}</span>
                  ),
                },
                {
                  key: 'unit',
                  label: 'Unit',
                  className: 'min-w-[180px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="text-[13px] font-medium text-slate-700">{String(value ?? '-')}</span>
                  ),
                },
              ]}
              toolbar={(
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <div className="relative min-w-[220px] flex-1 basis-[220px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari lokasi..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={selectedUnit}
                    onChange={setSelectedUnit}
                    options={unitOptions}
                    placeholder="Semua Unit"
                    minWidth="170px"
                    className="min-w-[170px] flex-1 basis-[170px]"
                  />

                  <AnimatedSelect
                    value={pageSize === 'all' ? 'Tampilkan semua' : String(pageSize)}
                    onChange={(value) => setPageSize(value === 'Tampilkan semua' ? 'all' : Math.max(10, Number(value) || 10))}
                    options={pageSizeOptions}
                    placeholder="10"
                    minWidth="150px"
                    className="min-w-[150px] flex-1 basis-[150px]"
                  />

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                    </svg>
                    Reset
                  </button>
                </div>
              )}
              renderActions={(row) => (
                <div className="flex items-center gap-1.5">
                  <ActionButton title="Detail Lokasi" onClick={() => handleDetail(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit Lokasi" onClick={() => handleEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.5 16.5 8 17l.5-3.5L17.586 5.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus Lokasi" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M3 7h18m-5 0V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3" />
                    </svg>
                  </ActionButton>
                </div>
              )}
              emptyContent={
                rows.length === 0
                  ? <EmptyState kind="empty" onAdd={() => setIsAddOpen(true)} />
                  : <EmptyState kind="filter" onReset={resetFilters} />
              }
            />
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">Hapus Lokasi</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{deleteTarget.nama}</span>?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700">Batal</button>
              <button type="button" onClick={confirmDelete} className="rounded-xl bg-red-600 px-3 py-2 text-[13px] font-semibold text-white">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{isEditMode ? 'Edit Lokasi' : 'Tambah Lokasi'}</h3>
                <p className="mt-1 text-[13px] text-slate-500">{isEditMode ? 'Perbarui data lokasi aset' : 'Tambahkan lokasi aset baru'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false)
                  setIsEditMode(false)
                  setEditingId(null)
                  setNewLocation({ nama: '', alamat: '', unit: '', status: 'aktif' })
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Nama Lokasi</label>
                <input
                  value={newLocation.nama}
                  onChange={(event) => setNewLocation((current) => ({ ...current, nama: event.target.value }))}
                  placeholder="Masukkan nama lokasi"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Alamat</label>
                <textarea
                  value={newLocation.alamat}
                  onChange={(event) => setNewLocation((current) => ({ ...current, alamat: event.target.value }))}
                  placeholder="Masukkan alamat lokasi"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Unit</label>
                <select
                  value={newLocation.unit}
                  onChange={(event) => setNewLocation((current) => ({ ...current, unit: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Pilih Unit</option>
                  {uniqueUnits.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>{unit.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-slate-700">Status</label>
                <select
                  value={newLocation.status}
                  onChange={(event) => setNewLocation((current) => ({ ...current, status: event.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false)
                  setIsEditMode(false)
                  setEditingId(null)
                  setNewLocation({ nama: '', alamat: '', unit: '', status: 'aktif' })
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddLocation}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-[13px] font-semibold text-white"
              >
                {isEditMode ? 'Simpan Perubahan' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
