import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../Layouts/DashboardLayout'

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

export default function EditLokasiPage({ lokasi, units = [] }: { lokasi?: Record<string, any>; units?: Array<{ id: string; name: string }> }) {
  const initialValues = {
    name: lokasi?.name ?? '',
    description: lokasi?.description ?? '',
    unit_id: lokasi?.unit_id ? String(lokasi.unit_id) : '',
    status: lokasi?.status ?? 'aktif',
  }

  const [form, setForm] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedAttachmentName, setSelectedAttachmentName] = useState('')
  const uniqueUnits = useMemo(() => Array.from(new Map(
    units
      .map((unit) => ({ ...unit, name: String(unit.name ?? '').trim() }))
      .filter((unit) => unit.name.length > 0)
      .map((unit) => [unit.name.toLocaleLowerCase(), unit]),
  ).values()), [units])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('location-toast')
      window.localStorage.setItem('location-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    const payload = {
      ...form,
      unit_id: form.unit_id || '',
    }

    router.put(`/master/lokasi/${lokasi?.id}`, payload, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Lokasi berhasil diubah.' })
        router.visit('/master/lokasi')
      },
      onError: () => {
        persistNotice({ type: 'error', message: 'Gagal memperbarui lokasi. Periksa kembali data yang diisi.' })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const summaryCards = [
    { label: 'Status', value: form.status === 'aktif' ? 'Aktif' : 'Nonaktif', accent: '#166534', icon: 'status' },
    { label: 'Unit', value: units.find((item) => String(item.id) === String(form.unit_id))?.name ?? 'Belum ditentukan', accent: '#2563eb', icon: 'unit' },
    { label: 'Alamat', value: form.description ? 'Tercatat' : 'Belum ada', accent: '#7c3aed', icon: 'map' },
  ]

  return (
    <DashboardLayout role='super_admin' currentPage='master-lokasi'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.5s-7-4.35-7-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3c0 6.15-7 10.5-7 10.5z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Master data</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Edit Lokasi</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.visit(`/master/lokasi/${lokasi?.id}`)}
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          </div>
        </div>

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
                  {card.icon === 'status' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {card.icon === 'unit' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A1.5 1.5 0 015.5 6H9V3h6v3h3.5A1.5 1.5 0 0120 7.5V19M7 10h10M7 14h10M7 18h10" /></svg>
                  )}
                  {card.icon === 'map' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l-5 2V5l5-2 6 2 5-2v14l-5 2-6-2zM9 5v12M15 7v12" /></svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi utama</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Lokasi</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="block font-medium text-slate-700">Nama Lokasi</span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan nama lokasi"
                />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="block font-medium text-slate-700">Alamat</span>
                <textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan alamat lengkap lokasi"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Unit</span>
                <select
                  value={form.unit_id}
                  onChange={(event) => handleChange('unit_id', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Pilih Unit</option>
                  {uniqueUnits.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dokumen</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-800">Lampiran Lokasi</h2>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0118.08 9.3 4 4 0 0118 16H7zm5-8v6m0 0l2.5-2.5M12 14L9.5 11.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Klik untuk unggah dokumen atau denah lokasi</p>
                  <p className="mt-1 text-xs text-slate-500">PNG, JPG, PDF atau file pendukung lainnya</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setSelectedAttachmentName(event.target.files?.[0]?.name ?? '')}
                />
                <span className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  {selectedAttachmentName ? selectedAttachmentName : 'Pilih File'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-sm text-slate-500">
              {lokasi?.name ? `Memperbarui data untuk ${lokasi.name}` : 'Pastikan semua informasi sudah benar sebelum disimpan.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/master/lokasi')}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
