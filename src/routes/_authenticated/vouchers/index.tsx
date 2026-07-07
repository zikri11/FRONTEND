import { createFileRoute } from '@tanstack/react-router'
import { Vouchers } from '@/features/vouchers'

export const Route = createFileRoute('/_authenticated/vouchers/')({
  component: Vouchers,
})
