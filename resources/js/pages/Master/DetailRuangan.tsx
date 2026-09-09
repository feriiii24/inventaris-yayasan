import { router } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'
import AssetPageTable from '../../components/AssetPageTable'

type Asset = {
  id: string
  kode: string
  nama: string
  jumlah: number
  kondisi: string
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

export default function DetailRuanganPage({ ruangan }: { ruangan?: Record<string, any> }) {
  const data = ruangan ?? {
    id: '-', nama: '-', location_id: '-', location_name: '-', unit_id: '-', unit_name: '-',
    kode: '-', lantai: '-', deskripsi: '-', status: '-', created_at: '-', updated_at: '-',
  }
  const assets: Asset[] = Array.isArray(data.assets) ? data.assets : []
  const displayAssets = assets.map((asset, index) => ({ ...asset, nomor: String(index + 1).padStart(2, '0') }))
  const isActive = data.status === 'Aktif'
  const summaryCards = [
    { label: 'Nama Ruangan', value: data.nama, accent: '#166534' },
    { label: 'Unit Pengelola', value: data.unit_name, accent: '#2563eb' },
    { label: 'Lokasi', value: data.location_name, accent: '#7c3aed' },
  ]

  return (
    <DashboardLayout role="super_admin" currentPage="master-ruangan">
      <div className="w-full space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-5 py-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.18)] sm:px-8 sm:py-7">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Master Data / Ruangan</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Detail Ruangan</h1>
                <p className="mt-1 text-sm text-emerald-50">{data.nama}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.visit('/master/ruangan')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20">← Kembali</button>
              <button type="button" onClick={() => router.visit(`/master/ruangan/${data.id}/edit`)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Edit Ruangan</button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
              <p className="mt-3 truncate text-lg font-bold tracking-tight text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading eyebrow="Informasi utama" title="Data Ruangan" />
            <div className="space-y-3">
              <InfoCard label="Deskripsi" value={data.deskripsi} accent="#3b82f6" />
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard label="Kode Ruangan" value={data.kode} accent="#0ea5e9" />
                <InfoCard label="Lantai" value={data.lantai} accent="#f97316" />
                <InfoCard label="Status" value={data.status} accent={isActive ? '#16a34a' : data.status === 'Aktif & Full' ? '#d97706' : '#dc2626'} />
                <InfoCard label="ID Ruangan" value={String(data.id)} accent="#f59e0b" />
                <InfoCard label="Dibuat" value={data.created_at} accent="#14b8a6" />
                <InfoCard label="Diperbarui" value={data.updated_at} accent="#f97316" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
            <SectionHeading eyebrow="Relasi ruangan" title="Aset di Ruangan Ini" count={`${assets.length} Aset`} />
            <AssetPageTable
              rows={displayAssets}
              pageSize={10}
              pageSizeOptions={[10, 50, 'all']}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              columns={[
                { key: 'nomor', label: 'No', className: 'w-16', render: (value) => <span className="text-slate-400">{String(value ?? '-')}</span> },
                { key: 'kode', label: 'Kode Aset', render: (value) => <span className="font-mono text-xs text-slate-500">{String(value ?? '-')}</span> },
                { key: 'nama', label: 'Nama Aset', render: (value) => <span className="font-semibold text-slate-900">{String(value ?? '-')}</span> },
                { key: 'jumlah', label: 'Jumlah', render: (value) => <span className="font-semibold text-slate-700">{String(value ?? 0)}</span> },
                { key: 'kondisi', label: 'Kondisi', render: (value) => <span className="text-slate-600">{String(value ?? '-')}</span> },
              ]}
              emptyMessage={
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">Belum ada aset</p>
                  <p className="mt-1 text-xs text-slate-500">Aset yang ditempatkan di ruangan ini akan tampil di sini.</p>
                </div>
              }
            />
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
