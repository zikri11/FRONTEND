import { DUMMY_OWNERS } from '@/features/owners/data/dummy-owners'

// Dummy seluruh router lintas tenant untuk SUPER_ADMIN — sampai backend
// menyertakan nama owner di GET /servers (scope SA sudah global).
export type RouterStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN'

export type RouterRow = {
  id: string
  name: string
  host: string
  port: number
  useSSL: boolean
  ownerName: string
  lastStatus: RouterStatus
  lastCheckedAt: string | null // "d MMM yyyy, HH:mm"
  username: string
  password: string // dummy — aslinya terenkripsi AES-256-GCM di backend
  hotspotName: string | null
  dnsName: string | null
}

export const ROUTER_STATUSES: RouterStatus[] = ['ONLINE', 'OFFLINE', 'UNKNOWN']

const TOTAL = 40

function statusFor(i: number): RouterStatus {
  if (i % 11 === 0) return 'UNKNOWN'
  if (i % 7 === 0) return 'OFFLINE'
  return 'ONLINE'
}

function checkedAtFor(i: number, status: RouterStatus): string | null {
  if (status === 'UNKNOWN') return null
  const day = 13 + (i % 2)
  const hour = 8 + (i % 12)
  const minute = (i * 13) % 60
  return `${day} Jul 2026, ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function generate(): RouterRow[] {
  const list: RouterRow[] = []
  for (let i = 0; i < TOTAL; i++) {
    const owner = DUMMY_OWNERS[i % DUMMY_OWNERS.length]
    const useSSL = i % 3 === 0
    const status = statusFor(i)
    list.push({
      id: `router-${String(i + 1).padStart(2, '0')}`,
      name: `Router Outlet ${(i % 3) + 1}`,
      host: `192.168.${(i % 20) + 1}.${((i * 7) % 250) + 1}`,
      port: useSSL ? 8729 : 8728,
      useSSL,
      ownerName: owner.name,
      lastStatus: status,
      lastCheckedAt: checkedAtFor(i, status),
      username: 'admin',
      password: `rahasia-${String(i + 1).padStart(2, '0')}`,
      hotspotName: i % 4 === 0 ? null : `hotspot${(i % 2) + 1}`,
      dnsName: i % 3 === 0 ? null : `login.outlet${(i % 3) + 1}.wifi.com`,
    })
  }
  return list
}

export const DUMMY_ROUTERS: RouterRow[] = generate()
