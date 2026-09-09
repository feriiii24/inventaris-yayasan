import { router } from '@inertiajs/react'
import { PublicInventoryPage } from '../../components/PublicPages'

export default function Inventory() {
  return <PublicInventoryPage onLogin={() => router.visit('/login')} />
}
