import { createFileRoute } from '@tanstack/react-router'
import { ActiveUsersFeature } from '@/features/active-users'

export const Route = createFileRoute('/_authenticated/active-users/')({
  component: ActiveUsersFeature,
})
