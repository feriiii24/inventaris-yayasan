import { router } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'
import AssetPageTable from '../../components/AssetPageTable'

type Room = {
  id: string
  nama: string
  kode: string
  status: string
}

function InfoCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
      {count && <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{count}</span>}
    </div>
  )
}

export default function DetailLokasiPage({ lokasi }: { lokasi?: Record<string, any> }) {
  const data = lokasi ?? {
    id: '-',
    nama: '-',
    alamat: '-',
    unit: '-',
    status: '-',
    created_at: '-',
    updated_at: '-',
  }
  const rooms: Room[] = Array.isArray(data.rooms) ? data.rooms : []
  const displayRooms = rooms.map((room, index) => ({ ...room, nomor: String(index + 1).padStart(2, '0') }))
  const isActive = data.status === 'Aktif'

  const summaryCards = [
    { label: 'Nama Lokasi', value: data.nama, accent: '#166534' },
    { label: 'Unit Pengelola', value: data.unit, accent: '#2563eb' },
    { label: 'Status Lokasi', value: data.status, accent: '#7c3aed' },
  ]

  return (
    <DashboardLayout role="super_admin" currentPage="master-lokasi">
      <div className="w-full space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-5 py-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.18)] sm:px-8 sm:py-7">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 20.5s-7-4.35-7-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3c0 6.15-7 10.5-7 10.5z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Master Data / Lokasi</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Detail Lokasi</h1>
                <p className="mt-1 text-sm text-emerald-50">{data.nama}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.visit('/master/lokasi')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Kembali
              </button>
              <button type="button" onClick={() => router.visit(`/master/lokasi/${data.id}/edit`)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.5 16.5 8 17l.5-3.5L17.586 5.586z" /></svg>
                Edit Lokasi
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="truncate text-lg font-bold tracking-tight text-slate-900">{card.value}</p>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: card.accent }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading eyebrow="Informasi utama" title="Data Lokasi" />
            <div className="space-y-3">
              <InfoCard label="Alamat / Deskripsi" value={data.alamat} accent="#7c3aed" />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label="ID Lokasi" value={String(data.id)} accent="#f59e0b" />
                <InfoCard label="Status" value={data.status} accent={isActive ? '#16a34a' : data.status === 'Aktif & Full' ? '#d97706' : '#dc2626'} />
                <InfoCard label="Dibuat" value={data.created_at} accent="#0ea5e9" />
                <InfoCard label="Diperbarui" value={data.updated_at} accent="#f97316" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading eyebrow="Relasi lokasi" title="Ruangan di Lokasi Ini" count={`${rooms.length} Ruangan`} />
            <AssetPageTable
              rows={displayRooms}
              onRowClick={(room) => router.visit(`/master/ruangan/${room.id}`)}
              getRowClassName={() => 'hover:bg-emerald-50/40'}
              pageSize={10}
              pageSizeOptions={[10, 50, 'all']}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                {
                  key: 'nomor',
                  label: 'No',
                  className: 'w-16',
                  render: (value) => <span className="text-slate-400">{String(value ?? '-')}</span>,
                },
                {
                  key: 'nama',
                  label: 'Nama Ruangan',
                  render: (value) => <span className="font-semibold text-slate-900">{String(value ?? '-')}</span>,
                },
                {
                  key: 'kode',
                  label: 'Kode',
                  render: (value) => <span className="font-mono text-xs text-slate-500">{String(value ?? '-')}</span>,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value) => (
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${value === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {String(value ?? '-')}
                    </span>
                  ),
                },
              ]}
              emptyMessage={
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">Belum ada ruangan</p>
                  <p className="mt-1 text-xs text-slate-500">Ruangan yang terhubung dengan lokasi ini akan tampil di sini.</p>
                </div>
              }
            />
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
          <SectionHeading eyebrow="Dokumen" title="Lampiran Lokasi" />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0118.08 9.3 4 4 0 0118 16H7zm5-8v6m0 0l2.5-2.5M12 14L9.5 11.5" /></svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada lampiran untuk lokasi ini.</p>
            <p className="mt-1 text-xs text-slate-500">Dokumen atau denah lokasi dapat ditambahkan saat mengedit data.</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
