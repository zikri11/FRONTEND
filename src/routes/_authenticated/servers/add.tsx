import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterRouter } from '@/features/servers/register'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/servers/add')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/servers' })
    }
  },
  component: RegisterRouter,
})
