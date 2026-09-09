import type { ReactNode } from 'react'
import DashboardLayout from '../Layouts/DashboardLayout'
import { PageShell, type SummaryCardItem } from './PageShell'
import type { Role } from '../types'

interface SidebarPageProps {
  title: string
  subtitle?: string
  role?: Role
  currentPage: any
  userName?: string
  userUnit?: string
  children?: ReactNode
  summaryCards?: SummaryCardItem[]
}

export default function SidebarPage({
  title,
  subtitle,
  role = 'super_admin',
  currentPage,
  userName,
  userUnit,
  children,
  summaryCards = [],
}: SidebarPageProps) {
  return (
    <DashboardLayout
      role={role}
      currentPage={currentPage}
    >
      <PageShell title={title} subtitle={subtitle} summaryCards={summaryCards}>
        {children ?? (
          <div className="text-sm" style={{ color: '#475569' }}>
            Halaman ini sudah aktif dan siap digunakan.
          </div>
        )}
      </PageShell>
    </DashboardLayout>
  )
}
