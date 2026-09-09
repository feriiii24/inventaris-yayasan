import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

type CategoryRow = {
  id: string
  no: number
  nama: string
  deskripsi: string
  status: 'Aktif' | 'Nonaktif'
}

const defaultRows: CategoryRow[] = [
  { id: '1', no: 1, nama: 'Inventaris', deskripsi: 'Aset bergerak dan perlengkapan operasional', status: 'Aktif' },
  { id: '2', no: 2, nama: 'Bergerak', deskripsi: 'Kendaraan, alat transportasi, mesin, dan sarana operasional', status: 'Aktif' },
  { id: '3', no: 3, nama: 'Tidak Bergerak', deskripsi: 'Tanah, bangunan, fasilitas permanen, dan aset gedung', status: 'Aktif' },
  { id: '4', no: 4, nama: 'Usaha Yayasan', deskripsi: 'Unit usaha dan kegiatan produktif yayasan', status: 'Nonaktif' },
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5v8A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5v-11z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada kategori' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Kategori aset yang ditambahkan akan muncul di sini.'
            : 'Tidak ada kategori yang sesuai dengan pencarian atau filter.'}
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

export default function KategoriPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState<CategoryRow[]>(() => {
    if (initialRows && initialRows.length > 0) {
      return initialRows.map((row, index) => ({
        id: String(row.id ?? index + 1),
        no: Number(row.no ?? index + 1),
        nama: String(row.nama ?? row.name ?? '-'),
        deskripsi: String(row.deskripsi ?? row.description ?? '-'),
        status: row.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      }))
    }

    return defaultRows
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Semua Status')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [form, setForm] = useState({ nama: '', deskripsi: '', status: 'Aktif' as 'Aktif' | 'Nonaktif' })

  useEffect(() => {
    if (initialRows && initialRows.length > 0) {
      setRows(initialRows.map((row, index) => ({
        id: String(row.id ?? index + 1),
        no: Number(row.no ?? index + 1),
        nama: String(row.nama ?? row.name ?? '-'),
        deskripsi: String(row.deskripsi ?? row.description ?? '-'),
        status: row.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      })))
    }
  }, [initialRows])

  useEffect(() => {
    const saved = window.localStorage.getItem('category-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('category-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const allStatuses = useMemo(() => ['Semua Status', ...new Set(rows.map((row) => row.status))], [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.nama, row.deskripsi].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesStatus = selectedStatus === 'Semua Status' || row.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [rows, searchTerm, selectedStatus])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('category-toast')
      window.localStorage.setItem('category-toast', JSON.stringify(nextNotice))
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStatus('Semua Status')
  }

  const handleAddCategory = () => {
    const nama = form.nama.trim()
    const deskripsi = form.deskripsi.trim()

    if (!nama || !deskripsi) {
      persistNotice({ type: 'error', message: 'Nama dan deskripsi kategori wajib diisi.' })
      return
    }

    setRows((current) => {
      const nextRows = [
        {
          id: String(Date.now()),
          no: current.length + 1,
          nama,
          deskripsi,
          status: form.status,
        },
        ...current,
      ]

      return nextRows.map((row, index) => ({ ...row, no: index + 1 }))
    })

    setForm({ nama: '', deskripsi: '', status: 'Aktif' })
    setIsAddOpen(false)
    persistNotice({ type: 'success', message: 'Kategori berhasil ditambah.' })
  }

  const handleEdit = (row: CategoryRow) => {
    setForm({ nama: row.nama, deskripsi: row.deskripsi, status: row.status })
    setIsAddOpen(true)
    persistNotice({ type: 'success', message: `Kategori ${row.nama} siap diubah.` })
  }

  const handleDelete = (row: CategoryRow) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id).map((row, index) => ({ ...row, no: index + 1 })))
    setDeleteTarget(null)
    persistNotice({ type: 'success', message: `Kategori ${deleteTarget.nama} berhasil dihapus.` })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='master-kategori'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-5">
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
                  <h3 className="text-lg font-semibold text-slate-800">Hapus Kategori</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{deleteTarget.nama}</span>?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Batal</button>
                <button type="button" onClick={confirmDelete} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {false && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{form.nama ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                  <p className="mt-1 text-sm text-slate-500">Isi data kategori aset dengan lengkap.</p>
                </div>
                <button type="button" onClick={() => { setIsAddOpen(false); setForm({ nama: '', deskripsi: '', status: 'Aktif' }) }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Kategori</label>
                  <input
                    value={form.nama}
                    onChange={(event) => setForm((current) => ({ ...current, nama: event.target.value }))}
                    placeholder="Contoh: Inventaris"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                  <textarea
                    value={form.deskripsi}
                    onChange={(event) => setForm((current) => ({ ...current, deskripsi: event.target.value }))}
                    placeholder="Masukkan deskripsi singkat..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'Aktif' | 'Nonaktif' }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => { setIsAddOpen(false); setForm({ nama: '', deskripsi: '', status: 'Aktif' }) }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Batal</button>
                <button type="button" onClick={handleAddCategory} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                  {form.nama ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5v8A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5v-11z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-semibold leading-none text-slate-900">Kategori</h1>
            <p className="mt-1 text-[13px] text-slate-500">Kelola kategori aset</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Master Kategori</h2>
              <p className="mt-1 text-[13px] text-slate-500">Daftar seluruh kategori aset</p>
            </div>

            {false && (
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Kategori
              </button>
            )}
          </div>

          <div className="mt-4">
            <AssetPageTable
              rows={filteredRows}
              pageSize={4}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                { key: 'no', label: '#', className: 'w-[56px]' },
                {
                  key: 'nama',
                  label: 'Nama Kategori',
                  className: 'min-w-[200px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="text-[13px] font-semibold text-slate-800">{String(value ?? '-')}</span>
                  ),
                },
                {
                  key: 'deskripsi',
                  label: 'Deskripsi',
                  className: 'min-w-[300px]',
                  render: (value: string | number | null | undefined) => (
                    <span className="line-clamp-2 text-[13px] text-slate-600">{String(value ?? '-')}</span>
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
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <div className="relative flex-1 min-w-0 lg:max-w-[420px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari kategori..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <AnimatedSelect
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={allStatuses.filter((status) => status !== 'Semua Status')}
                    placeholder="Semua Status"
                    minWidth="170px"
                    className="min-w-[170px]"
                  />
                </div>
              )}
              renderActions={(row) => (
                <div className="flex items-center gap-1.5">
                  <ActionButton title="Lihat Detail" onClick={() => router.visit(`/master/kategori/${row.id}`)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </ActionButton>
                </div>
              )}
              emptyContent={rows.length === 0 ? <EmptyState kind="empty" /> : <EmptyState kind="filter" onReset={resetFilters} />}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
