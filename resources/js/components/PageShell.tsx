import type { ReactNode } from 'react'

export interface SummaryCardItem {
  label: string
  value: string | number
  subtitle?: string
  accent?: string
  icon?: ReactNode
}

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, subtitle, accent = '#166534', icon }: SummaryCardItem) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold leading-none text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${accent}1A`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
      {subtitle && <p className="mt-3 text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}

interface PageCardProps {
  children: ReactNode
  summaryCards?: SummaryCardItem[]
}

export function PageCard({ children, summaryCards = [] }: PageCardProps) {
  if (summaryCards.length === 0) return <div className="page-panel">{children}</div>

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>
      <div className="page-panel">{children}</div>
    </div>
  )
}

export function PageShell({ title, subtitle, children, summaryCards = [] }: PageHeaderProps & PageCardProps) {
  return (
    <div className="page-shell">
      <PageHeader title={title} subtitle={subtitle} />
      <PageCard summaryCards={summaryCards}>{children}</PageCard>
    </div>
  )
}
