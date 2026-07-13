import { createFileRoute, redirect } from '@tanstack/react-router'
import { Docs } from '@/features/developer/docs'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/developer/docs/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: Docs,
})
