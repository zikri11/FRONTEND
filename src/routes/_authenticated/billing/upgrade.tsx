import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { BillingUpgrade } from '@/features/billing/upgrade'

export const Route = createFileRoute('/_authenticated/billing/upgrade')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: BillingUpgrade,
})
