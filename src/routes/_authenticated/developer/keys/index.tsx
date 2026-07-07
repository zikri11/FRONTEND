import { createFileRoute } from '@tanstack/react-router'
import { Keys } from '@/features/developer/keys'

export const Route = createFileRoute('/_authenticated/developer/keys/')({
  component: Keys,
})
