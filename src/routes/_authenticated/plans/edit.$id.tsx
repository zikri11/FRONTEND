import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { PlanForm } from '@/features/plans/form'

export const Route = createFileRoute('/_authenticated/plans/edit/$id')({
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
  return <PlanForm planId={id} />
}
