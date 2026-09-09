import { router, usePage } from '@inertiajs/react'
import { useMemo } from 'react'
import DashboardLayout from '../../../Layouts/DashboardLayout'

type MutationDetail = {
  id: string
  asset_id: string
  asset_name: string
  asset_code: string
  movement_type: string
  from_unit: string
  to_unit: string
  from_location: string
  to_location: string
  from_room: string
  to_room: string
  reference_number: string
  mutation_date: string
  notes: string
  status: string
  created_at: string
  updated_at: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
  sukses: { bg: '#dcfce7', color: '#166534' },
  selesai: { bg: '#dcfce7', color: '#166534' },
  proses: { bg: '#dbeafe', color: '#1d4ed8' },
  gagal: { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ label }: { label: string }) {
  const normalized = (label ?? '').toLowerCase()
  const style = statusColors[normalized] ?? { bg: '#f1f5f9', color: '#475569' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {label || 'Proses'}
    </span>
  )
}

export default function ShowMutationPage({ mutation }: { mutation?: MutationDetail }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const detail = mutation ?? {
    id: '',
    asset_id: '',
    asset_name: '-',
    asset_code: '-',
    movement_type: 'Pemindahan Unit',
    from_unit: '-',
    to_unit: '-',
    from_location: '-',
    to_location: '-',
    from_room: '-',
    to_room: '-',
    reference_number: '-',
    mutation_date: '-',
    notes: '-',
    status: 'proses',
    created_at: '-',
    updated_at: '-',
  }

  const summaryCards = useMemo(
    () => [
      {
        label: 'Jenis Mutasi',
        value: detail.movement_type,
        detail: 'Tipe Perpindahan',
        accent: '#10b981',
        bg: '#ecfdf5',
        color: '#166534',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
        ),
      },
      {
        label: 'Status',
        value: detail.status,
        detail: 'Status saat ini',
        accent: '#2563eb',
        bg: '#dbeafe',
        color: '#1d4ed8',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: 'Tanggal',
        value: detail.mutation_date,
        detail: 'Tanggal mutasi',
        accent: '#f59e0b',
        bg: '#fef3c7',
        color: '#b45309',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
    [detail],
  )

  const statusText = (detail.status ?? 'proses').toLowerCase()
  const statusDisplay = statusText === 'sukses' || statusText === 'selesai' ? 'Sukses' : statusText === 'gagal' || statusText === 'ditolak' ? 'Gagal' : 'Proses'

  return (
    <DashboardLayout role={layoutRole} currentPage="mutasi-aset">
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(16,185,129,0.22)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Detail</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Mutasi Aset</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit(`/mutasi/${detail.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => router.visit('/mutasi')}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: card.color + '55' }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.color }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: card.color }}>{card.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {card.label === 'Status' ? statusDisplay : card.value}
                  </div>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.color + '18', color: card.color, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: card.color }}>{card.detail}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Mutasi</p>
                <div className="mt-1 text-sm font-mono text-slate-500">{detail.reference_number}</div>
              </div>
              <StatusBadge label={statusDisplay} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Nama aset</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.asset_name}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Kode aset</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.asset_code}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Jenis mutasi</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.movement_type}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tanggal mutasi</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{detail.mutation_date}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Catatan</div>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{detail.notes}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Rute</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-800">Lokasi & Unit</h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Unit asal</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.from_unit}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Unit tujuan</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.to_unit}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Lokasi asal</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.from_location}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Lokasi tujuan</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.to_location}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Ruangan asal</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.from_room}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Ruangan tujuan</p>
                  <p className="mt-2 text-base font-semibold text-slate-800">{detail.to_room}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lampiran</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-800">Dokumen pendukung</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                  {detail.reference_number === '-' ? 'Belum ada' : 'Tersedia'}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0117.42 8 4.5 4.5 0 0117 18H7zm5-8v5m0 0l-2-2m2 2l2-2" />
                  </svg>
                  Area upload / lampiran dokumen mutasi
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Audit</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-800">Metadata</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Dibuat</span>
                  <span className="font-medium text-slate-800">{detail.created_at}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">Diubah</span>
                  <span className="font-medium text-slate-800">{detail.updated_at}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-slate-500">ID Mutasi</span>
                  <span className="font-medium text-slate-800">#{detail.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
