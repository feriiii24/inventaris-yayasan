import React, { useEffect, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import Layout from '../components/Layout'
import { pageMap } from '../config/pageRoutes'
import type { Page, Role } from '../types'
import ConfirmDialog from '../components/ui/ConfirmDialog'

interface DashboardLayoutProps {
  role?: Role
  currentPage?: Page
  userName?: string
  userUnit?: string
  children: ReactNode
}

function normalizeRole(value: unknown): Role {
  const raw = String(value ?? '').trim().toLowerCase().replace(/[^a-z_]/g, '_')
  const normalized = raw.replace(/_+/g, '_').replace(/^_|_$/g, '')

  if (normalized === 'super_admin' || normalized === 'superadmin') return 'super_admin'
  if (normalized === 'admin_pusat' || normalized === 'adminpusat') return 'admin_pusat'
  if (normalized === 'admin_unit' || normalized === 'adminunit') return 'admin_unit'

  return 'super_admin'
}

export default function DashboardLayout({
  role = 'super_admin',
  currentPage = 'dashboard',
  userName,
  userUnit,
  children,
}: DashboardLayoutProps) {
  const { props: pageProps } = usePage() as any
  const authUser = pageProps?.auth?.user ?? pageProps?.user ?? null

  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null)
  const bypassConfirmationRef = React.useRef<HTMLFormElement | null>(null)

  const displayName: string = authUser?.name ?? userName ?? 'Pengguna'
  const displayUnit: string | undefined = authUser?.unit?.name ?? userUnit
  const authRoleRaw = authUser?.roleModel?.name ?? authUser?.role ?? (authUser?.roles ? (Array.isArray(authUser.roles) ? authUser.roles[0] : authUser.roles) : null)
  const displayRole: Role = normalizeRole(authRoleRaw ?? role)

  useEffect(() => {
    const handleSubmit = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null
      if (!form || form.dataset.confirmSkip === 'true' || bypassConfirmationRef.current === form) {
        if (bypassConfirmationRef.current === form) bypassConfirmationRef.current = null
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      setPendingForm(form)
    }

    document.addEventListener('submit', handleSubmit, true)
    return () => document.removeEventListener('submit', handleSubmit, true)
  }, [])

  const handleNavigate = (page: Page) => {
    const route = pageMap[page] ?? '/dashboard'
    router.visit(route)
  }

  const handleLogout = () => {
    router.visit('/login')
  }

  return (
    <Layout
      role={displayRole}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      userName={displayName}
      userUnit={displayUnit}
    >
      <ConfirmDialog
        open={Boolean(pendingForm)}
        title="Simpan data"
        message="Apakah Anda yakin ingin menyimpan data yang sudah diisi?"
        confirmLabel="Ya, simpan"
        cancelLabel="Batal"
        tone="info"
        onCancel={() => setPendingForm(null)}
        onConfirm={() => {
          if (pendingForm) {
            bypassConfirmationRef.current = pendingForm
            pendingForm.requestSubmit()
          }
          setPendingForm(null)
        }}
      />
      {children}
    </Layout>
  )
}
