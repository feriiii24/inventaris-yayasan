import type { ReactNode } from 'react'

interface PageToolbarProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageToolbar({ title, subtitle, actions }: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {title && (
          <h2 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{title}</h2>
        )}
        {subtitle && (
          <p className="text-xs" style={{ color: '#64748b' }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
