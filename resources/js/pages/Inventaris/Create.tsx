import { router } from '@inertiajs/react'
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

type SelectOption = { id: string | number; name: string; unit_id?: string | number; location_id?: string | number }

const initialForm = {
  kode_aset: '',
  tanggal_pembukuan: '',
  nama_aset: '',
  spesifikasi: '',
  jumlah: '',
  jumlah_baik: '',
  jumlah_rusak_ringan: '',
  jumlah_rusak_berat: '',
  jumlah_dalam_perbaikan: '',
  satuan: 'Unit',
  asal_barang: '',
  tahun_pengadaan: '',
  harga_perolehan: '',
  kondisi: 'Baik',
  lokasi_id: '',
  unit_id: '',
  room_id: '',
  deskripsi: '',
  gambar: null as File | null,
  dokumen: null as File | null,
}

export default function CreateInventarisPage({ locations = [], units = [], rooms = [] }: { locations?: SelectOption[]; units?: SelectOption[]; rooms?: SelectOption[] }) {
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

  const locationOptions: (SelectOption & { unitId?: string })[] = locations.map((item) => ({ id: String(item.id), name: item.name, unit_id: item.unit_id !== null && typeof item.unit_id !== 'undefined' ? String(item.unit_id) : undefined }))
  const unitOptions = units.map((item) => ({ id: String(item.id), name: item.name }))
  const roomOptions: (SelectOption & { unitId?: string })[] = rooms.map((item) => ({ id: String(item.id), name: item.name, unit_id: item.unit_id !== null && typeof item.unit_id !== 'undefined' ? String(item.unit_id) : undefined, location_id: item.location_id !== null && typeof item.location_id !== 'undefined' ? String(item.location_id) : undefined }))

  // filtered options based on selected unit
  const filteredLocationOptions = locationOptions.filter((item) => !form.unit_id || String(item.unit_id) === String(form.unit_id))
  const filteredRoomOptions = roomOptions.filter((item) =>
    Boolean(form.lokasi_id) &&
    String(item.location_id) === String(form.lokasi_id) &&
    (!form.unit_id || String(item.unit_id) === String(form.unit_id)),
  )

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

  // Keep location and room selections consistent with the selected unit and location.
  useEffect(() => {
    // if unit cleared, clear lokasi and room
    if (!form.unit_id) {
      if (form.lokasi_id) updateField('lokasi_id', '')
      if (form.room_id) updateField('room_id', '')
      return
    }

    const lokasiMatch = locationOptions.find((item) => String(item.id) === String(form.lokasi_id))
    if (lokasiMatch && lokasiMatch.unit_id && String(lokasiMatch.unit_id) !== String(form.unit_id)) {
      updateField('lokasi_id', '')
    }

    const roomMatch = roomOptions.find((item) => String(item.id) === String(form.room_id))
    if (roomMatch && roomMatch.unit_id && String(roomMatch.unit_id) !== String(form.unit_id)) {
      updateField('room_id', '')
    }

    if (form.room_id && roomMatch?.location_id && String(roomMatch.location_id) !== String(form.lokasi_id)) {
      updateField('room_id', '')
    }
  }, [form.unit_id, form.lokasi_id])

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

    router.post('/inventaris/aset-inventaris', payload, {
      forceFormData: true,
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Aset inventaris berhasil ditambahkan.' })
        router.visit('/inventaris/aset-inventaris')
      },
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        const message = firstError ?? 'Gagal menambahkan aset inventaris. Periksa kembali data.'
        setError(message)
        persistNotice({ type: 'error', message })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role="super_admin" currentPage="asset-inventaris">
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold" style={{ color: '#0f172a' }}>Tambah Aset Inventaris</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Tambahkan data aset inventaris baru sesuai kebutuhan operasional yayasan.</p>
          </div>
          <button
            type="button"
            onClick={() => router.visit('/inventaris/aset-inventaris')}
            className="rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: '#e2e8f0', color: '#475569', background: '#fff' }}
          >
            Kembali
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Kode Aset</span>
            <input
              value={form.kode_aset}
              onChange={(event) => updateField('kode_aset', event.target.value)}
              required
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="INV-001"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Tanggal Pembukuan</span>
            <input
              type="date"
              value={form.tanggal_pembukuan}
              onChange={(event) => updateField('tanggal_pembukuan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Nama Aset</span>
            <input
              value={form.nama_aset}
              onChange={(event) => updateField('nama_aset', event.target.value)}
              required
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Mesin Fotocopy"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Spesifikasi</span>
            <textarea
              value={form.spesifikasi}
              onChange={(event) => updateField('spesifikasi', event.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Spesifikasi dan detail teknis aset"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Jumlah Total</span>
            <input
              type="number"
              min={0}
              value={form.jumlah}
              onChange={(event) => updateField('jumlah', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Satuan</span>
            <input
              value={form.satuan}
              onChange={(event) => updateField('satuan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Unit / Buah / Set"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Baik</span>
            <input
              type="number"
              min={0}
              value={form.jumlah_baik}
              onChange={(event) => updateField('jumlah_baik', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Rusak Ringan</span>
            <input
              type="number"
              min={0}
              value={form.jumlah_rusak_ringan}
              onChange={(event) => updateField('jumlah_rusak_ringan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Rusak Berat</span>
            <input
              type="number"
              min={0}
              value={form.jumlah_rusak_berat}
              onChange={(event) => updateField('jumlah_rusak_berat', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Dalam Perbaikan</span>
            <input
              type="number"
              min={0}
              value={form.jumlah_dalam_perbaikan}
              onChange={(event) => updateField('jumlah_dalam_perbaikan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Asal Barang</span>
            <input
              value={form.asal_barang}
              onChange={(event) => updateField('asal_barang', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Pembelian / Hibah / Donasi"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Tahun Pengadaan</span>
            <input
              type="number"
              min={1900}
              max={2100}
              value={form.tahun_pengadaan}
              onChange={(event) => updateField('tahun_pengadaan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Harga Perolehan</span>
            <input
              type="number"
              min={0}
              value={form.harga_perolehan}
              onChange={(event) => updateField('harga_perolehan', event.target.value)}
              className="h-11 w-full rounded-xl border px-3 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
            />
          </label>

          <div className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Kondisi Umum</span>
            <div className="flex h-11 w-full items-center rounded-xl border px-3 text-sm" style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a' }}>
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

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Lokasi</span>
            <AnimatedSelect
              value={resolveSelectionLabel(filteredLocationOptions, form.lokasi_id)}
              onChange={(value) => {
                handleSelectByName('lokasi_id', value, filteredLocationOptions)
                if (form.room_id) updateField('room_id', '')
              }}
              options={filteredLocationOptions.map((item) => item.name)}
              placeholder={form.unit_id ? 'Pilih lokasi' : 'Pilih unit terlebih dahulu'}
              className="w-full"
              disabled={!form.unit_id}
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Unit</span>
            <AnimatedSelect
              value={resolveSelectionLabel(unitOptions, form.unit_id)}
              onChange={(value) => handleSelectByName('unit_id', value, unitOptions)}
              options={unitOptions.map((item) => item.name)}
              placeholder="Pilih unit"
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Ruangan</span>
            <AnimatedSelect
              value={resolveSelectionLabel(filteredRoomOptions, form.room_id)}
              onChange={(value) => handleSelectByName('room_id', value, filteredRoomOptions)}
              options={filteredRoomOptions.map((item) => item.name)}
              placeholder={form.lokasi_id ? 'Pilih ruangan dari lokasi' : 'Pilih lokasi terlebih dahulu'}
              className="w-full"
              disabled={!form.lokasi_id}
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span style={{ color: '#475569' }}>Deskripsi</span>
            <textarea
              value={form.deskripsi}
              onChange={(event) => updateField('deskripsi', event.target.value)}
              rows={3}
              className="w-full rounded-xl border px-3 py-2 outline-none"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
              placeholder="Catatan atau deskripsi tambahan"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Gambar / Foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange('gambar', event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-dashed px-3 py-2 text-sm"
              style={{ borderColor: '#dbe5f0', background: '#f8fafc' }}
            />
            {selectedImageName && <span className="text-xs text-slate-500">{selectedImageName}</span>}
          </label>

          <label className="space-y-2 text-sm">
            <span style={{ color: '#475569' }}>Dokumen PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => handleFileChange('dokumen', event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-dashed px-3 py-2 text-sm"
              style={{ borderColor: '#dbe5f0', background: '#f8fafc' }}
            />
            {selectedDocumentName && <span className="text-xs text-slate-500">{selectedDocumentName}</span>}
          </label>

          <div className="md:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.visit('/inventaris/aset-inventaris')}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium"
              style={{ borderColor: '#e2e8f0', color: '#475569', background: '#fff' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: '#16a34a' }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Aset'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
