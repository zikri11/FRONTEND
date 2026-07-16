import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { KelolaPlan } from '@/features/plans'

export const Route = createFileRoute('/_authenticated/plans/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'SUPER_ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: KelolaPlan,
})
