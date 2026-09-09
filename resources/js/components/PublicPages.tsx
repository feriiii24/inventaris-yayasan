import { router, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { Archive, Building2, Boxes, CheckCircle2, ChevronDown, Filter, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'

function NavBar({ onLogin }: { onLogin: () => void }) {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 py-4 border-b bg-white/95 backdrop-blur" style={{ borderColor: '#e2e8f0' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#166534' }}>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <span className="block font-bold text-sm" style={{ color: '#0f172a' }}>Inventaris Aset Yayasan</span>
          <span className="hidden sm:block text-[11px]" style={{ color: '#64748b' }}>Portal informasi publik</span>
        </div>
      </div>
      <button
        onClick={onLogin}
        className="px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors shadow-sm"
        style={{ background: '#166534' }}
        onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
        onMouseLeave={e => e.currentTarget.style.background = '#166534'}
      >
        Masuk
      </button>
    </nav>
  )
}

function normalizeAssets(serverAssets: any[]) {
  return serverAssets.map((a: any) => ({
    id: a.id,
    kode: a.kode ?? a.asset_code ?? `ASSET-${a.id}`,
    nama: a.nama ?? a.name ?? '-',
    kategori: typeof a.kategori === 'object' ? a.kategori?.name ?? 'Inventaris' : a.kategori ?? 'Inventaris',
    jenis: a.jenis ?? a.spesifikasi ?? a.type ?? '-',
    lokasi: a.lokasi ?? a.location ?? '-',
    unit: typeof a.unit === 'object' ? a.unit?.name ?? '-' : a.unit ?? '-',
    ruangan: typeof a.ruangan === 'object' ? a.ruangan?.name ?? '-' : a.ruangan ?? '-',
    status: a.status ?? (Number(a.jumlahTersedia ?? a.jumlah ?? 0) > 0 ? 'Bisa dipinjam' : 'Tidak bisa dipinjam'),
    jumlah: Number(a.jumlah ?? 0),
    jumlahRusakBerat: Number(a.jumlahRusakBerat ?? 0),
    jumlahDalamPerbaikan: Number(a.jumlahDalamPerbaikan ?? 0),
    jumlahDipinjam: Number(a.jumlahDipinjam ?? 0),
    jumlahTersedia: Number(a.jumlahTersedia ?? a.jumlah ?? 0),
    satuan: a.satuan ?? 'Unit',
    nilaiPerolehan: 0,
  }))
}

export function PublicInventoryPage({ onLogin }: { onLogin: () => void }) {
  const props = (usePage().props as any) || {}
  const publicAssets = normalizeAssets(props.publicAssets || props.rows || [])
  const [search, setSearch] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [pageSize, setPageSize] = useState<10 | 50 | 'all'>(10)
  const units = Array.from(new Map(
    publicAssets
      .map(asset => asset.unit.trim())
      .filter(unit => unit && unit !== '-')
      .map(unit => [unit.toLocaleLowerCase(), unit]),
  ).values())

  const filtered = publicAssets.filter(a => {
    const q = search.trim().toLowerCase()
    const searchable = [a.nama, a.kode, a.lokasi, a.unit, a.ruangan, a.jenis].join(' ').toLowerCase()
    const matchQ = !q || searchable.includes(q)
    const matchUnit = !filterUnit || a.unit === filterUnit
    return matchQ && matchUnit
  })
  const displayedAssets = pageSize === 'all' ? filtered : filtered.slice(0, pageSize)

  const statusColors: Record<string, { bg: string; color: string }> = {
    'Bisa dipinjam': { bg: '#dcfce7', color: '#166534' },
    'Tidak bisa dipinjam': { bg: '#fee2e2', color: '#b91c1c' },
    'Rusak Berat': { bg: '#fee2e2', color: '#b91c1c' },
    'Dalam Perbaikan': { bg: '#dbeafe', color: '#1d4ed8' },
    'Sedang Dipinjam': { bg: '#fef3c7', color: '#92400e' },
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <NavBar onLogin={onLogin} />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="rounded-3xl p-6 sm:p-10 mb-8 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #14532d, #166534 60%, #15803d)' }}>
          <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full border-[28px] border-white/10" />
          <div className="absolute right-16 -bottom-24 w-40 h-40 rounded-full border-[20px] border-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-200 mb-3">Transparansi aset yayasan</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">Inventaris Aset Publik</h1>
            <p className="text-sm sm:text-base text-green-100/80 leading-relaxed">Temukan informasi aset inventaris yayasan secara cepat, transparan, dan mudah diakses.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Aset', value: publicAssets.length, icon: Archive, tone: '#166534', tint: '#ecfdf5' },
            { label: 'Unit Tercatat', value: new Set(publicAssets.map(a => a.unit).filter(u => u !== '-')).size, icon: Building2, tone: '#2563eb', tint: '#eff6ff' },
            { label: 'Total Tersedia', value: publicAssets.reduce((sum, a) => sum + a.jumlahTersedia, 0), icon: Boxes, tone: '#d97706', tint: '#fffbeb' },
          ].map(stat => {
            const Icon = stat.icon
            return (
            <div key={stat.label} className="bg-white rounded-2xl border p-4 sm:p-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-start justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.tint, color: stat.tone }}>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-right leading-tight" style={{ color: '#94a3b8' }}>{stat.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#0f172a' }}>{stat.value.toLocaleString('id-ID')}</p>
            </div>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl border p-3 sm:p-4 mb-5 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-2 mb-3">
           <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#f0fdf4', color: '#166534' }}>
             <SlidersHorizontal size={16} />
           </span>
           <div>
             <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>Cari dan filter aset</p>
             <p className="text-xs" style={{ color: '#94a3b8' }}>Gunakan kata kunci atau pilih unit</p>
           </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
             <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
           <input
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Cari nama, kode, lokasi, atau unit..."
             aria-label="Cari aset"
             className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all"
             style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a' }}
             onFocus={e => e.currentTarget.style.borderColor = '#166534'}
             onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
           />
           {search && (
             <button
               type="button"
               aria-label="Hapus pencarian"
               onClick={() => setSearch('')}
               className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
               style={{ color: '#64748b', background: '#e2e8f0' }}
             >
               <X size={12} />
             </button>
           )}
           </div>
           <div className="relative sm:w-56">
             <select
               value={filterUnit}
               onChange={e => setFilterUnit(e.target.value)}
               aria-label="Filter unit aset"
               className="w-full appearance-none px-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-all cursor-pointer"
               style={{ borderColor: '#e2e8f0', background: '#f8fafc', backgroundImage: 'none', color: filterUnit ? '#0f172a' : '#64748b' }}
               onFocus={e => e.currentTarget.style.borderColor = '#166534'}
               onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
             >
               <option value="">Semua unit</option>
               {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
             </select>
             <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={15} style={{ color: '#64748b' }} />
             <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} style={{ color: '#64748b' }} />
           </div>
           <div className="relative sm:w-40">
             <select
               value={pageSize}
               onChange={e => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as 10 | 50)}
               aria-label="Jumlah aset per halaman"
               className="w-full appearance-none px-3 pr-9 py-3 rounded-xl border text-sm outline-none transition-all cursor-pointer"
               style={{ borderColor: '#e2e8f0', background: '#f8fafc', backgroundImage: 'none', color: '#64748b' }}
               onFocus={e => e.currentTarget.style.borderColor = '#166534'}
               onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
             >
               <option value={10}>Tampilkan 10</option>
               <option value={50}>Tampilkan 50</option>
               <option value="all">Tampilkan semua</option>
             </select>
             <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} style={{ color: '#64748b' }} />
           </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
           <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>Daftar Aset</h2>
           <p className="text-xs mt-1" style={{ color: '#64748b' }}>{displayedAssets.length} dari {filtered.length} aset ditampilkan</p>
          </div>
          {(search || filterUnit) && (
           <button type="button" onClick={() => { setSearch(''); setFilterUnit('') }} className="text-xs font-semibold transition-colors" style={{ color: '#166534' }}>
             Reset filter
           </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
           <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Data tersedia untuk publik
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAssets.map(asset => (
            <div
              key={asset.id}
              className="rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md"
              style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: '#f1f5f9', color: '#64748b' }}>{asset.kode}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: statusColors[asset.status]?.bg ?? '#f1f5f9', color: statusColors[asset.status]?.color ?? '#64748b' }}>
                  {asset.status}
                </span>
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>{asset.nama}</h3>
              <p className="text-xs mb-3" style={{ color: '#64748b' }}>{asset.kategori} · {asset.jenis}</p>
              <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-4" style={{ background: '#f0fdf4' }}>
                <span className="text-xs" style={{ color: '#64748b' }}>Jumlah tersedia</span>
                <span className="text-sm font-bold" style={{ color: asset.jumlahTersedia > 0 ? '#166534' : '#b91c1c' }}>{asset.jumlahTersedia.toLocaleString('id-ID')} {asset.satuan}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mb-4" style={{ color: '#64748b' }}>
                <span>Total {asset.jumlah.toLocaleString('id-ID')}</span>
                {asset.jumlahRusakBerat > 0 && <span>Rusak berat {asset.jumlahRusakBerat.toLocaleString('id-ID')}</span>}
                {asset.jumlahDipinjam > 0 && <span>Dipinjam {asset.jumlahDipinjam.toLocaleString('id-ID')}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{asset.lokasi} · {asset.ruangan !== '-' ? asset.ruangan : asset.unit}</span>
                </div>
                {asset.status === 'Bisa dipinjam' && (
                  <button
                    type="button"
                    onClick={() => router.visit(`/ajukan-peminjaman?asset=${asset.id}`)}
                    className="w-full mt-4 rounded-xl py-2.5 text-xs font-semibold text-white transition-colors"
                    style={{ background: '#166534' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
                    onMouseLeave={e => e.currentTarget.style.background = '#166534'}
                  >
                    Ajukan peminjaman
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <svg className="w-6 h-6" style={{ color: '#cbd5e1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: '#64748b' }}>Tidak ada aset ditemukan</p>
          </div>
        )}
      </main>
    </div>
  )
}

export function PublicBorrowingPage({ onLogin }: { onLogin: () => void }) {
  const props = (usePage().props as any) || {}
  const borrowableAssets = normalizeAssets(props.publicAssets || props.rows || []).filter(a => a.status === 'Bisa dipinjam')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedAsset, setSelectedAsset] = useState<typeof borrowableAssets[0] | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    nama: '',
    instansi: '',
    keperluan: '',
    tanggalMulai: '',
    jamMulai: '',
    tanggalJatuhTempo: '',
    jamJatuhTempo: '',
    tanggalKembali: '',
    jamKembali: '',
    catatan: '',
    noHP: '',
    jumlah: '1',
  })
  const selectedAssetId = new URLSearchParams(window.location.search).get('asset')
  const submitted = new URLSearchParams(window.location.search).get('submitted') === '1'

  useEffect(() => {
    if (submitted) {
      setStep(4)
      return
    }
    const initialAsset = borrowableAssets.find(asset => asset.id === selectedAssetId)
    if (initialAsset) setSelectedAsset(initialAsset)
    if (initialAsset) setStep(2)
  }, [selectedAssetId, submitted])

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const submitBorrowing = () => {
    if (!selectedAsset) return
    if (!form.jumlah || !form.nama.trim() || !form.instansi.trim() || !form.keperluan.trim() || !form.noHP.trim()) {
      setValidationMessage('Jumlah, nama peminjam, instansi/organisasi, keperluan, dan nomor HP wajib diisi.')
      return
    }
    if (!form.tanggalMulai || !form.jamMulai || !form.tanggalJatuhTempo || !form.jamJatuhTempo || !form.tanggalKembali || !form.jamKembali) {
      setValidationMessage('Tanggal dan jam pinjam, jatuh tempo, serta kembali wajib diisi.')
      return
    }
    const loanDateTime = `${form.tanggalMulai}T${form.jamMulai}`
    const dueDateTime = `${form.tanggalJatuhTempo}T${form.jamJatuhTempo}`
    const returnDateTime = `${form.tanggalKembali}T${form.jamKembali}`
    if (dueDateTime < loanDateTime) {
      setValidationMessage('Tanggal dan jam jatuh tempo tidak boleh sebelum waktu pinjam.')
      return
    }
    if (returnDateTime < loanDateTime) {
      setValidationMessage('Tanggal dan jam kembali tidak boleh sebelum waktu pinjam.')
      return
    }
    if (returnDateTime > dueDateTime) {
      setValidationMessage('Tanggal dan jam kembali tidak boleh setelah waktu jatuh tempo.')
      return
    }
    router.post('/ajukan-peminjaman', {
      asset_id: selectedAsset.id,
      quantity: Number(form.jumlah),
      borrower_name: form.nama,
      borrower_names: form.instansi,
      phone: form.noHP,
      purpose: form.keperluan,
      loan_date: form.tanggalMulai,
      loan_time: form.jamMulai,
      due_date: form.tanggalJatuhTempo || null,
      due_time: form.jamJatuhTempo || null,
      return_date: form.tanggalKembali || null,
      return_time: form.jamKembali || null,
      notes: [form.noHP ? `Kontak: ${form.noHP}` : '', form.catatan].filter(Boolean).join('\n') || null,
    }, {
      onSuccess: () => setStep(4),
      onError: (errors) => {
        const message = Object.values(errors).flat().find((value): value is string => typeof value === 'string')
        setValidationMessage(message ?? 'Data pengajuan belum valid. Periksa kembali isian formulir.')
      },
    })
  }

  const steps = ['Pilih Aset', 'Cek Ketersediaan', 'Isi Form', 'Pengajuan Terkirim']

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <NavBar onLogin={onLogin} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>Ajukan Peminjaman Aset</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Ajukan permohonan peminjaman aset yang tersedia</p>
        </div>

        {/* Steps */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: i + 1 <= step ? '#166534' : '#f1f5f9',
                    color: i + 1 <= step ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i + 1 === step ? '#166534' : '#94a3b8', fontWeight: i + 1 === step ? 600 : 400 }}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-2" style={{ background: i + 1 < step ? '#166534' : '#e2e8f0' }} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-6" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#0f172a' }}>Pilih Aset yang Ingin Dipinjam</h2>
              {borrowableAssets.slice(0, 6).map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: selectedAsset?.id === asset.id ? '#166534' : '#e2e8f0',
                    background: selectedAsset?.id === asset.id ? '#f0fdf4' : '#f8fafc',
                  }}
                  onMouseEnter={e => selectedAsset?.id !== asset.id && (e.currentTarget.style.borderColor = '#94a3b8')}
                  onMouseLeave={e => selectedAsset?.id !== asset.id && (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#0f172a' }}>{asset.nama}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{asset.unit} · {asset.lokasi}</div>
                  </div>
                  {selectedAsset?.id === asset.id && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#166534' }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
              <button
                disabled={!selectedAsset}
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold mt-4 transition-colors disabled:opacity-40"
                style={{ background: '#166534' }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#14532d')}
                onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#166534')}
              >
                Cek Ketersediaan →
              </button>
            </div>
          )}

          {step === 2 && selectedAsset && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
                <svg className="w-7 h-7" style={{ color: '#166534' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>{selectedAsset.nama}</h2>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Status: <span className="font-semibold" style={{ color: '#166534' }}>Tersedia untuk dipinjam</span></p>
              </div>
              <div className="rounded-xl p-4 text-left" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span style={{ color: '#64748b' }}>Kode:</span> <span className="font-medium">{selectedAsset.kode}</span></div>
                  <div><span style={{ color: '#64748b' }}>Kategori:</span> <span className="font-medium">{selectedAsset.kategori}</span></div>
                  <div><span style={{ color: '#64748b' }}>Unit:</span> <span className="font-medium">{selectedAsset.unit}</span></div>
                  <div><span style={{ color: '#64748b' }}>Lokasi:</span> <span className="font-medium">{selectedAsset.lokasi}</span></div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => router.visit('/inventaris')} className="flex-1 py-2.5 rounded-xl border text-sm transition-colors" style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >← Kembali</button>
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: '#166534' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
                  onMouseLeave={e => e.currentTarget.style.background = '#166534'}
                >Isi Form →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: '#0f172a' }}>Isi Form Peminjaman</h2>
              {[
                { label: `Jumlah yang dipinjam (tersedia ${selectedAsset?.jumlahTersedia ?? 0} ${selectedAsset?.satuan ?? 'Unit'})`, key: 'jumlah', placeholder: 'Contoh: 1', type: 'number', required: true },
                { label: 'Nama Peminjam', key: 'nama', placeholder: 'Nama lengkap Anda', type: 'text', required: true },
                { label: 'Instansi / Organisasi', key: 'instansi', placeholder: 'Nama instansi atau organisasi', type: 'text', required: true },
                { label: 'Keperluan', key: 'keperluan', placeholder: 'Jelaskan keperluan peminjaman', type: 'text', required: true },
                { label: 'No. HP / WhatsApp', key: 'noHP', placeholder: '08xxxxxxxxxx', type: 'tel', required: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    min={f.key === 'jumlah' ? 1 : undefined}
                    max={f.key === 'jumlah' ? selectedAsset?.jumlahTersedia : undefined}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => {
                      if (f.key === 'jumlah') {
                        const requested = Number(e.target.value)
                        const available = selectedAsset?.jumlahTersedia ?? 0
                        update(f.key, requested > available ? String(available) : e.target.value)
                      } else {
                        update(f.key, e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#166534'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Tanggal Pinjam', key: 'tanggalMulai', required: true },
                  { label: 'Jam Pinjam', key: 'jamMulai', type: 'time', required: true },
                  { label: 'Tanggal Jatuh Tempo', key: 'tanggalJatuhTempo', required: true },
                  { label: 'Jam Jatuh Tempo', key: 'jamJatuhTempo', type: 'time', required: true },
                  { label: 'Tanggal Kembali', key: 'tanggalKembali', required: true },
                  { label: 'Jam Kembali', key: 'jamKembali', type: 'time', required: true },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
                      {f.label} {f.required && <span style={{ color: '#dc2626' }}>*</span>}
                      {f.hint && <span className="ml-1 font-normal" style={{ color: '#94a3b8' }}>({f.hint})</span>}
                    </label>
                    <input
                      type={f.type ?? 'date'}
                      required={f.required}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => update(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#166534'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Catatan <span className="font-normal" style={{ color: '#94a3b8' }}>(opsional)</span></label>
                <textarea
                  value={form.catatan}
                  onChange={e => update('catatan', e.target.value)}
                  placeholder="Tambahkan catatan atau informasi pendukung"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-y"
                  style={{ borderColor: '#e2e8f0', background: '#f9fafb', color: '#0f172a' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#166534'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl border text-sm transition-colors" style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >← Kembali</button>
                <button onClick={submitBorrowing} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: '#166534' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#14532d'}
                  onMouseLeave={e => e.currentTarget.style.background = '#166534'}
                >Kirim Pengajuan →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
                <svg className="w-7 h-7" style={{ color: '#166534' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Pengajuan Terkirim!</h2>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Pengajuan peminjaman Anda telah dikirim dan sedang menunggu persetujuan dari admin.</p>
              </div>
              <div className="rounded-xl p-3 text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p style={{ color: '#166534' }}>Nomor Pengajuan: <strong>PJM-2024-{Math.floor(Math.random() * 900) + 100}</strong></p>
                <p className="mt-1" style={{ color: '#64748b' }}>Kami akan menghubungi Anda melalui nomor HP yang diberikan.</p>
              </div>
              <button
                onClick={() => router.visit('/inventaris')}
                className="w-full py-2.5 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: '#166534', color: '#166534', background: '#f0fdf4' }}
              >
                Ajukan Peminjaman Lain
              </button>
            </div>
          )}
        </div>
      </div>
      {validationMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="validation-modal-title">
           <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl" style={{ borderColor: '#e2e8f0' }}>
             <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#fef2f2', color: '#dc2626' }}>
               <X className="h-6 w-6" />
             </div>
             <h2 id="validation-modal-title" className="text-center text-base font-bold" style={{ color: '#0f172a' }}>Periksa Isian Form</h2>
             <p className="mt-2 text-center text-sm leading-6" style={{ color: '#64748b' }}>{validationMessage}</p>
             <button
               type="button"
               onClick={() => setValidationMessage(null)}
               className="mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
               style={{ background: '#166534' }}
             >
               Mengerti
             </button>
           </div>
        </div>
      )}
    </div>
  )
}
