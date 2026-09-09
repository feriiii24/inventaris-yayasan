import { AssetDetailTemplate } from './AssetDetailPage'

function getInfoRows(asset: Record<string, any>) {
  return [
    { label: 'Kode Aset', value: String(asset.asset_code ?? asset.kode ?? '') },
    { label: 'Nama Aset', value: String(asset.name ?? asset.nama ?? '') },
    { label: 'Kategori', value: String(asset.kategori ?? asset.category?.name ?? '') },
    { label: 'Jenis Aset', value: String(asset.jenis ?? asset.type?.name ?? '') },
    { label: 'Tanggal Pembukuan', value: String(asset.dibuat ?? asset.created_at ?? '') },
    { label: 'Tahun Pengadaan', value: String(asset.acquisition_year ?? asset.tahunPengadaan ?? '') },
    { label: 'Jumlah', value: asset.quantity ?? asset.jumlah ? String(asset.quantity ?? asset.jumlah) : '' },
    { label: 'Satuan', value: String(asset.unit_measure ?? asset.satuan ?? '') },
    { label: 'Asal Barang', value: String(asset.acquisition_source ?? asset.asalBarang ?? '') },
    { label: 'Spesifikasi', value: String(asset.description ?? asset.spesifikasi ?? '') },
    { label: 'Kondisi', value: String(asset.condition_status ?? asset.kondisi ?? '') },
    { label: 'Harga Perolehan', value: asset.purchase_value ?? asset.nilaiPerolehan ? `Rp ${Number(asset.purchase_value ?? asset.nilaiPerolehan).toLocaleString('id-ID')}` : '' },
    { label: 'Lokasi', value: String(asset.location?.name ?? asset.lokasi ?? '') },
    { label: 'Unit', value: String(asset.unit?.name ?? asset.unit_name ?? asset.unit ?? '') },
    { label: 'Penanggung Jawab', value: String(asset.owner_name ?? asset.penanggungjawab ?? '') },
    { label: 'Sumber Dana', value: String(asset.acquisition_source ?? asset.sumberDana ?? '') },
  ].filter((row) => row.value)
}

interface Props {
  onBack: () => void
  assetId?: string
  asset?: Record<string, any>
}

export default function AssetInventarisDetailPage({ onBack, assetId, asset }: Props) {
  const resolvedAsset = asset ?? { id: assetId ?? '1', asset_code: '-', name: '-', kategori: 'Inventaris' }

  return <AssetDetailTemplate onBack={onBack} asset={resolvedAsset} title="Detail Aset Inventaris" infoRows={getInfoRows(resolvedAsset)} />
}
