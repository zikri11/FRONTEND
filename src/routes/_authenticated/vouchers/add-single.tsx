import { createFileRoute, redirect } from '@tanstack/react-router'
import { AddSingleVoucher } from '@/features/vouchers/add-single'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/vouchers/add-single')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/vouchers' })
    }
  },
  component: AddSingleVoucher,
})
