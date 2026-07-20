// Helper monitoring bersama (dipakai dashboard owner & panel SA).
// Backend: GET /monitoring/health/summary — agregat uptime per hari, ter-scope.
import { api } from '@/lib/axios'

export type HealthSummaryPoint = {
  date: string // YYYY-MM-DD (UTC)
  checks: number
  fails: number
  uptimePct: number
  downtimeMinutes: number
}

// Tanpa serverId → agregat semua outlet (sesuai scope). Dengan serverId → 1 outlet.
export function fetchHealthSummary(
  params: { serverId?: string; days?: number },
  signal?: AbortSignal
): Promise<HealthSummaryPoint[]> {
  return api
    .get('/monitoring/health/summary', { params, signal })
    .then((r) => (r.data as { data: HealthSummaryPoint[] }).data)
}

// Availability overall dari total checks/fails (bukan rata-rata harian).
export function availabilityLabel(points?: HealthSummaryPoint[]): string {
  const pts = points ?? []
  const checks = pts.reduce((a, p) => a + p.checks, 0)
  if (checks === 0) return '—'
  const fails = pts.reduce((a, p) => a + p.fails, 0)
  return `${Math.round(((checks - fails) / checks) * 10000) / 100}%`
}

// Kunci hari UTC (cocok date_trunc('day') backend) untuk `days` terakhir.
// Hari tanpa cek tak dikembalikan backend → di-merge ke grid ini.
export function buildDayKeys(days: number): string[] {
  const now = new Date()
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10))
  }
  return keys
}
