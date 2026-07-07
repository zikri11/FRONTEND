import { createFileRoute } from '@tanstack/react-router'
import { Docs } from '@/features/developer/docs'

export const Route = createFileRoute('/_authenticated/developer/docs/')({
  component: Docs,
})
