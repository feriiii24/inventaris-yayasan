import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: any, row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  emptyMessage?: ReactNode
  getRowClassName?: (row: T, rowIndex: number) => string
  onRowClick?: (row: T) => void
}

export default function DataTable<T extends Record<string, any>>({ columns, rows, emptyMessage = 'Belum ada data.', getRowClassName, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full table-fixed text-left text-[13px]">
          <thead style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] align-middle"
                  style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center" style={{ color: '#64748b' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b transition-all duration-200 ease-out hover:bg-slate-50/80 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] ${onRowClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400' : ''} ${getRowClassName ? getRowClassName(row, rowIndex) : ''}`.trim()}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onRowClick(row)
                    }
                  } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  style={{ borderColor: '#f1f5f9' }}
                >
                  {columns.map(column => {
                    const value = row[column.key as keyof T]
                    const content = column.render ? column.render(value, row) : (value ?? '-')

                    return (
                      <td
                        key={String(column.key)}
                        className={`px-3 py-3 align-middle ${column.className ?? ''}`}
                        style={{ color: '#334155' }}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
