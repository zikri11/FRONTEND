import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { RouterDetail } from '@/features/routers/detail'

export const Route = createFileRoute('/_authenticated/routers/$id')({
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
  return <RouterDetail routerId={id} />
}
