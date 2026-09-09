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
  bentuk_usaha: '',
  lokasi: '',
  pengelola: '',
  mulai_operasional: '',
  dasar_perjanjian: '',
  gambar: null as File | null,
  dokumen: null as File | null,
  keterangan: '',
}

function formatNotice(type: 'success' | 'error', message: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('usaha-yayasan-toast', JSON.stringify({ type, message }))
}

export default function CreateUsahaYayasanPage() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [selectedDocumentName, setSelectedDocumentName] = useState('')

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('usaha-yayasan-toast')
      window.localStorage.setItem('usaha-yayasan-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('usaha-yayasan-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('usaha-yayasan-toast')
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

  const handleFileChange = (field: 'gambar' | 'dokumen', file: File | null) => {
    updateField(field, file)

    if (field === 'gambar') {
      setSelectedImageName(file ? file.name : '')
    }

    if (field === 'dokumen') {
      setSelectedDocumentName(file ? file.name : '')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = new FormData()
    payload.append('bentuk_usaha', form.bentuk_usaha)
    payload.append('lokasi', form.lokasi)
    payload.append('pengelola', form.pengelola)
    if (form.mulai_operasional) payload.append('mulai_operasional', form.mulai_operasional)
    if (form.dasar_perjanjian) payload.append('dasar_perjanjian', form.dasar_perjanjian)
    if (form.keterangan) payload.append('keterangan', form.keterangan)
    if (form.gambar) payload.append('gambar', form.gambar)
    if (form.dokumen) payload.append('dokumen', form.dokumen)

    router.post('/inventaris/usaha-yayasan', payload, {
      forceFormData: true,
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Usaha yayasan berhasil ditambahkan.' })
        router.visit('/inventaris/usaha-yayasan')
      },
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        const message = firstError ?? 'Gagal menambahkan usaha yayasan. Periksa kembali data Anda.'
        setError(message)
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const summaryCards = [
    { label: 'Bentuk usaha', value: form.bentuk_usaha || '-', accent: '#10b981', bg: '#ecfdf5', color: '#166534' },
    { label: 'Lokasi', value: form.lokasi || '-', accent: '#3b82f6', bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'Pengelola', value: form.pengelola || '-', accent: '#8b5cf6', bg: '#ede9fe', color: '#6d28d9' },
    { label: 'Mulai operasional', value: form.mulai_operasional || '-', accent: '#f59e0b', bg: '#fef3c7', color: '#b45309' },
  ]

  return (
    <DashboardLayout role='super_admin' currentPage='usaha-yayasan'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m9-6H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Yayasan</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Tambah Usaha Yayasan</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/inventaris/usaha-yayasan')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="group relative min-h-[118px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: card.accent }} />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                  <div className="mt-2 text-base font-bold tracking-tight text-slate-900 break-words">{card.value}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: card.bg, color: card.color }}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18M7 21V12h10v9" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m2-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi utama</p>
                    <h2 className="text-base font-semibold text-slate-900">Data usaha</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Bentuk Usaha</span>
                    <input
                      value={form.bentuk_usaha}
                      onChange={(event) => updateField('bentuk_usaha', event.target.value)}
                      required
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Contoh: Koperasi, Unit Produksi, Cafe"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Lokasi</span>
                    <input
                      value={form.lokasi}
                      onChange={(event) => updateField('lokasi', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Alamat / gedung / kawasan"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Pengelola</span>
                    <input
                      value={form.pengelola}
                      onChange={(event) => updateField('pengelola', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Nama pengelola"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Mulai Operasional</span>
                    <input
                      type="date"
                      value={form.mulai_operasional}
                      onChange={(event) => updateField('mulai_operasional', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Dasar Perjanjian</span>
                    <input
                      value={form.dasar_perjanjian}
                      onChange={(event) => updateField('dasar_perjanjian', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="SK / MoU / Peraturan"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M8 17H4m0 0l4-4m-4 4l4 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lampiran</p>
                    <h2 className="text-base font-semibold text-slate-900">Dokumen dan media</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Gambar / Image</span>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3.5 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/40">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handleFileChange('gambar', event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                      />
                      {selectedImageName && <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedImageName}</p>}
                    </div>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Dokumen PDF</span>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3.5 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/40">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(event) => handleFileChange('dokumen', event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                      />
                      {selectedDocumentName && <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedDocumentName}</p>}
                    </div>
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Keterangan</span>
                    <textarea
                      value={form.keterangan}
                      onChange={(event) => updateField('keterangan', event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Keterangan usaha yayasan"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.visit('/inventaris/usaha-yayasan')}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(22,101,52,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Usaha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
