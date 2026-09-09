import { router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'
import AnimatedSelect from '../../../components/ui/AnimatedSelect'
import DashboardLayout from '../../../Layouts/DashboardLayout'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'

type BorrowingForm = {
  asset_id: string
  quantity: string
  borrower_unit_id: string
  borrower_name: string
  loan_date: string
  loan_time: string
  due_date: string
  due_time: string
  return_date: string
  return_time: string
  purpose: string
  notes: string
  status: string
}

type AssetOption = {
  id: string | number
  name: string
  kode?: string
  unit_id?: string | number | null
  unit_name?: string
  jumlah?: number | string
  available?: number | string
  available_quantity?: number | string
  quantity?: number | string
  stok?: number | string
  stock?: number | string
}
type UnitOption = { id: string | number; name: string }

export default function EditBorrowingPage({ borrowing, assets = [], units = [], current_unit_id }: { borrowing?: Record<string, any>; assets?: AssetOption[]; units?: UnitOption[]; current_unit_id?: string | number | null }) {
  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'
  const currentUnitId = current_unit_id ? String(current_unit_id) : ''

  const [form, setForm] = useState<BorrowingForm>({
    asset_id: String(borrowing?.asset_id ?? ''),
    quantity: String(borrowing?.quantity ?? '1'),
    borrower_unit_id: currentUnitId || String(borrowing?.borrower_unit_id ?? ''),
    borrower_name: borrowing?.borrower_name ?? '',
    loan_date: borrowing?.loan_date ?? new Date().toISOString().slice(0, 10),
    loan_time: borrowing?.loan_time ?? '08:00',
    due_date: borrowing?.due_date ?? '',
    due_time: borrowing?.due_time ?? '',
    return_date: borrowing?.return_date ?? '',
    return_time: borrowing?.return_time ?? '',
    purpose: borrowing?.purpose ?? '',
    notes: borrowing?.notes ?? '',
    status: borrowing?.status ?? 'pending',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const allowSubmitRef = useRef(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [selectedDocumentName, setSelectedDocumentName] = useState('')

  const getAssetStock = (asset?: Record<string, any> | null) => {
    const rawValue = asset?.available ?? asset?.available_quantity ?? asset?.jumlah ?? asset?.quantity ?? asset?.stok ?? asset?.stock ?? 0
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }

  const selectedAsset = assets.find((asset) => String(asset.id) === String(form.asset_id))
  const selectedUnit = units.find((unit) => String(unit.id) === String(form.borrower_unit_id))
  const activeBorrowerUnitName = selectedUnit?.name ?? units.find((unit) => String(unit.id) === currentUnitId)?.name ?? 'Unit aktif'
  const maxAvailable = getAssetStock(selectedAsset as Record<string, any> | undefined)

  const getAssetLabel = (asset?: AssetOption | null) => {
    if (!asset) return ''
    const ownerUnit = asset.unit_name || 'Unit tidak diketahui'
    return `${asset.name} - ${ownerUnit}`
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pending',
      dipinjam: 'Dipinjam',
      dikembalikan: 'Selesai',
      ditolak: 'Ditolak',
    }
    return map[status] ?? status
  }

  const clampQuantity = (value: string) => {
    const normalized = value.replace(/[^\d]/g, '')
    const fallbackValue = maxAvailable > 0 ? maxAvailable : 1
    const nextValue = normalized === '' ? '1' : String(Math.min(Math.max(Number(normalized), 1), fallbackValue))
    return nextValue
  }

  const updateField = (field: keyof BorrowingForm, value: string) => {
    if (field === 'borrower_unit_id' && currentUnitId) {
      setForm((current) => ({ ...current, borrower_unit_id: currentUnitId }))
      return
    }

    if (field === 'quantity') {
      setForm((current) => ({ ...current, quantity: clampQuantity(value) }))
      return
    }

    if (field === 'asset_id') {
      setForm((current) => {
        const nextAsset = assets.find((asset) => String(asset.id) === String(value))
        const nextMax = getAssetStock(nextAsset as Record<string, any> | undefined)
        const nextQuantity = String(Math.min(Math.max(Number(current.quantity || 1), 1), nextMax || 1))

        return { ...current, asset_id: value, quantity: nextQuantity }
      })
      return
    }

    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!form.asset_id) {
      setError('Pilih aset yang akan dipinjam.')
      setSubmitting(false)
      return
    }

    const quantity = Number(form.quantity || 0)
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('Jumlah pinjam minimal 1 unit.')
      setSubmitting(false)
      return
    }

    if (quantity > maxAvailable) {
      setError(`Jumlah pinjam tidak boleh melebihi stok tersedia (${maxAvailable} unit).`)
      setSubmitting(false)
      return
    }

    if (currentUnitId) {
      setForm((current) => ({ ...current, borrower_unit_id: currentUnitId }))
    }

    if (!form.borrower_name.trim()) {
      setError('Nama peminjam wajib diisi.')
      setSubmitting(false)
      return
    }

    if (!form.loan_date) {
      setError('Tanggal pinjam wajib diisi.')
      setSubmitting(false)
      return
    }

    if (form.due_date && form.loan_date >= form.due_date) {
      setError('Tanggal jatuh tempo harus lebih besar dari tanggal pinjam.')
      setSubmitting(false)
      return
    }

    if (form.return_date && form.due_date && form.due_date < form.return_date) {
      setError('Tanggal jatuh tempo tidak boleh lebih kecil dari tanggal kembali yang dijanjikan.')
      setSubmitting(false)
      return
    }

    if (form.return_date && form.loan_date && form.return_date < form.loan_date) {
      setError('Tanggal kembali tidak boleh lebih kecil dari tanggal pinjam.')
      setSubmitting(false)
      return
    }

    router.put(`/peminjaman/${borrowing?.id}`, {
      asset_id: form.asset_id,
      quantity: quantity,
      borrower_unit_id: currentUnitId || form.borrower_unit_id || null,
      borrower_name: form.borrower_name,
      borrower_names: form.borrower_name,
      loan_date: form.loan_date,
      loan_time: form.loan_time || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      return_date: form.return_date || null,
      return_time: form.return_time || null,
      purpose: form.purpose,
      notes: form.notes,
      status: form.status,
    }, {
      onSuccess: () => router.visit('/peminjaman'),
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        setError(firstError ?? 'Gagal memperbarui peminjaman aset.')
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const summaryCards = [
    {
      label: 'Aset',
      value: selectedAsset ? (selectedAsset.kode ? `${selectedAsset.kode}` : selectedAsset.name) : 'Belum dipilih',
      detail: selectedAsset ? selectedAsset.name : 'Pilih aset pinjaman',
      accent: '#10b981',
      bg: '#ffffff',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Unit',
      value: selectedUnit ? selectedUnit.name : 'Belum dipilih',
      detail: 'Unit peminjam',
      accent: '#2563eb',
      bg: '#ffffff',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
        </svg>
      ),
    },
    {
      label: 'Jumlah',
      value: `${form.quantity} unit`,
      detail: maxAvailable ? `Tersedia ${maxAvailable} unit` : 'Stok tidak tersedia',
      accent: '#f59e0b',
      bg: '#ffffff',
      color: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage='peminjaman-aset'>
      <ConfirmDialog
        open={showSaveConfirmation}
        title="Simpan perubahan peminjaman"
        message="Apakah Anda yakin ingin menyimpan perubahan peminjaman aset ini?"
        confirmLabel="Ya, simpan"
        cancelLabel="Batal"
        tone="info"
        onCancel={() => setShowSaveConfirmation(false)}
        onConfirm={() => {
          allowSubmitRef.current = true
          setShowSaveConfirmation(false)
          formRef.current?.requestSubmit()
        }}
      />
      <div className="w-full space-y-5">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-[0_20px_40px_rgba(16,185,129,0.22)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Transaksi</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit Peminjaman Aset</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.visit('/peminjaman')}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15"
            >
              Kembali
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: card.color + '55', background: card.bg }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.color }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: card.color }}>{card.label}</div>
                  <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{card.value}</div>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: card.color + '18', color: card.color, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="mt-2 text-xs font-medium" style={{ color: card.color }}>{card.detail}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          <span className="font-semibold">Unit peminjam:</span> {activeBorrowerUnitName}
        </div>

        <form
          ref={formRef}
          data-confirm-skip="true"
          onSubmitCapture={(event) => {
            if (!allowSubmitRef.current) {
              event.preventDefault()
              event.stopPropagation()
              setShowSaveConfirmation(true)
            } else {
              allowSubmitRef.current = false
            }
          }}
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.04)]"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Form</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-800">Detail peminjaman</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Update data
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Aset</label>
                <AnimatedSelect
                  value={selectedAsset ? getAssetLabel(selectedAsset) : ''}
                  onChange={(selectedLabel) => {
                    const nextAsset = assets.find((asset) => getAssetLabel(asset) === selectedLabel)
                    updateField('asset_id', nextAsset ? String(nextAsset.id) : '')
                  }}
                  options={assets.map((asset) => getAssetLabel(asset))}
                  placeholder="Pilih aset"
                  minWidth="100%"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jumlah Pinjam</label>
                <input
                  type="number"
                  min={1}
                  max={maxAvailable || 1}
                  value={form.quantity}
                  onChange={(event) => updateField('quantity', event.target.value)}
                  placeholder="1"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
                {selectedAsset ? (
                  <p className="text-xs text-slate-500">Stok tersedia: {maxAvailable} unit</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Unit Peminjam</label>
                <AnimatedSelect
                  value={currentUnitId ? (selectedUnit ? selectedUnit.name : '') : (selectedUnit ? selectedUnit.name : '')}
                  onChange={(selectedLabel) => {
                    if (currentUnitId) return
                    const nextUnit = units.find((unit) => unit.name === selectedLabel)
                    updateField('borrower_unit_id', nextUnit ? String(nextUnit.id) : '')
                  }}
                  options={currentUnitId ? (selectedUnit ? [selectedUnit.name] : []) : units.map((unit) => unit.name)}
                  placeholder={currentUnitId ? 'Unit Anda' : 'Pilih unit'}
                  minWidth="100%"
                  className="w-full"
                  disabled={Boolean(currentUnitId)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <AnimatedSelect
                  value="Pending"
                  onChange={() => {}}
                  options={['Pending']}
                  placeholder="Pending"
                  minWidth="100%"
                  className="w-full"
                  disabled={true}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Nama Peminjam</label>
                <input
                  value={form.borrower_name}
                  onChange={(event) => updateField('borrower_name', event.target.value)}
                  placeholder="Nama peminjam"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal Pinjam</label>
                <input
                  type="date"
                  value={form.loan_date}
                  onChange={(event) => updateField('loan_date', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jam Pinjam</label>
                <input
                  type="time"
                  value={form.loan_time}
                  onChange={(event) => updateField('loan_time', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => updateField('due_date', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jam Jatuh Tempo</label>
                <input
                  type="time"
                  value={form.due_time}
                  onChange={(event) => updateField('due_time', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tanggal Kembali</label>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(event) => updateField('return_date', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Jam Kembali</label>
                <input
                  type="time"
                  value={form.return_time}
                  onChange={(event) => updateField('return_time', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Keperluan</label>
                <input
                  value={form.purpose}
                  onChange={(event) => updateField('purpose', event.target.value)}
                  placeholder="Keperluan peminjaman"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  placeholder="Catatan tambahan"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lampiran</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-800">Dokumen pendukung peminjaman</h3>
                </div>
                <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                  Optional
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-8 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/60">
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setSelectedDocumentName(event.target.files?.[0]?.name ?? '')}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0117.5 8a3.5 3.5 0 01.72 6.8M12 12v7m0 0l-3-3m3 3l3-3" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">Unggah dokumen pendukung</p>
                <p className="mt-1 text-xs text-slate-500">PDF, JPG, atau PNG hingga 5MB</p>
                {selectedDocumentName ? (
                  <p className="mt-3 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{selectedDocumentName}</p>
                ) : null}
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.visit('/peminjaman')}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
              </svg>
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
