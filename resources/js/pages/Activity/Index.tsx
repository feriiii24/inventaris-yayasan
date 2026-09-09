import { useEffect, useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import AssetPageTable from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

type ActivityRow = {
  id: string
  time: string
  user: string
  message: string
  type: 'Tambah' | 'Update' | 'Hapus' | 'Mutasi' | 'Pengajuan' | 'Approval' | 'Penolakan' | 'Laporan' | 'Dokumen' | 'Aktivitas'
}

const typeColors: Record<string, { bg: string; color: string }> = {
  Tambah: { bg: '#dcfce7', color: '#166534' },
  Update: { bg: '#dbeafe', color: '#1d4ed8' },
  Hapus: { bg: '#fee2e2', color: '#b91c1c' },
  Mutasi: { bg: '#dcfce7', color: '#166534' },
  Pengajuan: { bg: '#e0f2fe', color: '#0369a1' },
  Approval: { bg: '#fef3c7', color: '#b45309' },
  Penolakan: { bg: '#fee2e2', color: '#b91c1c' },
  Laporan: { bg: '#fee2e2', color: '#b91c1c' },
  Dokumen: { bg: '#f3e8ff', color: '#7c3aed' },
  Aktivitas: { bg: '#f1f5f9', color: '#475569' },
}

function TypeBadge({ value }: { value: string }) {
  const style = typeColors[value] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
  )
}

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada aktivitas' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Log aktivitas terbaru akan muncul di sini.'
            : 'Tidak ada aktivitas yang sesuai dengan pencarian atau filter.'}
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

export default function ActivityPage() {
  const { props: pageProps } = usePage() as any
  const authUser = pageProps?.auth?.user ?? pageProps?.user ?? null
  const currentRole = authUser?.roleModel?.name ?? authUser?.role ?? 'super_admin'

  useEffect(() => {
    if (String(currentRole).toLowerCase() === 'admin_unit') {
      router.visit('/dashboard')
    }
  }, [currentRole])

  if (String(currentRole).toLowerCase() === 'admin_unit') return null

  const serverActivities = (pageProps?.activities ?? []) as any[]

  const activities = useMemo(() => serverActivities.map((a) => ({
    id: String(a.id ?? ''),
    time: a.time ?? (a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'),
    user: a.user ?? a.user_name ?? (a.user?.name ?? 'Sistem'),
    message: a.message ?? a.description ?? a.note ?? '-',
    type: a.type ?? a.action ?? 'Aktivitas',
  })), [serverActivities])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('Semua Tipe')
  const [pageSize, setPageSize] = useState(10)

  const allTypes = useMemo(() => ['Semua Tipe', ...Array.from(new Set(activities.map((activity) => activity.type)))], [activities])

  const activityStats = useMemo(() => {
    const stats = {
      total: activities.length,
      typeDistribution: activities.reduce((acc: Record<string, number>, act) => {
        acc[act.type] = (acc[act.type] ?? 0) + 1
        return acc
      }, {}),
    }
    return stats
  }, [activities])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm.trim()) count++
    if (selectedType !== 'Semua Tipe') count++
    return count
  }, [searchTerm, selectedType])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return activities.filter((item) => {
      const haystack = [item.user, item.message, item.type].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesType = selectedType === 'Semua Tipe' || item.type === selectedType

      return matchesSearch && matchesType
    })
  }, [activities, searchTerm, selectedType])

  return (
    <DashboardLayout role={currentRole} currentPage='aktivitas'>
      <div className="w-full space-y-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-12 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)] sm:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold leading-tight">Aktivitas</h1>
                  <p className="mt-2 text-emerald-100">Log aktivitas pengguna dan sistem</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Aktivitas', value: activityStats.total, icon: 'activity', accent: 'from-emerald-500 to-teal-500' },
            { label: 'Tambah', value: activityStats.typeDistribution['Tambah'] ?? 0, icon: 'add', accent: 'from-green-500 to-emerald-500' },
            { label: 'Update', value: activityStats.typeDistribution['Update'] ?? 0, icon: 'edit', accent: 'from-blue-500 to-cyan-500' },
            { label: 'Hapus', value: activityStats.typeDistribution['Hapus'] ?? 0, icon: 'delete', accent: 'from-red-500 to-orange-500' },
          ].map((stat, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 100}ms backwards` }}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stat.accent}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white opacity-90`}>
                  {stat.icon === 'activity' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {stat.icon === 'add' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                  {stat.icon === 'edit' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  {stat.icon === 'delete' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Riwayat Aktivitas</h2>
                <p className="mt-1 text-sm text-slate-600">Log kegiatan terbaru di sistem</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari aktivitas..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <AnimatedSelect
                  value={selectedType}
                  onChange={setSelectedType}
                  options={allTypes.filter((type) => type !== 'Semua Tipe')}
                  placeholder="Semua Tipe"
                  minWidth="150px"
                  className="min-w-[150px]"
                />

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value={10}>10 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                  <option value={activities.length}>Semua</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedType('Semua Tipe')
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 focus:ring-2 focus:ring-emerald-100"
                >
                  Reset
                </button>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Filter aktif:</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 font-medium">
                    {activeFilterCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          <AssetPageTable
            rows={filteredRows}
            pageSize={pageSize}
            showTitle={false}
            showSearch={false}
            showAddButton={false}
            toolbar={null}
            columns={[
              { key: 'time', label: 'Waktu', className: 'w-[100px]' },
              {
                key: 'user',
                label: 'Pengguna',
                className: 'min-w-[180px]',
                render: (value: string | number | null | undefined) => (
                  <span className="text-sm font-semibold text-slate-800">{String(value ?? '-')}</span>
                ),
              },
              {
                key: 'message',
                label: 'Aktivitas',
                className: 'min-w-[340px]',
                render: (value: string | number | null | undefined) => (
                  <span className="text-sm text-slate-600">{String(value ?? '-')}</span>
                ),
              },
              {
                key: 'type',
                label: 'Tipe',
                className: 'min-w-[120px]',
                render: (value: string | number | null | undefined) => <TypeBadge value={String(value ?? 'Update')} />,
              },
            ]}
            emptyContent={
              activities.length === 0
                ? <EmptyState kind="empty" />
                : <EmptyState kind="filter" onReset={() => {
                  setSearchTerm('')
                  setSelectedType('Semua Tipe')
                }} />
            }
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
