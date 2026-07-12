import { createFileRoute, redirect } from '@tanstack/react-router'
import { AddBulkVoucher } from '@/features/vouchers/add-bulk'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/vouchers/add-bulk')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/vouchers' })
    }
  },
  component: AddBulkVoucher,
})
