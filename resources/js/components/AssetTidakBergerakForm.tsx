import AddAssetPage from './AddAssetPage'

interface Props {
  onBack: () => void
  initialValues?: Record<string, string | number>
  mode?: 'create' | 'edit'
}

export default function AssetTidakBergerakForm({ onBack, initialValues, mode = 'create' }: Props) {
  return (
    <AddAssetPage
      onBack={onBack}
      initialValues={initialValues}
      mode={mode}
      category="Tidak Bergerak"
      title="Tambah Aset Tidak Bergerak"
      submitLabel="Simpan Aset Tidak Bergerak"
    />
  )
}
