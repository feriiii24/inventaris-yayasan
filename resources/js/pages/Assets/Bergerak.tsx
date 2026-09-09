import { router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetActionModal, { type AssetModalField } from '../../components/AssetActionModal'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DashboardLayout from '../../Layouts/DashboardLayout'
import { getAssetDetailRoute, getAssetEditRoute, getPageRoute } from '../../config/pageRoutes'

const assetIconMap: Record<string, string> = {
  kendaraan: 'car',
  motor: 'bike',
  elektronik: 'monitor',
  mesin: 'printer',
  default: 'package',
}

function getAssetCategoryIcon(label: string) {
  const key = label.toLowerCase()
  const type = key.includes('kendaraan') ? 'car' : key.includes('motor') ? 'bike' : key.includes('elektronik') || key.includes('peralatan') ? 'monitor' : key.includes('mesin') || key.includes('fotokopi') || key.includes('printer') ? 'printer' : 'package'

  return type
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

function AssetTypeChip({ label }: { label: string }) {
  const icon = getAssetCategoryIcon(label)

  const Icon = ({ className }: { className?: string }) => {
    const common = { className, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

    if (icon === 'car') {
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M5 16V9.5A2.5 2.5 0 017.5 7H10l2-2h3.5A2.5 2.5 0 0118 7.5V16" />
          <path d="M5 14h14" />
          <circle cx="8" cy="16.5" r="1.75" />
          <circle cx="17" cy="16.5" r="1.75" />
        </svg>
      )
    }

    if (icon === 'bike') {
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="6.5" cy="16.5" r="3.5" />
          <circle cx="17.5" cy="16.5" r="3.5" />
          <path d="M9 16.5l2-5h3l2 5" />
          <path d="M9 10h4l-2-3h-2l2 3" />
        </svg>
      )
    }

    if (icon === 'monitor') {
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect x="3" y="4" width="15" height="11" rx="2" />
          <path d="M8 20h7" />
          <path d="M10 15l-2 5" />
          <path d="M14 15l2 5" />
        </svg>
      )
    }

    if (icon === 'printer') {
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M7 9V4h10v5" />
          <rect x="4" y="9" width="16" height="8" rx="2" />
          <path d="M7 15h10v5H7z" />
        </svg>
      )
    }

    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
        <path d="M9.5 12.5l1.5 1.5 3.5-4" />
      </svg>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#ecfdf5', color: '#166534' }}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{label}</span>
    </div>
  )
}

export default function BergerakPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const [rows, setRows] = useState<Array<Record<string, any>>>(initialRows)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<{ dasarHak: string; tahun: string; tanggal: string; pageSize: number | 'all' | string }>({ dasarHak: '', tahun: '', tanggal: '', pageSize: 10 })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create')
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aset-bergerak-toast')
      window.localStorage.setItem('aset-bergerak-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('aset-bergerak-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('aset-bergerak-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filterOptions = useMemo(() => {
    const dasarHak = [...new Set(rows.map((row) => row.dasarHak).filter((value): value is string => Boolean(value)))]
    const tahun = [...new Set(rows.map((row) => String(row.tahunPerolehan)).filter((value): value is string => Boolean(value)))]
    const tanggal = [...new Set(rows.map((row) => row.dibuat).filter((value): value is string => Boolean(value)))]

    return { dasarHak, tahun, tanggal }
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.bentukAset, row.dasarHak, row.atasNama, row.nomorRegistrasi, row.keterangan].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesDasarHak = !filters.dasarHak || row.dasarHak === filters.dasarHak
      const matchesTahun = !filters.tahun || String(row.tahunPerolehan) === filters.tahun
      const matchesTanggal = !filters.tanggal || row.dibuat === filters.tanggal

      return matchesQuery && matchesDasarHak && matchesTahun && matchesTanggal
    })
  }, [rows, filters, searchTerm])

  const modalFields: AssetModalField[] = [
    { name: 'bentukAset', label: 'Bentuk Aset', type: 'text' },
    { name: 'dasarHak', label: 'Dasar Hak', type: 'text' },
    { name: 'atasNama', label: 'Atas Nama', type: 'text' },
    { name: 'tahunPerolehan', label: 'Tahun Perolehan', type: 'number' },
    { name: 'nomorRegistrasi', label: 'Nomor Registrasi', type: 'text' },
    { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
    { name: 'dibuat', label: 'Dibuat', type: 'date' },
  ]

  const handleOpenCreate = () => {
    router.visit('/inventaris/aset-bergerak/create')
  }

  const handleOpenEdit = (row: Record<string, any>) => {
    router.visit(getAssetEditRoute(row.id ?? row.no, 'bergerak'))
  }

  const handleOpenDetail = (row: Record<string, any>) => {
    router.visit(getAssetDetailRoute(row.id ?? row.no, 'bergerak'))
  }

  const handleDelete = (row: Record<string, any>) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    const assetId = deleteTarget.id ?? deleteTarget.no
    router.delete(getAssetDetailRoute(assetId, 'bergerak'), {
      onSuccess: () => {
        setRows((currentRows) => currentRows.filter((item) => String(item.id ?? item.no) !== String(assetId)))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Aset berhasil dihapus.' })
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus aset. Silakan coba lagi.' })
      },
    })
  }

  const handleSave = (values: Record<string, any>) => {
    if (modalMode === 'create') {
      const nextNo = rows.length ? Math.max(...rows.map((item) => item.no)) + 1 : 1
      setRows((currentRows) => [{ ...values, id: String(nextNo), no: nextNo } as Record<string, any>, ...currentRows])
      persistNotice({ type: 'success', message: 'Aset berhasil ditambahkan.' })
    }

    if (modalMode === 'edit' && selectedRow) {
      setRows((currentRows) =>
        currentRows.map((item) => (item.no === selectedRow.no ? { ...item, ...values } : item)),
      )
      persistNotice({ type: 'success', message: 'Perubahan aset berhasil disimpan.' })
    }

    setModalOpen(false)
    setSelectedRow(null)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({ dasarHak: '', tahun: '', tanggal: '', pageSize: '10' })
  }

  const summaryCards = [
    {
      label: 'Total Aset',
      value: rows.length,
      detail: 'Seluruh aset bergerak terdaftar',
      accent: '#166534',
      iconBg: '#ecfdf5',
      iconColor: '#166534',
      cardBg: '#f8fffb',
    },
    {
      label: 'Dasar Hak',
      value: new Set(rows.map((row) => row.dasarHak).filter(Boolean)).size,
      detail: 'Jenis hak kepemilikan',
      accent: '#0f766e',
      iconBg: '#ecfeff',
      iconColor: '#0f766e',
      cardBg: '#f5fffe',
    },
    {
      label: 'Tahun Terbaru',
      value: rows.length ? Math.max(...rows.map((row) => Number(row.tahunPerolehan || 0))).toString() : '0',
      detail: 'Perolehan terakhir tercatat',
      accent: '#7c3aed',
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed',
      cardBg: '#faf8ff',
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage='asset-bergerak'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus aset bergerak"
        message={deleteTarget ? `Apakah Anda yakin ingin menghapus aset ${deleteTarget.bentukAset}? Data yang dihapus tidak akan bisa dikembalikan.` : 'Hapus aset ini?'}
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        tone="danger"
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-9zm2.5 0h11m-11 4h11" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Manajemen Aset</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Aset Bergerak</h1>
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
              Tambah Aset
            </button>
          </div>
        </div>

        <div className="grid items-stretch gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative h-full min-h-[120px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg" style={{ background: card.cardBg }}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {typeof card.value === 'string' ? card.value : Number(card.value)}
                  </div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.iconBg, color: card.iconColor }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V8m6 11V5m-10 0h16" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-9zM8 5v14M16 5v14M4 10h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Data Aset Bergerak</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Informasi daftar aset bergerak yayasan</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                {filteredRows.length} data terdaftar
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-inner shadow-slate-100/70">
              <AssetPageTable
                title=""
                subtitle=""
                rows={filteredRows}
                pageSize={Math.max(10, Number(filters.pageSize) || 10)}
                searchPlaceholder="Cari bentuk aset, atas nama, nomor registrasi..."
                emptyMessage="Data tidak ditemukan"
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
                        placeholder="Cari bentuk aset, atas nama, nomor registrasi..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <AnimatedSelect
                      value={filters.dasarHak}
                      onChange={(value) => setFilters((prev) => ({ ...prev, dasarHak: value }))}
                      options={filterOptions.dasarHak}
                      placeholder="Semua Dasar Hak"
                      minWidth="170px"
                      className="min-w-[150px] flex-1"
                    />

                    <AnimatedSelect
                      value={filters.tahun}
                      onChange={(value) => setFilters((prev) => ({ ...prev, tahun: value }))}
                      options={filterOptions.tahun}
                      placeholder="Semua Tahun"
                      minWidth="150px"
                      className="min-w-[140px] flex-1"
                    />

                    <AnimatedSelect
                      value={filters.tanggal}
                      onChange={(value) => setFilters((prev) => ({ ...prev, tanggal: value }))}
                      options={filterOptions.tanggal}
                      placeholder="Semua Tanggal"
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[12px] font-medium text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50"
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
                    <ActionButton title="Edit Aset" onClick={() => handleOpenEdit(row)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </ActionButton>
                    <ActionButton title="Hapus Aset" variant="danger" onClick={() => handleDelete(row)}>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </ActionButton>
                  </>
                )}
                columns={[
                  { key: 'no', label: 'No', className: 'w-[52px] text-center' },
                  { key: 'bentukAset', label: 'Bentuk Aset', className: 'w-[200px]', render: (value) => <span className="text-[13px] font-semibold text-slate-900">{String(value ?? '-')}</span> },
                  { key: 'dasarHak', label: 'Dasar Hak', className: 'w-[170px]' },
                  { key: 'atasNama', label: 'Atas Nama', className: 'w-[190px]' },
                  { key: 'tahunPerolehan', label: 'Tahun Perolehan', className: 'w-[120px]', render: (value) => <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{String(value)}</span> },
                  { key: 'nomorRegistrasi', label: 'Nomor Registrasi', className: 'w-[150px] whitespace-nowrap', render: (value) => <span className="font-medium text-emerald-700">{String(value)}</span> },
                  { key: 'keterangan', label: 'Keterangan', className: 'w-[260px]' },
                  { key: 'dibuat', label: 'Dibuat', className: 'w-[120px] whitespace-nowrap' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <AssetActionModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'Tambah Aset Bergerak' : modalMode === 'edit' ? 'Edit Aset Bergerak' : 'Detail Aset Bergerak'}
        fields={modalFields}
        initialValues={selectedRow ?? {
          no: '',
          bentukAset: '',
          dasarHak: '',
          atasNama: '',
          tahunPerolehan: new Date().getFullYear(),
          nomorRegistrasi: '',
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
