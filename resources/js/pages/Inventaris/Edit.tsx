import { router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
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

type InventarisRecord = {
  id: string
  tanggal_pembukuan?: string
  tanggalPembukuan?: string
  kode_aset?: string
  kodeAset?: string
  nama_aset?: string
  namaAset?: string
  spesifikasi?: string
  jumlah?: number | string
  jumlah_baik?: number | string
  jumlahBaik?: number | string
  jumlah_rusak_ringan?: number | string
  jumlahRusakRingan?: number | string
  jumlah_rusak_berat?: number | string
  jumlahRusakBerat?: number | string
  jumlah_dalam_perbaikan?: number | string
  jumlahDalamPerbaikan?: number | string
  satuan?: string
  asal_barang?: string
  asalBarang?: string
  tahun_pengadaan?: number | string
  tahunPengadaan?: number | string
  harga_perolehan?: number | string
  hargaPerolehan?: number | string
  kondisi?: string
  lokasi_id?: number | string
  lokasiId?: number | string
  unit_id?: number | string
  unitId?: number | string
  room_id?: number | string
  roomId?: number | string
  deskripsi?: string
  gambar?: string | null
  dokumen?: string | null
}

type SelectOption = { id: string | number; name: string }

export default function EditInventarisPage({ asetInventaris, locations = [], units = [], rooms = [] }: { asetInventaris: InventarisRecord; locations?: SelectOption[]; units?: SelectOption[]; rooms?: SelectOption[] }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const initialForm = {
    kode_aset: asetInventaris?.kode_aset ?? asetInventaris?.kodeAset ?? '',
    tanggal_pembukuan: asetInventaris?.tanggal_pembukuan ?? asetInventaris?.tanggalPembukuan ?? '',
    nama_aset: asetInventaris?.nama_aset ?? asetInventaris?.namaAset ?? '',
    spesifikasi: asetInventaris?.spesifikasi ?? '',
    jumlah: asetInventaris?.jumlah ?? '',
    jumlah_baik: asetInventaris?.jumlah_baik ?? asetInventaris?.jumlahBaik ?? '',
    jumlah_rusak_ringan: asetInventaris?.jumlah_rusak_ringan ?? asetInventaris?.jumlahRusakRingan ?? '',
    jumlah_rusak_berat: asetInventaris?.jumlah_rusak_berat ?? asetInventaris?.jumlahRusakBerat ?? '',
    jumlah_dalam_perbaikan: asetInventaris?.jumlah_dalam_perbaikan ?? asetInventaris?.jumlahDalamPerbaikan ?? '',
    satuan: asetInventaris?.satuan ?? 'Unit',
    asal_barang: asetInventaris?.asal_barang ?? asetInventaris?.asalBarang ?? '',
    tahun_pengadaan: asetInventaris?.tahun_pengadaan ?? asetInventaris?.tahunPengadaan ?? '',
    harga_perolehan: asetInventaris?.harga_perolehan ?? asetInventaris?.hargaPerolehan ?? '',
    kondisi: asetInventaris?.kondisi ?? 'Baik',
    lokasi_id: asetInventaris?.lokasi_id ?? asetInventaris?.lokasiId ?? '',
    unit_id: asetInventaris?.unit_id ?? asetInventaris?.unitId ?? '',
    room_id: asetInventaris?.room_id ?? asetInventaris?.roomId ?? '',
    deskripsi: asetInventaris?.deskripsi ?? '',
    gambar: null as File | null,
    dokumen: null as File | null,
  }

  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [selectedDocumentName, setSelectedDocumentName] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('aset-inventaris-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('aset-inventaris-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aset-inventaris-toast')
      window.localStorage.setItem('aset-inventaris-toast', JSON.stringify(nextNotice))
    }
  }

  const locationOptions = locations.map((item) => ({ id: String(item.id), name: item.name }))
  const unitOptions = units.map((item) => ({ id: String(item.id), name: item.name }))
  const roomOptions = rooms.map((item) => ({ id: String(item.id), name: item.name }))

  const resolveSelectionLabel = (items: SelectOption[], selectedId: string) => {
    const match = items.find((item) => String(item.id) === String(selectedId))
    return match?.name ?? ''
  }

  const updateField = (field: keyof typeof initialForm, value: string | File | null) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSelectByName = (field: 'lokasi_id' | 'unit_id' | 'room_id', selectedLabel: string, options: SelectOption[]) => {
    const match = options.find((item) => item.name === selectedLabel)
    updateField(field, match ? String(match.id) : '')
  }

  const handleFileChange = (field: 'gambar' | 'dokumen', file: File | null) => {
    updateField(field, file)
    if (field === 'gambar') setSelectedImageName(file ? file.name : '')
    if (field === 'dokumen') setSelectedDocumentName(file ? file.name : '')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const total = Number(form.jumlah || 0)
    const jumlahBaik = Number(form.jumlah_baik || 0)
    const jumlahRusakRingan = Number(form.jumlah_rusak_ringan || 0)
    const jumlahRusakBerat = Number(form.jumlah_rusak_berat || 0)
    const jumlahDalamPerbaikan = Number(form.jumlah_dalam_perbaikan || 0)

    if (jumlahBaik + jumlahRusakRingan + jumlahRusakBerat + jumlahDalamPerbaikan !== total) {
      setError('Total jumlah harus sama dengan jumlah semua kondisi aset.')
      setSubmitting(false)
      return
    }

    const payload = new FormData()
    payload.append('_method', 'PUT')
    payload.append('kode_aset', form.kode_aset)
    if (form.tanggal_pembukuan) payload.append('tanggal_pembukuan', form.tanggal_pembukuan)
    payload.append('nama_aset', form.nama_aset)
    if (form.spesifikasi) payload.append('spesifikasi', form.spesifikasi)
    if (form.jumlah) payload.append('jumlah', String(form.jumlah))
    if (form.jumlah_baik) payload.append('jumlah_baik', String(form.jumlah_baik))
    if (form.jumlah_rusak_ringan) payload.append('jumlah_rusak_ringan', String(form.jumlah_rusak_ringan))
    if (form.jumlah_rusak_berat) payload.append('jumlah_rusak_berat', String(form.jumlah_rusak_berat))
    if (form.jumlah_dalam_perbaikan) payload.append('jumlah_dalam_perbaikan', String(form.jumlah_dalam_perbaikan))
    if (form.satuan) payload.append('satuan', form.satuan)
    if (form.asal_barang) payload.append('asal_barang', form.asal_barang)
    if (form.tahun_pengadaan) payload.append('tahun_pengadaan', String(form.tahun_pengadaan))
    if (form.harga_perolehan) payload.append('harga_perolehan', String(form.harga_perolehan))
    if (form.kondisi) payload.append('kondisi', form.kondisi)
    if (form.lokasi_id) payload.append('lokasi_id', String(form.lokasi_id))
    if (form.unit_id) payload.append('unit_id', String(form.unit_id))
    if (form.room_id) payload.append('room_id', String(form.room_id))
    if (form.deskripsi) payload.append('deskripsi', form.deskripsi)
    if (form.gambar) payload.append('gambar', form.gambar)
    if (form.dokumen) payload.append('dokumen', form.dokumen)

    router.post(`/inventaris/aset-inventaris/${asetInventaris.id}`, payload, {
      forceFormData: true,
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Aset inventaris berhasil diperbarui.' })
        router.visit('/inventaris/aset-inventaris')
      },
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        const message = firstError ?? 'Gagal memperbarui aset inventaris. Periksa kembali data.'
        setError(message)
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role={layoutRole} currentPage="asset-inventaris">
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Inventaris</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit Aset Inventaris</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/inventaris/aset-inventaris')}
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
        {(() => {
          const total = Number(form.jumlah || 0)
          const baik = Number(form.jumlah_baik || 0)
          const ringan = Number(form.jumlah_rusak_ringan || 0)
          const berat = Number(form.jumlah_rusak_berat || 0)
          const perbaikan = Number(form.jumlah_dalam_perbaikan || 0)

          const kondisiUmum = berat > 0
            ? 'Rusak Berat'
            : perbaikan > 0
              ? 'Dalam Perbaikan'
              : ringan > 0
                ? 'Rusak Ringan'
                : 'Baik'

          const kondisiColorMap: Record<string, { accent: string; bg: string; color: string }> = {
            'Baik': { accent: '#10b981', bg: '#ecfdf5', color: '#065f46' },
            'Rusak Ringan': { accent: '#f59e0b', bg: '#fef3c7', color: '#b45309' },
            'Rusak Berat': { accent: '#ef4444', bg: '#fee2e2', color: '#b91c1c' },
            'Dalam Perbaikan': { accent: '#3b82f6', bg: '#dbeafe', color: '#1d4ed8' },
          }

          const kondisiMeta = kondisiColorMap[kondisiUmum] ?? kondisiColorMap['Baik']

          return (
            <div className="flex w-full flex-wrap gap-3">
              <div className="group relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-w-[180px] min-h-[118px]">
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
                <div className="flex h-full items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Kode aset</div>
                    <div className="mt-2 text-lg font-bold tracking-tight text-slate-900 break-all">{form.kode_aset || '-'}</div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10H7zM9 9h6v6H9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-w-[180px] min-h-[118px]">
                <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
                <div className="flex h-full items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Jumlah total</div>
                    <div className="mt-2 text-lg font-bold tracking-tight text-slate-900">{Number(form.jumlah || 0)} {form.satuan || 'Unit'}</div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 0v10m8-10v10M8 11h8M8 15h8" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative flex-1 overflow-hidden rounded-2xl border border-slate-200 p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-w-[180px] min-h-[118px]" style={{ background: kondisiMeta.bg, borderColor: `${kondisiMeta.accent}66` }}>
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: kondisiMeta.accent }} />
                <div className="flex h-full items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Kondisi umum</div>
                    <div className="mt-2 text-lg font-bold tracking-tight" style={{ color: kondisiMeta.color }}>{kondisiUmum}</div>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: `${kondisiMeta.accent}1A`, color: kondisiMeta.color }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
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
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Kode Aset</span>
                    <input
                      value={form.kode_aset}
                      onChange={(event) => updateField('kode_aset', event.target.value)}
                      required
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Tanggal Pembukuan</span>
                    <input
                      type="date"
                      value={form.tanggal_pembukuan}
                      onChange={(event) => updateField('tanggal_pembukuan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Nama Aset</span>
                    <input
                      value={form.nama_aset}
                      onChange={(event) => updateField('nama_aset', event.target.value)}
                      required
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Spesifikasi</span>
                    <textarea
                      value={form.spesifikasi}
                      onChange={(event) => updateField('spesifikasi', event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M5 21h14a2 2 0 002-2V7l-5-5H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Kondisi &amp; kuantitas</p>
                    <h2 className="text-base font-semibold text-slate-900">Status aset</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Jumlah Total</span>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlah}
                      onChange={(event) => updateField('jumlah', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Satuan</span>
                    <input
                      value={form.satuan}
                      onChange={(event) => updateField('satuan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Baik</span>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlah_baik}
                      onChange={(event) => updateField('jumlah_baik', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Rusak Ringan</span>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlah_rusak_ringan}
                      onChange={(event) => updateField('jumlah_rusak_ringan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Dalam Perbaikan</span>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlah_dalam_perbaikan}
                      onChange={(event) => updateField('jumlah_dalam_perbaikan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm md:col-span-2 xl:col-span-1">
                    <span className="font-medium text-slate-600">Rusak Berat</span>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlah_rusak_berat}
                      onChange={(event) => updateField('jumlah_rusak_berat', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-sky-500" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Administrasi</p>
                    <h2 className="text-base font-semibold text-slate-900">Detail pembiayaan &amp; lokasi</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Asal Barang</span>
                    <input
                      value={form.asal_barang}
                      onChange={(event) => updateField('asal_barang', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Tahun Pengadaan</span>
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      value={form.tahun_pengadaan}
                      onChange={(event) => updateField('tahun_pengadaan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Harga Perolehan</span>
                    <input
                      type="number"
                      min={0}
                      value={form.harga_perolehan}
                      onChange={(event) => updateField('harga_perolehan', event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <div className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Kondisi Umum</span>
                    <div className="flex h-11 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800">
                      {(() => {
                        const total = Number(form.jumlah || 0)
                        const baik = Number(form.jumlah_baik || 0)
                        const ringan = Number(form.jumlah_rusak_ringan || 0)
                        const berat = Number(form.jumlah_rusak_berat || 0)
                        const perbaikan = Number(form.jumlah_dalam_perbaikan || 0)

                        if (berat > 0) return 'Rusak Berat'
                        if (perbaikan > 0) return 'Dalam Perbaikan'
                        if (ringan > 0) return 'Rusak Ringan'
                        if (baik > 0 || total === 0) return 'Baik'
                        return 'Baik'
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Lokasi</span>
                    <AnimatedSelect
                      value={resolveSelectionLabel(locationOptions, form.lokasi_id)}
                      onChange={(value) => handleSelectByName('lokasi_id', value, locationOptions)}
                      options={locationOptions.map((item) => item.name)}
                      placeholder="Pilih lokasi"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Unit</span>
                    <AnimatedSelect
                      value={resolveSelectionLabel(unitOptions, form.unit_id)}
                      onChange={(value) => handleSelectByName('unit_id', value, unitOptions)}
                      options={unitOptions.map((item) => item.name)}
                      placeholder="Pilih unit"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Ruangan</span>
                    <AnimatedSelect
                      value={resolveSelectionLabel(roomOptions, form.room_id)}
                      onChange={(value) => handleSelectByName('room_id', value, roomOptions)}
                      options={roomOptions.map((item) => item.name)}
                      placeholder="Pilih ruangan"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-violet-500" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Dokumen</p>
                    <h2 className="text-base font-semibold text-slate-900">Lampiran aset</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="font-medium text-slate-600">Deskripsi</span>
                    <textarea
                      value={form.deskripsi}
                      onChange={(event) => updateField('deskripsi', event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Gambar / Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange('gambar', event.target.files?.[0] ?? null)}
                      className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    {selectedImageName && <span className="text-xs text-slate-500">{selectedImageName}</span>}
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-slate-600">Dokumen PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => handleFileChange('dokumen', event.target.files?.[0] ?? null)}
                      className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    {selectedDocumentName && <span className="text-xs text-slate-500">{selectedDocumentName}</span>}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={() => router.visit('/inventaris/aset-inventaris')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(16,185,129,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
                </svg>
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
