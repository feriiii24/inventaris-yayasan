import type { ReactNode } from 'react'

export const dashboardCardClass = 'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]'

export function SectionHeader({ eyebrow, title, description, action, tone = 'light' }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; tone?: 'light' | 'dark' }) {
  const isDark = tone === 'dark'
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-emerald-200' : 'text-slate-400'}`}>{eyebrow}</p>}
        <h2 className={`mt-1 text-[17px] font-semibold tracking-[-0.01em] ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
        {description && <p className={`mt-1 text-xs ${isDark ? 'text-emerald-100/85' : 'text-slate-500'}`}>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ChartCard({ eyebrow, title, description, action, children, className = '' }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`${dashboardCardClass} chart-card relative overflow-hidden ${className}`}><div className="chart-card-accent" aria-hidden="true" /><div className="chart-card-header px-5 pb-4 pt-5 sm:px-6"><SectionHeader eyebrow={eyebrow} title={title} description={description} action={action} /></div><div className="chart-card-body relative px-5 py-5 sm:px-6">{children}</div></section>
}

export function StatusBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Baik: 'bg-emerald-50 text-emerald-700',
    'Rusak Ringan': 'bg-amber-50 text-amber-700',
    'Rusak Berat': 'bg-red-50 text-red-700',
    'Dalam Perbaikan': 'bg-blue-50 text-blue-700',
    Aktif: 'bg-emerald-50 text-emerald-700',
    Dipinjam: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[label] ?? 'bg-slate-100 text-slate-600'}`}>{label}</span>
}

export function ProgressIndicator({ value, color = '#4f46e5' }: { value: number; color?: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(value, 100)))}><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(value, 100))}%`, background: color }} /></div>
}

export function StatisticCard({ label, value, detail, color, icon, money, formatMoney, formatNumber }: { label: string; value: number; detail: string; color: string; icon: ReactNode; money?: boolean; formatMoney: (value: number) => string; formatNumber: (value: number) => string }) {
  const display = money ? formatMoney(value) : formatNumber(value)
  return <article className={`${dashboardCardClass} flex min-h-[158px] flex-col p-5 transition-shadow duration-200 hover:border-slate-300 hover:shadow-md`}>
    <div className="flex items-start"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold" style={{ background: `${color}12`, color }}>{icon}</span></div>
    <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{display}</p>
    <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{detail}</div>
  </article>
}

export function ActivityItem({ user, activity, unit, time }: { user: string; activity: string; unit: string; time: string }) {
  return <div className="flex gap-3 px-5 py-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" /><div><p className="text-xs text-slate-700"><b>{user}</b> {activity}</p><p className="mt-1 text-[11px] text-slate-400">{unit} · {time}</p></div></div>
}

export function AlertItem({ label, value, detail, color, onClick }: { label: string; value: number; detail: string; color: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`${dashboardCardClass} w-full p-4 text-left transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2`}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">{label}</span><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /></div><p className="mt-3 text-2xl font-bold text-slate-950">{value.toLocaleString('id-ID')}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></button>
}

export function EmptyState({ onAdd, title = 'Belum ada data inventaris', description = 'Tambahkan inventaris untuk mulai melihat statistik.', actionLabel = '+ Tambah Inventaris' }: { onAdd: () => void; title?: string; description?: string; actionLabel?: string }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p><button type="button" onClick={onAdd} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">{actionLabel}</button></div>
}

export function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="flex min-w-[145px] flex-1 flex-col gap-1"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}
