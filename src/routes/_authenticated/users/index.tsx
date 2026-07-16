import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { KelolaOwner } from '@/features/owners'

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'SUPER_ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: KelolaOwner,
})
