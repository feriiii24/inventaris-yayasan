import { router, usePage } from '@inertiajs/react'
import { useMemo } from 'react'
import DashboardLayout from '../../../Layouts/DashboardLayout'

type BorrowingDetail = {
  id: string
  asset_id: string
  asset_name: string
  asset_code: string
  quantity: number
  borrower_name: string
  borrower_names: string
  borrower_unit: string
  loan_date: string
  due_date: string
  return_date: string
  purpose: string
  notes: string
  status: string
  status_label: string
  created_at: string
  updated_at: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#dbeafe', color: '#1d4ed8' },
  dipinjam: { bg: '#e0f2fe', color: '#0369a1' },
  selesai: { bg: '#dcfce7', color: '#166534' },
  dikembalikan: { bg: '#dcfce7', color: '#166534' },
  ditolak: { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ label }: { label: string }) {
  const normalized = (label ?? '').toLowerCase()
  const style = statusColors[normalized] ?? { bg: '#f1f5f9', color: '#475569' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {label || 'Dipinjam'}
    </span>
  )
}

export default function ShowBorrowingPage({ borrowing }: { borrowing?: BorrowingDetail }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const detail = borrowing ?? {
    id: '',
    asset_id: '',
    asset_name: '-',
    asset_code: '-',
    quantity: 0,
    borrower_name: '-',
    borrower_names: '-',
    borrower_unit: '-',
    loan_date: '-',
    due_date: '-',
    return_date: '-',
    purpose: '-',
    notes: '-',
    status: 'dipinjam',
    status_label: 'Dipinjam',
    created_at: '-',
    updated_at: '-',
  }

  const summaryCards = useMemo(
    () => [
      {
        label: 'Status',
        value: detail.status_label,
        detail: 'Status saat ini',
        accent: '#10b981',
        bg: '#ffffff',
        color: '#166534',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: 'Jumlah',
        value: `${detail.quantity} unit`,
        detail: 'Total aset dipinjam',
        accent: '#2563eb',
        bg: '#ffffff',
        color: '#1d4ed8',
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        label: 'Tanggal Kembali',
        value: detail.return_date === '-' ? 'Belum ada' : detail.return_date,
        detail: 'Tanggal pengembalian',
        accent: '#f59e0b',
        bg: '#ffffff',
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

  const infoRows = [
    { label: 'ID Peminjaman', value: detail.id || '-' },
    { label: 'Nama Aset', value: detail.asset_name },
    { label: 'Kode Aset', value: detail.asset_code },
    { label: 'Peminjam', value: detail.borrower_name },
    { label: 'Unit Peminjam', value: detail.borrower_unit },
    { label: 'Tanggal Pinjam', value: detail.loan_date },
    { label: 'Tanggal Jatuh Tempo', value: detail.due_date },
    { label: 'Tanggal Kembali', value: detail.return_date },
    { label: 'Tujuan', value: detail.purpose },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage="peminjaman-aset">
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(16,185,129,0.22)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Detail</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Peminjaman Aset</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit(`/peminjaman/${detail.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                type="button"
                onClick={() => router.visit('/peminjaman')}
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
              className="group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: card.color + '55', background: card.bg }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.color }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: card.color }}>{card.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
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

        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi utama</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-800">Ringkasan peminjaman</h2>
              </div>
              <StatusBadge label={detail.status_label} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {infoRows.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Catatan</p>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {detail.notes === '-' ? 'Tidak ada catatan tambahan.' : detail.notes}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Meta</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>Dibuat</span>
                  <span className="font-medium text-slate-900">{detail.created_at}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Terakhir diubah</span>
                  <span className="font-medium text-slate-900">{detail.updated_at}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
