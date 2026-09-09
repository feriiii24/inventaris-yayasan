import { router } from '@inertiajs/react'
import DashboardLayout from '../../Layouts/DashboardLayout'

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

export default function DetailKategoriPage({ kategori }: { kategori?: Record<string, any> }) {
  const data = kategori ?? {
    id: '-',
    nama: '-',
    deskripsi: '-',
    status: '-',
    created_at: '-',
    updated_at: '-',
  }

  return (
    <DashboardLayout role='super_admin' currentPage='master-kategori'>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5v8A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5v-11z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[22px] font-semibold text-slate-900">Detail Kategori</h1>
                <p className="mt-1 text-sm text-slate-500">{data.nama}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/master/kategori')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => router.visit('/master/kategori')}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm"
              >
                Edit Kategori
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Nama Kategori" value={data.nama} />
            <InfoCard label="Status" value={data.status} />
            <InfoCard label="Dibuat" value={data.created_at} />
            <InfoCard label="Diperbarui" value={data.updated_at} />
            <InfoCard label="ID Kategori" value={String(data.id)} />
            <InfoCard label="Deskripsi" value={data.deskripsi} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Ringkasan kategori</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nama</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{data.nama}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Status</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{data.status}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Deskripsi</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{data.deskripsi}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
