import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetActionModal, { type AssetModalField } from '../../components/AssetActionModal'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DashboardLayout from '../../Layouts/DashboardLayout'
import { getAssetDetailRoute, getAssetEditRoute, getPageRoute } from '../../config/pageRoutes'

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
          <p className="text-sm font-semibold" style={{ color: palette.text }}>{type === 'success' ? 'Berhasil' : 'Gagal'}</p>
          <p className="mt-1 text-sm" style={{ color: palette.text }}>{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium" style={{ color: palette.icon }} aria-label="Tutup notifikasi">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function UsahaYayasanPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState<Array<Record<string, any>>>(initialRows)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ bentukUsaha: '', lokasi: '', pengelola: '', pageSize: '10' })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create')
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('usaha-yayasan-toast')
      window.localStorage.setItem('usaha-yayasan-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem('usaha-yayasan-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('usaha-yayasan-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filterOptions = useMemo(() => {
    const makeStringOptions = (values: Array<string | null | undefined>) =>
      [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]

    return {
      bentukUsaha: makeStringOptions(rows.map((row) => row.bentukUsaha)),
      lokasi: makeStringOptions(rows.map((row) => row.lokasi)),
      pengelola: makeStringOptions(rows.map((row) => row.pengelola)),
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.bentukUsaha, row.lokasi, row.pengelola, row.dasarPerjanjian, row.keterangan].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesBentukUsaha = !filters.bentukUsaha || row.bentukUsaha === filters.bentukUsaha
      const matchesLokasi = !filters.lokasi || row.lokasi === filters.lokasi
      const matchesPengelola = !filters.pengelola || row.pengelola === filters.pengelola

      return matchesQuery && matchesBentukUsaha && matchesLokasi && matchesPengelola
    })
  }, [rows, searchTerm, filters])

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({ bentukUsaha: '', lokasi: '', pengelola: '', pageSize: '10' })
  }

  const modalFields: AssetModalField[] = [
    { name: 'bentukUsaha', label: 'Bentuk Usaha', type: 'text' },
    { name: 'lokasi', label: 'Lokasi', type: 'text' },
    { name: 'pengelola', label: 'Pengelola', type: 'text' },
    { name: 'mulaiOperasional', label: 'Mulai Operasional', type: 'date' },
    { name: 'dasarPerjanjian', label: 'Dasar Perjanjian', type: 'text' },
    { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
    { name: 'dibuat', label: 'Dibuat', type: 'date' },
  ]

  const handleOpenCreate = () => {
    router.visit('/inventaris/usaha-yayasan/create')
  }

  const handleOpenEdit = (row: Record<string, any>) => {
    router.visit(`/inventaris/usaha-yayasan/${row.id ?? row.no}/edit`)
  }

  const handleOpenDetail = (row: Record<string, any>) => {
    router.visit(`/inventaris/usaha-yayasan/${row.id ?? row.no}`)
  }

  const handleDelete = (row: Record<string, any>) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    const assetId = deleteTarget.id ?? deleteTarget.no
    router.delete(`/inventaris/usaha-yayasan/${assetId}`, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Usaha yayasan berhasil dihapus.' })
        setRows((currentRows) => currentRows.filter((item) => String(item.id ?? item.no) !== String(assetId)))
        setDeleteTarget(null)
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus usaha yayasan. Silakan coba lagi.' })
      },
    })
  }

  const handleSave = (values: Record<string, any>) => {
    if (modalMode === 'create') {
      const nextNo = rows.length ? Math.max(...rows.map((item) => item.no)) + 1 : 1
      setRows((currentRows) => [{ ...values, id: String(nextNo), no: nextNo } as Record<string, any>, ...currentRows])
      persistNotice({ type: 'success', message: 'Data berhasil ditambahkan.' })
    }

    if (modalMode === 'edit' && selectedRow) {
      setRows((currentRows) =>
        currentRows.map((item) => (item.no === selectedRow.no ? { ...item, ...values } : item)),
      )
      persistNotice({ type: 'success', message: 'Perubahan berhasil disimpan.' })
    }

    setModalOpen(false)
    setSelectedRow(null)
  }

  const summaryCards = [
    {
      label: 'Total usaha',
      value: rows.length,
      accent: '#10b981',
      bg: '#ecfdf5',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
        </svg>
      ),
    },
    {
      label: 'Lokasi',
      value: new Set(rows.map((row) => row.lokasi).filter(Boolean)).size,
      accent: '#3b82f6',
      bg: '#dbeafe',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-6-10A6 6 0 0118 11c0 5.65-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      ),
    },
    {
      label: 'Pengelola',
      value: new Set(rows.map((row) => row.pengelola).filter(Boolean)).size,
      accent: '#8b5cf6',
      bg: '#ede9fe',
      color: '#6d28d9',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role='super_admin' currentPage='usaha-yayasan'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus usaha yayasan"
        message={deleteTarget ? `Apakah Anda yakin ingin menghapus usaha ${deleteTarget.bentukUsaha}? Data yang dihapus tidak dapat dikembalikan.` : 'Hapus usaha ini?'}
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        tone="danger"
      />

      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Yayasan</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Usaha Yayasan</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Usaha
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative min-h-[118px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Daftar data</p>
              <h2 className="text-base font-semibold text-slate-900">Data usaha yayasan</h2>
            </div>
          </div>

          <div className="mt-4">
            <AssetPageTable
              title=""
              subtitle=""
              rows={filteredRows}
              pageSize={Math.max(10, Number(filters.pageSize) || 10)}
              emptyMessage="Data tidak ditemukan"
              emptyContent={
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Data tidak ditemukan</p>
                    <p className="mt-1 text-xs text-slate-500">Tidak ada usaha yang sesuai dengan pencarian atau filter.</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-[12px] font-medium text-emerald-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                    </svg>
                    Reset Filter
                  </button>
                </div>
              }
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              toolbar={(
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-[220px] flex-1">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari bentuk usaha, lokasi, pengelola..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={filters.bentukUsaha}
                    onChange={(value) => setFilters((prev) => ({ ...prev, bentukUsaha: value }))}
                    options={filterOptions.bentukUsaha}
                    placeholder="Semua Bentuk Usaha"
                    minWidth="180px"
                    className="min-w-[150px] flex-1"
                  />

                  <AnimatedSelect
                    value={filters.lokasi}
                    onChange={(value) => setFilters((prev) => ({ ...prev, lokasi: value }))}
                    options={filterOptions.lokasi}
                    placeholder="Semua Lokasi"
                    minWidth="170px"
                    className="min-w-[150px] flex-1"
                  />

                  <AnimatedSelect
                    value={filters.pengelola}
                    onChange={(value) => setFilters((prev) => ({ ...prev, pengelola: value }))}
                    options={filterOptions.pengelola}
                    placeholder="Semua Pengelola"
                    minWidth="170px"
                    className="min-w-[150px] flex-1"
                  />

                  <AnimatedSelect
                    value={String(filters.pageSize)}
                    onChange={(value) => setFilters((prev) => ({ ...prev, pageSize: String(Math.max(10, Number(value) || 10)) }))}
                    options={['10', '25', '50']}
                    placeholder="10"
                    minWidth="110px"
                    className="min-w-[110px] flex-1"
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
                <>
                  <ActionButton title="Lihat Detail" onClick={() => handleOpenDetail(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit Usaha" onClick={() => handleOpenEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus Usaha" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionButton>
                </>
              )}
              columns={[
                { key: 'no', label: '#', className: 'w-[52px]' },
                { key: 'bentukUsaha', label: 'Bentuk Usaha', className: 'w-[260px]', render: (value) => (
                  <span className="text-[13px] font-semibold" style={{ color: '#0f172a' }}>{String(value ?? '-')}</span>
                ) },
                { key: 'pengelola', label: 'Pengelola', className: 'w-[180px]' },
                { key: 'mulaiOperasional', label: 'Mulai Operasional', className: 'w-[140px]', render: (value) => (
                  <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: '#ecfdf5', color: '#166534' }}>{String(value ?? '-')}</span>
                ) },
                { key: 'dasarPerjanjian', label: 'Dasar Perjanjian', className: 'w-[220px]', render: (value) => (
                  <span className="line-clamp-2 leading-relaxed text-[13px]" style={{ color: '#334155' }}>{String(value ?? '-')}</span>
                ) },
                { key: 'keterangan', label: 'Keterangan', className: 'w-[220px]', render: (value) => (
                  <span className="line-clamp-2 leading-relaxed text-[13px]" style={{ color: '#334155' }}>{String(value ?? '-')}</span>
                ) },
                { key: 'dibuat', label: 'Dibuat', className: 'w-[110px]' },
              ]}
            />
          </div>
        </div>
      </div>

      <AssetActionModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'Tambah Usaha Yayasan' : modalMode === 'edit' ? 'Edit Usaha Yayasan' : 'Detail Usaha Yayasan'}
        fields={modalFields}
        initialValues={selectedRow ?? {
          no: '',
          bentukUsaha: '',
          lokasi: '',
          pengelola: '',
          mulaiOperasional: '',
          dasarPerjanjian: '',
          keterangan: '',
          dibuat: '',
        }}
        onClose={() => {
          setModalOpen(false)
          setSelectedRow(null)
        }}
        onSave={handleSave}
      />
    </DashboardLayout>
  )
}
