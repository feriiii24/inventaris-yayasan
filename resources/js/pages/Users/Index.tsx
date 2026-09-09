import { useMemo, useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import AssetPageTable, { ActionButton } from '../../components/AssetPageTable'
import AnimatedSelect from '../../components/ui/AnimatedSelect'
import DashboardLayout from '../../Layouts/DashboardLayout'

type UserRow = {
  id: string
  no: number
  nama: string
  email: string
  role: string
  unit: string
  status: 'Aktif' | 'Pending' | 'Nonaktif'
}

const statusColors: Record<string, { bg: string; color: string }> = {
  Aktif: { bg: '#dcfce7', color: '#166534' },
  Pending: { bg: '#fef3c7', color: '#b45309' },
  Nonaktif: { bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ value }: { value: string }) {
  const style = statusColors[value] ?? { bg: '#f1f5f9', color: '#64748b' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
  )
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
          <p className="text-sm font-semibold" style={{ color: palette.text }}>
            {type === 'success' ? 'Berhasil' : 'Gagal'}
          </p>
          <p className="mt-1 text-sm" style={{ color: palette.text }}>{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium" style={{ color: palette.icon }} aria-label="Tutup notifikasi">
          ✕
        </button>
      </div>
    </div>
  )
}

function EmptyState({ kind = 'empty', onReset }: { kind?: 'empty' | 'filter'; onReset?: () => void }) {
  const isEmpty = kind === 'empty'

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800">
          {isEmpty ? 'Belum ada pengguna' : 'Data tidak ditemukan'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isEmpty
            ? 'Pengguna yang terdaftar akan muncul di sini.'
            : 'Tidak ada pengguna yang sesuai dengan pencarian atau filter.'}
        </p>
      </div>
      {!isEmpty && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
        >
          Reset Filter
        </button>
      )}
    </div>
  )
}

export default function UsersPage(props: { rows?: UserRow[]; units?: { id: string; name: string }[] }) {
  const serverRows = props.rows ?? []
  const [rows, setRows] = useState<UserRow[]>(serverRows)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [pageSize, setPageSize] = useState<number | 'all'>(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ nama: '', email: '', password: '', password_confirmation: '', role: 'admin_unit', unit_id: '' })
  const unitOptions = useMemo(() => Array.from(new Map(
    (props.units ?? [])
      .map((unit) => ({ id: unit.id, name: String(unit.name ?? '').trim() }))
      .filter((unit) => unit.name.length > 0)
      .map((unit) => [unit.name.toLocaleLowerCase(), unit]),
  ).values()), [props.units])

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('user-toast')
      window.localStorage.setItem('user-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    setRows(serverRows)
  }, [props.rows])

  useEffect(() => {
    const saved = window.localStorage.getItem('user-toast')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { type: 'success' | 'error'; message: string }
        setNotice(parsed)
      } catch {
        setNotice(null)
      } finally {
        window.localStorage.removeItem('user-toast')
      }
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const validateCreateForm = () => {
    const trimmedName = form.nama.trim()
    const trimmedEmail = form.email.trim()
    const password = form.password
    const confirmation = form.password_confirmation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/
    const nextErrors: Record<string, string> = {}

    if (!trimmedName) nextErrors.nama = 'Nama pengguna wajib diisi.'
    if (!trimmedEmail) nextErrors.email = 'Email wajib diisi.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextErrors.email = 'Format email tidak valid.'
    if (!form.role) nextErrors.role = 'Role wajib dipilih.'
    if (!form.unit_id) nextErrors.unit_id = 'Unit wajib dipilih.'
    if (!password) nextErrors.password = 'Password wajib diisi.'
    else if (password.length < 8) nextErrors.password = 'Password minimal 8 karakter.'
    else if (!passwordRegex.test(password)) nextErrors.password = 'Password harus terdiri dari minimal 1 huruf besar, 1 angka, dan 1 simbol.'
    if (!confirmation) nextErrors.password_confirmation = 'Konfirmasi password wajib diisi.'
    else if (password !== confirmation) nextErrors.password_confirmation = 'Konfirmasi password tidak sesuai.'

    setFieldErrors(nextErrors)

    const firstMessage = Object.values(nextErrors)[0]
    return firstMessage ?? null
  }

  const handleSubmit = () => {
    const validationMessage = validateCreateForm()
    if (validationMessage) {
      persistNotice({ type: 'error', message: validationMessage })
      return
    }

    const payload = {
      name: form.nama,
      email: form.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
      role: form.role,
      unit_id: form.unit_id,
    }

    router.post('/pengguna', payload, {
      onSuccess: (page) => {
        const errors = (page as any)?.props?.errors ?? {}
        const hasErrors = Object.keys(errors).length > 0

        if (hasErrors) {
          const firstError = Object.values(errors)[0]
          const message = typeof firstError === 'string' ? firstError : 'Gagal menambahkan pengguna.'
          persistNotice({ type: 'error', message })
          return
        }

        const message = (page as any)?.props?.flash?.success || 'Pengguna berhasil ditambahkan.'
        setForm({ nama: '', email: '', password: '', password_confirmation: '', role: 'staff', unit_id: '' })
        setFieldErrors({})
        setModalOpen(false)
        persistNotice({ type: 'success', message })
        router.visit('/pengguna')
      },
      onError: (errors) => {
        const firstError = Object.values(errors ?? {})[0]
        const message = typeof firstError === 'string' ? firstError : 'Gagal menambahkan pengguna.'
        persistNotice({ type: 'error', message })
      }
    })
  }

  const allStatuses = useMemo(() => Array.from(new Set(rows.map((row) => row.status))), [rows])
  const allRoles = useMemo(() => Array.from(new Set(rows.map((row) => row.role).filter(Boolean))), [rows])
  const allUnits = useMemo(() => Array.from(new Set(rows.map((row) => row.unit).filter(Boolean))), [rows])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const haystack = [row.nama, row.email, row.role, row.unit, row.status].join(' ').toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesStatus = !selectedStatus || row.status === selectedStatus
      const matchesRole = !selectedRole || row.role === selectedRole
      const matchesUnit = !selectedUnit || row.unit === selectedUnit

      return matchesSearch && matchesStatus && matchesRole && matchesUnit
    })
  }, [rows, searchTerm, selectedStatus, selectedRole, selectedUnit])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedRole('')
    setSelectedUnit('')
    setPageSize(10)
  }

  const handleDetail = (row: UserRow) => {
    const url = `/pengguna/${row.id}`
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
  }

  const handleEdit = (row: UserRow) => {
    router.visit(`/pengguna/${row.id}/edit`)
  }

  const handleDelete = (row: UserRow) => {
    setDeleteTarget(row)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    router.delete(`/pengguna/${deleteTarget.id}`, {
      onSuccess: () => {
        setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id))
        setDeleteTarget(null)
        persistNotice({ type: 'success', message: 'Pengguna berhasil dihapus.' })
        router.visit('/pengguna')
      },
      onError: () => {
        setDeleteTarget(null)
        persistNotice({ type: 'error', message: 'Gagal menghapus pengguna.' })
      },
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='pengguna'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-8 9a4 4 0 014-4h0a4 4 0 014 4v1H8v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Manajemen akses</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Pengguna</h1>
                <p className="mt-2 text-sm text-emerald-50">Kelola akun dan izin akses pengguna yayasan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Data terupdate
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Pengguna', value: rows.length, accent: '#166534', icon: 'users' },
            { label: 'Aktif', value: rows.filter(r => r.status === 'Aktif').length, accent: '#2563eb', icon: 'check' },
            { label: 'Pending', value: rows.filter(r => r.status === 'Pending').length, accent: '#f59e0b', icon: 'clock' },
            { label: 'Nonaktif', value: rows.filter(r => r.status === 'Nonaktif').length, accent: '#ef4444', icon: 'x' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 100}ms backwards` }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: stat.accent }} />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                  <p className="mt-4 text-3xl font-bold leading-none tracking-tight text-slate-900">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all duration-300 group-hover:scale-110" style={{ background: `${stat.accent}12`, color: stat.accent }}>
                  {stat.icon === 'users' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6 0h.01M12 12a8 8 0 100-16 8 8 0 000 16z" /></svg>}
                  {stat.icon === 'check' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {stat.icon === 'clock' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {stat.icon === 'x' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Daftar</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-800">Data Pengguna</h2>
              <p className="text-[13px] text-slate-500">Kelola {rows.length} akun pengguna</p>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-[13px] font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pengguna
            </button>
          </div>

          {/* Filter Bar */}
          <div className="mb-5 space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[220px]">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari nama, email, role..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-1 gap-2 md:flex-none">
                <AnimatedSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={allStatuses}
                  placeholder="Status"
                  minWidth="130px"
                  className="flex-1 md:flex-none"
                />

                <AnimatedSelect
                  value={selectedRole}
                  onChange={setSelectedRole}
                  options={allRoles}
                  placeholder="Role"
                  minWidth="130px"
                  className="flex-1 md:flex-none"
                />

                <AnimatedSelect
                  value={selectedUnit}
                  onChange={setSelectedUnit}
                  options={allUnits}
                  placeholder="Unit"
                  minWidth="130px"
                  className="flex-1 md:flex-none"
                />
              </div>

              <div className="flex gap-2">
                <AnimatedSelect
                  value={pageSize === 'all' ? 'Tampilkan semua' : String(pageSize)}
                  onChange={(value) => setPageSize(value === 'Tampilkan semua' ? 'all' : Math.max(10, Number(value) || 10))}
                  options={['10', '25', '50', 'Tampilkan semua']}
                  placeholder="10"
                  minWidth="140px"
                  className="flex-1 md:flex-none"
                />

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[12px] font-medium text-emerald-700 transition-all hover:bg-emerald-50 active:scale-95"
                  title="Reset semua filter"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 9.5A7 7 0 0118.5 14.5M18.5 14.5A7 7 0 015.5 9.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Active Filters Info */}
            {(searchTerm || selectedStatus || selectedRole || selectedUnit) && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                <span className="font-medium">Filter aktif diterapkan ({(searchTerm ? 1 : 0) + (selectedStatus ? 1 : 0) + (selectedRole ? 1 : 0) + (selectedUnit ? 1 : 0)})</span>
              </div>
            )}
          </div>

          <div className="">
            <AssetPageTable
              rows={filteredRows}
              pageSize={pageSize === 'all' ? Math.max(filteredRows.length || 10, 10) : Math.max(10, Number(pageSize) || 10)}
              emptyMessage="Data tidak ditemukan"
              emptyContent={<EmptyState kind={rows.length === 0 ? 'empty' : 'filter'} onReset={resetFilters} />}
              showTitle={false}
              showSearch={false}
              showAddButton={false}
              renderActions={(row) => (
               <div className="flex items-center gap-1.5">
                 <ActionButton title="Detail pengguna" onClick={() => handleDetail(row)}>
                   <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7 10.5-7 10.5 7 10.5 7-4.5 7-10.5 7S1.5 12 1.5 12zm10.5 3a3 3 0 100-6 3 3 0 000 6z" />
                   </svg>
                 </ActionButton>
                 <ActionButton title="Edit pengguna" onClick={() => handleEdit(row)}>
                   <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                   </svg>
                 </ActionButton>
                 <ActionButton title="Hapus pengguna" variant="danger" onClick={() => handleDelete(row)}>
                   <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </ActionButton>
               </div>
              )}
              columns={[
               { key: 'no', label: '#', className: 'w-[56px]' },
               {
                 key: 'nama',
                 label: 'Nama',
                 render: (value) => <span className="font-medium text-slate-800">{value || '-'}</span>,
               },
               { key: 'email', label: 'Email' },
               { key: 'role', label: 'Role', render: (value) => <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{value || '-'}</span> },
               { key: 'unit', label: 'Unit' },
               {
                 key: 'status',
                 label: 'Status',
                 render: (value) => <StatusBadge value={String(value || 'Pending')} />,
               },
              ]}
              toolbar={null}
            />
          </div>
        </div>

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" style={{ border: '1px solid #fecaca' }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">Hapus Pengguna</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{deleteTarget.nama}</span>?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Batal</button>
                <button type="button" onClick={confirmDelete} className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: '#dc2626' }}>Hapus</button>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" style={{ border: '1px solid #e2e8f0' }}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Tambah Pengguna</h3>
                  <p className="text-sm text-slate-500">Lengkapi data akun baru sebelum disimpan.</p>
                </div>
                <button type="button" onClick={() => { setFieldErrors({}); setForm({ nama: '', email: '', password: '', password_confirmation: '', role: 'admin_unit', unit_id: '' }); setModalOpen(false) }} className="rounded-lg border px-2 py-1 text-sm text-slate-500">✕</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama</label>
                    <input
                      required
                      autoComplete="name"
                      value={form.nama}
                      aria-invalid={Boolean(fieldErrors.nama)}
                      onChange={(e) => {
                        setForm({ ...form, nama: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, nama: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.nama ? '#ef4444' : '#e2e8f0' }}
                      placeholder="Masukkan nama pengguna"
                    />
                    {fieldErrors.nama && <p className="mt-1 text-xs text-red-600">{fieldErrors.nama}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      aria-invalid={Boolean(fieldErrors.email)}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, email: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.email ? '#ef4444' : '#e2e8f0' }}
                      placeholder="nama@yayasan.id"
                    />
                    {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                    <input
                      required
                      autoComplete="new-password"
                      type="password"
                      value={form.password}
                      aria-invalid={Boolean(fieldErrors.password)}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, password: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.password ? '#ef4444' : '#e2e8f0' }}
                      placeholder="Min. 8 karakter, huruf besar, angka, simbol"
                    />
                    {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                    <input
                      required
                      autoComplete="new-password"
                      type="password"
                      value={form.password_confirmation}
                      aria-invalid={Boolean(fieldErrors.password_confirmation)}
                      onChange={(e) => {
                        setForm({ ...form, password_confirmation: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, password_confirmation: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.password_confirmation ? '#ef4444' : '#e2e8f0' }}
                      placeholder="Ulangi password"
                    />
                    {fieldErrors.password_confirmation && <p className="mt-1 text-xs text-red-600">{fieldErrors.password_confirmation}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                    <select
                      required
                      value={form.role}
                      aria-invalid={Boolean(fieldErrors.role)}
                      onChange={(e) => {
                        setForm({ ...form, role: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, role: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.role ? '#ef4444' : '#e2e8f0' }}
                    >
                      <option value="">Pilih role</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="admin_pusat">Admin Yayasan</option>
                      <option value="admin_unit">Admin Unit</option>
                    </select>
                    {fieldErrors.role && <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                    <select
                      required
                      value={form.unit_id}
                      aria-invalid={Boolean(fieldErrors.unit_id)}
                      onChange={(e) => {
                        setForm({ ...form, unit_id: e.target.value })
                        setFieldErrors((prev) => ({ ...prev, unit_id: '' }))
                      }}
                      className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      style={{ borderColor: fieldErrors.unit_id ? '#ef4444' : '#e2e8f0' }}
                    >
                      <option value="">Pilih unit</option>
                      {unitOptions.length > 0 ? (
                        unitOptions.map((unit) => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="">Tidak ada unit terdaftar</option>
                        </>
                      )}
                    </select>
                    {fieldErrors.unit_id && <p className="mt-1 text-xs text-red-600">{fieldErrors.unit_id}</p>}
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => { setFieldErrors({}); setForm({ nama: '', email: '', password: '', password_confirmation: '', role: 'admin_unit', unit_id: '' }); setModalOpen(false) }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">Batal</button>
                  <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
