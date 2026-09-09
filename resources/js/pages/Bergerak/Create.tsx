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
          <p className="text-sm font-semibold" style={{ color: palette.text }}>{type === 'success' ? 'Berhasil' : 'Gagal'}</p>
          <p className="mt-1 text-sm" style={{ color: palette.text }}>{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium" style={{ color: palette.icon }} aria-label="Tutup notifikasi">
          ✕
        </button>
      </div>
    </div>
  )
}

const initialForm = {
  bentuk_aset: '',
  dasar_hak: '',
  atas_nama: '',
  tahun_perolehan: '',
  nomor_registrasi: '',
  foto: null as File | null,
  dokumen_pdf: null as File | null,
  keterangan: '',
}

export default function CreateBergerakPage() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [selectedDocumentName, setSelectedDocumentName] = useState('')

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aset-bergerak-toast')
      window.localStorage.setItem('aset-bergerak-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('aset-bergerak-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('aset-bergerak-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const updateField = (field: keyof typeof initialForm, value: string | File | null) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleFileChange = (field: 'foto' | 'dokumen_pdf', file: File | null) => {
    updateField(field, file)
    if (field === 'foto') setSelectedImageName(file ? file.name : '')
    if (field === 'dokumen_pdf') setSelectedDocumentName(file ? file.name : '')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = new FormData()
    payload.append('bentuk_aset', form.bentuk_aset)
    if (form.dasar_hak) payload.append('dasar_hak', form.dasar_hak)
    if (form.atas_nama) payload.append('atas_nama', form.atas_nama)
    if (form.tahun_perolehan) payload.append('tahun_perolehan', form.tahun_perolehan)
    if (form.nomor_registrasi) payload.append('nomor_registrasi', form.nomor_registrasi)
    if (form.keterangan) payload.append('keterangan', form.keterangan)
    if (form.foto) payload.append('foto', form.foto)
    if (form.dokumen_pdf) payload.append('dokumen_pdf', form.dokumen_pdf)

    router.post('/inventaris/aset-bergerak', payload, {
      forceFormData: true,
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Aset bergerak berhasil ditambahkan.' })
        router.visit('/inventaris/aset-bergerak')
      },
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        const message = firstError ?? 'Gagal menambahkan aset bergerak. Periksa kembali data Anda.'
        setError(message)
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='asset-bergerak'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: '#0f172a' }}>Tambah Aset Bergerak</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Isi data aset bergerak baru yang akan dikelola.</p>
          </div>
          <button
            type="button"
            onClick={() => router.visit('/inventaris/aset-bergerak')}
            className="rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: '#e2e8f0', color: '#475569', background: '#fff' }}
          >
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Bentuk Aset</span>
            <input
              value={form.bentuk_aset}
              onChange={(event) => updateField('bentuk_aset', event.target.value)}
              required
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Contoh: Kendaraan, Mesin, Elektronik"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Dasar Hak</span>
            <input
              value={form.dasar_hak}
              onChange={(event) => updateField('dasar_hak', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Hak Milik / Sertifikat / Lainnya"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Atas Nama</span>
            <input
              value={form.atas_nama}
              onChange={(event) => updateField('atas_nama', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Nama pemilik / yayasan"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Tahun Perolehan</span>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.tahun_perolehan}
              onChange={(event) => updateField('tahun_perolehan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="2024"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Nomor Registrasi</span>
            <input
              value={form.nomor_registrasi}
              onChange={(event) => updateField('nomor_registrasi', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="BRG-001 / No. Polisi / Nomor Seri"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Foto / Image</span>
            <div className="rounded-xl border border-dashed bg-slate-50 p-3" style={{ borderColor: '#cbd5e1' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange('foto', event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600"
              />
              {selectedImageName && (
                <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedImageName}</p>
              )}
            </div>
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Dokumen PDF</span>
            <div className="rounded-xl border border-dashed bg-slate-50 p-3" style={{ borderColor: '#cbd5e1' }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => handleFileChange('dokumen_pdf', event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600"
              />
              {selectedDocumentName && (
                <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedDocumentName}</p>
              )}
            </div>
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Keterangan</span>
            <textarea
              rows={4}
              value={form.keterangan}
              onChange={(event) => updateField('keterangan', event.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Catatan atau deskripsi aset..."
            />
          </label>

          {error && (
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" style={{ borderColor: '#fecaca' }}>
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.visit('/inventaris/aset-bergerak')}
              className="rounded-xl border px-4 py-2 text-sm font-medium"
              style={{ borderColor: '#e2e8f0', color: '#475569', background: '#fff' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: '#166534', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
