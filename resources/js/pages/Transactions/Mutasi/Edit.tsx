import { router, usePage } from '@inertiajs/react'
import { useRef, useState } from 'react'
import DashboardLayout from '../../../Layouts/DashboardLayout'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AnimatedSelect from '../../../components/ui/AnimatedSelect'

type MutationForm = {
  asset_id: string
  from_unit_id: string
  to_unit_id: string
  from_location_id: string
  to_location_id: string
  from_room_id: string
  to_room_id: string
  movement_type: string
  mutation_date: string
  reference_number: string
  notes: string
  status: string
}

type AssetOption = { id: string | number; name: string; kode?: string; unit_id?: string | number | null; location_id?: string | number | null; room_id?: string | number | null }
type UnitOption = { id: string | number; name: string }
type LocationOption = { id: string | number; name: string; code?: string; unit_id?: string | number | null }
type RoomOption = { id: string | number; name: string; code?: string; location_name?: string; unit_id?: string | number | null; status?: string }

export default function EditMutationPage({ mutation, assets = [], units = [], locations = [], rooms = [], current_unit_id }: { mutation?: Record<string, any>; assets?: AssetOption[]; units?: UnitOption[]; locations?: LocationOption[]; rooms?: RoomOption[]; current_unit_id?: string | number | null }) {
  const currentUnitId = current_unit_id ? String(current_unit_id) : ''
  const [form, setForm] = useState<MutationForm>({
    asset_id: String(mutation?.asset_id ?? ''),
    from_unit_id: String(mutation?.from_unit_id ?? currentUnitId),
    to_unit_id: String(mutation?.to_unit_id ?? currentUnitId),
    from_location_id: String(mutation?.from_location_id ?? ''),
    to_location_id: String(mutation?.to_location_id ?? ''),
    from_room_id: String(mutation?.from_room_id ?? ''),
    to_room_id: String(mutation?.to_room_id ?? ''),
    movement_type: mutation?.movement_type === 'Mutasi Internal' || mutation?.movement_type === 'Perbaikan Distribusi'
      ? 'Pemindahan Unit'
      : (mutation?.movement_type ?? 'Pemindahan Unit'),
    mutation_date: mutation?.mutation_date ?? new Date().toISOString().slice(0, 10),
    reference_number: mutation?.reference_number ?? '',
    notes: mutation?.notes ?? '',
    status: mutation?.status ?? 'proses',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const allowSubmitRef = useRef(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  const updateField = (field: keyof MutationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleMovementTypeChange = (value: string) => {
    const isCrossUnitMovement = value === 'Pemindahan Unit'

    setForm((current) => ({
      ...current,
      movement_type: value,
      status: isCrossUnitMovement ? 'proses' : current.status,
      from_unit_id: currentUnitId || '',
      to_unit_id: isCrossUnitMovement ? '' : (currentUnitId || ''),
      from_location_id: selectedAsset?.location_id ? String(selectedAsset.location_id) : '',
      to_location_id: '',
      from_room_id: selectedAsset?.room_id ? String(selectedAsset.room_id) : '',
      to_room_id: '',
    }))
  }

  const showUnitFields = form.movement_type === 'Pemindahan Unit'
  const showLocationFields = form.movement_type === 'Pindah Lokasi'
  const showRoomFields = form.movement_type === 'Pindah Ruangan'
  const isCrossUnitMovement = form.movement_type === 'Pemindahan Unit'
  const sourceUnitOptions = currentUnitId ? units.filter((unit) => String(unit.id) === currentUnitId) : units
  const destinationUnitOptions = isCrossUnitMovement && currentUnitId
    ? units.filter((unit) => String(unit.id) !== currentUnitId)
    : units
  const selectedAsset = assets.find((asset) => String(asset.id) === String(form.asset_id))
  const locationUnitId = currentUnitId || (selectedAsset?.unit_id ? String(selectedAsset.unit_id) : '')
  const locationOptions = locationUnitId
    ? locations.filter((location) => String(location.unit_id ?? '') === locationUnitId)
    : locations
  const roomOptions = locationUnitId
    ? rooms.filter((room) => String(room.unit_id ?? '') === locationUnitId)
    : rooms
  const activeRoomOptions = roomOptions.filter((room) => String(room.status ?? '').toLowerCase() === 'aktif')

  const handleAssetChange = (value: string) => {
    const asset = assets.find((item) => String(item.id) === value)
    setForm((current) => ({
      ...current,
      asset_id: value,
      from_location_id: asset?.location_id ? String(asset.location_id) : '',
      from_room_id: asset?.room_id ? String(asset.room_id) : '',
      to_location_id: '',
      to_room_id: '',
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!form.asset_id) {
      setError('Pilih aset yang akan dimutasi.')
      setSubmitting(false)
      return
    }

    if (showUnitFields && form.from_unit_id && form.to_unit_id && form.from_unit_id === form.to_unit_id && !(currentUnitId && form.from_unit_id === currentUnitId && form.to_unit_id === currentUnitId)) {
      setError('Unit tujuan tidak boleh sama dengan unit asal.')
      setSubmitting(false)
      return
    }

    if (currentUnitId && isCrossUnitMovement && form.to_unit_id === currentUnitId) {
      setError('Unit tujuan tidak boleh sama dengan unit Anda.')
      setSubmitting(false)
      return
    }

    if (showLocationFields && form.from_location_id && form.to_location_id && form.from_location_id === form.to_location_id) {
      setError('Lokasi tujuan tidak boleh sama dengan lokasi asal.')
      setSubmitting(false)
      return
    }

    if (showRoomFields && form.from_room_id && form.to_room_id && form.from_room_id === form.to_room_id) {
      setError('Ruangan tujuan tidak boleh sama dengan ruangan asal.')
      setSubmitting(false)
      return
    }

    router.put(`/mutasi/${mutation?.id}`, {
      asset_id: form.asset_id,
      from_unit_id: showUnitFields ? (form.from_unit_id || currentUnitId || null) : null,
      to_unit_id: showUnitFields ? (form.to_unit_id || currentUnitId || null) : null,
      from_location_id: showLocationFields ? (form.from_location_id || null) : null,
      to_location_id: showLocationFields ? (form.to_location_id || null) : null,
      from_room_id: showRoomFields ? (form.from_room_id || null) : null,
      to_room_id: showRoomFields ? (form.to_room_id || null) : null,
      movement_type: form.movement_type,
      mutation_date: form.mutation_date,
      reference_number: form.reference_number,
      notes: form.notes,
      status: isCrossUnitMovement ? 'proses' : form.status,
    }, {
      onSuccess: () => router.visit('/mutasi'),
      onError: (errors: Record<string, any>) => {
        const firstError = Object.values(errors).flat().find((value) => typeof value === 'string') as string | undefined
        setError(firstError ?? 'Gagal memperbarui mutasi aset.')
      },
      onFinish: () => setSubmitting(false),
    })
  }

  const { props } = usePage<{ auth?: { user?: { role?: string } } }>()
  const authRole = props?.auth?.user?.role ?? 'super_admin'
  const layoutRole = authRole === 'admin_pusat' ? 'admin_pusat' : authRole === 'admin_unit' ? 'admin_unit' : 'super_admin'

  const summaryCards = [
    {
      label: 'Jenis Mutasi',
      value: form.movement_type,
      detail: 'Tipe perpindahan',
      accent: '#10b981',
      bg: '#ecfdf5',
      color: '#166534',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      label: 'Status',
      value: form.status,
      detail: 'Status saat ini',
      accent: '#2563eb',
      bg: '#dbeafe',
      color: '#1d4ed8',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Tanggal',
      value: form.mutation_date || '-',
      detail: 'Tanggal mutasi',
      accent: '#f59e0b',
      bg: '#fef3c7',
      color: '#b45309',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <DashboardLayout role={layoutRole} currentPage='mutasi-aset'>
      <ConfirmDialog
        open={showSaveConfirmation}
        title="Simpan perubahan mutasi"
        message="Apakah Anda yakin ingin menyimpan perubahan data mutasi aset ini?"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">Edit</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Mutasi Aset</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.visit('/mutasi')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: card.accent + '55' }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: card.accent }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: card.color }}>{card.label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
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
        >
          <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Form</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-800">Informasi Mutasi</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Edit data
                </span>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Aset</label>
                  <AnimatedSelect
                    value={form.asset_id}
                    onChange={handleAssetChange}
                    options={assets.map((asset) => ({ value: String(asset.id), label: `${asset.kode ? `${asset.kode} - ` : ''}${asset.name}` }))}
                    placeholder="Pilih aset"
                    minWidth="100%"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Jenis Mutasi</label>
                  <AnimatedSelect
                    value={form.movement_type}
                    onChange={handleMovementTypeChange}
                    options={['Pemindahan Unit', 'Pindah Ruangan', 'Pindah Lokasi']}
                    placeholder="Pilih jenis mutasi"
                    minWidth="100%"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <AnimatedSelect value={isCrossUnitMovement ? 'proses' : form.status} onChange={(value) => updateField('status', value)} options={[{ value: 'proses', label: 'Proses' }, { value: 'sukses', label: 'Sukses' }]} placeholder="Pilih status" minWidth="100%" disabled={isCrossUnitMovement} />
                  {isCrossUnitMovement ? (
                    <p className="text-xs text-amber-700">Mutasi pemindahan unit akan menunggu persetujuan dari unit tujuan.</p>
                  ) : null}
                </div>

                {showUnitFields ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Unit Asal</label>
                      <AnimatedSelect value={form.from_unit_id} onChange={(value) => updateField('from_unit_id', value)} options={sourceUnitOptions.map((unit) => ({ value: String(unit.id), label: unit.name }))} placeholder="Pilih unit asal" minWidth="100%" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Unit Tujuan</label>
                      <AnimatedSelect value={form.to_unit_id} onChange={(value) => updateField('to_unit_id', value)} options={destinationUnitOptions.map((unit) => ({ value: String(unit.id), label: unit.name }))} placeholder="Pilih unit tujuan" minWidth="100%" />
                    </div>
                  </>
                ) : null}

                {showLocationFields ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Lokasi Asal</label>
                      <AnimatedSelect value={form.from_location_id} onChange={() => undefined} options={locationOptions.filter((location) => String(location.id) === String(form.from_location_id)).map((location) => ({ value: String(location.id), label: location.name }))} placeholder="Pilih lokasi asal" minWidth="100%" disabled />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Lokasi Tujuan</label>
                      <AnimatedSelect value={form.to_location_id} onChange={(value) => updateField('to_location_id', value)} options={locationOptions.filter((location) => String(location.id) !== String(form.from_location_id)).map((location) => ({ value: String(location.id), label: location.name }))} placeholder="Pilih lokasi tujuan" minWidth="100%" />
                    </div>
                  </>
                ) : null}

                {showRoomFields ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ruangan Asal</label>
                      <AnimatedSelect value={form.from_room_id} onChange={() => undefined} options={roomOptions.filter((room) => String(room.id) === String(form.from_room_id)).map((room) => ({ value: String(room.id), label: `${room.name}${room.location_name ? ` - ${room.location_name}` : ''}` }))} placeholder="Pilih ruangan asal" minWidth="100%" disabled />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ruangan Tujuan</label>
                      <AnimatedSelect value={form.to_room_id} onChange={(value) => updateField('to_room_id', value)} options={activeRoomOptions.filter((room) => String(room.id) !== String(form.from_room_id)).map((room) => ({ value: String(room.id), label: `${room.name}${room.location_name ? ` - ${room.location_name}` : ''}` }))} placeholder="Pilih ruangan tujuan" minWidth="100%" />
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tanggal Mutasi</label>
                  <input
                    type="date"
                    value={form.mutation_date}
                    onChange={(event) => updateField('mutation_date', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nomor Referensi</label>
                  <input
                    value={form.reference_number}
                    onChange={(event) => updateField('reference_number', event.target.value)}
                    placeholder="M-2026-001"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Catatan</label>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    rows={4}
                    placeholder="Berikan keterangan mutasi aset..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.visit('/mutasi')}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 3" />
                  </svg>
                  {submitting ? 'Menyimpan...' : 'Perbarui Mutasi'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Rute</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-800">Lokasi & Unit</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Unit asal</div>
                    <div className="mt-1 font-semibold text-slate-800">{form.from_unit_id ? units.find((unit) => String(unit.id) === String(form.from_unit_id))?.name ?? 'Tidak ada' : 'Belum dipilih'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Unit tujuan</div>
                    <div className="mt-1 font-semibold text-slate-800">{form.to_unit_id ? units.find((unit) => String(unit.id) === String(form.to_unit_id))?.name ?? 'Tidak ada' : 'Belum dipilih'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Lokasi asal</div>
                    <div className="mt-1 font-semibold text-slate-800">{form.from_location_id ? locations.find((location) => String(location.id) === String(form.from_location_id))?.name ?? 'Tidak ada' : 'Belum dipilih'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Lokasi tujuan</div>
                    <div className="mt-1 font-semibold text-slate-800">{form.to_location_id ? locations.find((location) => String(location.id) === String(form.to_location_id))?.name ?? 'Tidak ada' : 'Belum dipilih'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Lampiran</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-800">Dokumen pendukung</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                    Opsional
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0117.42 8 4.5 4.5 0 0117 18H7zm5-8v5m0 0l-2-2m2 2l2-2" />
                    </svg>
                    Upload dokumen mutasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
