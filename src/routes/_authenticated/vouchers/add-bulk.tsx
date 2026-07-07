import { createFileRoute } from '@tanstack/react-router'
import { AddBulkVoucher } from '@/features/vouchers/add-bulk'

export const Route = createFileRoute('/_authenticated/vouchers/add-bulk')({
  component: AddBulkVoucher,
})
