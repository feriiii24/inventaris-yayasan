import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import SidebarPage from '../../components/SidebarPage'
import AnimatedSelect from '../../components/ui/AnimatedSelect'

const statusStyles = {
  Baik: { color: '#166534', bg: '#dcfce7' },
  'Rusak Ringan': { color: '#d97706', bg: '#fef3c7' },
  'Rusak Berat': { color: '#dc2626', bg: '#fee2e2' },
  'Dalam Perbaikan': { color: '#0369a1', bg: '#e0f2fe' },
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function DistribusiPage({ rows: initialRows = [] }: { rows?: Array<Record<string, any>> }) {
  const pageProps = (usePage().props as any) || {}
  const authUser = pageProps?.auth?.user ?? pageProps?.user ?? null
  const currentRole = String(authUser?.roleModel?.name ?? authUser?.role ?? 'super_admin').trim().toLowerCase()

  if (currentRole === 'admin_unit' || currentRole === 'adminunit') {
    return null
  }

  const unitRows = useMemo(() => {
    if (initialRows && initialRows.length > 0) {
      return initialRows.map((row) => ({
        id: row.id ?? row.unit_id ?? row.unitId ?? '',
        unit: row.unit ?? 'Lainnya',
        total: Number(row.total ?? 0),
        good: Number(row.good ?? 0),
        rusakRingan: Number(row.rusak_ringan ?? 0),
        rusakBerat: Number(row.rusak_berat ?? 0),
        dalamPerbaikan: Number(row.dalam_perbaikan ?? 0),
        damaged: Number(row.damaged ?? 0),
        percent: Number(row.percent ?? 0),
        status: row.status ?? 'Baik',
      }))
    }

    return []
  }, [initialRows])

  const totalAset = unitRows.reduce((sum, item) => sum + item.total, 0)
  const highestUnit = unitRows[0]
  const goodAssets = unitRows.reduce((sum, item) => sum + item.good, 0)
  const rusakRinganAssets = unitRows.reduce((sum, item) => sum + item.rusakRingan, 0)
  const rusakBeratAssets = unitRows.reduce((sum, item) => sum + item.rusakBerat, 0)
  const dalamPerbaikanAssets = unitRows.reduce((sum, item) => sum + item.dalamPerbaikan, 0)
  const damagedAssets = rusakRinganAssets + rusakBeratAssets + dalamPerbaikanAssets

  const goodPercent = totalAset ? ((goodAssets / totalAset) * 100) : 0
  const rusakRinganPercent = totalAset ? ((rusakRinganAssets / totalAset) * 100) : 0
  const rusakBeratPercent = totalAset ? ((rusakBeratAssets / totalAset) * 100) : 0
  const dalamPerbaikanPercent = totalAset ? ((dalamPerbaikanAssets / totalAset) * 100) : 0
  const damagedPercent = totalAset ? ((damagedAssets / totalAset) * 100) : 0

  const donutGradient = `conic-gradient(#16a34a 0 ${goodPercent}%, #f59e0b ${goodPercent}% ${goodPercent + rusakRinganPercent}%, #ef4444 ${goodPercent + rusakRinganPercent}% ${goodPercent + rusakRinganPercent + rusakBeratPercent}%, #0284c7 ${goodPercent + rusakRinganPercent + rusakBeratPercent}% 100%)`

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('total')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const filtered = unitRows.filter((row) => {
      const matchesSearch = !query || row.unit.toLowerCase().includes(query)
      const matchesStatus = !statusFilter || row.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === 'name') return a.unit.localeCompare(b.unit)
      return b.total - a.total
    })

    return sorted
  }, [searchTerm, sortBy, statusFilter, unitRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setSortBy('total')
    setCurrentPage(1)
  }

  return (
    <SidebarPage
      title=""
      subtitle=""
      currentPage='distribusi-unit'
    >
      <div className="w-full min-w-0 space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_22px_40px_rgba(5,150,105,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Overview</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Distribusi aset per unit</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-emerald-50 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              {unitRows.length} Unit terpantau
            </div>
          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: 'Total Aset',
              value: formatNumber(totalAset),
              note: '100% aset tercatat',
              accent: '#10b981',
              bg: '#ecfdf5',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
              color: '#166534',
            },
            {
              label: 'Aset Baik',
              value: formatNumber(goodAssets),
              note: `${goodPercent.toFixed(1)}% dari total`,
              accent: '#22c55e',
              bg: '#dcfce7',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
                </svg>
              ),
              color: '#166534',
            },
            {
              label: 'Rusak Ringan',
              value: formatNumber(rusakRinganAssets),
              note: `${rusakRinganPercent.toFixed(1)}% dari total`,
              accent: '#f59e0b',
              bg: '#fef3c7',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              ),
              color: '#b45309',
            },
            {
              label: 'Rusak Berat',
              value: formatNumber(rusakBeratAssets),
              note: `${rusakBeratPercent.toFixed(1)}% dari total`,
              accent: '#ef4444',
              bg: '#fee2e2',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              ),
              color: '#b91c1c',
            },
            {
              label: 'Dalam Perbaikan',
              value: formatNumber(dalamPerbaikanAssets),
              note: `${dalamPerbaikanPercent.toFixed(1)}% dari total`,
              accent: '#0284c7',
              bg: '#e0f2fe',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h2l3 8 4-16 3 8h6" />
                </svg>
              ),
              color: '#075985',
            },
          ].map((card) => (
            <div key={card.label} className="group relative min-h-[140px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-2 text-[12px] text-slate-500">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.75fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Performa unit</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <div className="relative min-w-[180px]">
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Cari unit..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                </div>

                <AnimatedSelect
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                  }}
                  options={['Baik', 'Rusak Ringan', 'Rusak Berat', 'Dalam Perbaikan']}
                  placeholder="Semua Status"
                  minWidth="180px"
                />

                <AnimatedSelect
                  value={sortBy === 'total' ? 'Urutkan: Aset Terbanyak' : 'Urutkan: Nama Unit'}
                  onChange={(value) => {
                    setSortBy(value === 'Urutkan: Nama Unit' ? 'name' : 'total')
                  }}
                  options={['Urutkan: Aset Terbanyak', 'Urutkan: Nama Unit']}
                  placeholder="Urutkan: Aset Terbanyak"
                  minWidth="180px"
                />

                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredRows.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18V8.5A2.5 2.5 0 016.5 6H10l2 3h5.5A2.5 2.5 0 0120 11.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-800">Belum ada data distribusi</p>
                    <p className="mt-1 text-sm text-slate-500">Data distribusi aset per unit akan muncul setelah unit memiliki aset.</p>
                  </div>
                </div>
              ) : (
                filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, index) => {
                  const rank = (currentPage - 1) * pageSize + index + 1
                  return (
                    <div key={item.unit} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-sm">
                      <div className="grid grid-cols-[auto_minmax(0,1.8fr)_minmax(0,1.4fr)_auto] items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[12px] font-semibold text-emerald-700">
                          {rank}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-slate-800">{item.unit}</div>
                          <div className="mt-0.5 text-[12px] text-slate-500">{item.total} aset tercatat</div>
                        </div>

                        <div className="min-w-0">
                          <div className="mb-1 flex items-center justify-between gap-2 text-[12px] text-slate-500">
                            <span>{item.total} aset</span>
                            <span className="whitespace-nowrap font-semibold text-slate-700">{item.percent}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>

                        <span className="text-[12px] font-semibold text-slate-600">{item.percent}%</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18M3 11h18" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Komposisi</p>
                <h3 className="text-lg font-semibold text-slate-800">Kondisi Aset</h3>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-4">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full shadow-inner" style={{ background: donutGradient }}>
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-lg ring-1 ring-slate-200">
                  <span className="text-[26px] font-bold tracking-tight text-slate-900">{formatNumber(totalAset)}</span>
                  <span className="text-[11px] font-medium text-slate-500">Total aset</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                {[
                  { label: 'Aset Baik', value: goodAssets, percent: goodPercent, color: 'bg-emerald-500' },
                  { label: 'Rusak Ringan', value: rusakRinganAssets, percent: rusakRinganPercent, color: 'bg-amber-500' },
                  { label: 'Rusak Berat', value: rusakBeratAssets, percent: rusakBeratPercent, color: 'bg-red-500' },
                  { label: 'Dalam Perbaikan', value: dalamPerbaikanAssets, percent: dalamPerbaikanPercent, color: 'bg-sky-600' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-[13px] font-medium text-slate-600">{item.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-slate-800">{formatNumber(item.value)} • {item.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Detail</p>
              <h3 className="text-lg font-semibold text-slate-800">Detail Distribusi per Unit</h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {filteredRows.length} Unit
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-600">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Total aset</th>
                  <th className="px-4 py-3">Baik</th>
                  <th className="px-4 py-3">Rusak Ringan</th>
                  <th className="px-4 py-3">Rusak Berat</th>
                  <th className="px-4 py-3">Dalam Perbaikan</th>
                  <th className="px-4 py-3">Persentase</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">Belum ada data distribusi</td>
                  </tr>
                ) : (
                  pagedRows.map((row, index) => {
                    const startIndex = (currentPage - 1) * pageSize
                    const goodPercentValue = row.total ? (row.good / row.total) * 100 : 0
                    const ringanPercentValue = row.total ? (row.rusakRingan / row.total) * 100 : 0
                    const beratPercentValue = row.total ? (row.rusakBerat / row.total) * 100 : 0
                    const perbaikanPercentValue = row.total ? (row.dalamPerbaikan / row.total) * 100 : 0

                    return (
                      <tr key={row.unit} className="border-t border-slate-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-50/80 hover:shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                        <td className="px-4 py-3 font-medium text-slate-600">{startIndex + index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{row.unit}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{row.total}</td>
                        <td className="px-4 py-3 font-medium text-emerald-600">{row.good} ({goodPercentValue.toFixed(1)}%)</td>
                        <td className="px-4 py-3 font-medium text-amber-600">{row.rusakRingan} ({ringanPercentValue.toFixed(1)}%)</td>
                        <td className="px-4 py-3 font-medium text-red-600">{row.rusakBerat} ({beratPercentValue.toFixed(1)}%)</td>
                        <td className="px-4 py-3 font-medium text-sky-600">{row.dalamPerbaikan} ({perbaikanPercentValue.toFixed(1)}%)</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap font-semibold text-slate-700">{row.percent}%</span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${row.percent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => router.visit(`/unit/${row.id}`)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>Menampilkan {Math.min(filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0, filteredRows.length)}–{Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} data</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt; Sebelumnya
              </button>

              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm"
              >
                {currentPage}
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Selanjutnya &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarPage>
  )
}
