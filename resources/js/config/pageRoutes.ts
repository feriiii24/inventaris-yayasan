import type { Page } from '../types'

export const pageMap: Record<Page, string> = {
  login: '/login',
  dashboard: '/dashboard',
  'add-asset': '/inventaris/create',
  'asset-detail': '/inventaris/1',
  'asset-inventaris': '/inventaris/aset-inventaris',
  'asset-bergerak': '/inventaris/aset-bergerak',
  'asset-tidak-bergerak': '/inventaris/aset-tidak-bergerak',
  'usaha-yayasan': '/inventaris/usaha-yayasan',
  'daftar-unit': '/unit',
  'distribusi-unit': '/unit/distribusi',
  'mutasi-aset': '/mutasi',
  'peminjaman-aset': '/peminjaman',
  'pengembalian-aset': '/pengembalian',
  'laporan-aset': '/laporan',
  'laporan-kondisi': '/laporan/kondisi',
  'laporan-nilai': '/laporan/nilai',
  'laporan-mutasi': '/laporan/mutasi',
  'master-kategori': '/master/kategori',
  'master-lokasi': '/master/lokasi',
  'master-ruangan': '/master/ruangan',
  'master-jenis': '/master/jenis',
  pengguna: '/pengguna',
  aktivitas: '/aktivitas',
  pengaturan: '/pengaturan',
  'public-inventory': '/inventaris',
  'public-borrowing': '/peminjaman',
}

export const getAssetDetailRoute = (assetId?: string | number, category: 'inventaris' | 'bergerak' | 'tidak-bergerak' | 'usaha-yayasan' = 'inventaris') => {
  const id = assetId ?? 1
  const prefixMap = {
    inventaris: 'aset-inventaris',
    bergerak: 'aset-bergerak',
    'tidak-bergerak': 'aset-tidak-bergerak',
    'usaha-yayasan': 'usaha-yayasan',
  }

  return `/inventaris/${prefixMap[category]}/${id}`
}

export const getAssetEditRoute = (assetId?: string | number, category: 'inventaris' | 'bergerak' | 'tidak-bergerak' | 'usaha-yayasan' = 'inventaris') => `${getAssetDetailRoute(assetId, category)}/edit`

export const getAssetIdFromPath = (pathname = typeof window !== 'undefined' ? window.location.pathname : '') => {
  const normalized = pathname.split('?')[0].replace(/\/+$/, '')
  const segments = normalized.split('/').filter(Boolean)
  const inventarisIndex = segments.indexOf('inventaris')

  if (inventarisIndex === -1) return undefined

  const maybeAssetId = segments[inventarisIndex + 1]
  if (
    !maybeAssetId ||
    maybeAssetId === 'create' ||
    maybeAssetId === 'edit' ||
    ['aset-inventaris', 'aset-bergerak', 'aset-tidak-bergerak', 'usaha-yayasan'].includes(maybeAssetId)
  ) {
    return undefined
  }

  return maybeAssetId
}

export const getPageRoute = (page: Page | string | undefined) => {
  if (!page) return '/dashboard'
  if (page.startsWith('/')) return page
  return pageMap[page as Page] ?? '/dashboard'
}
