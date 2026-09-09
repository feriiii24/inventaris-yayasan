import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
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

export default function UserEditPage({ user, units = [] }: { user?: Record<string, any>; units?: Array<{ id: string; name: string }> }) {
  const initialValues = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'admin_unit',
    unit_id: user?.unit_id ? String(user.unit_id) : '',
    status: user?.status ?? 'aktif',
  }

  const [form, setForm] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const persistNotice = (nextNotice: { type: 'success' | 'error'; message: string }) => {
    setNotice(nextNotice)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('user-toast')
      window.localStorage.setItem('user-toast', JSON.stringify(nextNotice))
    }
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const roleOptions = useMemo(
    () => [
      { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin_pusat', label: 'Admin Yayasan' },
      { value: 'admin_unit', label: 'Admin Unit' },
    ],
    [],
  )

  const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'pending', label: 'Pending' },
    { value: 'nonaktif', label: 'Nonaktif' },
  ]
  const uniqueUnits = useMemo(() => Array.from(new Map(
    units
      .map((unit) => ({ ...unit, name: String(unit.name ?? '').trim() }))
      .filter((unit) => unit.name.length > 0)
      .map((unit) => [unit.name.toLocaleLowerCase(), unit]),
  ).values()), [units])

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    router.put(`/pengguna/${user?.id}`, form, {
      onSuccess: () => {
        persistNotice({ type: 'success', message: 'Pengguna berhasil diperbarui.' })
        router.visit('/pengguna')
      },
      onError: () => {
        persistNotice({ type: 'error', message: 'Gagal memperbarui pengguna.' })
      },
      onFinish: () => setSubmitting(false),
    })
  }

  return (
    <DashboardLayout role='super_admin' currentPage='pengguna'>
      {notice && <NotificationToast type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}
      <div className="w-full space-y-6">
        {/* Premium Header */}
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Manajemen akun</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Edit Pengguna</h1>
                <p className="mt-2 text-sm text-emerald-50">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => router.visit('/pengguna')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Form</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-800">Perbarui Data Pengguna</h2>
            <p className="text-[13px] text-slate-500">Ubah informasi akun pengguna yang diperlukan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nama Lengkap</label>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="nama@yayasan.id"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                <select
                  value={form.role}
                  onChange={(event) => handleChange('role', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Unit</label>
                <select
                  value={form.unit_id}
                  onChange={(event) => handleChange('unit_id', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Pilih Unit</option>
                  {uniqueUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => router.visit('/pengguna')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
