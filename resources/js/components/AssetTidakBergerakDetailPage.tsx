import { AssetDetailTemplate } from './AssetDetailPage'

function getInfoRows(asset: Record<string, any>) {
  return [
    { label: 'Kode Aset', value: String(asset.asset_code ?? asset.kode ?? '') },
    { label: 'Nama Aset', value: String(asset.name ?? asset.nama ?? asset.bentukAset ?? '') },
    { label: 'Kategori', value: String(asset.kategori ?? asset.category?.name ?? 'Tidak Bergerak') },
    { label: 'Jenis Aset', value: String(asset.jenis ?? asset.type?.name ?? '') },
    { label: 'Bentuk Aset', value: String(asset.bentukAset ?? asset.name ?? '') },
    { label: 'Dasar Hak', value: String(asset.legal_basis ?? asset.dasarHak ?? '') },
    { label: 'Atas Nama', value: String(asset.owner_name ?? asset.atasNama ?? '') },
    { label: 'Tahun Perolehan', value: String(asset.acquisition_year ?? asset.tahunPerolehan ?? '') },
    { label: 'Jangka Waktu', value: String(asset.jangkaWaktu ?? asset.start_operation_date ?? '') },
    { label: 'Kondisi', value: String(asset.condition_status ?? asset.kondisi ?? '') },
    { label: 'Nilai Perolehan', value: asset.purchase_value ?? asset.nilaiPerolehan ? `Rp ${Number(asset.purchase_value ?? asset.nilaiPerolehan).toLocaleString('id-ID')}` : '' },
    { label: 'Lokasi', value: String(asset.location?.name ?? asset.lokasi ?? '') },
    { label: 'Unit', value: String(asset.unit?.name ?? asset.unit_name ?? asset.unit ?? '') },
    { label: 'Penanggung Jawab', value: String(asset.owner_name ?? asset.penanggungjawab ?? '') },
    { label: 'Dibuat', value: String(asset.dibuat ?? asset.created_at ?? '') },
    { label: 'Keterangan', value: String(asset.description ?? asset.keterangan ?? '') },
  ].filter((row) => row.value)
}

interface Props {
  onBack: () => void
  assetId?: string
  asset?: Record<string, any>
}

export default function AssetTidakBergerakDetailPage({ onBack, assetId, asset }: Props) {
  const resolvedAsset = asset ?? { id: assetId ?? '1', asset_code: '-', name: '-', kategori: 'Tidak Bergerak' }

  return <AssetDetailTemplate onBack={onBack} asset={resolvedAsset} title="Detail Aset Tidak Bergerak" infoRows={getInfoRows(resolvedAsset)} />
}
