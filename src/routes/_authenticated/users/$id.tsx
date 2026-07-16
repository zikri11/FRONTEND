import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { OwnerDetail } from '@/features/owners/detail'

export const Route = createFileRoute('/_authenticated/users/$id')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'SUPER_ADMIN') {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <OwnerDetail ownerId={id} />
}
