import { createFileRoute } from '@tanstack/react-router'
import { AddProfile } from '@/features/profiles/add'

export const Route = createFileRoute('/_authenticated/profiles/add')({
  component: AddProfile,
})
