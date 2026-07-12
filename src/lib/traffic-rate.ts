import type { TrafficInterface } from '@/features/dashboard/components/router-health-panel'

// Counter kumulatif tick sebelumnya per router — untuk menghitung rate trafik
// (bit/detik) dari delta antar poll/push. Module-level agar bertahan antar
// render maupun antar sumber data (REST poll atau WebSocket push) untuk
// router yang sama.
const prevTrafficCounters = new Map<string, { ts: number; rx: number; tx: number }>()

export function computeTrafficRate(
  serverId: string,
  traffic: TrafficInterface[]
): { rx: number; tx: number } | null {
  if (!traffic.length) {
    prevTrafficCounters.delete(serverId)
    return null
  }
  const rx = traffic.reduce((s, t) => s + (t.rxByte || 0), 0)
  const tx = traffic.reduce((s, t) => s + (t.txByte || 0), 0)
  const now = Date.now()
  const prev = prevTrafficCounters.get(serverId)
  prevTrafficCounters.set(serverId, { ts: now, rx, tx })
  if (!prev || now <= prev.ts) return null // tick pertama: belum ada delta
  const dt = (now - prev.ts) / 1000
  // Counter reset (router reboot) → delta negatif → anggap 0.
  return {
    rx: (Math.max(0, rx - prev.rx) * 8) / dt,
    tx: (Math.max(0, tx - prev.tx) * 8) / dt,
  }
}
