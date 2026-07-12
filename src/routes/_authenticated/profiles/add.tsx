import { createFileRoute, redirect } from '@tanstack/react-router'
import { AddProfile } from '@/features/profiles/add'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/profiles/add')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'OWNER') {
      throw redirect({ to: '/profiles' })
    }
  },
  component: AddProfile,
})
