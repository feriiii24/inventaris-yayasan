import { router } from '@inertiajs/react'
import AddAssetPage from '../../components/AddAssetPage'
import DashboardLayout from '../../Layouts/DashboardLayout'
import { getAssetIdFromPath } from '../../config/pageRoutes'
import { usePage } from '@inertiajs/react'
import type { Role } from '../../types'

export default function Edit({ assetId }: { assetId?: string }) {
  const role: Role = 'super_admin'
  const props = usePage().props as any
  const resolvedAssetId = String(assetId ?? getAssetIdFromPath() ?? (props.asset?.id ?? props.rows?.[0]?.id ?? '1'))
  const serverAsset = props.asset ?? (props.rows ?? []).find((item: any) => String(item.id) === resolvedAssetId)
  const asset = serverAsset ?? {
    id: resolvedAssetId,
    kode: '',
    nama: '',
    kategori: '',
    jenis: '',
    unit: '',
    lokasi: '',
    ruangan: '',
    tanggalPerolehan: '',
    tahunPerolehan: '',
    nilaiPerolehan: '',
    sumberDana: '',
    kondisi: 'Baik',
    status: '',
    deskripsi: '',
    penanggungjawab: '',
    spesifikasi: '',
    jumlah: '',
    satuan: '',
    asalBarang: '',
    bentukAset: '',
    dasarHak: '',
    atasNama: '',
    nomorRegistrasi: '',
    jangkaWaktu: '',
    pengelola: '',
    mulaiOperasional: '',
    dasarPerjanjian: '',
    keterangan: '',
    dibuat: '',
  }

  const initialValues = {
    kode: asset.kode,
    nama: asset.nama,
    kategori: asset.kategori,
    jenis: asset.jenis,
    unit: asset.unit,
    lokasi: asset.lokasi,
    ruangan: asset.ruangan,
    tanggalPerolehan: asset.tanggalPerolehan,
    tahunPerolehan: String(asset.tahunPerolehan),
    nilaiPerolehan: String(asset.nilaiPerolehan),
    sumberDana: asset.sumberDana,
    kondisi: asset.kondisi,
    status: asset.status,
    deskripsi: asset.deskripsi ?? '',
    penanggungjawab: asset.penanggungjawab,
    pemilik: asset.penanggungjawab,
    spesifikasi: asset.spesifikasi ?? '',
    jumlah: asset.jumlah ?? '',
    satuan: asset.satuan ?? '',
    asalBarang: asset.asalBarang ?? '',
    bentukAset: asset.bentukAset ?? '',
    dasarHak: asset.dasarHak ?? '',
    atasNama: asset.atasNama ?? '',
    nomorRegistrasi: asset.nomorRegistrasi ?? '',
    jangkaWaktu: asset.jangkaWaktu ?? '',
    pengelola: asset.pengelola ?? '',
    mulaiOperasional: asset.mulaiOperasional ?? '',
    dasarPerjanjian: asset.dasarPerjanjian ?? '',
    keterangan: asset.keterangan ?? '',
    dibuat: asset.dibuat ?? '',
  }

  return (
    <DashboardLayout role={role} currentPage='asset-detail'>
      <AddAssetPage
        mode='edit'
        title='Edit Aset'
        submitLabel='Simpan Perubahan'
        initialValues={initialValues}
        onBack={() => router.visit(`/inventaris/${resolvedAssetId}`)}
      />
    </DashboardLayout>
  )
}
