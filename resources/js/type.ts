export type Role = 'super_admin' | 'admin_pusat' | 'admin_unit'

export type Page =
  | 'login'
  | 'dashboard'
  | 'add-asset'
  | 'asset-detail'
  | 'asset-inventaris'
  | 'asset-bergerak'
  | 'asset-tidak-bergerak'
  | 'usaha-yayasan'
  | 'daftar-unit'
  | 'distribusi-unit'
  | 'mutasi-aset'
  | 'peminjaman-aset'
  | 'pengembalian-aset'
  | 'laporan-aset'
  | 'laporan-kondisi'
  | 'laporan-nilai'
  | 'laporan-mutasi'
  | 'master-lokasi'
  | 'master-ruangan'
  | 'pengguna'
  | 'aktivitas'
  | 'pengaturan'
  | 'public-inventory'
  | 'public-borrowing'

export type AssetCategory = 'Inventaris' | 'Bergerak' | 'Tidak Bergerak' | 'Usaha Yayasan'
export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Dalam Perbaikan'
export type AssetStatus = 'Aktif' | 'Dipinjam' | 'Dalam Mutasi' | 'Tidak Aktif'

export interface Asset {
  id: string
  kode: string
  nama: string
  kategori: AssetCategory
  jenis: string
  unit: string
  lokasi: string
  ruangan: string
  tahunPerolehan: number
  nilaiPerolehan: number
  kondisi: AssetCondition
  status: AssetStatus
  penanggungjawab: string
  foto?: string
  deskripsi?: string
  tanggalPerolehan: string
  sumberDana: string
}

export interface User {
  id: string
  nama: string
  email: string
  role: Role
  unit?: string
  avatar?: string
}

export interface Activity {
  id: string
  aktivitas: string
  aset: string
  pengguna: string
  unit: string
  waktu: string
  status: 'Sukses' | 'Proses' | 'Gagal'
}
