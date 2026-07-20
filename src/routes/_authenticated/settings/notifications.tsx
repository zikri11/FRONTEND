import { createFileRoute, redirect } from '@tanstack/react-router'

// Halaman Notifications (dummy, tanpa backend) dihapus → arahkan ke /settings.
export const Route = createFileRoute('/_authenticated/settings/notifications')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' })
  },
})
