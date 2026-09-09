import { router } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

function InfoCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

export default function UserDetailPage({ user }: { user?: Record<string, any> }) {
  const data = user ?? {
    id: '-',
    name: '-',
    email: '-',
    role: '-',
    unit: '-',
    status: '-',
    created_at: '-',
    last_login: '-',
  }

  const summaryCards = [
    { label: 'Nama Pengguna', value: data.name, accent: '#166534' },
    { label: 'Email', value: data.email, accent: '#2563eb' },
    { label: 'Role', value: data.role, accent: '#7c3aed' },
  ]

  return (
    <DashboardLayout role='super_admin' currentPage='pengguna'>
      <div className="w-full space-y-6">
        {/* Premium Header */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Detail pengguna</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{data.name}</h1>
                <p className="mt-2 text-sm text-emerald-50">{data.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => router.visit('/pengguna')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
              <button
                type="button"
                onClick={() => router.visit(`/pengguna/${data.id}/edit`)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Pengguna
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                  <p className="mt-3 text-lg font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" style={{ background: `${card.accent}18`, color: card.accent }}>
                  {card.label === 'Nama Pengguna' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" /></svg>
                  )}
                  {card.label === 'Email' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  )}
                  {card.label === 'Role' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Information Section */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Akun Pengguna</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Status" value={data.status} accent="#f59e0b" />
            <InfoCard label="Unit Kerja" value={data.unit} accent="#0ea5e9" />
            <InfoCard label="Terdaftar" value={data.created_at} accent="#14b8a6" />
            <InfoCard label="Terakhir Login" value={data.last_login} accent="#8b5cf6" />
            <InfoCard label="ID Pengguna" value={String(data.id)} accent="#ef4444" />
          </div>
        </div>

        {/* Access Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Akses</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-800">Ringkasan Hak Akses</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Hak Akses</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">{data.role}</p>
              <p className="mt-2 text-[12px] text-slate-600">Role yang diberikan untuk akun ini</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-600" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Unit Kerja</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">{data.unit}</p>
              <p className="mt-2 text-[12px] text-slate-600">Unit atau divisi tempat bekerja</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-600 to-orange-600" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Status Akun</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">{data.status}</p>
              <p className="mt-2 text-[12px] text-slate-600">Status aktivasi akun pengguna</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
