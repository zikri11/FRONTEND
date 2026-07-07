import { createFileRoute } from '@tanstack/react-router'
import { EditRouter } from '@/features/servers/edit'

export const Route = createFileRoute('/_authenticated/servers/edit/$id')({
  component: EditRouter,
})
