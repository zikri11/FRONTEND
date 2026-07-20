// Layer API Kelola Plan (SUPER_ADMIN) → backend modul `plans`.
// GET /plans balik ARRAY polos (bukan {data,meta}) & memuat paket non-aktif.
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'

// Bentuk Plan dari backend (Prisma model Plan).
export type Plan = {
  id: string
  code: string
  name: string
  price: number
  durationDays: number | null
  maxRouters: number
  maxTeknisi: number
  aiAccess: boolean
  apiKeyAccess: boolean
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

// Payload POST/PATCH — selaras CreatePlanDto backend.
export type PlanPayload = {
  code: string
  name: string
  price: number
  durationDays: number | null
  maxRouters: number
  maxTeknisi: number
  aiAccess: boolean
  apiKeyAccess: boolean
  isActive: boolean
}

export const EMPTY_PLAN_FORM: PlanPayload = {
  code: '',
  name: '',
  price: 0,
  durationDays: 30,
  maxRouters: 0,
  maxTeknisi: 0,
  aiAccess: false,
  apiKeyAccess: false,
  isActive: true,
}

export function fetchPlans(signal?: AbortSignal): Promise<Plan[]> {
  return api.get('/plans', { signal }).then((r) => r.data as Plan[])
}

export function fetchPlan(id: string, signal?: AbortSignal): Promise<Plan> {
  return api.get(`/plans/${id}`, { signal }).then((r) => r.data as Plan)
}

export function createPlan(payload: PlanPayload): Promise<Plan> {
  return api.post('/plans', payload).then((r) => r.data as Plan)
}

export function updatePlan(
  id: string,
  payload: Partial<PlanPayload>
): Promise<Plan> {
  return api.patch(`/plans/${id}`, payload).then((r) => r.data as Plan)
}

// DELETE → soft-delete ({softDeleted:true, plan}) bila masih dipakai, else hard.
export type RemovePlanResult = { softDeleted: boolean; plan?: Plan }

export function removePlan(id: string): Promise<RemovePlanResult> {
  return api.delete(`/plans/${id}`).then((r) => r.data as RemovePlanResult)
}

export function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

// Pesan error backend (string | array validasi) → satu baris untuk toast.
export function planErrorMessage(error: unknown, fallback: string): string {
  const m =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}
