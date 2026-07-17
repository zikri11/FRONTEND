import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { PosTransactionsHistory } from '@/features/pos-transactions'

export const Route = createFileRoute('/_authenticated/pos-transactions/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    // OWNER & TEKNISI (ter-scope owner-nya oleh backend) boleh lihat riwayat POS.
    if (user?.role !== 'OWNER' && user?.role !== 'TEKNISI') {
      throw redirect({ to: '/' })
    }
  },
  component: PosTransactionsHistory,
})
