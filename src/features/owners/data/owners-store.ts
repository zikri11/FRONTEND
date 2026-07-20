// Layer API Kelola Owner (SUPER_ADMIN) → backend modul `admin` + `monitoring`.
// GET /admin/owners (list paginated) & GET /admin/owners/:id (detail).
// Timeline outlet pakai GET /monitoring/health/summary per server.
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'

// ── GET /admin/owners ──────────────────────────────────────────────────────
export type OwnerPlan = { code: string; name: string }

export type OwnerListItem = {
  id: string
  name: string
  email: string
  plan: OwnerPlan | null
  teknisiCount: number
  routerCount: number
  posCount: number
  createdAt: string
}

export type OwnersResponse = {
  data: OwnerListItem[]
  meta: { total: number; skip: number; take: number }
}

export type ListOwnersParams = {
  skip?: number
  take?: number
  search?: string
  planCode?: string
}

export function fetchOwners(
  params: ListOwnersParams,
  signal?: AbortSignal
): Promise<OwnersResponse> {
  return api
    .get('/admin/owners', { params, signal })
    .then((r) => r.data as OwnersResponse)
}

// ── GET /admin/owners/:id ──────────────────────────────────────────────────
export type OwnerDetailPlan = {
  code: string
  name: string
  price: number
  durationDays: number | null
  maxRouters: number
  maxTeknisi: number
  aiAccess: boolean
  apiKeyAccess: boolean
}

export type OwnerOutlet = {
  serverId: string
  name: string
  lastStatus: string
  lastCheckedAt: string | null
}

export type OwnerDetailData = {
  id: string
  name: string
  email: string
  createdAt: string
  subscription: {
    plan: OwnerDetailPlan
    status: string
    startedAt: string | null
    expiredAt: string | null
  } | null
  usage: {
    routers: { used: number; max: number }
    teknisi: { used: number; max: number }
    aiAccess: boolean
    apiKeyAccess: boolean
  }
  monitoring: { outlets: OwnerOutlet[] }
}

export function fetchOwnerDetail(
  id: string,
  signal?: AbortSignal
): Promise<OwnerDetailData> {
  return api
    .get(`/admin/owners/${id}`, { signal })
    .then((r) => r.data as OwnerDetailData)
}

// ── GET /monitoring/health/summary ─────────────────────────────────────────
// Per hari; hari tanpa cek TIDAK muncul (harus di-merge ke grid di FE).
export type HealthSummaryPoint = {
  date: string // YYYY-MM-DD (UTC)
  checks: number
  fails: number
  uptimePct: number
  downtimeMinutes: number
}

export function fetchHealthSummary(
  serverId: string,
  days: number,
  signal?: AbortSignal
): Promise<HealthSummaryPoint[]> {
  return api
    .get('/monitoring/health/summary', { params: { serverId, days }, signal })
    .then((r) => (r.data as { data: HealthSummaryPoint[] }).data)
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function ownerErrorMessage(error: unknown, fallback: string): string {
  const m =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}

export function formatDateId(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}
