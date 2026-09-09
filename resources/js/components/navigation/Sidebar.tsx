import { useEffect, useState } from 'react'
import { navItems } from '../../config/sidebar'
import type { Page, Role } from '../../types'

export interface SidebarProps {
  role: Role
  currentPage: Page
  onNavigate: (page: Page) => void
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
  userName: string
  userUnit?: string
  onLogout: () => void
}

function ChevronDown() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

import { usePage } from '@inertiajs/react'

export default function Sidebar({ role, currentPage, onNavigate, collapsed, onToggle, mobileOpen = false, onCloseMobile, userName, userUnit, onLogout }: SidebarProps) {
  const pageProps = (usePage().props as any) || {}
  const authUser = pageProps?.auth?.user ?? pageProps?.user ?? null
  const displayName = authUser?.name ?? userName ?? 'Pengguna'
  const displayUnit = authUser?.unit?.name ?? userUnit
  const displayRole = authUser?.roleModel?.name ?? role


  const [openGroups, setOpenGroups] = useState<string[]>(['Manajemen Aset'])

  // Keep a stable effective role across navigations to avoid flicker when Inertia props
  // are temporarily unavailable during client-side navigation.
  const [effectiveRole, setEffectiveRole] = useState<Role>(displayRole as Role)

  useEffect(() => {
    // When authUser becomes available, update the effective role.
    if (authUser) {
      const r = (authUser?.roleModel?.name ?? (authUser?.role as Role) ?? displayRole) as Role
      setEffectiveRole(r)
    } else {
      // if no authUser but displayRole changed (via parent), keep displayRole as fallback
      setEffectiveRole(displayRole as Role)
    }
  }, [authUser, displayRole])

  useEffect(() => {
    const activeGroup = navItems.find(item => item.children?.some(child => child.page === currentPage))

    if (activeGroup) {
      setOpenGroups(prev => prev.includes(activeGroup.label) ? prev : [...prev, activeGroup.label])
    }
  }, [currentPage])

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(effectiveRole))
 
  const roleBadge = {
    super_admin: { label: 'Super Admin', bg: '#dcfce7', color: '#166534' },
    admin_pusat: { label: 'Admin Pusat', bg: '#dbeafe', color: '#1d4ed8' },
    admin_unit: { label: 'Admin Unit', bg: '#fef3c7', color: '#d97706' },
  }[effectiveRole]

  return (
    <aside
      className={`relative flex h-screen min-h-0 flex-shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 shadow-[0_0_0_1px_rgba(148,163,184,0.08)] backdrop-blur-sm transition-all duration-300 ease-out max-md:fixed max-md:left-0 max-md:top-0 max-md:z-50 max-md:shadow-xl ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      style={{ width: collapsed ? '72px' : '248px' }}
    >
      <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white px-3 py-3.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-sm shadow-emerald-200/80">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Inventaris</div>
            <div className="truncate text-sm font-bold text-slate-900">Yayasan</div>
          </div>
        )}
        <button
          onClick={() => {
            onToggle()
            onCloseMobile?.()
          }}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Toggle sidebar"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            }
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {filteredNav.map(item => {
          const isActive = item.page === currentPage || (item.children?.some(c => c.page === currentPage))
          const isOpen = openGroups.includes(item.label)

          if (!item.children) {
            return (
              <button
                key={item.label}
                onClick={() => item.page && onNavigate(item.page)}
                title={collapsed ? item.label : undefined}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200 ease-out"
                style={{
                  background: isActive ? 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02))' : 'transparent',
                  color: isActive ? '#166534' : '#475569',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(22,101,52,0.06)' : 'none',
                  transform: isActive ? 'translateX(2px)' : 'translateX(0px)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#f8fafc'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[14px]" style={{ color: isActive ? '#166534' : '#64748b' }}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-[12px] font-medium">{item.label}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </>
                )}
              </button>
            )
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                title={collapsed ? item.label : undefined}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200 ease-out"
                style={{
                  background: isActive ? 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02))' : 'transparent',
                  color: isActive ? '#166534' : '#475569',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(22,101,52,0.06)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#f8fafc'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[14px]" style={{ color: isActive ? '#166534' : '#64748b' }}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-[12px] font-medium">{item.label}</span>
                    <span className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#94a3b8' }}>
                      <ChevronDown />
                    </span>
                  </>
                )}
              </button>

              {!collapsed && (
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isOpen ? `${item.children.length * 40 + 12}px` : '0px',
                    opacity: isOpen ? 1 : 0,
                    marginTop: isOpen ? '6px' : '0px',
                    marginLeft: '18px',
                    paddingLeft: '12px',
                    borderLeft: isOpen ? '1px solid #e2e8f0' : '0px solid transparent',
                  }}
                >
                  <div className="space-y-1 pt-1">
                    {item.children.filter(c => !c.roles || c.roles.includes(effectiveRole)).map(child => (
                      <button
                        key={child.page}
                        onClick={() => onNavigate(child.page)}
                        className="w-full rounded-lg px-2.5 py-1 text-left text-[10px] transition-all duration-200 ease-out"
                        style={{
                          background: currentPage === child.page ? '#dcfce7' : 'transparent',
                          color: currentPage === child.page ? '#166534' : '#64748b',
                          fontWeight: currentPage === child.page ? 600 : 500,
                          transform: currentPage === child.page ? 'translateX(2px)' : 'translateX(0px)',
                        }}
                        onMouseEnter={e => currentPage !== child.page && (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={e => currentPage !== child.page && (e.currentTarget.style.background = 'transparent')}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-slate-800">{displayName}</div>
              <div className="truncate text-[10px] text-slate-500">{displayUnit || 'Semua Unit'}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: roleBadge.bg, color: roleBadge.color }}>
              {roleBadge.label}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] font-medium text-red-600 transition hover:bg-red-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      )}
    </aside>
  )
}
