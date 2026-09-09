import { router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'
import AnimatedSelect from '../../../components/ui/AnimatedSelect'
import DashboardLayout from '../../../Layouts/DashboardLayout'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'

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

const today = new Date().toISOString().slice(0, 10)

const initialForm: BorrowingForm = {
  asset_id: '',
  quantity: '1',
  borrower_unit_id: '',
  borrower_name: '',
  loan_date: today,
  loan_time: '08:00',
  due_date: '',
  due_time: '',
  return_date: '',
  return_time: '',
  purpose: '',
  notes: '',
  status: 'pending',
}

export default function CreateBorrowingPage({ assets = [], units = [], current_unit_id }: { assets?: AssetOption[]; units?: UnitOption[]; current_unit_id?: string | number | null }) {
  const currentUnitId = current_unit_id ? String(current_unit_id) : ''
  const [form, setForm] = useState<BorrowingForm>(() => ({
    ...initialForm,
    borrower_unit_id: currentUnitId,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const allowSubmitRef = useRef(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

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

  const summaryCards = [
    {
      label: 'Aset',
      value: selectedAsset ? (selectedAsset.kode ? `${selectedAsset.kode}` : selectedAsset.name) : 'Belum dipilih',
      detail: selectedAsset ? selectedAsset.name : 'Pilih aset yang dipinjam',
      accent: '#10b981',
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
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

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

    router.post('/peminjaman', {
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
        setError(firstError ?? 'Gagal menambahkan peminjaman aset.')
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='peminjaman-aset'>
      <ConfirmDialog
        open={showSaveConfirmation}
        title="Simpan peminjaman aset"
        message="Apakah Anda yakin ingin mengajukan peminjaman aset ini?"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-100">Transaksi</p>
                <h1 className="mt-1 text-2xl font-bold">Tambah Peminjaman Aset</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.visit('/peminjaman')}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Kembali
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${card.accent}15`, color: card.accent }}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">{card.detail}</p>
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
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
        >
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Detail peminjaman</h2>
              <p className="text-sm text-slate-500">Lengkapi informasi aset, peminjam, dan jadwal pengembalian.</p>
            </div>
          </div>

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
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
              <label className="text-sm font-medium text-slate-700">Nama Peminjam</label>
              <input
                value={form.borrower_name}
                onChange={(event) => updateField('borrower_name', event.target.value)}
                placeholder="Nama peminjam"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Pinjam</label>
              <input
                type="date"
                value={form.loan_date}
                onChange={(event) => updateField('loan_date', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jam Pinjam</label>
              <input
                type="time"
                value={form.loan_time}
                onChange={(event) => updateField('loan_time', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => updateField('due_date', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jam Jatuh Tempo</label>
              <input
                type="time"
                value={form.due_time}
                onChange={(event) => updateField('due_time', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Kembali</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(event) => updateField('return_date', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Jam Kembali</label>
              <input
                type="time"
                value={form.return_time}
                onChange={(event) => updateField('return_time', event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Keperluan</label>
              <input
                value={form.purpose}
                onChange={(event) => updateField('purpose', event.target.value)}
                placeholder="Keperluan peminjaman"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Catatan</label>
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                rows={4}
                placeholder="Catatan tambahan"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => router.visit('/peminjaman')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Peminjaman'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
