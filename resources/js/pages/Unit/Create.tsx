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

export default function UnitCreatePage() {
  const [form, setForm] = useState({
    code: '',
    name: '',
    leader_name: '',
    type: '',
    address: '',
    status: 'aktif',
  })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('unit-toast', JSON.stringify(nextNotice))
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

    router.post('/unit', form, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Unit berhasil ditambah.' })
        router.visit('/unit')
      },
      onError: () => {
        persistNotice({ type: 'error', message: 'Gagal menambahkan unit.' })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='daftar-unit'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: '#0f172a' }}>Tambah Unit</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Buat data unit baru untuk yayasan.</p>
          </div>
          <button
            type="button"
            onClick={() => router.visit('/unit')}
            className="rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: '#e2e8f0', color: '#475569' }}
          >
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Kode Unit</span>
            <input value={form.code} onChange={(event) => handleChange('code', event.target.value)} required className="h-11 w-full rounded-xl border px-3 outline-none" style={{ borderColor: '#e2e8f0' }} />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Nama Unit</span>
            <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required className="h-11 w-full rounded-xl border px-3 outline-none" style={{ borderColor: '#e2e8f0' }} />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Kepala Unit</span>
            <input value={form.leader_name} onChange={(event) => handleChange('leader_name', event.target.value)} className="h-11 w-full rounded-xl border px-3 outline-none" style={{ borderColor: '#e2e8f0' }} />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Tipe Unit</span>
            <input value={form.type} onChange={(event) => handleChange('type', event.target.value)} className="h-11 w-full rounded-xl border px-3 outline-none" style={{ borderColor: '#e2e8f0' }} />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Alamat</span>
            <textarea value={form.address} onChange={(event) => handleChange('address', event.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 outline-none" style={{ borderColor: '#e2e8f0' }} />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Status</span>
            <select value={form.status} onChange={(event) => handleChange('status', event.target.value)} className="h-11 w-full rounded-xl border px-3 outline-none" style={{ borderColor: '#e2e8f0' }}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="perlu_review">Perlu Review</option>
            </select>
          </label>

          <div className="md:col-span-2 mt-2 flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white" style={{ background: '#166534', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Menyimpan...' : 'Simpan Unit'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
