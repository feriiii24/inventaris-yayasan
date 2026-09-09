import { createPortal } from 'react-dom'
import { useState } from 'react'
import { breadcrumbMap } from '../../config/sidebar'
import type { Page, Role } from '../../types'

export interface TopbarProps {
  currentPage: Page
  role: Role
  userName: string
  onNavigate: (page: Page) => void
  onAddAsset: () => void
  onToggleSidebar?: () => void
}

import { usePage } from '@inertiajs/react'

export default function Topbar({ currentPage, role, userName, onNavigate, onAddAsset, onToggleSidebar }: TopbarProps) {
  const pageProps = (usePage().props as any) || {}
  const authUser = pageProps?.auth?.user ?? pageProps?.user ?? null
  const displayName = authUser?.name ?? userName ?? 'Pengguna'
  const displayRole = authUser?.roleModel?.name ?? role

  const [showQuickAction, setShowQuickAction] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const breadcrumbs = breadcrumbMap[currentPage] ?? [currentPage]

  const roleLabel = {
    super_admin: 'Super Admin',
    admin_pusat: 'Admin Pusat',
    admin_unit: 'Admin Unit',
  }[displayRole as Role] ?? 'Pengguna'

  const roleColors = {
    super_admin: { bg: '#dcfce7', color: '#166534', badge: '#10b981' },
    admin_pusat: { bg: '#dbeafe', color: '#1d4ed8', badge: '#3b82f6' },
    admin_unit: { bg: '#fef3c7', color: '#d97706', badge: '#f59e0b' },
  }[(displayRole as Role) ?? 'super_admin']

  return (
    <header
      className="flex items-center justify-between gap-4 border-b bg-gradient-to-r from-white via-white to-slate-50/50 px-4 py-4 md:px-6"
      style={{
        borderColor: '#e2e8f0',
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Buka menu navigasi"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ background: roleColors.bg, color: roleColors.color }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: roleColors.badge }}
              />
              {roleLabel}
            </div>
          </div>

          <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span
                  className="truncate"
                  style={{
                    color: i === breadcrumbs.length - 1 ? '#0f172a' : '#64748b',
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 500,
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden w-[160px] md:block">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Cari aset..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
          aria-label="Notifikasi"
          title="Notifikasi"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowQuickAction(v => !v)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg hover:shadow-emerald-200/70"
            title="Menu aksi cepat"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Aksi Cepat</span>
          </button>

          {showQuickAction && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[1000]" onClick={() => setShowQuickAction(false)} aria-hidden="true">
              <div
                className="fixed right-4 top-[4.75rem] z-[1001] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:right-6"
                onClick={(event) => event.stopPropagation()}
              >
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menu Cepat</p>
              </div>
              {[
                { label: 'Tambah Aset', action: onAddAsset, icon: '📝' },
                { label: 'Mutasi Aset', action: () => onNavigate('mutasi-aset'), icon: '↔️' },
                { label: 'Buat Laporan', action: () => onNavigate('laporan-aset'), icon: '📊' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setShowQuickAction(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-slate-900 border-b border-slate-50 last:border-b-0"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              </div>
            </div>,
            document.body,
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
            title={`${displayName} - ${roleLabel}`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white shadow-sm shadow-emerald-200/50">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 sm:flex flex-col gap-0.5">
              <div className="truncate text-xs font-semibold text-slate-800">{displayName.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-500">{roleLabel}</div>
            </div>
            <svg className="hidden h-3.5 w-3.5 text-slate-400 sm:block flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[1000]" onClick={() => setShowProfile(false)} aria-hidden="true">
              <div
                className="fixed right-4 top-[4.75rem] z-[1001] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl md:right-6"
                onClick={(event) => event.stopPropagation()}
              >
              <div className="border-b border-slate-100 px-4 py-3.5">
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                <div
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                  style={{ background: roleColors.bg, color: roleColors.color }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: roleColors.badge }}
                  />
                  {roleLabel}
                </div>
              </div>
              <button
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={() => setShowProfile(false)}
              >
                Keluar
              </button>
              </div>
            </div>,
            document.body,
          )}
        </div>
      </div>
    </header>
  )
}
