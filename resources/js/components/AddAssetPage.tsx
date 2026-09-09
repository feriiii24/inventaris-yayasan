import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import ConfirmDialog from './ui/ConfirmDialog'

interface Props {
  onBack: () => void
  initialValues?: Record<string, string | number>
  mode?: 'create' | 'edit'
  title?: string
  submitLabel?: string
  category?: 'Inventaris' | 'Bergerak' | 'Tidak Bergerak' | 'Usaha Yayasan'
}

const conditions = ['Baik', 'Sedang', 'Buruk']
const units = Array.from(new Set([
  'Unit Pendidikan A',
  'Unit Kesehatan B',
  'Sekretariat Yayasan',
  'Unit Bisnis',
  'Unit Sosial C',
  'Unit Riset D',
]))

const Input = ({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all"
      style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a', ...(props.style ?? {}) }}
      onFocus={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.background = '#ffffff' }}
      onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f9fafb' }}
    />
  </div>
)

const Select = ({ label, required, children, ...props }: { label: string; required?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    <select
      {...props}
      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
      style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
    >
      <option value="">Pilih {label}</option>
      {children}
    </select>
  </div>
)

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
        <span style={{ color: '#166534' }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

function getDefaultForm(category: string) {
  const base = {
    tanggalPembukuan: '',
    kode: '',
    nama: '',
    spesifikasi: '',
    jumlah: '',
    satuan: '',
    asalBarang: '',
    tahunPengadaan: '',
    kondisi: 'Baik',
    hargaPerolehan: '',
    lokasi: '',
    unit: '',
    bentukAset: '',
    dasarHak: '',
    atasNama: '',
    tahunPerolehan: '',
    nomorRegistrasi: '',
    jangkaWaktu: '',
    keterangan: '',
    dibuat: '',
    bentukUsaha: '',
    pengelola: '',
    mulaiOperasional: '',
    dasarPerjanjian: '',
    document_name: '',
  }

  switch (category) {
    case 'Bergerak':
      return { ...base, bentukAset: '', dasarHak: '', atasNama: '', tahunPerolehan: '', nomorRegistrasi: '', keterangan: '', dibuat: '' }
    case 'Tidak Bergerak':
      return { ...base, bentukAset: '', dasarHak: '', atasNama: '', tahunPerolehan: '', jangkaWaktu: '', keterangan: '', dibuat: '' }
    case 'Usaha Yayasan':
      return { ...base, bentukUsaha: '', lokasi: '', pengelola: '', mulaiOperasional: '', dasarPerjanjian: '', keterangan: '', dibuat: '' }
    default:
      return { ...base, tanggalPembukuan: '', kode: '', nama: '', spesifikasi: '', jumlah: '', satuan: '', asalBarang: '', tahunPengadaan: '', kondisi: 'Baik', hargaPerolehan: '', lokasi: '', unit: '' }
  }
}

export default function AddAssetPage({
  onBack,
  initialValues,
  mode = 'create',
  title = 'Tambah Aset Baru',
  submitLabel = 'Simpan Aset',
  category = 'Inventaris',
}: Props) {
  const defaultForm = getDefaultForm(category)

  const normalizeInitialValues = (values: Record<string, any> | undefined) => {
    if (!values) return {}

    const map = { ...values }
    const asString = (value: unknown) => value === null || typeof value === 'undefined' ? '' : String(value)

    const normalized: Record<string, string> = {}
    const categoryLower = category.toLowerCase()

    if (categoryLower.includes('inventaris')) {
      normalized.tanggalPembukuan = asString(map.tanggalPembukuan ?? map.created_at ?? map.createdAt ?? '')
      normalized.kode = asString(map.asset_code ?? map.kode ?? map.assetCode ?? '')
      normalized.nama = asString(map.name ?? map.nama ?? '')
      normalized.spesifikasi = asString(map.description ?? map.spesifikasi ?? '')
      normalized.jumlah = asString(map.quantity ?? map.jumlah ?? '')
      normalized.satuan = asString(map.unit_measure ?? map.satuan ?? '')
      normalized.asalBarang = asString(map.acquisition_source ?? map.asalBarang ?? '')
      normalized.tahunPengadaan = asString(map.acquisition_year ?? map.tahunPengadaan ?? '')
      normalized.kondisi = asString(map.condition_status ?? map.kondisi ?? 'Baik')
      normalized.hargaPerolehan = asString(map.purchase_value ?? map.hargaPerolehan ?? map.nilaiPerolehan ?? '')
      normalized.lokasi = asString(map.location?.name ?? map.lokasi ?? '')
      normalized.unit = asString(map.unit?.name ?? map.unit_name ?? map.unit ?? '')
      normalized.keterangan = asString(map.keterangan ?? '')
    }

    if (categoryLower.includes('bergerak')) {
      normalized.bentukAset = asString(map.name ?? map.bentukAset ?? '')
      normalized.dasarHak = asString(map.legal_basis ?? map.dasarHak ?? '')
      normalized.atasNama = asString(map.owner_name ?? map.atasNama ?? map.penanggungjawab ?? '')
      normalized.tahunPerolehan = asString(map.acquisition_year ?? map.tahunPerolehan ?? '')
      normalized.nomorRegistrasi = asString(map.registration_number ?? map.nomorRegistrasi ?? '')
      normalized.keterangan = asString(map.description ?? map.keterangan ?? '')
      normalized.dibuat = asString(map.created_at ?? map.dibuat ?? '')
    }

    if (categoryLower.includes('tidak')) {
      normalized.bentukAset = asString(map.name ?? map.bentukAset ?? '')
      normalized.dasarHak = asString(map.legal_basis ?? map.dasarHak ?? '')
      normalized.atasNama = asString(map.owner_name ?? map.atasNama ?? map.penanggungjawab ?? '')
      normalized.tahunPerolehan = asString(map.acquisition_year ?? map.tahunPerolehan ?? '')
      normalized.jangkaWaktu = asString(map.jangkaWaktu ?? (map.start_operation_date ? `Sejak ${map.start_operation_date}` : '') ?? '')
      normalized.keterangan = asString(map.description ?? map.keterangan ?? '')
      normalized.dibuat = asString(map.created_at ?? map.dibuat ?? '')
    }

    if (categoryLower.includes('usaha')) {
      normalized.bentukUsaha = asString(map.name ?? map.bentukUsaha ?? '')
      normalized.lokasi = asString(map.location?.name ?? map.lokasi ?? '')
      normalized.pengelola = asString(map.owner_name ?? map.pengelola ?? map.penanggungjawab ?? '')
      normalized.mulaiOperasional = asString(map.start_operation_date ?? map.mulaiOperasional ?? '')
      normalized.dasarPerjanjian = asString(map.legal_basis ?? map.dasarPerjanjian ?? '')
      normalized.keterangan = asString(map.description ?? map.keterangan ?? '')
      normalized.dibuat = asString(map.created_at ?? map.dibuat ?? '')
      normalized.document_name = asString(map.document_name ?? map.document?.name ?? map.metadata?.document?.name ?? map.metadata?.document_name ?? '')
    }

    return Object.fromEntries(Object.entries({ ...map, ...normalized }).map(([key, value]) => [key, asString(value)]))
  }

  const [submitted, setSubmitted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Record<string, any> | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [form, setForm] = useState(() => ({
    ...defaultForm,
    ...normalizeInitialValues(initialValues),
  }))

  useEffect(() => {
    setForm({
      ...defaultForm,
      ...normalizeInitialValues(initialValues),
    })
  }, [category, initialValues])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const renderCategorySpecificFields = () => {
    switch (category) {
      case 'Inventaris':
        return (
          <SectionCard
            title="Informasi Aset Inventaris"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          >
            <Input label="Tanggal Pembukuan" required type="date" value={form.tanggalPembukuan} onChange={e => update('tanggalPembukuan', e.target.value)} />
            <Input label="Kode Aset" required placeholder="INV-2024-001" value={form.kode} onChange={e => update('kode', e.target.value)} />
            <Input label="Nama Aset" required placeholder="Nama aset" value={form.nama} onChange={e => update('nama', e.target.value)} />
            <Input label="Spesifikasi" placeholder="Spesifikasi aset" value={form.spesifikasi} onChange={e => update('spesifikasi', e.target.value)} />
            <Input label="Jumlah" required type="number" placeholder="1" value={form.jumlah} onChange={e => update('jumlah', e.target.value)} />
            <Input label="Satuan" required placeholder="Unit / Buah / Paket" value={form.satuan} onChange={e => update('satuan', e.target.value)} />
            <Input label="Asal Barang" placeholder="Pembelian / Hibah / Donasi" value={form.asalBarang} onChange={e => update('asalBarang', e.target.value)} />
            <Input label="Tahun Pengadaan" required type="number" placeholder="2024" value={form.tahunPengadaan} onChange={e => update('tahunPengadaan', e.target.value)} />
            <Select label="Kondisi" required value={form.kondisi} onChange={e => update('kondisi', e.target.value)}>
              {conditions.map(option => <option key={option} value={option}>{option}</option>)}
            </Select>
            <Input label="Harga Perolehan" required placeholder="Rp 0" value={form.hargaPerolehan} onChange={e => update('hargaPerolehan', e.target.value)} />
            <Input label="Lokasi" placeholder="Lokasi aset" value={form.lokasi} onChange={e => update('lokasi', e.target.value)} />
            <Select label="Unit" required value={form.unit} onChange={e => update('unit', e.target.value)}>
              {units.map(option => <option key={option} value={option}>{option}</option>)}
            </Select>
          </SectionCard>
        )

      case 'Bergerak':
        return (
          <SectionCard
            title="Informasi Aset Bergerak"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8l3 3v7a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h1zm8 0V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2" /></svg>}
          >
            <Input label="Bentuk Aset" required placeholder="Kendaraan / Mesin / Peralatan" value={form.bentukAset} onChange={e => update('bentukAset', e.target.value)} />
            <Input label="Dasar Hak" placeholder="Hak Milik / Hak Pakai" value={form.dasarHak} onChange={e => update('dasarHak', e.target.value)} />
            <Input label="Atas Nama" placeholder="Yayasan / Unit" value={form.atasNama} onChange={e => update('atasNama', e.target.value)} />
            <Input label="Tahun Perolehan" required type="number" placeholder="2024" value={form.tahunPerolehan} onChange={e => update('tahunPerolehan', e.target.value)} />
            <Input label="Nomor Registrasi" placeholder="B 1234 ABC" value={form.nomorRegistrasi} onChange={e => update('nomorRegistrasi', e.target.value)} />
            <Input label="Dibuat" type="date" value={form.dibuat} onChange={e => update('dibuat', e.target.value)} />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Keterangan</label>
              <textarea
                rows={3}
                placeholder="Catatan penggunaan / kondisi aset"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                value={form.keterangan}
                onChange={e => update('keterangan', e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f9fafb' }}
              />
            </div>
          </SectionCard>
        )

      case 'Tidak Bergerak':
        return (
          <SectionCard
            title="Informasi Aset Tidak Bergerak"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01" /></svg>}
          >
            <Input label="Bentuk Aset" required placeholder="Tanah / Bangunan / Ruang Kelas" value={form.bentukAset} onChange={e => update('bentukAset', e.target.value)} />
            <Input label="Dasar Hak" placeholder="Hak Milik / Hak Pakai" value={form.dasarHak} onChange={e => update('dasarHak', e.target.value)} />
            <Input label="Atas Nama" placeholder="Nama pemilik / yayasan" value={form.atasNama} onChange={e => update('atasNama', e.target.value)} />
            <Input label="Tahun Perolehan" required type="number" placeholder="2024" value={form.tahunPerolehan} onChange={e => update('tahunPerolehan', e.target.value)} />
            <Input label="Jangka Waktu" placeholder="20 tahun / Tidak terbatas" value={form.jangkaWaktu} onChange={e => update('jangkaWaktu', e.target.value)} />
            <Input label="Dibuat" type="date" value={form.dibuat} onChange={e => update('dibuat', e.target.value)} />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Keterangan</label>
              <textarea
                rows={3}
                placeholder="Informasi lokasi dan kondisi aset"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                value={form.keterangan}
                onChange={e => update('keterangan', e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f9fafb' }}
              />
            </div>
          </SectionCard>
        )

      case 'Usaha Yayasan':
        return (
          <SectionCard
            title="Informasi Usaha Yayasan"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V7a2 2 0 012-2h12a2 2 0 012 2v12M9 7V4m6 3V4M8 11h8M8 15h8" /></svg>}
          >
            <Input label="Bentuk Usaha" required placeholder="Koperasi / Unit Produksi / Cafe" value={form.bentukUsaha} onChange={e => update('bentukUsaha', e.target.value)} />
            <Input label="Lokasi" placeholder="Alamat / gedung / kawasan" value={form.lokasi} onChange={e => update('lokasi', e.target.value)} />
            <Input label="Pengelola" placeholder="Nama pengelola" value={form.pengelola} onChange={e => update('pengelola', e.target.value)} />
            <Input label="Mulai Operasional" type="date" value={form.mulaiOperasional} onChange={e => update('mulaiOperasional', e.target.value)} />
            <Input label="Dasar Perjanjian" placeholder="SK / MoU / Peraturan" value={form.dasarPerjanjian} onChange={e => update('dasarPerjanjian', e.target.value)} />
            <Input label="Dibuat" type="date" value={form.dibuat} onChange={e => update('dibuat', e.target.value)} />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Dokumen Pendukung (PDF)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  const isPdf = !!file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))

                  if (file && !isPdf) {
                    event.target.value = ''
                    window.alert('Hanya file PDF yang diperbolehkan untuk dokumen usaha yayasan.')
                    return
                  }

                  setDocumentFile(file)
                  update('document_name', file ? file.name : '')
                }}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
              />
              {form.document_name && (
                <p className="mt-2 text-xs" style={{ color: '#166534' }}>
                  File terpilih: {form.document_name}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Keterangan</label>
              <textarea
                rows={3}
                placeholder="Keterangan usaha yayasan"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                value={form.keterangan}
                onChange={e => update('keterangan', e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.background = '#ffffff' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f9fafb' }}
              />
            </div>
          </SectionCard>
        )

      default:
        return null
    }
  }

  const categorySlug = category === 'Bergerak' ? 'bergerak' : category === 'Tidak Bergerak' ? 'tidak-bergerak' : category === 'Usaha Yayasan' ? 'usaha-yayasan' : 'inventaris'

  const normalizePurchaseValue = (value: string | number | undefined) => {
    const raw = String(value ?? '0').replace(/[^\d.]/g, '')
    if (!raw || raw === '.') return 0

    const numeric = Number(raw)
    if (!Number.isFinite(numeric)) return 0

    const capped = Math.min(Math.max(numeric, 0), 9999999999999.99)
    return Number(capped.toFixed(2))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      category: categorySlug,
      asset_code: form.kode || undefined,
      name: form.nama || form.bentukAset || form.bentukUsaha || undefined,
      description: form.spesifikasi || form.keterangan || undefined,
      quantity: Number(form.jumlah || 1),
      unit_measure: form.satuan || 'Unit',
      acquisition_source: form.asalBarang || 'Pembelian',
      acquisition_year: Number(form.tahunPengadaan || form.tahunPerolehan || new Date().getFullYear()),
      condition_status: form.kondisi || 'Baik',
      purchase_value: normalizePurchaseValue(form.hargaPerolehan),
      owner_name: form.atasNama || form.pengelola || form.unit || '',
      registration_number: form.nomorRegistrasi || undefined,
      legal_basis: form.dasarHak || form.dasarPerjanjian || undefined,
      start_operation_date: form.mulaiOperasional || form.dibuat || form.tanggalPembukuan || undefined,
      is_movable: categorySlug === 'bergerak',
      status: 'aktif',
    }

    if (categorySlug === 'usaha-yayasan' && documentFile && (documentFile.type !== 'application/pdf' && !documentFile.name.toLowerCase().endsWith('.pdf'))) {
      window.alert('Hanya file PDF yang diperbolehkan untuk dokumen usaha yayasan.')
      return
    }

    setPendingPayload(payload)
    setConfirmOpen(true)
  }

  const executeSubmit = () => {
    if (!pendingPayload) return

    const actionUrl = mode === 'edit' && initialValues?.id ? `/inventaris/${initialValues.id}` : '/inventaris'
    const payloadForRequest = new FormData()

    Object.entries(pendingPayload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      payloadForRequest.append(key, String(value))
    })

    if (categorySlug === 'usaha-yayasan' && documentFile) {
      payloadForRequest.append('document', documentFile)
    }

    if (mode === 'edit') {
      router.put(actionUrl, payloadForRequest, {
        forceFormData: true,
        onSuccess: () => {
          setConfirmOpen(false)
          setSubmitted(true)
          setTimeout(() => { setSubmitted(false); onBack() }, 1200)
        },
        onError: () => setConfirmOpen(false),
        preserveScroll: true,
      })
      return
    }

    router.post(actionUrl, payloadForRequest, {
      forceFormData: true,
      onSuccess: () => {
        setConfirmOpen(false)
        setSubmitted(true)
        setTimeout(() => { setSubmitted(false); onBack() }, 1200)
      },
      onError: () => setConfirmOpen(false),
      preserveScroll: true,
    })
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-2xl" style={{ boxShadow: '0 30px 60px rgba(22, 101, 52, 0.2)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#dcfce7', color: '#166534' }}>
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">
            {mode === 'edit' ? 'Perubahan berhasil disimpan' : 'Aset berhasil ditambahkan'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === 'edit'
              ? 'Informasi aset telah diperbarui dengan sukses.'
              : 'Data aset baru sudah masuk ke sistem dan siap ditampilkan.'}
          </p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: '#166534' }}
            >
              Kembali ke daftar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title={mode === 'edit' ? 'Simpan perubahan aset?' : 'Simpan aset baru?'}
        message={mode === 'edit'
          ? 'Pastikan data aset sudah benar sebelum menyimpan perubahan.'
          : 'Data aset baru akan disimpan ke database dan dapat ditampilkan di halaman kategori.'}
        confirmLabel={mode === 'edit' ? 'Ya, simpan' : 'Ya, simpan aset'}
        cancelLabel="Batal"
        onConfirm={executeSubmit}
        onCancel={() => setConfirmOpen(false)}
        tone="info"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl border transition-colors"
          style={{ borderColor: '#e2e8f0', color: '#64748b' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>{title}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {mode === 'edit' ? 'Perbarui informasi aset yang sudah tercatat' : 'Isi semua informasi aset yang diperlukan'}
          </p>
        </div>
      </div>

      {renderCategorySpecificFields()}

        <div className="flex items-center justify-end gap-3 pt-2 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors"
            style={{ borderColor: '#e2e8f0', color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
            style={{ background: '#166534' }}
            onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
            onMouseLeave={e => e.currentTarget.style.background = '#166534'}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
