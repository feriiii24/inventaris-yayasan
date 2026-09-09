import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../Layouts/DashboardLayout'
import AnimatedSelect from '../../components/ui/AnimatedSelect'

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

export default function CreateRuanganPage({ units = [], locations = [] }: { units?: Array<{ id: string; name: string }>; locations?: Array<{ id: string; name: string; unit_id?: string }> }) {
  const [form, setForm] = useState({
    name: '',
    unit_id: '',
    location_id: '',
    code: '',
    floor: '',
    description: '',
    status: 'aktif',
  })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  const handleChange = (field: string, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'unit_id') {
        next.location_id = ''
      }
      return next
    })
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    router.post('/master/ruangan', {
      name: form.name.trim(),
      unit_id: form.unit_id,
      location_id: form.location_id,
      code: form.code.trim(),
      floor: form.floor.trim(),
      description: form.description.trim(),
      status: form.status,
    }, {
      onSuccess: (page) => {
        const errors = (page as any)?.props?.errors ?? {}
        const hasErrors = Object.keys(errors).length > 0

        if (hasErrors) {
          const firstError = Object.values(errors)[0]
          const message = typeof firstError === 'string' ? firstError : 'Gagal menambahkan ruangan.'
          persistNotice({ type: 'error', message })
          return
        }

        persistNotice({ type: 'success', message: 'Ruangan berhasil ditambahkan.' })
        router.visit('/master/ruangan')
      },
      onError: (errors) => {
        const firstError = Object.values(errors ?? {})[0]
        const message = typeof firstError === 'string' ? firstError : 'Gagal menambahkan ruangan.'
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='master-ruangan'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="w-full space-y-6">
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
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Tambah Ruangan</h1>
                <p className="mt-1 text-sm text-emerald-50/80">Tambahkan ruangan baru dan hubungkan dengan unit serta lokasi.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.visit('/master/ruangan')}
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi utama</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Ruangan</h2>
            <p className="mt-1 text-sm text-slate-500">Isi informasi berikut dengan lengkap agar data mudah dikelola.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
            <AnimatedSelect value={form.unit_id} onChange={(value) => handleChange('unit_id', value)} options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))} placeholder="Pilih Unit" minWidth="100%" />
          </label>

          <label className="space-y-2 text-sm">
            <span className="block font-medium text-slate-700">Lokasi</span>
            <AnimatedSelect value={form.location_id} onChange={(value) => handleChange('location_id', value)} options={filteredLocations.map((location) => ({ value: String(location.id), label: location.name }))} placeholder="Pilih Lokasi" minWidth="100%" disabled={!form.unit_id} />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Kode Ruangan</span>
            <input
              value={form.code}
              onChange={(event) => handleChange('code', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Contoh: R-101"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Lantai</span>
            <input
              value={form.floor}
              onChange={(event) => handleChange('floor', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Contoh: 2"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="block font-medium text-slate-700">Status</span>
            <AnimatedSelect value={form.status} onChange={(value) => handleChange('status', value)} options={[{ value: 'aktif', label: 'Aktif' }, { value: 'full', label: 'Aktif & Full' }, { value: 'nonaktif', label: 'Nonaktif' }]} placeholder="Pilih Status" minWidth="100%" />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="block font-medium text-slate-700">Deskripsi</span>
            <textarea
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Masukkan keterangan ruangan"
            />
          </label>

          <div className="mt-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end md:col-span-2">
            <button type="button" onClick={() => router.visit('/master/ruangan')} className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">Batal</button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed"
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Ruangan'}
            </button>
          </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
