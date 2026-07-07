import { createFileRoute } from '@tanstack/react-router'
import { AddSingleVoucher } from '@/features/vouchers/add-single'

export const Route = createFileRoute('/_authenticated/vouchers/add-single')({
  component: AddSingleVoucher,
})
