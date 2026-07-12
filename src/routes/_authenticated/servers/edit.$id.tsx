import { createFileRoute, redirect } from '@tanstack/react-router'
import { EditRouter } from '@/features/servers/edit'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/servers/edit/$id')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/servers' })
    }
  },
  component: EditRouter,
})
