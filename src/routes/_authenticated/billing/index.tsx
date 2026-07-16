import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { BillingPage } from '@/features/billing'

export const Route = createFileRoute('/_authenticated/billing/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: BillingPage,
})
