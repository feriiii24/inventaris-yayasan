import { router, usePage } from '@inertiajs/react'
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

export default function EditTidakBergerakPage({ asetTidakBergerak }: { asetTidakBergerak?: Record<string, any> }) {
  const initialForm = {
    bentuk_aset: asetTidakBergerak?.bentuk_aset ?? asetTidakBergerak?.bentukAset ?? '',
    dasar_hak: asetTidakBergerak?.dasar_hak ?? asetTidakBergerak?.dasarHak ?? '',
    atas_nama: asetTidakBergerak?.atas_nama ?? asetTidakBergerak?.atasNama ?? '',
    tahun_perolehan: asetTidakBergerak?.tahun_perolehan ?? asetTidakBergerak?.tahunPerolehan ?? '',
    jangka_waktu: asetTidakBergerak?.jangka_waktu ?? asetTidakBergerak?.jangkaWaktu ?? '',
    keterangan: asetTidakBergerak?.keterangan ?? '',
    foto: null as File | null,
    dokumen_pdf: null as File | null,
  }

  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [selectedDocumentName, setSelectedDocumentName] = useState('')

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aset-tidak-bergerak-toast')
      window.localStorage.setItem('aset-tidak-bergerak-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('aset-tidak-bergerak-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('aset-tidak-bergerak-toast')
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

    if (field === 'foto') {
      setSelectedImageName(file ? file.name : '')
    }

    if (field === 'dokumen_pdf') {
      setSelectedDocumentName(file ? file.name : '')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = new FormData()
    payload.append('_method', 'PUT')
    payload.append('bentuk_aset', form.bentuk_aset)
    if (form.dasar_hak) payload.append('dasar_hak', form.dasar_hak)
    if (form.atas_nama) payload.append('atas_nama', form.atas_nama)
    if (form.tahun_perolehan) payload.append('tahun_perolehan', form.tahun_perolehan)
    if (form.jangka_waktu) payload.append('jangka_waktu', form.jangka_waktu)
    if (form.keterangan) payload.append('keterangan', form.keterangan)
    if (form.foto) payload.append('foto', form.foto)
    if (form.dokumen_pdf) payload.append('dokumen_pdf', form.dokumen_pdf)

    router.post(`/inventaris/aset-tidak-bergerak/${asetTidakBergerak?.id}`, payload, {
      forceFormData: true,
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Aset tidak bergerak berhasil diperbarui.' })
        router.visit('/inventaris/aset-tidak-bergerak')
      },
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        const message = firstError ?? 'Gagal memperbarui aset tidak bergerak.'
        setError(message)
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  return (
    <DashboardLayout role={layoutRole} currentPage='asset-tidak-bergerak'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Properti</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit Aset Tidak Bergerak</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit(`/inventaris/aset-tidak-bergerak/${asetTidakBergerak?.id}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
          </div>
        </div>

        <div className="w-full">
          <div className="flex w-full flex-wrap gap-3">
            <div className="group relative min-h-[118px] min-w-[180px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Bentuk aset</div>
                  <div className="mt-2 text-lg font-bold tracking-tight text-slate-900 break-all">{form.bentuk_aset || '-'}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V7.5A2.5 2.5 0 015.5 5H9l2 3h7.5A2.5 2.5 0 0121 10.5V21M3 21h18" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group relative min-h-[118px] min-w-[180px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dasar hak</div>
                  <div className="mt-2 text-lg font-bold tracking-tight text-slate-900 break-all">{form.dasar_hak || '-'}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10H7zM9 9h6v6H9z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group relative min-h-[118px] min-w-[180px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-violet-500" />
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tahun perolehan</div>
                  <div className="mt-2 text-lg font-bold tracking-tight text-slate-900">{form.tahun_perolehan || '-'}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
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
                    <h2 className="text-base font-semibold text-slate-900">Data aset</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Bentuk Aset</span>
                    <input
                      value={form.bentuk_aset}
                      onChange={(event) => updateField('bentuk_aset', event.target.value)}
                      required
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Dasar Hak</span>
                    <input
                      value={form.dasar_hak}
                      onChange={(event) => updateField('dasar_hak', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Atas Nama</span>
                    <input
                      value={form.atas_nama}
                      onChange={(event) => updateField('atas_nama', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Tahun Perolehan</span>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={form.tahun_perolehan}
                      onChange={(event) => updateField('tahun_perolehan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Jangka Waktu</span>
                    <input
                      value={form.jangka_waktu}
                      onChange={(event) => updateField('jangka_waktu', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
                    <h2 className="text-base font-semibold text-slate-900">Dokumen aset</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Foto / Gambar</span>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3.5 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/40">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleFileChange('foto', event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                      />
                      {selectedImageName && (
                        <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedImageName}</p>
                      )}
                    </div>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Dokumen PDF</span>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3.5 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/40">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(event) => handleFileChange('dokumen_pdf', event.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                      />
                      {selectedDocumentName && (
                        <p className="mt-2 text-xs text-slate-500">Terpilih: {selectedDocumentName}</p>
                      )}
                    </div>
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Keterangan</span>
                    <textarea
                      value={form.keterangan}
                      onChange={(event) => updateField('keterangan', event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-2 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.visit(`/inventaris/aset-tidak-bergerak/${asetTidakBergerak?.id}`)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(22,101,52,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
