import { createFileRoute, redirect } from '@tanstack/react-router'
import { Servers } from '@/features/servers'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/servers/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: Servers,
})
