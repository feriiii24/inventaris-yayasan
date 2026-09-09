import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'
import { getAssetEditRoute } from '../config/pageRoutes'

export const statusColors: Record<string, { bg: string; color: string }> = {
  Baik: { bg: '#dcfce7', color: '#166534' },
  'Rusak Ringan': { bg: '#fef3c7', color: '#d97706' },
  'Rusak Berat': { bg: '#fee2e2', color: '#dc2626' },
  'Dalam Perbaikan': { bg: '#dbeafe', color: '#1d4ed8' },
  Aktif: { bg: '#dcfce7', color: '#166534' },
  Dipinjam: { bg: '#fef3c7', color: '#d97706' },
  'Dalam Mutasi': { bg: '#dbeafe', color: '#1d4ed8' },
  'Tidak Aktif': { bg: '#f1f5f9', color: '#64748b' },
  Sukses: { bg: '#dcfce7', color: '#166534' },
  Proses: { bg: '#dbeafe', color: '#1d4ed8' },
}

export const tabs = ['Informasi', 'Riwayat', 'Mutasi', 'Dokumen', 'Perubahan Kondisi'] as const

type TabName = (typeof tabs)[number]

function toDisplayText(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, any>

    if (typeof obj.name === 'string' && obj.name.trim()) return obj.name
    if (typeof obj.label === 'string' && obj.label.trim()) return obj.label
    if (typeof obj.value === 'string' && obj.value.trim()) return obj.value

    return JSON.stringify(obj)
  }

  return String(value)
}

export function Badge({ label }: { label: string }) {
  const resolvedLabel = toDisplayText(label)
  const style = statusColors[resolvedLabel] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {resolvedLabel || '-'}
    </span>
  )
}

export function DetailField({ label, value }: { label: string; value: string | number | undefined | null }) {
  const resolvedValue = toDisplayText(value)

  return (
    <div>
      <dt className="mb-0.5 text-xs font-medium" style={{ color: '#64748b' }}>{label}</dt>
      <dd className="text-sm font-medium" style={{ color: '#0f172a' }}>{resolvedValue || '-'}</dd>
    </div>
  )
}

function AnimatedNumber({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frameId = 0
    let startTime: number | null = null

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frameId)
  }, [value, duration])

  return <span>{displayValue}</span>
}

function SummaryStatCard({
  title,
  value,
  detail,
  icon,
  accent,
  iconBg,
  iconColor,
  cardBg,
  textColor,
  detailColor,
}: {
  title: string
  value: number
  detail: string
  icon: React.ReactNode
  accent: string
  iconBg: string
  iconColor: string
  cardBg: string
  textColor: string
  detailColor: string
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: accent + '55', background: cardBg }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: detailColor }}>{title}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight" style={{ color: textColor }}>
            <AnimatedNumber value={value} />
          </div>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
          style={{ background: iconBg, color: iconColor, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 text-xs" style={{ color: detailColor }}>{detail}</div>
    </div>
  )
}

export function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? `Rp ${numericValue.toLocaleString('id-ID')}` : 'Rp 0'
}

function getAssetValue(asset: Record<string, any> | undefined, keys: string[]) {
  for (const key of keys) {
    let current: any = asset
    for (const part of key.split('.')) {
      if (current === null || current === undefined) {
        current = undefined
        break
      }
      current = current[part]
    }

    if (current !== null && current !== undefined && current !== '') {
      return current
    }
  }

  return ''
}

const conditionHistory = [
  {
    tanggal: '15 Jan 2024',
    kondisi: 'Baik',
    catatan: 'Kondisi baik setelah pemeriksaan rutin',
    oleh: 'Ahmad Fauzi',
  },
  {
    tanggal: '10 Des 2023',
    kondisi: 'Baik',
    catatan: 'Pemeriksaan semester — kondisi prima',
    oleh: 'Siti Rahayu',
  },
]

const mutationHistory = [
  {
    tanggal: '12 Apr 2024',
    jenis: 'Pemindahan Unit',
    dari: 'Unit Pendidikan A',
    ke: 'Unit Kesehatan B',
    status: 'Sukses',
  },
  {
    tanggal: '03 Jan 2024',
    jenis: 'Perbaikan',
    dari: 'Ruang Admin',
    ke: 'Workshop IT',
    status: 'Proses',
  },
]

const documentList = [
  { nama: 'SPK-Pembelian-2024.pdf', tipe: 'PDF', ukuran: '1.2 MB', tanggal: '12 Apr 2024' },
  { nama: 'Foto-Asset-Inventory.jpg', tipe: 'Image', ukuran: '2.4 MB', tanggal: '08 Apr 2024' },
  { nama: 'BAP-Pemeriksaan-Aset.docx', tipe: 'DOCX', ukuran: '540 KB', tanggal: '20 Mar 2024' },
]

export function AssetDetailTemplate({
  onBack,
  asset,
  title = 'Detail Aset',
  infoRows,
}: {
  onBack: () => void
  asset: Record<string, any>
  title?: string
  infoRows?: Array<{ label: string; value: string }>
}) {
  const [activeTab, setActiveTab] = useState<TabName>('Informasi')
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImageFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const resolvedInfoRows = infoRows ?? [
    { label: 'Kode Aset', value: String(getAssetValue(asset, ['asset_code', 'kode']) || '') },
    { label: 'Nama Aset', value: String(getAssetValue(asset, ['name', 'nama']) || '') },
    { label: 'Kategori', value: String(getAssetValue(asset, ['kategori', 'category.name', 'category']) || '') },
    { label: 'Jenis Aset', value: String(getAssetValue(asset, ['jenis', 'type.name']) || '') },
    { label: 'Unit', value: String(getAssetValue(asset, ['unit.name', 'unit', 'unit_name']) || '') },
    { label: 'Lokasi', value: String(getAssetValue(asset, ['location.name', 'lokasi', 'location']) || '') },
    { label: 'Ruangan', value: String(getAssetValue(asset, ['room.name', 'ruangan']) || '') },
    { label: 'Tahun Perolehan', value: String(getAssetValue(asset, ['acquisition_year', 'tahunPengadaan']) || '') },
    { label: 'Tanggal Perolehan', value: String(getAssetValue(asset, ['start_operation_date', 'tanggalPerolehan', 'dibuat']) || '') },
    { label: 'Harga Perolehan', value: formatCurrency(getAssetValue(asset, ['purchase_value', 'hargaPerolehan', 'nilaiPerolehan'])) },
    { label: 'Sumber Dana', value: String(getAssetValue(asset, ['acquisition_source', 'asalBarang', 'sumberDana']) || '') },
    { label: 'Penanggung Jawab', value: String(getAssetValue(asset, ['owner_name', 'penanggungjawab']) || '') },
    { label: 'Spesifikasi', value: String(getAssetValue(asset, ['description', 'spesifikasi']) || '') },
    { label: 'Jumlah', value: String(getAssetValue(asset, ['quantity', 'jumlah']) || '') },
    { label: 'Satuan', value: String(getAssetValue(asset, ['unit_measure', 'satuan']) || '') },
    { label: 'Asal Barang', value: String(getAssetValue(asset, ['acquisition_source', 'asalBarang']) || '') },
    { label: 'Bentuk Aset', value: String(getAssetValue(asset, ['bentukAset']) || '') },
    { label: 'Dasar Hak', value: String(getAssetValue(asset, ['legal_basis', 'dasarHak']) || '') },
    { label: 'Atas Nama', value: String(getAssetValue(asset, ['owner_name', 'atasNama']) || '') },
    { label: 'Nomor Registrasi', value: String(getAssetValue(asset, ['registration_number', 'nomorRegistrasi']) || '') },
    { label: 'Jangka Waktu', value: String(getAssetValue(asset, ['jangkaWaktu', 'start_operation_date']) || '') },
    { label: 'Pengelola', value: String(getAssetValue(asset, ['pengelola']) || '') },
    { label: 'Mulai Operasional', value: String(getAssetValue(asset, ['start_operation_date', 'mulaiOperasional']) || '') },
    { label: 'Dasar Perjanjian', value: String(getAssetValue(asset, ['legal_basis', 'dasarPerjanjian']) || '') },
    { label: 'Dibuat', value: String(getAssetValue(asset, ['dibuat', 'created_at']) || '') },
    { label: 'Keterangan', value: String(getAssetValue(asset, ['description', 'keterangan']) || '') },
  ].filter((row) => row.value)

  const assetCode = toDisplayText(getAssetValue(asset, ['asset_code', 'kode']) || '-')
  const assetName = toDisplayText(getAssetValue(asset, ['name', 'nama']) || '-')
  const assetCategory = toDisplayText(getAssetValue(asset, ['category.name', 'kategori']) || '-')
  const assetCondition = toDisplayText(getAssetValue(asset, ['condition_status', 'kondisi']) || 'Baik')
  const assetStatus = toDisplayText(getAssetValue(asset, ['status', 'asset_status']) || 'Aktif')
  const assetUnit = toDisplayText(getAssetValue(asset, ['unit.name', 'unit', 'unit_name']) || '-')
  const assetLocation = toDisplayText(getAssetValue(asset, ['location.name', 'lokasi', 'location']) || '-')
  const assetValue = formatCurrency(getAssetValue(asset, ['purchase_value', 'hargaPerolehan', 'nilaiPerolehan']))
  const photoValue = getAssetValue(asset, ['foto_url', 'fotoUrl', 'foto', 'photo_url', 'photo', 'gambar'])
  const imageUrl = typeof photoValue === 'string' && photoValue.trim() ? photoValue : ''

  const summaryCards = [
    {
      title: 'Jumlah',
      value: 1,
      detail: 'Aset terpilih',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm-8 6l-8-4v8l8 4 8-4v-8l-8 4z" />
        </svg>
      ),
    },
    {
      title: 'Baik',
      value: assetCondition === 'Baik' ? 1 : 0,
      detail: 'Kondisi prima',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
        </svg>
      ),
    },
    {
      title: 'Rusak Ringan',
      value: assetCondition === 'Rusak Ringan' ? 1 : 0,
      detail: 'Butuh cek',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      ),
    },
    {
      title: 'Rusak Berat',
      value: assetCondition === 'Rusak Berat' ? 1 : 0,
      detail: 'Urgent',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Perbaikan',
      value: assetCondition === 'Dalam Perbaikan' ? 1 : 0,
      detail: 'Diproses',
      accent: '#64748b',
      iconBg: '#f1f5f9',
      iconColor: '#0f172a',
      cardBg: '#ffffff',
      textColor: '#0f172a',
      detailColor: '#64748b',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 011.4 0l2.6 2.6a1 1 0 010 1.4l-7.3 7.3-4.2 1.1 1.1-4.2 7.4-7.2zM13 5l2 2M3 21l3.5-1" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Aset</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.visit(getAssetEditRoute(asset.id ?? 1, String(getAssetValue(asset, ['category.slug']) || 'inventaris')))}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(22,101,52,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Mutasi
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 md:w-32">
                {imageUrl ? (
                  <button
                    type="button"
                    aria-label="Lihat foto penuh"
                    onClick={() => setIsImageFullscreen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setIsImageFullscreen(true)
                      }
                    }}
                    className="group relative block h-full w-full cursor-pointer overflow-hidden p-0 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <img src={imageUrl} alt={assetName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/10 group-hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">Lihat foto penuh</span>
                    </div>
                  </button>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{assetCategory}</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">{assetName}</h2>
                    <p className="mt-1 font-mono text-xs text-slate-500">{assetCode}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge label={assetCondition} />
                    <Badge label={assetStatus} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {summaryCards.map((card) => (
                    <SummaryStatCard
                      key={card.title}
                      title={card.title}
                      value={card.value}
                      detail={card.detail}
                      accent={card.accent}
                      icon={card.icon}
                      iconBg={card.iconBg}
                      iconColor={card.iconColor}
                      cardBg={card.cardBg}
                      textColor={card.textColor}
                      detailColor={card.detailColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
              <span>Ringkasan</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-emerald-300">Live</span>
            </div>

            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Kondisi</span>
                <span className="text-sm font-semibold text-white">{assetCondition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Unit</span>
                <span className="text-sm font-semibold text-white">{assetUnit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Nilai</span>
                <span className="text-sm font-semibold text-emerald-300">{assetValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="-mb-px border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200"
              style={{
                borderColor: activeTab === tab ? '#166534' : 'transparent',
                color: activeTab === tab ? '#166534' : '#64748b',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isImageFullscreen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setIsImageFullscreen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setIsImageFullscreen(false)
              }}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Tutup
            </button>
            <img src={imageUrl} alt={assetName} className="max-h-[85vh] w-full object-contain" />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {activeTab === 'Informasi' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resolvedInfoRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <DetailField label={row.label} value={row.value} />
              </div>
            ))}

            {asset.deskripsi && (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Deskripsi</dt>
                <dd className="text-sm leading-6 text-slate-700">{asset.deskripsi}</dd>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Riwayat' && (
          <div className="space-y-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Riwayat perubahan aset ini</p>
            {(asset.activities ?? []).slice(0, 4).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {activity.pengguna.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">
                    {activity.pengguna} <span className="font-normal text-slate-500">— {activity.aktivitas}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{activity.waktu}</div>
                </div>
                <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ background: statusColors[activity.status]?.bg ?? '#f1f5f9', color: statusColors[activity.status]?.color ?? '#64748b' }}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Mutasi' && (
          <div className="space-y-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Riwayat mutasi aset</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-slate-600">Tanggal</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Jenis</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Dari</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Ke</th>
                    <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mutationHistory.map((item) => (
                    <tr key={`${item.tanggal}-${item.jenis}`} className="border-t border-slate-200 bg-white">
                      <td className="px-3 py-2 text-slate-700">{item.tanggal}</td>
                      <td className="px-3 py-2 text-slate-700">{item.jenis}</td>
                      <td className="px-3 py-2 text-slate-500">{item.dari}</td>
                      <td className="px-3 py-2 text-slate-500">{item.ke}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ background: statusColors[item.status]?.bg ?? '#f1f5f9', color: statusColors[item.status]?.color ?? '#64748b' }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Dokumen' && (
          <div className="space-y-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Dokumen pendukung aset</p>
            <div className="grid gap-3 md:grid-cols-3">
              {documentList.map((doc) => (
                <div key={doc.nama} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V7l-5-5H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{doc.nama}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{doc.tipe} · {doc.ukuran}</div>
                  <div className="mt-2 text-[11px] text-slate-400">{doc.tanggal}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Perubahan Kondisi' && (
          <div className="space-y-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Catatan kondisi aset</p>
            {conditionHistory.map((item) => (
              <div key={`${item.tanggal}-${item.kondisi}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-800">{item.kondisi}</div>
                  <span className="rounded-full px-2 py-1 text-[11px] font-medium" style={{ background: statusColors[item.kondisi]?.bg ?? '#f1f5f9', color: statusColors[item.kondisi]?.color ?? '#64748b' }}>
                    {item.tanggal}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.catatan}</p>
                <p className="mt-2 text-[11px] text-slate-500">Oleh: {item.oleh}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
