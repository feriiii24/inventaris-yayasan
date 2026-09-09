import { router, usePage } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value || '-'}</p>
    </div>
  )
}

export default function UnitShowPage({ unit }: { unit?: Record<string, any> }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const data = unit ?? {
    id: '-',
    code: '-',
    name: '-',
    leader_name: '-',
    type: '-',
    address: '-',
    status: '-',
    created_at: '-',
    updated_at: '-',
  }

  const statusStyle = {
    aktif: { bg: '#dcfce7', color: '#166534' },
    nonaktif: { bg: '#f1f5f9', color: '#475569' },
    'perlu_review': { bg: '#fef3c7', color: '#b45309' },
    'perlu review': { bg: '#fef3c7', color: '#b45309' },
  }[String(data.status ?? '').toLowerCase()] ?? { bg: '#f1f5f9', color: '#475569' }

  const summaryCards = [
    {
      label: 'Kode unit',
      value: String(data.code ?? '-'),
      accent: '#10b981',
      bg: '#ecfdf5',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10M5 7h.01M5 12h.01M5 17h.01" />
        </svg>
      ),
    },
    {
      label: 'Kepala unit',
      value: String(data.leader_name ?? '-'),
      accent: '#3b82f6',
      bg: '#dbeafe',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
        </svg>
      ),
    },
    {
      label: 'Tipe unit',
      value: String(data.type ?? '-'),
      accent: '#8b5cf6',
      bg: '#ede9fe',
      color: '#6d28d9',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7a2 2 0 012-2h12a2 2 0 012 2v12M9 7V4m6 3V4M8 11h8M8 15h8" />
        </svg>
      ),
    },
    {
      label: 'Status',
      value: String(data.status ?? '-'),
      accent: '#f59e0b',
      bg: '#fef3c7',
      color: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage='daftar-unit'>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Unit</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Detail Unit</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/unit')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>
              <button
                type="button"
                onClick={() => router.visit(`/unit/${data.id}/edit`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Unit
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative min-h-[118px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-base font-bold tracking-tight text-slate-900 break-words">{String(card.value || '-')}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr,0.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a2 2 0 011.414.586l5.414 5.414A2 2 0 0119 9.414V17a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ringkasan</p>
                <h2 className="text-base font-semibold text-slate-900">Informasi unit</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Nama unit</p>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{String(data.name || '-')}</h3>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {String(data.status || '-')}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Kode Unit" value={String(data.code ?? '-')} />
                <InfoCard label="Tipe" value={String(data.type ?? '-')} />
                <InfoCard label="Kepala Unit" value={String(data.leader_name ?? '-')} />
                <InfoCard label="Dibuat" value={String(data.created_at ?? '-')} />
                <InfoCard label="Diperbarui" value={String(data.updated_at ?? '-')} />
                <InfoCard label="ID" value={String(data.id ?? '-')} />
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-6-10A6 6 0 0118 11c0 5.65-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Alamat unit</h3>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{String(data.address || 'Belum ada alamat untuk unit ini.')}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Dokumen & catatan</h3>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Belum ada lampiran atau dokumen pendukung untuk unit ini.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
