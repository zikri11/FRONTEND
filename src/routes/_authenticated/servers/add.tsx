import { createFileRoute } from '@tanstack/react-router'
import { RegisterRouter } from '@/features/servers/register'

export const Route = createFileRoute('/_authenticated/servers/add')({
  component: RegisterRouter,
})
