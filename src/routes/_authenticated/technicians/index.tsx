import { createFileRoute, redirect } from '@tanstack/react-router'
import { Technicians } from '@/features/technicians'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/technicians/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'TEKNISI') {
      throw redirect({
        to: '/',
      })
    }
  },
  component: Technicians,
})
