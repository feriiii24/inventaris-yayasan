import { router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import AssetActionModal, { type AssetModalField } from '../../components/AssetActionModal'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DashboardLayout from '../../Layouts/DashboardLayout'
import { getAssetDetailRoute, getAssetEditRoute, getPageRoute } from '../../config/pageRoutes'

const conditionColors: Record<string, { bg: string; color: string }> = {
  Baik: { bg: '#dcfce7', color: '#166534' },
  'Rusak Ringan': { bg: '#fef3c7', color: '#b45309' },
  'Rusak Berat': { bg: '#fee2e2', color: '#b91c1c' },
  'Dalam Perbaikan': { bg: '#ede9fe', color: '#6d28d9' },
  Sedang: { bg: '#fef3c7', color: '#b45309' },
  Buruk: { bg: '#fee2e2', color: '#b91c1c' },
}

const formatCurrency = (value: unknown) => {
  const numericValue = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.-]/g, ''))

  if (!Number.isFinite(numericValue)) return 'Rp 0'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

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

function ConditionBadge({ value }: { value: string }) {
  const style = conditionColors[value] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
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

function StatCard({
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
  icon: ReactNode
  accent: string
  iconBg: string
  iconColor: string
  cardBg: string
  textColor: string
  detailColor: string
}) {
  return (
    <div
      className="group relative h-full min-h-[146px] overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
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

export default function InventarisPage({ rows: initialRows = [], totalRows, totalUnits }: { rows?: Array<Record<string, any>>; totalRows?: number; totalUnits?: number }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? null
  const isAdminUnit = authRole === 'admin_unit' || /admin[_\s-]?unit/i.test(String(authRole ?? ''))
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const [rows, setRows] = useState<Array<Record<string, any>>>(initialRows)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    asalBarang: '',
    kondisi: '',
    lokasi: '',
    unit: '',
    pageSize: '10',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create')
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null)
  const [repairTarget, setRepairTarget] = useState<Record<string, any> | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('inventaris-toast')
      window.localStorage.setItem('inventaris-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('inventaris-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('inventaris-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const modalFields: AssetModalField[] = [
    { name: 'tanggalPembukuan', label: 'Tanggal Pembukuan', type: 'date' },
    { name: 'kode', label: 'Kode Aset', type: 'text' },
    { name: 'nama', label: 'Nama Aset', type: 'text' },
    { name: 'spesifikasi', label: 'Spesifikasi', type: 'textarea' },
    { name: 'jumlah', label: 'Jumlah', type: 'number' },
    { name: 'satuan', label: 'Satuan', type: 'text' },
    { name: 'asalBarang', label: 'Asal Barang', type: 'text' },
    { name: 'tahunPengadaan', label: 'Tahun Pengadaan', type: 'number' },
    { name: 'kondisi', label: 'Kondisi', type: 'select', options: [{ label: 'Baik', value: 'Baik' }, { label: 'Sedang', value: 'Sedang' }, { label: 'Buruk', value: 'Buruk' }] },
    { name: 'hargaPerolehan', label: 'Harga Perolehan', type: 'text' },
    { name: 'lokasi', label: 'Lokasi', type: 'text' },
    { name: 'unit', label: 'Unit', type: 'text' },
  ]

  const filterOptions = useMemo(() => {
    const makeStringOptions = (values: Array<string | null | undefined>) =>
      [...new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]

    return {
      asalBarang: makeStringOptions(rows.map((row) => row.asalBarang)),
      kondisi: makeStringOptions(rows.map((row) => row.kondisi)),
      lokasi: makeStringOptions(rows.map((row) => row.lokasi)),
      unit: makeStringOptions(rows.map((row) => row.unit)),
    }
  }, [rows])

  const summaryStats = useMemo(() => {
    const numericValue = (value: unknown) => {
      const asNumber = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
      return Number.isFinite(asNumber) ? asNumber : 0
    }

    const total = typeof totalUnits === 'number' ? totalUnits : rows.reduce((sum, row) => {
      const value = numericValue(row.jumlah)
      return sum + (value > 0 ? value : 1)
    }, 0)

    const baik = rows.reduce((sum, row) => {
      const value = numericValue(row.jumlah_baik ?? row.jumlahBaik)
      if (value > 0) return sum + value

      const rawValue = String(row.kondisi ?? row.condition_status ?? row.status ?? '').trim().toLowerCase()
      return rawValue.includes('baik') ? sum + 1 : sum
    }, 0)

    const rusakRingan = rows.reduce((sum, row) => {
      const value = numericValue(row.jumlah_rusak_ringan ?? row.jumlahRusakRingan)
      if (value > 0) return sum + value

      const rawValue = String(row.kondisi ?? row.condition_status ?? row.status ?? '').trim().toLowerCase()
      return rawValue.includes('ringan') || rawValue.includes('sedang') ? sum + 1 : sum
    }, 0)

    const rusakBerat = rows.reduce((sum, row) => {
      const value = numericValue(row.jumlah_rusak_berat ?? row.jumlahRusakBerat)
      if (value > 0) return sum + value

      const rawValue = String(row.kondisi ?? row.condition_status ?? row.status ?? '').trim().toLowerCase()
      return rawValue.includes('berat') || rawValue.includes('buruk') ? sum + 1 : sum
    }, 0)

    const dalamPerbaikan = rows.reduce((sum, row) => {
      const value = numericValue(row.jumlah_dalam_perbaikan ?? row.jumlahDalamPerbaikan)
      if (value > 0) return sum + value

      const rawValue = String(row.kondisi ?? row.condition_status ?? row.status ?? '').trim().toLowerCase()
      return rawValue.includes('perbaikan') ? sum + 1 : sum
    }, 0)

    const uniqueLokasi = new Set(rows.map((row) => row.lokasi).filter(Boolean)).size
    const uniqueUnit = new Set(rows.map((row) => row.unit).filter(Boolean)).size

    return {
      total,
      baik,
      rusakRingan,
      rusakBerat,
      dalamPerbaikan,
      lokasi: uniqueLokasi,
      unit: uniqueUnit,
    }
  }, [rows, totalUnits])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesAsalBarang = !filters.asalBarang || row.asalBarang === filters.asalBarang
      const matchesKondisi = !filters.kondisi || row.kondisi === filters.kondisi
      const matchesLokasi = !filters.lokasi || row.lokasi === filters.lokasi
      const matchesUnit = !filters.unit || row.unit === filters.unit
      return matchesAsalBarang && matchesKondisi && matchesLokasi && matchesUnit
    })
  }, [rows, filters])

  const handleOpenCreate = () => {
    router.visit('/inventaris/aset-inventaris/create')
  }

  const handleOpenEdit = (row: Record<string, any>) => {
    router.visit(`/inventaris/aset-inventaris/${row.id ?? row.no}/edit`)
  }

  const handleOpenDetail = (row: Record<string, any>) => {
    router.visit(`/inventaris/aset-inventaris/${row.id ?? row.no}`)
  }

  const handleDelete = (row: Record<string, any>) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    const assetId = deleteTarget.id ?? deleteTarget.no
    router.delete(`/inventaris/aset-inventaris/${assetId}`, {
      onSuccess: () => {
        setRows((currentRows) => currentRows.filter((item) => String(item.id ?? item.no) !== String(assetId)))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Aset berhasil dihapus.' })
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus aset. Silakan coba lagi.' })
      },
    })
  }

  const confirmRepair = () => {
    if (!repairTarget) return
    const assetId = repairTarget.id ?? repairTarget.no
    router.post(`/inventaris/aset-inventaris/${assetId}/repair`, {}, {
      onSuccess: () => {
        setRepairTarget(null)
        persistNotice({ type: 'success', message: 'Aset dipindahkan ke status Dalam Perbaikan.' })
        router.reload({ only: ['rows'] })
      },
      onError: () => {
        setRepairTarget(null)
        persistNotice({ type: 'error', message: 'Gagal memulai perbaikan aset.' })
      },
    })
  }

  const handleSave = (values: Record<string, any>) => {
    if (modalMode === 'create') {
      const nextNo = rows.length ? Math.max(...rows.map((item) => item.no)) + 1 : 1
      const nextRow = {
        ...values,
        id: String(nextNo),
        no: nextNo,
        jumlah: Number(values.jumlah ?? 0),
        tahunPengadaan: Number(values.tahunPengadaan ?? 0),
      }
      setRows((currentRows) => [nextRow as Record<string, any>, ...currentRows])
      persistNotice({ type: 'success', message: 'Aset berhasil ditambahkan.' })
    }

    if (modalMode === 'edit' && selectedRow) {
      setRows((currentRows) =>
        currentRows.map((item) =>
          item.no === selectedRow.no
            ? { ...item, ...values, jumlah: Number(values.jumlah ?? item.jumlah), tahunPengadaan: Number(values.tahunPengadaan ?? item.tahunPengadaan) }
            : item,
        ),
      )
      persistNotice({ type: 'success', message: 'Perubahan aset berhasil disimpan.' })
    }

    setModalOpen(false)
    setSelectedRow(null)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setFilters({ asalBarang: '', kondisi: '', lokasi: '', unit: '', pageSize: '10' })
  }

  const SelectField = ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder: string
  }) => {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const uniqueOptions = Array.from(new Map(
      options
        .map((option) => option.trim())
        .filter(Boolean)
        .map((option) => [option.toLocaleLowerCase(), option]),
    ).values())

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={wrapperRef} className="relative min-w-[150px] flex-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 pr-8 text-[13px] text-left transition-all duration-200 ease-out"
          style={{
            borderColor: open ? '#166534' : '#e2e8f0',
            color: '#334155',
            boxShadow: open ? '0 0 0 3px rgba(22, 101, 52, 0.08)' : 'none',
            transform: open ? 'translateY(-1px)' : 'translateY(0)',
          }}
        >
          <span className="truncate">{value || placeholder}</span>
          <svg
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border bg-white shadow-lg transition-all duration-200 ease-out"
          style={{
            borderColor: '#e2e8f0',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.98)',
            transformOrigin: 'top center',
            maxHeight: open ? '240px' : '0px',
            pointerEvents: open ? 'auto' : 'none',
            overflowY: open ? 'auto' : 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-slate-50"
              style={{ color: !value ? '#166534' : '#475569', fontWeight: !value ? 600 : 400 }}
            >
              {placeholder}
            </button>
            {uniqueOptions.map((option) => (
              <button
                key={option.toLocaleLowerCase()}
                type="button"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-slate-50"
                style={{ color: value === option ? '#166534' : '#475569', fontWeight: value === option ? 600 : 400 }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const PageSizeField = () => {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const pageSizeOptions = ['10', '20', '50', 'Tampilkan semua']

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={wrapperRef} className="relative min-w-[110px] flex-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 pr-8 text-[13px] text-left transition-all duration-200 ease-out"
          style={{
            borderColor: open ? '#166534' : '#e2e8f0',
            color: '#334155',
            boxShadow: open ? '0 0 0 3px rgba(22, 101, 52, 0.08)' : 'none',
            transform: open ? 'translateY(-1px)' : 'translateY(0)',
          }}
        >
          <span>{filters.pageSize === 'Tampilkan semua' ? 'Tampilkan semua' : `${filters.pageSize} / Baris`}</span>
          <svg
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border bg-white shadow-lg transition-all duration-200 ease-out"
          style={{
            borderColor: '#e2e8f0',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.98)',
            transformOrigin: 'top center',
            maxHeight: open ? '160px' : '0px',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {pageSizeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setFilters((prev) => ({ ...prev, pageSize: option }))
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-slate-50"
              style={{ color: filters.pageSize === option ? '#166534' : '#475569', fontWeight: filters.pageSize === option ? 600 : 400 }}
            >
              {option === 'Tampilkan semua' ? 'Tampilkan semua' : `${option} / Baris`}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout role={layoutRole} currentPage='asset-inventaris'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus aset inventaris"
        message={deleteTarget ? `Apakah Anda yakin ingin menghapus aset ${deleteTarget.nama}? Tindakan ini tidak dapat dibatalkan.` : 'Hapus aset ini?'}
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        tone="danger"
      />
      <ConfirmDialog
        open={Boolean(repairTarget)}
        title="Mulai perbaikan aset"
        message={repairTarget ? `Mulai perbaikan untuk aset ${repairTarget.nama}?` : 'Mulai perbaikan aset ini?'}
        confirmLabel="Ya, perbaiki"
        cancelLabel="Batal"
        onConfirm={confirmRepair}
        onCancel={() => setRepairTarget(null)}
        tone="info"
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm-8 6l-8-4v8l8 4 8-4v-8l-8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Inventaris</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Aset Inventaris</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-emerald-50 hover:shadow-lg active:translate-y-0"
            >
              <svg className="h-4 w-4 transition-transform duration-300 ease-out group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Aset
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            title="Total aset"
            value={summaryStats.total}
            detail={`${(totalRows ?? rows.length).toLocaleString('id-ID')} data aset`}
            accent="#64748b"
            iconBg="#f1f5f9"
            iconColor="#0f172a"
            cardBg="#ffffff"
            textColor="#0f172a"
            detailColor="#64748b"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm-8 6l-8-4v8l8 4 8-4v-8l-8 4z" />
              </svg>
            )}
          />
          <StatCard
            title="Baik"
            value={summaryStats.baik}
            detail="Prima"
            accent="#16a34a"
            iconBg="#dcfce7"
            iconColor="#166534"
            cardBg="#f0fdf4"
            textColor="#166534"
            detailColor="#15803d"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
              </svg>
            )}
          />
          <StatCard
            title="Ringan"
            value={summaryStats.rusakRingan}
            detail="Perlu cek"
            accent="#d97706"
            iconBg="#fef3c7"
            iconColor="#b45309"
            cardBg="#fffbeb"
            textColor="#b45309"
            detailColor="#b45309"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
          />
          <StatCard
            title="Berat"
            value={summaryStats.rusakBerat}
            detail="Urgent"
            accent="#dc2626"
            iconBg="#fee2e2"
            iconColor="#b91c1c"
            cardBg="#fef2f2"
            textColor="#b91c1c"
            detailColor="#b91c1c"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <StatCard
            title="Perbaikan"
            value={summaryStats.dalamPerbaikan}
            detail="Diproses"
            accent="#7c3aed"
            iconBg="#ede9fe"
            iconColor="#6d28d9"
            cardBg="#f5f3ff"
            textColor="#6d28d9"
            detailColor="#7c3aed"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.7 6.3a1 1 0 011.4 0l2.6 2.6a1 1 0 010 1.4l-7.3 7.3-4.2 1.1 1.1-4.2 7.4-7.2zM13 5l2 2M3 21l3.5-1" />
              </svg>
            )}
          />
          {!isAdminUnit && (
            <StatCard
              title="Unit"
              value={summaryStats.unit}
              detail="Unit terdaftar"
              accent="#1e293b"
              iconBg="#e2e8f0"
              iconColor="#0f172a"
              cardBg="#f8fafc"
              textColor="#0f172a"
              detailColor="#475569"
              icon={(
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            />
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-9zM8 5v14M16 5v14M4 10h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Data Aset Inventaris</h2>
                <p className="mt-0.5 text-xs text-slate-500">Ringkasan aset yang terdaftar dan aktif di unit kerja</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {filteredRows.length} data terfilter
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner shadow-slate-100/60">
            <AssetPageTable
              title=""
              subtitle=""
              rows={filteredRows}
              pageSize={filters.pageSize === 'Tampilkan semua' ? Math.max(filteredRows.length || 10, 10) : Number(filters.pageSize) || 10}
              searchPlaceholder="Cari kode, nama, lokasi, unit..."
              emptyMessage="Data tidak ditemukan"
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              toolbar={(
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-[220px]">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Cari kode, nama, lokasi, unit..."
                      className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-[13px] outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                      onFocus={(event) => {
                        event.currentTarget.style.borderColor = '#166534'
                        event.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 101, 52, 0.08)'
                      }}
                      onBlur={(event) => {
                        event.currentTarget.style.borderColor = '#e2e8f0'
                        event.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <AnimatedSelect
                    value={filters.asalBarang}
                    onChange={(value) => setFilters((prev) => ({ ...prev, asalBarang: value }))}
                    options={filterOptions.asalBarang}
                    placeholder="Asal Barang"
                    minWidth="170px"
                  />

                  <AnimatedSelect
                    value={filters.kondisi}
                    onChange={(value) => setFilters((prev) => ({ ...prev, kondisi: value }))}
                    options={filterOptions.kondisi}
                    placeholder="Kondisi"
                    minWidth="170px"
                  />

                  <AnimatedSelect
                    value={filters.lokasi}
                    onChange={(value) => setFilters((prev) => ({ ...prev, lokasi: value }))}
                    options={filterOptions.lokasi}
                    placeholder="Lokasi"
                    minWidth="170px"
                  />

                  {!isAdminUnit && (
                    <AnimatedSelect
                      value={filters.unit}
                      onChange={(value) => setFilters((prev) => ({ ...prev, unit: value }))}
                      options={filterOptions.unit}
                      placeholder="Unit"
                      minWidth="170px"
                    />
                  )}

                  <PageSizeField />

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-medium transition-colors"
                    style={{ borderColor: '#e2e8f0', color: '#475569', background: '#ffffff' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                    </svg>
                    Reset
                  </button>
                </div>
              )}
              renderQuickActions={(row) => (
                ['Rusak Ringan', 'Rusak Berat'].includes(String(row.kondisi)) ? (
                  <button
                    type="button"
                    title="Perbaiki Aset"
                    aria-label="Perbaiki Aset"
                    onClick={() => setRepairTarget(row)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
                  >
                    Perbaiki
                  </button>
                ) : null
              )}
              renderActions={(row) => (
                <>
                  <ActionButton title="Lihat Detail" onClick={() => handleOpenDetail(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Edit Aset" onClick={() => handleOpenEdit(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Hapus Aset" variant="danger" onClick={() => handleDelete(row)}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </ActionButton>
                </>
              )}
              columns={[
                { key: 'no', label: 'No', className: 'w-[52px] text-center' },
                { key: 'tanggalPembukuan', label: 'Tanggal Pembukuan', className: 'w-[120px] whitespace-nowrap' },
                { key: 'kode', label: 'Kode Aset', className: 'w-[130px] whitespace-nowrap', render: (value) => <span className="font-medium" style={{ color: '#166534' }}>{String(value)}</span> },
                { key: 'nama', label: 'Nama Aset', className: 'w-[220px]' },
                { key: 'spesifikasi', label: 'Spesifikasi', className: 'w-[260px]' },
                { key: 'jumlah', label: 'Jumlah', className: 'w-[80px] text-center' },
                { key: 'satuan', label: 'Satuan', className: 'w-[80px] text-center' },
                { key: 'asalBarang', label: 'Asal Barang', className: 'w-[110px] whitespace-nowrap' },
                { key: 'tahunPengadaan', label: 'Tahun Pengadaan', className: 'w-[110px] whitespace-nowrap' },
                {
                  key: 'kondisi',
                  label: 'Kondisi',
                  className: 'w-[110px]',
                  render: (value) => <ConditionBadge value={String(value || 'Baik')} />,
                },
                {
                  key: 'hargaPerolehan',
                  label: 'Harga Perolehan',
                  className: 'w-[150px] whitespace-nowrap text-right font-medium',
                  render: (value) => <span style={{ color: '#0f172a' }}>{formatCurrency(value)}</span>,
                },
                { key: 'lokasi', label: 'Lokasi', className: 'w-[180px]' },
                isAdminUnit
                  ? { key: 'ruangan', label: 'Ruangan', className: 'w-[170px]' }
                  : { key: 'unit', label: 'Unit', className: 'w-[170px]' },
              ]}
            />
          </div>
        </div>
      </div>

      <AssetActionModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'Tambah Aset Inventaris' : modalMode === 'edit' ? 'Edit Aset Inventaris' : 'Detail Aset Inventaris'}
        fields={modalFields}
        initialValues={selectedRow ?? {
          no: '',
          tanggalPembukuan: '',
          kode: '',
          nama: '',
          spesifikasi: '',
          jumlah: 0,
          satuan: 'Unit',
          asalBarang: '',
          tahunPengadaan: new Date().getFullYear(),
          kondisi: 'Baik',
          hargaPerolehan: '',
          lokasi: '',
          unit: '',
        }}
        onClose={() => {
          setModalOpen(false)
          setSelectedRow(null)
        }}
        onSave={handleSave}
      />
    </DashboardLayout>
  )
}
