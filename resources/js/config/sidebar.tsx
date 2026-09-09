import type { ReactNode } from 'react'
import type { Page, Role } from '../types'

export interface NavItem {
  label: string
  page?: Page
  icon: ReactNode
  children?: { label: string; page: Page }[]
  roles?: Role[]
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard', page: 'dashboard',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Manajemen Aset',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    children: [
      { label: 'Aset Inventaris', page: 'asset-inventaris', roles: ['super_admin','admin_pusat','admin_unit'] },
      { label: 'Aset Bergerak', page: 'asset-bergerak', roles: ['super_admin','admin_pusat'] },
      { label: 'Aset Tidak Bergerak', page: 'asset-tidak-bergerak', roles: ['super_admin','admin_pusat'] },
      { label: 'Usaha Yayasan', page: 'usaha-yayasan', roles: ['super_admin','admin_pusat'] },
    ],
  },
  {
    label: 'Unit',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    roles: ['super_admin', 'admin_pusat'],
    children: [
      { label: 'Daftar Unit', page: 'daftar-unit', roles: ['super_admin', 'admin_pusat'] },
      { label: 'Distribusi Aset per Unit', page: 'distribusi-unit', roles: ['super_admin', 'admin_pusat'] },
    ],
  },
  {
    label: 'Transaksi Aset',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    children: [
      { label: 'Mutasi Aset', page: 'mutasi-aset' },
      { label: 'Peminjaman Aset', page: 'peminjaman-aset' },
      { label: 'Aset Dipinjam', page: 'pengembalian-aset' },
    ],
  },
  {
    label: 'Laporan',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    children: [
      { label: 'Laporan Aset', page: 'laporan-aset' },
      { label: 'Laporan Kondisi', page: 'laporan-kondisi' },
      { label: 'Laporan Nilai Aset', page: 'laporan-nilai' },
      { label: 'Laporan Mutasi', page: 'laporan-mutasi' },
    ],
  },
  {
    label: 'Master Data',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    roles: ['super_admin', 'admin_pusat', 'admin_unit'],
    children: [
      { label: 'Lokasi', page: 'master-lokasi' },
      { label: 'Ruangan', page: 'master-ruangan' },
    ],
  },
  {
    label: 'Pengguna', page: 'pengguna',
    roles: ['super_admin'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    label: 'Aktivitas', page: 'aktivitas',
    roles: ['super_admin', 'admin_pusat'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },

  {
    label: 'Pengaturan', page: 'pengaturan',
    roles: ['super_admin'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
]

export const breadcrumbMap: Partial<Record<Page, string[]>> = {
  dashboard: ['Dashboard'],
  'asset-inventaris': ['Manajemen Aset', 'Aset Inventaris'],
  'asset-bergerak': ['Manajemen Aset', 'Aset Bergerak'],
  'asset-tidak-bergerak': ['Manajemen Aset', 'Aset Tidak Bergerak'],
  'usaha-yayasan': ['Manajemen Aset', 'Usaha Yayasan'],
  'add-asset': ['Manajemen Aset', 'Tambah Aset'],
  'asset-detail': ['Manajemen Aset', 'Detail Aset'],
  'daftar-unit': ['Unit', 'Daftar Unit'],
  'distribusi-unit': ['Unit', 'Distribusi Aset per Unit'],
  'mutasi-aset': ['Transaksi', 'Mutasi Aset'],
  'peminjaman-aset': ['Transaksi', 'Peminjaman Aset'],
  'pengembalian-aset': ['Transaksi', 'Aset Dipinjam'],
  'laporan-aset': ['Laporan', 'Laporan Aset'],
  'laporan-kondisi': ['Laporan', 'Laporan Kondisi'],
  'laporan-nilai': ['Laporan', 'Laporan Nilai Aset'],
  'laporan-mutasi': ['Laporan', 'Laporan Mutasi'],
  'master-lokasi': ['Master Data', 'Lokasi'],
  'master-ruangan': ['Master Data', 'Ruangan'],
  pengguna: ['Pengguna'],
  aktivitas: ['Aktivitas'],
  pengaturan: ['Pengaturan'],
}
