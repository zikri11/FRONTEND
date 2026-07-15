import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { PosTransactionsHistory } from '@/features/pos-transactions'

export const Route = createFileRoute('/_authenticated/pos-transactions/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'OWNER') {
      throw redirect({ to: '/' })
    }
  },
  component: PosTransactionsHistory,
})
