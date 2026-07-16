// Penyimpanan dummy plan (module-level, hilang saat reload) — sampai backend
// punya CRUD plan. Dipakai bersama halaman list, add, dan edit.
export type PlanRow = {
  id: string
  name: string
  maxRouters: number
  maxTechnicians: number
  aiAccess: boolean
  durationDays: number
  price: number
  period: 'Bulan' | 'Tahun'
}

export const EMPTY_PLAN_FORM: Omit<PlanRow, 'id'> = {
  name: '',
  maxRouters: 0,
  maxTechnicians: 0,
  aiAccess: false,
  durationDays: 30,
  price: 0,
  period: 'Bulan',
}

let plans: PlanRow[] = [
  { id: 'plan-free', name: 'Free', maxRouters: 5, maxTechnicians: 2, aiAccess: false, durationDays: 30, price: 0, period: 'Bulan' },
  { id: 'plan-standard', name: 'Standard', maxRouters: 25, maxTechnicians: 10, aiAccess: true, durationDays: 30, price: 149000, period: 'Bulan' },
  { id: 'plan-pro', name: 'Pro', maxRouters: 100, maxTechnicians: 50, aiAccess: true, durationDays: 30, price: 299000, period: 'Bulan' },
]

export function getPlans(): PlanRow[] {
  return [...plans]
}

export function getPlan(id: string): PlanRow | undefined {
  return plans.find((p) => p.id === id)
}

export function upsertPlan(data: Omit<PlanRow, 'id'>, id?: string): void {
  if (id) {
    plans = plans.map((p) => (p.id === id ? { ...p, ...data } : p))
  } else {
    plans = [
      ...plans,
      { id: `plan-${Date.now()}-${data.name.toLowerCase()}`, ...data },
    ]
  }
}

export function deletePlan(id: string): void {
  plans = plans.filter((p) => p.id !== id)
}

export function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}
