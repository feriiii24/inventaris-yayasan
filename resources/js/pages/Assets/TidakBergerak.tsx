import { router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DashboardLayout from '../../Layouts/DashboardLayout'

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

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada aset' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Aset tidak bergerak yang ditambahkan akan muncul di sini.'
            : 'Tidak ada aset yang sesuai dengan pencarian atau filter.'}
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

export default function TidakBergerakPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState<Array<Record<string, any>>>(initialRows)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ dasarHak: '', tahun: '', jangkaWaktu: '', pageSize: '10' })
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aset-tidak-bergerak-toast')
      window.localStorage.setItem('aset-tidak-bergerak-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('aset-tidak-bergerak-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('aset-tidak-bergerak-toast')
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
      dasarHak: makeStringOptions(rows.map((row) => row.dasarHak)),
      tahun: makeStringOptions(rows.map((row) => String(row.tahunPerolehan ?? ''))),
      jangkaWaktu: makeStringOptions(rows.map((row) => row.jangkaWaktu)),
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.bentukAset, row.dasarHak, row.atasNama, row.jangkaWaktu, row.keterangan].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesDasarHak = !filters.dasarHak || row.dasarHak === filters.dasarHak
      const matchesTahun = !filters.tahun || String(row.tahunPerolehan) === filters.tahun
      const matchesJangkaWaktu = !filters.jangkaWaktu || row.jangkaWaktu === filters.jangkaWaktu

      return matchesQuery && matchesDasarHak && matchesTahun && matchesJangkaWaktu
    })
  }, [rows, searchTerm, filters])

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({ dasarHak: '', tahun: '', jangkaWaktu: '', pageSize: '10' })
  }

  const handleOpenCreate = () => {
    router.visit('/inventaris/aset-tidak-bergerak/create')
  }

  const handleOpenEdit = (row: Record<string, any>) => {
    router.visit(`/inventaris/aset-tidak-bergerak/${row.id ?? row.no}/edit`)
  }

  const handleOpenDetail = (row: Record<string, any>) => {
    router.visit(`/inventaris/aset-tidak-bergerak/${row.id ?? row.no}`)
  }

  const handleDelete = (row: Record<string, any>) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    const assetId = deleteTarget.id ?? deleteTarget.no
    router.delete(`/inventaris/aset-tidak-bergerak/${assetId}`, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Aset tidak bergerak berhasil dihapus.' })
        setRows((currentRows) => currentRows.filter((item) => String(item.id ?? item.no) !== String(assetId)))
        setDeleteTarget(null)
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus aset tidak bergerak. Silakan coba lagi.' })
      },
    })
  }

  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const totalAset = rows.length
  const tahunTerbaru = [...new Set(rows.map((row) => row.tahunPerolehan).filter(Boolean))].slice(-1)[0] ?? '-'
  const dasarHakTerbanyak = (() => {
    const counts = new Map<string, number>()
    rows.forEach((row) => {
      const key = String(row.dasarHak ?? '').trim()
      if (!key) return
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    const [label] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
    return label || '-'
  })()

  return (
    <DashboardLayout role={layoutRole} currentPage='asset-tidak-bergerak'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus aset tidak bergerak"
        message={deleteTarget ? `Apakah Anda yakin ingin menghapus aset ${deleteTarget.bentukAset}? Tindakan ini tidak dapat dibatalkan.` : 'Hapus aset ini?'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Properti</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Aset Tidak Bergerak</h1>
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

        <div className="grid gap-3 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Total aset</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{totalAset}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tahun terbaru</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{tahunTerbaru}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-violet-500" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dasar hak dominan</div>
                <div className="mt-2 text-lg font-bold tracking-tight text-slate-900 break-all">{dasarHakTerbanyak}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition-transform duration-300 group-hover:scale-110">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10H7zM9 9h6v6H9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Daftar aset</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Data Aset Tidak Bergerak</h2>
            </div>
            <div className="text-sm text-slate-500">{filteredRows.length} item</div>
          </div>

          <div className="mt-4">
            <AssetPageTable
              rows={filteredRows}
              pageSize={Math.max(10, Number(filters.pageSize) || 10)}
              emptyMessage="Data tidak ditemukan"
              emptyContent={<EmptyState kind={rows.length === 0 ? 'empty' : 'filter'} onReset={resetFilters} />}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              toolbar={(
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-[220px] flex-1">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari bentuk aset, dasar hak, atas nama..."
                      className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-[13px] outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                      onFocus={(event) => {
                        event.currentTarget.style.borderColor = '#166534'
                        event.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 101, 52, 0.08)'
                      }}
                      onBlur={(event) => {
                        event.currentTarget.style.borderColor = '#e2e8f0'
                        event.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <AnimatedSelect
                    value={filters.dasarHak}
                    onChange={(value) => setFilters((current) => ({ ...current, dasarHak: value }))}
                    options={filterOptions.dasarHak}
                    placeholder="Semua Dasar Hak"
                    minWidth="170px"
                    className="min-w-[170px]"
                  />

                  <AnimatedSelect
                    value={filters.tahun}
                    onChange={(value) => setFilters((current) => ({ ...current, tahun: value }))}
                    options={filterOptions.tahun.filter(Boolean)}
                    placeholder="Semua Tahun"
                    minWidth="170px"
                    className="min-w-[170px]"
                  />

                  <AnimatedSelect
                    value={filters.jangkaWaktu}
                    onChange={(value) => setFilters((current) => ({ ...current, jangkaWaktu: value }))}
                    options={filterOptions.jangkaWaktu}
                    placeholder="Semua Jangka Waktu"
                    minWidth="170px"
                    className="min-w-[170px]"
                  />

                  <AnimatedSelect
                    value={String(filters.pageSize)}
                    onChange={(value) => setFilters((current) => ({ ...current, pageSize: String(Math.max(10, Number(value) || 10)) }))}
                    options={['10', '25', '50']}
                    placeholder="10"
                    minWidth="110px"
                    className="min-w-[110px]"
                  />

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-medium transition-colors"
                    style={{ borderColor: '#bbf7d0', color: '#166534', background: '#ffffff' }}
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
                  <ActionButton title="Lihat detail" onClick={() => handleOpenDetail(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit aset" onClick={() => handleOpenEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus aset" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionButton>
                </>
              )}
              columns={[
                { key: 'no', label: '#', className: 'w-[56px]', render: (value) => <span className="font-medium text-slate-700">{value ?? 1}</span> },
                {
                  key: 'bentukAset',
                  label: 'Bentuk Aset',
                  render: (_value, row) => <span className="text-slate-700">{row.bentukAset ?? row.bentuk_aset ?? '-'}</span>,
                },
                {
                  key: 'dasarHak',
                  label: 'Dasar Hak',
                  render: (_value, row) => <span className="text-slate-700">{row.dasarHak ?? row.dasar_hak ?? '-'}</span>,
                },
                {
                  key: 'atasNama',
                  label: 'Atas Nama',
                  render: (_value, row) => <span className="text-slate-700">{row.atasNama ?? row.atas_nama ?? '-'}</span>,
                },
                {
                  key: 'tahunPerolehan',
                  label: 'Tahun Perolehan',
                  render: (_value, row) => <span className="text-slate-700">{row.tahunPerolehan ?? row.tahun_perolehan ?? '-'}</span>,
                },
                {
                  key: 'jangkaWaktu',
                  label: 'Jangka Waktu',
                  render: (_value, row) => <span className="text-slate-700">{row.jangkaWaktu ?? row.jangka_waktu ?? '-'}</span>,
                },
                {
                  key: 'keterangan',
                  label: 'Keterangan',
                  render: (_value, row) => <span className="text-slate-700">{row.keterangan ?? '-'}</span>,
                },
                {
                  key: 'created_at',
                  label: 'Dibuat',
                  render: (_value, row) => <span className="text-slate-700">{row.created_at ?? row.dibuat ?? '-'}</span>,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
