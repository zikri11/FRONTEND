import { createFileRoute } from '@tanstack/react-router'
import { ActivityHistory } from '@/features/activity'

export const Route = createFileRoute('/_authenticated/activity/')({
  component: ActivityHistory,
})
