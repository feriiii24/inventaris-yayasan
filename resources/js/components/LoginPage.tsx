import { usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'

interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

interface Props {
  onLogin: (payload: LoginPayload) => void
  onPublicInventory: () => void
}

export default function LoginPage({ onLogin, onPublicInventory }: Props) {
  const { props } = usePage<{ errors?: Record<string, string>, flash?: { success?: string, error?: string } }>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const serverError = props.errors?.email ?? ''
  const flashSuccess = (props as any)?.flash?.success ?? null
  const flashError = (props as any)?.flash?.error ?? null

  useEffect(() => {
    const nextNotice = flashSuccess
      ? { type: 'success' as const, message: flashSuccess }
      : flashError
        ? { type: 'error' as const, message: flashError }
        : null

    setNotice(nextNotice)

    if (nextNotice) {
      const timer = window.setTimeout(() => setNotice(null), 4500)
      return () => window.clearTimeout(timer)
    }
  }, [flashSuccess, flashError])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    onLogin({ email, password, remember })

    window.setTimeout(() => setLoading(false), 700)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Branding Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-12 xl:p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #14532d 0%, #166534 50%, #15803d 100%)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg leading-tight">Sistem Inventaris<br />Aset Yayasan</span>
          </div>

          <div className="mt-8 max-w-lg">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Portal Pengelolaan Aset</p>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.12] mb-5">
              Kelola Aset dengan<br />Lebih Teratur &<br />Transparan
            </h1>
            <p className="text-green-100/80 text-base leading-relaxed max-w-md">
              Platform manajemen inventaris aset terpadu untuk yayasan. Pantau, kelola, dan laporkan seluruh aset dalam satu sistem yang terintegrasi.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-green-300 text-xs mt-6">
          © 2024 Sistem Inventaris Aset Yayasan. All rights reserved.
        </div>
      </div>

      {/* Login Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:p-8 lg:p-12">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-7 justify-center">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10" style={{ background: '#166534' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: '#0f172a' }}>Sistem Inventaris</div>
              <div className="font-bold text-sm leading-tight" style={{ color: '#166534' }}>Aset Yayasan</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] border p-6 sm:p-9" style={{ borderColor: '#e2e8f0' }}>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: '#166534' }}>Selamat datang</p>
              <h2 className="text-2xl sm:text-[1.7rem] font-bold mb-2" style={{ color: '#0f172a' }}>Masuk ke akun Anda</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>Kelola inventaris aset yayasan dengan aman dan mudah.</p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  Email / Username
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@yayasan.id"
                  required
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: '#d1d5db', background: '#f8fafc', color: '#0f172a' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#166534')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-all pr-10"
                    style={{ borderColor: '#d1d5db', background: '#f8fafc', color: '#0f172a' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#166534')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#d1d5db')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#64748b' }}
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: '#166534' }}
                  />
                  <span className="text-sm" style={{ color: '#64748b' }}>Ingat saya</span>
                </label>
                <button type="button" className="text-sm font-medium" style={{ color: '#166534' }}>
                  Lupa Password?
                </button>
              </div>

              {/* Server-side flash messages (success / error) */}
              {notice && notice.type === 'success' && (
                <div className="text-sm p-3 rounded-lg mb-4" style={{ background: '#ecfdf5', color: '#14532d', border: '1px solid #a7f3d0' }}>
                  {notice.message}
                </div>
              )}

              {(notice && notice.type === 'error' || error || serverError) && (
                <div className="text-sm p-3 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  {notice?.type === 'error' ? notice.message : (error || serverError)}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all text-sm shadow-lg shadow-green-900/10"
                style={{ background: loading ? '#4ade80' : '#166534' }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#14532d')}
                onMouseLeave={e => !loading && (e.currentTarget.style.background = '#166534')}
              >
                {loading ? 'Memverifikasi...' : 'Masuk'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
              <span className="text-xs" style={{ color: '#94a3b8' }}>atau</span>
              <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
            </div>

            {/* Public access */}
            <div className="space-y-2.5">
              <button
                onClick={onPublicInventory}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group"
                style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#166534'; e.currentTarget.style.background = '#f0fdf4' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                  <svg className="w-4 h-4" style={{ color: '#166534' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>Cek Inventaris</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>Lihat ketersediaan aset secara publik</div>
                </div>
                <svg className="w-4 h-4 ml-auto" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#94a3b8' }}>
            © 2024 Sistem Inventaris Aset Yayasan
          </p>
        </div>
      </div>
    </div>
  )
}
