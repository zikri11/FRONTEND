import { createFileRoute, redirect } from '@tanstack/react-router'

// Halaman "Account" template lama digabung ke halaman Akun (/settings).
export const Route = createFileRoute('/_authenticated/settings/account')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
})
