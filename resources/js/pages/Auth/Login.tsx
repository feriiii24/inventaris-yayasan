import { router } from '@inertiajs/react'
import LoginPage from '../../components/LoginPage'

export default function Login() {
  const handleLogin = ({ email, password, remember }: { email: string; password: string; remember: boolean }) => {
    // Submit as a plain POST form to ensure server receives request and sets session flash
    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/login'
      form.style.display = 'none'

      const add = (name: string, value: string) => {
        const i = document.createElement('input')
        i.type = 'hidden'
        i.name = name
        i.value = value
        form.appendChild(i)
      }

      add('_token', csrf)
      add('email', email)
      add('password', password)
      add('remember', remember ? '1' : '0')

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Gagal mengirim request login. Periksa console untuk detail.')
      // eslint-disable-next-line no-console
      console.error('Login submit failed', err)
    }
  }

  const handlePublicInventory = () => {
    router.visit('/inventaris')
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onPublicInventory={handlePublicInventory}
    />
  )
}
