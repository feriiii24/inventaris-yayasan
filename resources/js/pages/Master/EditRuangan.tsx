import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
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

export default function EditRuanganPage({ ruangan, locations = [], units = [] }: { ruangan?: Record<string, any>; locations?: Array<{ id: string; name: string; unit_id?: string }>; units?: Array<{ id: string; name: string }> }) {
  const initialValues = {
    name: ruangan?.name ?? '',
    location_id: ruangan?.location_id ? String(ruangan.location_id) : '',
    unit_id: ruangan?.unit_id ? String(ruangan.unit_id) : '',
    code: ruangan?.kode ?? '',
    floor: ruangan?.lantai ?? '',
    description: ruangan?.deskripsi ?? '',
    status: ['penuh', 'aktif_full'].includes(ruangan?.status) ? 'full' : (ruangan?.status ?? 'aktif'),
  }

  const [form, setForm] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const uniqueUnits = useMemo(() => Array.from(new Map(
    units
      .map((unit) => ({ ...unit, name: String(unit.name ?? '').trim() }))
      .filter((unit) => unit.name.length > 0)
      .map((unit) => [unit.name.toLocaleLowerCase(), unit]),
  ).values()), [units])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('room-toast')
      window.localStorage.setItem('room-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filteredLocations = useMemo(() => {
    if (!form.unit_id) return locations
    return locations.filter((location) => String(location.unit_id ?? '') === String(form.unit_id))
  }, [form.unit_id, locations])
  const uniqueLocations = useMemo(() => Array.from(new Map(
    filteredLocations
      .map((location) => ({ ...location, name: String(location.name ?? '').trim() }))
      .filter((location) => location.name.length > 0)
      .map((location) => [location.name.toLocaleLowerCase(), location]),
  ).values()), [filteredLocations])

  const handleChange = (field: string, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'unit_id') {
        const nextUnitId = String(value)
        const selectedLocation = locations.find((location) => String(location.id) === String(current.location_id))
        if (selectedLocation && String(selectedLocation.unit_id ?? '') !== nextUnitId) {
          next.location_id = ''
        }
      }

      if (field === 'location_id') {
        const selectedLocation = locations.find((location) => String(location.id) === String(value))
        if (selectedLocation && selectedLocation.unit_id) {
          next.unit_id = String(selectedLocation.unit_id)
        }
      }

      return next
    })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    const payload = {
      name: form.name.trim(),
      location_id: form.location_id || '',
      unit_id: form.unit_id || '',
      code: form.code.trim(),
      floor: form.floor.trim(),
      description: form.description.trim(),
      status: form.status,
    }

    router.put(`/master/ruangan/${ruangan?.id}`, payload, {
      onSuccess: (page) => {
        const errors = (page as any)?.props?.errors ?? {}
        const hasErrors = Object.keys(errors).length > 0

        if (hasErrors) {
          const firstError = Object.values(errors)[0]
          const message = typeof firstError === 'string' ? firstError : 'Gagal memperbarui ruangan.'
          persistNotice({ type: 'error', message })
          return
        }

        persistNotice({ type: 'success', message: 'Ruangan berhasil diperbarui.' })
        router.visit('/master/ruangan')
      },
      onError: (errors) => {
        const firstError = Object.values(errors ?? {})[0]
        const message = typeof firstError === 'string' ? firstError : 'Gagal memperbarui ruangan.'
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const summaryCards = [
    { label: 'Status', value: form.status === 'aktif' ? 'Aktif' : (form.status === 'full' ? 'Aktif & Full' : 'Nonaktif'), accent: '#166534', icon: 'status' },
    { label: 'Unit', value: units.find((item) => String(item.id) === String(form.unit_id))?.name ?? 'Belum ditentukan', accent: '#2563eb', icon: 'unit' },
    { label: 'Lokasi', value: filteredLocations.find((item) => String(item.id) === String(form.location_id))?.name ?? 'Belum ditentukan', accent: '#7c3aed', icon: 'map' },
  ]

  return (
    <DashboardLayout role='super_admin' currentPage='master-ruangan'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7.5A2.5 2.5 0 016.5 5H9l2 2h6.5A2.5 2.5 0 0120 9.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Master data</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Edit Ruangan</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.visit(`/master/ruangan/${ruangan?.id}`)}
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
                <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Ruangan</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="block font-medium text-slate-700">Nama Ruangan</span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan nama ruangan"
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
                  {uniqueUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Lokasi</span>
                <select
                  value={form.location_id}
                  onChange={(event) => handleChange('location_id', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  disabled={!form.unit_id}
                >
                  <option value="">Pilih Lokasi</option>
                  {uniqueLocations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Kode Ruangan</span>
                <input
                  value={form.code}
                  onChange={(event) => handleChange('code', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Contoh: R-101"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Lantai</span>
                <input
                  value={form.floor}
                  onChange={(event) => handleChange('floor', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Contoh: 2"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="block font-medium text-slate-700">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="aktif">Aktif</option>
                  <option value="full">Aktif &amp; Full</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="block font-medium text-slate-700">Deskripsi</span>
                <textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan deskripsi ruangan"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-sm text-slate-500">
              {ruangan?.name ? `Memperbarui data untuk ${ruangan.name}` : 'Pastikan semua informasi sudah benar sebelum disimpan.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/master/ruangan')}
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
