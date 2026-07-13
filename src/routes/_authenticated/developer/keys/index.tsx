import { createFileRoute, redirect } from '@tanstack/react-router'
import { Keys } from '@/features/developer/keys'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/developer/keys/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: Keys,
})
