import { router } from '@inertiajs/react'
import { PublicBorrowingPage } from '../../components/PublicPages'

export default function Borrowing() {
  return <PublicBorrowingPage onLogin={() => router.visit('/login')} />
}
