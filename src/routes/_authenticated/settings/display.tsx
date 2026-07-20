import { createFileRoute, redirect } from '@tanstack/react-router'

// Halaman Display (dummy, tanpa backend) dihapus → arahkan ke /settings.
export const Route = createFileRoute('/_authenticated/settings/display')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
})
