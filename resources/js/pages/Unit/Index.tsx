import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

const statusColors: Record<string, { bg: string; color: string }> = {
  Aktif: { bg: '#dcfce7', color: '#166534' },
  'Perlu Review': { bg: '#fef3c7', color: '#b45309' },
  'Tidak Aktif': { bg: '#f1f5f9', color: '#475569' },
  Nonaktif: { bg: '#f1f5f9', color: '#475569' },
}

const SelectField = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}) => (
  <AnimatedSelect
    value={value}
    onChange={onChange}
    options={options}
    placeholder={placeholder}
    minWidth="150px"
    className="min-w-[150px] flex-1"
  />
)

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

export default function UnitIndexPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const [rows, setRows] = useState<Array<Record<string, any>>>(initialRows)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ tipe: '', status: '', pageSize: '10' })
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  const pageSizeValue = Math.max(10, Number(filters.pageSize) || 10)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  useEffect(() => {
    const saved = window.localStorage.getItem('unit-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('unit-toast')
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
      tipe: makeStringOptions(rows.map((row) => row.tipe)),
      status: makeStringOptions(rows.map((row) => row.status)),
    }
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.namaUnit, row.kepalaUnit, row.tipe].join(' ').toLowerCase()
      const matchesQuery = !query || haystack.includes(query)
      const matchesTipe = !filters.tipe || row.tipe === filters.tipe
      const matchesStatus = !filters.status || row.status === filters.status

      return matchesQuery && matchesTipe && matchesStatus
    })
  }, [rows, searchTerm, filters])

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({ tipe: '', status: '', pageSize: '10' })
  }

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('unit-toast')
      window.localStorage.setItem('unit-toast', JSON.stringify(nextNotice))
    }
  }

  const summaryCards = [
    {
      label: 'Total Unit',
      value: String(rows.length),
      subtitle: 'Semua unit terdaftar',
      accent: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
        </svg>
      ),
    },
    {
      label: 'Unit Aktif',
      value: String(rows.filter((row) => String(row.status ?? '').toLowerCase() === 'aktif').length),
      subtitle: 'Unit yang aktif beroperasi',
      accent: '#20a162',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      ),
    },
    {
      label: 'Perlu Review',
      value: String(rows.filter((row) => String(row.status ?? '').toLowerCase() === 'perlu review').length),
      subtitle: 'Butuh perhatian lebih',
      accent: '#d97706',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Jenis Unit',
      value: String(new Set(rows.map((row) => String(row.tipe ?? 'Lainnya')).filter(Boolean)).size),
      subtitle: 'Variasi tipe unit',
      accent: '#2563eb',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10M5 7h.01M5 12h.01M5 17h.01" />
        </svg>
      ),
    },
  ]

  const handleDelete = (row: Record<string, any>) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    router.delete(`/unit/${deleteTarget.id}`, {
      onSuccess: () => {
        setRows((current) => current.filter((item) => item.id !== deleteTarget.id))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Unit berhasil dihapus.' })
        router.visit('/unit')
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus unit.' })
        router.visit('/unit')
      },
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='daftar-unit'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Yayasan</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Daftar Unit</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/unit/create')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Unit
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative min-h-[128px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
                  <p className="mt-3 text-3xl font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${card.accent}1A`, color: card.accent }}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{card.subtitle}</p>
            </div>
          ))}
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
                  <h3 className="text-lg font-semibold text-slate-800">Hapus Unit</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{deleteTarget.namaUnit ?? deleteTarget.name ?? 'unit'}</span>?
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

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Data Unit</h2>
                <p className="mt-1 text-xs text-slate-500">Ringkasan unit yayasan yang aktif dan terdata</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/unit/create')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[13px] font-semibold text-white shadow-[0_12px_20px_rgba(22,101,52,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Unit
            </button>
          </div>

          <div className="mt-4">
            <AssetPageTable
              title=""
              subtitle=""
              rows={filteredRows}
              pageSize={pageSizeValue}
              emptyMessage="Data tidak ditemukan"
              emptyContent={
                rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#ecfdf5', color: '#166534' }}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Belum ada data unit</p>
                      <p className="mt-1 text-xs" style={{ color: '#64748b' }}>Unit yayasan yang ditambahkan akan muncul di sini.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.visit('/unit/create')}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-medium text-white"
                      style={{ background: '#166534' }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Unit
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#ecfdf5', color: '#166534' }}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Data tidak ditemukan</p>
                      <p className="mt-1 text-xs" style={{ color: '#64748b' }}>Tidak ada unit yang sesuai dengan pencarian atau filter.</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-medium"
                      style={{ borderColor: '#bbf7d0', color: '#166534', background: '#ffffff' }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                      </svg>
                      Reset Filter
                    </button>
                  </div>
                )
              }
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              toolbar={(
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-[220px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari unit, kepala unit, tipe..."
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

                  <SelectField
                    value={filters.tipe}
                    onChange={(value) => setFilters((prev) => ({ ...prev, tipe: value }))}
                    options={filterOptions.tipe}
                    placeholder="Semua Tipe"
                  />

                  <SelectField
                    value={filters.status}
                    onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                    options={filterOptions.status}
                    placeholder="Semua Status"
                  />

                  <AnimatedSelect
                    value={filters.pageSize}
                    onChange={(value) => setFilters((prev) => ({ ...prev, pageSize: String(Math.max(10, Number(value) || 10)) }))}
                    options={['10', '25', '50']}
                    placeholder="10"
                    minWidth="120px"
                    className="min-w-[120px]"
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
                  <ActionButton title="Lihat Detail" onClick={() => router.visit(`/unit/${row.id}`)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit Unit" onClick={() => router.visit(`/unit/${row.id}/edit`)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus Unit" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionButton>
                </>
              )}
              columns={[
                { key: 'no', label: '#', className: 'w-[52px]' },
                { key: 'namaUnit', label: 'Nama Unit', className: 'w-[210px]', render: (value) => <span className="text-[13px] font-semibold" style={{ color: '#0f172a' }}>{String(value ?? '-')}</span> },
                { key: 'kepalaUnit', label: 'Kepala Unit', className: 'w-[170px]' },
                { key: 'tipe', label: 'Tipe', className: 'w-[140px]' },
                { key: 'alamat', label: 'Alamat Unit', className: 'w-[220px]' },
                { key: 'status', label: 'Status', className: 'w-[120px]', render: (value) => <StatusBadge value={String(value ?? 'Tidak Aktif')} /> },
                { key: 'created_at', label: 'Dibuat', className: 'w-[110px] whitespace-nowrap' },
                { key: 'updated_at', label: 'Diperbarui', className: 'w-[120px] whitespace-nowrap' },
              ]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
