import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { Sidebar, Topbar } from './navigation'
import type { Role, Page } from '../types'
import AiChatWidget from './ui/AiChatWidget'

interface LayoutProps {
  role: Role
  currentPage: Page
  onNavigate: (page: Page) => void
  onLogout: () => void
  userName: string
  userUnit?: string
  children: React.ReactNode
}

export default function Layout({ role, currentPage, onNavigate, onLogout, userName, userUnit, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Global flash notifications from Inertia shared props
  const { props } = usePage<{ flash?: { success?: string, error?: string } }>()
  const flashSuccess = (props as any)?.flash?.success ?? null
  const flashError = (props as any)?.flash?.error ?? null
  const [showFlash, setShowFlash] = useState<boolean>(false)
  const [flashType, setFlashType] = useState<'success'|'error'>('success')
  const [flashMessage, setFlashMessage] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('admin-viewport')
    document.body.classList.add('admin-viewport')

    return () => {
      document.documentElement.classList.remove('admin-viewport')
      document.body.classList.remove('admin-viewport')
    }
  }, [])

  useEffect(() => {
    if (flashSuccess) {
      setFlashType('success')
      setFlashMessage(flashSuccess)
      setShowFlash(true)
    } else if (flashError) {
      setFlashType('error')
      setFlashMessage(flashError)
      setShowFlash(true)
    } else {
      setFlashMessage(null)
      setShowFlash(false)
    }

  }, [flashSuccess, flashError])

  useEffect(() => {
    if (!showFlash) return
    const t = setTimeout(() => setShowFlash(false), 4500)
    return () => clearTimeout(t)
  }, [showFlash])

  function closeFlash() {
    setShowFlash(false)
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden" style={{ background: '#f8fafc' }}>
      <Sidebar
        role={role}
        currentPage={currentPage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userName={userName}
        userUnit={userUnit}
        onLogout={onLogout}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          currentPage={currentPage}
          role={role}
          userName={userName}
          onNavigate={onNavigate}
          onAddAsset={() => onNavigate('add-asset')}
          onToggleSidebar={() => setMobileSidebarOpen(v => !v)}
        />
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-6" style={{ background: '#f8fafc' }}>
          {children}
        </main>
      </div>

      {showFlash && flashMessage && (
        <div className="fixed right-5 top-5 z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border shadow-lg" style={{
          background: flashType === 'success' ? '#ecfdf5' : '#fef2f2',
          borderColor: flashType === 'success' ? '#a7f3d0' : '#fecaca'
        }}>
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: (flashType === 'success' ? '#166534' : '#b91c1c') + '1A', color: flashType === 'success' ? '#166534' : '#b91c1c' }}>
              {flashType === 'success' ? (
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
              <p className="text-sm font-semibold" style={{ color: flashType === 'success' ? '#14532d' : '#7f1d1d' }}>{flashType === 'success' ? 'Berhasil' : 'Gagal'}</p>
              <p className="mt-1 text-sm" style={{ color: flashType === 'success' ? '#14532d' : '#7f1d1d' }}>{flashMessage}</p>
            </div>
            <button type="button" onClick={closeFlash} className="text-sm font-medium" style={{ color: flashType === 'success' ? '#166534' : '#b91c1c' }} aria-label="Tutup notifikasi">
              ✕
            </button>
          </div>
        </div>
      )}
      <AiChatWidget />
    </div>
  )
}
