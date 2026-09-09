import { cloneElement, Fragment, isValidElement, useEffect, useMemo, useRef, useState } from 'react'
import DataTable, { type DataTableColumn } from './ui/DataTable'

interface AssetPageTableProps<T extends Record<string, any>> {
  title?: string
  subtitle?: string
  rows: T[]
  columns: DataTableColumn<T>[]
  searchPlaceholder?: string
  emptyMessage?: React.ReactNode
  emptyContent?: React.ReactNode
  pageSize?: number | 'all'
  pageSizeOptions?: Array<number | 'all'>
  showPageSizeSelector?: boolean
  onPageSizeChange?: (value: number | 'all') => void
  addButtonLabel?: string
  onAdd?: () => void
  renderActions?: (row: T) => React.ReactNode
  renderQuickActions?: (row: T) => React.ReactNode
  showTitle?: boolean
  showSearch?: boolean
  showAddButton?: boolean
  toolbar?: React.ReactNode
  searchTerm?: string
  onSearchChange?: (value: string) => void
  getRowClassName?: (row: T, rowIndex: number) => string
  onRowClick?: (row: T) => void
}

export function ActionButton({
  title,
  children,
  onClick,
  variant = 'default',
  className = '',
}: {
  title: string
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger' | 'success'
  className?: string
}) {
  const base = {
    borderColor: variant === 'danger' ? '#fecaca' : variant === 'success' ? '#15803d' : '#e2e8f0',
    color: variant === 'danger' ? '#b91c1c' : variant === 'success' ? '#ffffff' : '#475569',
    background: variant === 'danger' ? '#fef2f2' : variant === 'success' ? '#16a34a' : 'transparent',
  }

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm ${className}`}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = variant === 'danger' ? '#fee2e2' : variant === 'success' ? '#15803d' : '#f8fafc'
        e.currentTarget.style.borderColor = variant === 'danger' ? '#fca5a5' : variant === 'success' ? '#166534' : '#cbd5e1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variant === 'danger' ? '#fef2f2' : variant === 'success' ? '#16a34a' : 'transparent'
        e.currentTarget.style.borderColor = variant === 'danger' ? '#fecaca' : variant === 'success' ? '#15803d' : '#e2e8f0'
      }}
    >
      {children}
    </button>
  )
}

function ActionMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const flattenMenuItems = (node: React.ReactNode): React.ReactNode[] => {
    if (node === null || node === undefined || node === false || node === true) {
      return []
    }

    if (Array.isArray(node)) {
      return node.flatMap((item) => flattenMenuItems(item))
    }

    if (isValidElement(node)) {
      if (node.type === Fragment) {
        return flattenMenuItems(node.props?.children)
      }

      if (typeof node.type === 'string' && (node.type === 'div' || node.type === 'span')) {
        return flattenMenuItems(node.props?.children)
      }

      return [node]
    }

    return [node]
  }

  const menuItems = flattenMenuItems(children)

  const hasTextContent = (node: React.ReactNode): boolean => {
    if (node === null || node === undefined || node === false || node === true) {
      return false
    }

    if (typeof node === 'string' || typeof node === 'number') {
      return true
    }

    if (Array.isArray(node)) {
      return node.some((part) => hasTextContent(part))
    }

    if (isValidElement(node)) {
      return hasTextContent(node.props?.children)
    }

    return false
  }

  const updateMenuPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const menuWidth = 190
    const maxLeft = window.innerWidth - menuWidth - 12
    const nextLeft = Math.min(rect.right - menuWidth, maxLeft)
    const nextTop = Math.min(rect.bottom + 8, window.innerHeight - 220)

    setMenuPosition({
      top: Math.max(12, nextTop),
      left: Math.max(12, nextLeft),
    })
  }

  useEffect(() => {
    if (!open) return

    updateMenuPosition()

    const handleScroll = () => updateMenuPosition()
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  const handleToggle = () => {
    if (!open) {
      updateMenuPosition()
    }

    setOpen((value) => !value)
  }

  return (
    <div ref={containerRef} className="relative inline-flex w-8 items-center justify-center overflow-visible">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Aksi"
        title="Aksi"
        onClick={handleToggle}
        className="relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm0 7a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm0 7a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed min-w-[190px] rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl motion-safe:animate-[fadeIn_0.18s_ease-out]"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 41 }}
          >
            <div className="flex flex-col gap-1.5" onClick={() => setOpen(false)}>
              {menuItems.map((item, index) => {
                if (!isValidElement(item)) {
                  return <div key={index} className="w-full">{item}</div>
                }

                const titleText = typeof item.props?.title === 'string' ? item.props.title : ''
                const childValue = item.props?.children
                const shouldAddTextLabel = !hasTextContent(childValue) && !!titleText

                const menuChildren = shouldAddTextLabel
                  ? (
                    <span className="flex items-center gap-2">
                      <span className="flex items-center justify-center">{childValue}</span>
                      <span>{titleText}</span>
                    </span>
                  )
                  : childValue

                return cloneElement(item, {
                  key: item.key ?? index,
                  children: menuChildren,
                  className: `${item.props.className ?? ''} w-full !justify-start !rounded-xl !px-2.5 !py-2 !text-left !text-[11px] !font-medium !shadow-none !border-0 !bg-transparent !transition-all hover:!bg-slate-50 hover:!text-slate-900`,
                })
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AssetPageTable<T extends Record<string, any>>({
  title,
  subtitle,
  rows,
  columns,
  searchPlaceholder = 'Cari data...',
  emptyMessage = 'Belum ada data.',
  emptyContent,
  pageSize = 10,
  pageSizeOptions = [10, 50, 100, 'all'],
  showPageSizeSelector = true,
  onPageSizeChange,
  addButtonLabel,
  onAdd,
  renderActions,
  renderQuickActions,
  showTitle = true,
  showSearch = true,
  showAddButton = true,
  toolbar,
  searchTerm,
  onSearchChange,
  getRowClassName,
  onRowClick,
}: AssetPageTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('')
  const [internalPageSize, setInternalPageSize] = useState<number | 'all'>(pageSize === 'all' ? 'all' : Math.max(10, Number(pageSize) || 10))
  const [currentPage, setCurrentPage] = useState(1)
  const resolvedSearch = searchTerm ?? internalSearch
  const setResolvedSearch = onSearchChange ?? setInternalSearch

  useEffect(() => {
    const nextValue = pageSize === 'all' ? 'all' : Math.max(10, Number(pageSize) || 10)
    setInternalPageSize(nextValue)
  }, [pageSize])

  const filteredRows = useMemo(() => {
    const query = resolvedSearch.trim().toLowerCase()

    if (!query) return rows

    return rows.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(query))
    )
  }, [rows, resolvedSearch])

  const headerActions = showAddButton && (addButtonLabel || onAdd) ? (
    <button
      onClick={onAdd}
      className="px-3 py-2 rounded-xl text-xs font-medium text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: '#166534' }}
    >
      {addButtonLabel ?? '+ Tambah Data'}
    </button>
  ) : null

  const effectivePageSize = internalPageSize
  const normalizedPageSize = effectivePageSize === 'all' ? (filteredRows.length || 1) : Math.max(10, Number(effectivePageSize) || 10)
  const totalPages = effectivePageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredRows.length / normalizedPageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRows = effectivePageSize === 'all'
    ? filteredRows
    : filteredRows.slice((safePage - 1) * normalizedPageSize, safePage * normalizedPageSize)

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const tableColumns: DataTableColumn<T>[] = renderActions || renderQuickActions
    ? [
        ...columns,
        {
          key: 'actions',
          label: 'Aksi',
          className: 'whitespace-nowrap text-center',
          render: (_value, row) => (
            <div className="flex w-full items-center justify-center gap-2">
              {renderQuickActions && (
                <div className="flex items-center gap-2">{renderQuickActions(row)}</div>
              )}
              {renderActions && <ActionMenu>{renderActions(row)}</ActionMenu>}
            </div>
          ),
        },
      ]
    : columns

  const handleSearch = (value: string) => {
    setResolvedSearch(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (value: number | 'all') => {
    setInternalPageSize(value)
    onPageSizeChange?.(value)
    setCurrentPage(1)
  }

  const pageNumberButtons = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#0f172a' }}>{title}</h2>
            {subtitle && <p className="text-xs" style={{ color: '#64748b' }}>{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {headerActions}

            {showSearch && (
              <div className="relative w-full sm:max-w-xs">
                <svg
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#94a3b8' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={resolvedSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-all duration-200 ease-out focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:-translate-y-0.5"
                  style={{ borderColor: '#e2e8f0', background: '#ffffff', color: '#0f172a' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {toolbar && <div className="pt-1">{toolbar}</div>}

      <DataTable
        columns={tableColumns}
        rows={paginatedRows}
        emptyMessage={emptyContent ?? emptyMessage}
        getRowClassName={getRowClassName}
        onRowClick={onRowClick}
      />

      {showPageSizeSelector || filteredRows.length > (effectivePageSize === 'all' ? 0 : normalizedPageSize) ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Menampilkan</span>
            {showPageSizeSelector && (
              <select
                value={effectivePageSize === 'all' ? 'all' : String(effectivePageSize)}
                onChange={(event) => {
                  const nextValue = event.target.value === 'all' ? 'all' : Number(event.target.value)
                  handlePageSizeChange(nextValue)
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-700 outline-none transition focus:border-emerald-300"
              >
                {pageSizeOptions.map((option) => (
                  <option key={String(option)} value={option === 'all' ? 'all' : String(option)}>
                    {option === 'all' ? 'Semua' : option}
                  </option>
                ))}
              </select>
            )}
            <span>{effectivePageSize === 'all' ? 'semua data' : `${effectivePageSize} / halaman`}</span>
          </div>

          {effectivePageSize !== 'all' && filteredRows.length > normalizedPageSize && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              {pageNumberButtons.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${pageNumber === safePage ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                >
                  {pageNumber}
                </button>
              ))}

              {totalPages > 5 && <span className="px-1 text-[12px] text-slate-500">...</span>}

              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          )}

          {effectivePageSize !== 'all' && filteredRows.length <= normalizedPageSize && (
            <span className="text-xs text-slate-500">
              {filteredRows.length} data
            </span>
          )}

          {effectivePageSize === 'all' && (
            <span className="text-xs text-slate-500">
              Menampilkan semua {filteredRows.length} data
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
