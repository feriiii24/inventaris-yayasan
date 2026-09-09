import { router, usePage } from '@inertiajs/react'
import DashboardPage from '../components/DashboardPage'
import DashboardLayout from '../Layouts/DashboardLayout'
import { getPageRoute } from '../config/pageRoutes'
import type { Role } from '../types'

function normalizeRole(value: unknown): Role {
  const raw = String(value ?? '').trim().toLowerCase().replace(/[^a-z_]/g, '_')
  const normalized = raw.replace(/_+/g, '_').replace(/^_|_$/g, '')

  if (normalized === 'super_admin' || normalized === 'superadmin') return 'super_admin'
  if (normalized === 'admin_pusat' || normalized === 'adminpusat') return 'admin_pusat'
  if (normalized === 'admin_unit' || normalized === 'adminunit') return 'admin_unit'

  return 'super_admin'
}

export default function Dashboard({ stats = {}, recentAssets = [] }: { stats?: Record<string, any>, recentAssets?: Array<Record<string, any>> }) {
  const pageProps = (usePage().props as any) || {}
  const authUser = pageProps.auth?.user ?? pageProps.user ?? null
  const authRoleRaw = authUser?.roleModel?.name ?? authUser?.role ?? (Array.isArray(authUser?.roles) ? (authUser.roles[0]?.name ?? authUser.roles[0]) : authUser?.roles)
  const currentRole = normalizeRole(authRoleRaw ?? 'super_admin')

  const handleNavigate = (page: string) => {
    router.visit(getPageRoute(page))
  }

  return (
    <DashboardLayout
      role={currentRole}
      currentPage='dashboard'
    >
      <DashboardPage role={currentRole} onNavigate={handleNavigate} stats={stats} recentAssets={recentAssets} />
    </DashboardLayout>
  )
}
