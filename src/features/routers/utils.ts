import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'

// Util bersama fitur Kelola Router (list + detail), data real GET /servers.
export type RouterStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN'

type OwnerUser = { id: string; name: string }

// Map ownerId -> nama owner (GET /servers hanya membawa ownerId; SA boleh
// GET /users?role=OWNER global)
export function useOwnersMap(): Record<string, string> {
  const { data } = useQuery({
    queryKey: ['owners-map'],
    queryFn: ({ signal }) =>
      api
        .get('/users', { params: { role: 'OWNER' }, signal })
        .then((r) =>
          Object.fromEntries(
            ((r.data ?? []) as OwnerUser[]).map((u) => [u.id, u.name])
          )
        ),
    staleTime: 60_000,
  })
  return (data ?? {}) as Record<string, string>
}

export function normalizeStatus(status: string | null | undefined): RouterStatus {
  if (status === 'ONLINE' || status === 'OFFLINE') return status
  return 'UNKNOWN'
}

export function formatCheckedAt(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
