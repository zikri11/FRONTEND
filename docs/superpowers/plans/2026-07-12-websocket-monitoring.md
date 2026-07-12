# B7 — Monitoring Real-Time via WebSocket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasi data monitoring dashboard dari REST polling (`refetchInterval: 3000`) ke WebSocket push (socket.io `/monitoring` namespace), dengan REST sebagai fallback otomatis kalau WS gagal, tanpa mengubah RBAC OWNER yang sudah ada.

**Architecture:** Hook baru `useMonitoringSocket` mengisolasi seluruh lifecycle socket.io (connect sekali, subscribe/unsubscribe per pergantian router, reconnect otomatis, exhaust setelah 5 percobaan → `unavailable`). `dashboard/index.tsx` compose hook ini dengan query REST yang sudah ada (`fetchDashboardMetrics`, kini jadi fallback-only via `enabled` kondisional) dan query vouchers-count baru yang independen dari status WS.

**Tech Stack:** React 19, TanStack Query, `socket.io-client` (baru), Vitest browser-mode (`vitest-browser-react`, Playwright chromium), Zustand (`useAuthStore`/`useServerStore`).

## Global Constraints

- Install dependency pakai `pnpm add`, **bukan** `npm` (repo pakai pnpm lockfile; `npm` pernah crash di layout node_modules repo ini).
- Semua command shell pakai `rtk proxy` prefix untuk eslint (`rtk proxy npx eslint <file>`), tsc & vitest & vite build jalan langsung tanpa `rtk proxy`.
- OWNER role **tidak pernah** mencoba koneksi WS sama sekali (bukan cuma di-fallback) — sesuai spec §"OWNER tetap 100% di jalur REST lama".
- `computeTrafficRate` dipakai bersama oleh jalur REST dan WS lewat satu `Map` module-level (`src/lib/traffic-rate.ts`) — delta counter harus kontinu lintas sumber data.
- Referensi kontrak backend: `D:\MAGANG-KP\PROJEK\DEMO\BACKEND\backendWebManagementWiFiuntukFnB\doc\CATATAN_FRONTEND.md` §8.
- Spec lengkap: `docs/superpowers/specs/2026-07-12-websocket-monitoring-design.md`.

---

## Task 1: Extract `computeTrafficRate` ke `src/lib/traffic-rate.ts`

**Files:**
- Create: `src/lib/traffic-rate.ts`
- Create (test): `src/lib/traffic-rate.test.ts`
- Modify: `src/features/dashboard/index.tsx:70-94` (hapus definisi lokal, ganti import)

**Interfaces:**
- Produces: `computeTrafficRate(serverId: string, traffic: TrafficInterface[]): { rx: number; tx: number } | null` — dipakai Task 4 (hook) dan sudah dipakai `dashboard/index.tsx`.
- Consumes: `TrafficInterface` type dari `@/features/dashboard/components/router-health-panel`.

- [ ] **Step 1: Buat file lib dengan fungsi yang di-pindah verbatim**

```ts
// src/lib/traffic-rate.ts
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
```

- [ ] **Step 2: Tulis test (belum ada sebelumnya — fungsi ini baru diberi coverage)**

```ts
// src/lib/traffic-rate.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeTrafficRate } from './traffic-rate'
import type { TrafficInterface } from '@/features/dashboard/components/router-health-panel'

function iface(rxByte: number, txByte: number): TrafficInterface {
  return { id: 'ether1', name: 'ether1', rxByte, txByte, running: true }
}

describe('computeTrafficRate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null on the first tick for a server (no prior delta)', () => {
    expect(computeTrafficRate('srv-1', [iface(1000, 500)])).toBeNull()
  })

  it('computes bits/sec from the delta between two ticks', () => {
    computeTrafficRate('srv-2', [iface(1000, 500)])
    vi.setSystemTime(1000) // +1s
    const rate = computeTrafficRate('srv-2', [iface(2000, 1500)])
    expect(rate).toEqual({ rx: 8000, tx: 8000 }) // (1000 bytes * 8) / 1s
  })

  it('clamps to 0 when counters reset (router reboot)', () => {
    computeTrafficRate('srv-3', [iface(5000, 5000)])
    vi.setSystemTime(1000)
    const rate = computeTrafficRate('srv-3', [iface(100, 100)])
    expect(rate).toEqual({ rx: 0, tx: 0 })
  })

  it('returns null and clears state when traffic list is empty', () => {
    computeTrafficRate('srv-4', [iface(1000, 500)])
    vi.setSystemTime(1000)
    expect(computeTrafficRate('srv-4', [])).toBeNull()
    // state cleared → next non-empty call is treated as a fresh first tick
    vi.setSystemTime(2000)
    expect(computeTrafficRate('srv-4', [iface(2000, 1000)])).toBeNull()
  })

  it('sums rxByte/txByte across multiple interfaces', () => {
    computeTrafficRate('srv-5', [iface(1000, 500), iface(2000, 1000)])
    vi.setSystemTime(1000)
    const rate = computeTrafficRate('srv-5', [iface(1500, 700), iface(2500, 1300)])
    // rx delta = (1500-1000)+(2500-2000) = 1000 bytes → 8000 bits/s
    // tx delta = (700-500)+(1300-1000) = 500 bytes → 4000 bits/s
    expect(rate).toEqual({ rx: 8000, tx: 4000 })
  })
})
```

- [ ] **Step 3: Jalankan test, harus PASS langsung (fungsi sudah diimplementasi di Step 1)**

Run: `npx vitest run src/lib/traffic-rate.test.ts`
Expected: 5 passed

- [ ] **Step 4: Hapus definisi lama di `dashboard/index.tsx`, ganti jadi import**

Hapus blok berikut dari `src/features/dashboard/index.tsx` (baris 70-94, persis setelah `EMPTY_METRICS` dan sebelum `is403`):

```ts
// HAPUS blok ini:
// Counter kumulatif tick sebelumnya per router — untuk menghitung rate trafik
// (bit/detik) dari delta antar poll. Module-level agar bertahan antar render.
const prevTrafficCounters = new Map<string, { ts: number; rx: number; tx: number }>()

function computeTrafficRate(
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
  return {
    rx: (Math.max(0, rx - prev.rx) * 8) / dt,
    tx: (Math.max(0, tx - prev.tx) * 8) / dt,
  }
}
```

Tambahkan import di bagian atas file (dekat import `qk`/`nested-box`):

```ts
import { computeTrafficRate } from '@/lib/traffic-rate'
```

Sisa kode (`metrics.trafficRate = computeTrafficRate(serverId, metrics.traffic)` di dalam `fetchDashboardMetrics`) **tidak berubah** — tinggal panggil fungsi yang sekarang di-import.

- [ ] **Step 5: Verifikasi tak ada regresi**

Run: `npx tsc -b --pretty false` → 0 error.
Run: `rtk proxy npx eslint src/features/dashboard/index.tsx src/lib/traffic-rate.ts` → 0 problem baru.

- [ ] **Step 6: Commit**

```bash
git add src/lib/traffic-rate.ts src/lib/traffic-rate.test.ts src/features/dashboard/index.tsx
git commit -m "refactor(dashboard): extract computeTrafficRate ke src/lib/traffic-rate.ts

Persiapan B7 — fungsi ini akan dipakai bersama jalur REST (existing) dan
WebSocket (Task berikutnya), harus satu instance Map module-level supaya
delta counter kontinu lintas sumber data.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Socket origin helper — `src/lib/socket-url.ts`

**Files:**
- Create: `src/lib/socket-url.ts`
- Create (test): `src/lib/socket-url.test.ts`

**Interfaces:**
- Produces: `getSocketOrigin(): string` — dipakai Task 4 (hook) untuk membentuk URL koneksi socket.io.

- [ ] **Step 1: Tulis failing test dulu**

```ts
// src/lib/socket-url.test.ts
import { describe, expect, it, vi } from 'vitest'
import { getSocketOrigin } from './socket-url'

describe('getSocketOrigin', () => {
  it('strips /api suffix from an absolute VITE_API_BASE_URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000/api')
    expect(getSocketOrigin()).toBe('http://localhost:4000')
  })

  it('strips /api suffix regardless of trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.egnet.id/api/')
    expect(getSocketOrigin()).toBe('https://api.egnet.id')
  })

  it('falls back to window.location.origin for a relative base URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api')
    expect(getSocketOrigin()).toBe(window.location.origin)
  })

  it('falls back to window.location.origin when env var is unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(getSocketOrigin()).toBe(window.location.origin)
  })
})
```

*(`vitest.config.ts` sudah set `unstubEnvs: true` — env stub otomatis di-reset tiap test, tak perlu `afterEach` manual.)*

- [ ] **Step 2: Jalankan test, harus FAIL (file belum ada)**

Run: `npx vitest run src/lib/socket-url.test.ts`
Expected: FAIL — `Cannot find module './socket-url'`

- [ ] **Step 3: Implementasi minimal**

```ts
// src/lib/socket-url.ts

/**
 * Origin (protocol+host, tanpa path) buat koneksi socket.io. Diturunkan dari
 * VITE_API_BASE_URL yang sama dipakai axios (src/lib/axios.ts) — bukan env
 * var baru. Kalau base URL relatif (proxy dev server), pakai origin browser.
 */
export function getSocketOrigin(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  return window.location.origin
}
```

- [ ] **Step 4: Jalankan test, harus PASS**

Run: `npx vitest run src/lib/socket-url.test.ts`
Expected: 4 passed

- [ ] **Step 5: Verifikasi**

Run: `npx tsc -b --pretty false` → 0 error.
Run: `rtk proxy npx eslint src/lib/socket-url.ts` → 0 problem.

- [ ] **Step 6: Commit**

```bash
git add src/lib/socket-url.ts src/lib/socket-url.test.ts
git commit -m "feat(lib): tambah getSocketOrigin — derive origin WS dari VITE_API_BASE_URL

Persiapan B7, dipakai hook useMonitoringSocket (task berikutnya). Reuse env
var axios yang sudah ada, tak perlu env var baru.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Ekspor tipe monitoring bersama dari `router-health-panel.tsx`

**Files:**
- Modify: `src/features/dashboard/components/router-health-panel.tsx:12-25` (tambah export, tidak hapus apa pun)

**Interfaces:**
- Produces: `export type ActiveUser`, `export type SnapshotActiveUser` — dipakai Task 4 (hook) dan Task 7 (wiring dashboard, ganti definisi lokal).
- Consumes: tidak ada baru.

`ActiveUser` (bentuk UI, dipakai `RecentSales`) dan `SnapshotActiveUser` (bentuk mentah field backend) saat ini didefinisikan lokal & tak diekspor di `dashboard/index.tsx:38-44` dan `:100-105`. Pindahkan ke `router-health-panel.tsx` supaya jadi satu "rumah tipe domain monitoring" bareng `RouterResources`/`TrafficInterface` yang sudah di situ — dipakai baik jalur REST maupun hook WS tanpa duplikasi.

- [ ] **Step 1: Tambah dua tipe baru, taruh persis setelah `TrafficInterface` (baris 27-35 saat ini)**

```ts
// Tambahkan setelah `export type TrafficInterface = {...}` di router-health-panel.tsx:

// Bentuk UI (dipakai RecentSales) — hasil mapping dari SnapshotActiveUser.
export type ActiveUser = {
  user?: string
  name?: string
  address?: string
  macAddress?: string
  uptime?: string
}

// Field snapshot activeUsers mentah dari backend (REST /monitoring/snapshot
// maupun event WebSocket `snapshot` — bentuknya sama).
export type SnapshotActiveUser = {
  username?: string
  ipAddress?: string
  macAddress?: string
  uptime?: string
}
```

- [ ] **Step 2: Verifikasi tsc (belum dipakai di tempat lain, harus tetap 0 error — cuma nambah export)**

Run: `npx tsc -b --pretty false` → 0 error.

- [ ] **Step 3: Commit**

```bash
git add src/features/dashboard/components/router-health-panel.tsx
git commit -m "refactor(dashboard): ekspor ActiveUser & SnapshotActiveUser dari router-health-panel

Persiapan B7 — kedua tipe ini akan dipakai bareng oleh jalur REST (existing,
Task berikut) dan hook WebSocket baru, dipindah dari definisi lokal
dashboard/index.tsx supaya satu sumber kebenaran.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Hook `useMonitoringSocket`

**Files:**
- Create: `src/hooks/use-monitoring-socket.ts`
- Create (test): `src/hooks/use-monitoring-socket.test.ts`
- Modify: `package.json` (tambah dependency `socket.io-client`)

**Interfaces:**
- Consumes: `computeTrafficRate` dari `@/lib/traffic-rate` (Task 1), `getSocketOrigin` dari `@/lib/socket-url` (Task 2), `ActiveUser`/`SnapshotActiveUser`/`RouterResources`/`TrafficInterface` dari `@/features/dashboard/components/router-health-panel` (Task 3), `useAuthStore` dari `@/stores/auth-store`.
- Produces: `useMonitoringSocket(serverId: string | null, enabled: boolean): { activeUsers: ActiveUser[]; resources: RouterResources | null; traffic: TrafficInterface[]; trafficRate: {rx:number;tx:number}|null; wsStatus: 'connecting'|'live'|'unavailable'; routerConnected: boolean | null }` — dipakai Task 7 (wiring dashboard).

- [ ] **Step 1: Install dependency**

```bash
pnpm add socket.io-client
```

- [ ] **Step 2: Tulis failing test dulu (mock `socket.io-client`, tak butuh backend beneran)**

```ts
// src/hooks/use-monitoring-socket.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { io } from 'socket.io-client'
import { useMonitoringSocket } from './use-monitoring-socket'
import { useAuthStore } from '@/stores/auth-store'

vi.mock('socket.io-client', () => ({ io: vi.fn() }))

function createFakeSocket(subscribeAck: { ok: boolean } = { ok: true }) {
  const handlers: Record<string, (...args: any[]) => void> = {}
  const managerHandlers: Record<string, (...args: any[]) => void> = {}
  return {
    on: vi.fn((event: string, cb: (...args: any[]) => void) => {
      handlers[event] = cb
    }),
    emit: vi.fn((event: string, payload: unknown, ack?: (res: unknown) => void) => {
      if (event === 'subscribe' && ack) ack(subscribeAck)
    }),
    disconnect: vi.fn(),
    io: {
      on: vi.fn((event: string, cb: (...args: any[]) => void) => {
        managerHandlers[event] = cb
      }),
    },
    trigger: (event: string, payload?: unknown) => handlers[event]?.(payload),
    triggerManager: (event: string) => managerHandlers[event]?.(),
  }
}

beforeEach(() => {
  useAuthStore.getState().auth.setAccessToken('test-token')
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000/api')
  vi.mocked(io).mockReset()
})

describe('useMonitoringSocket', () => {
  it('does not connect when disabled', async () => {
    const { result } = await renderHook(() => useMonitoringSocket('srv-1', false))
    expect(io).not.toHaveBeenCalled()
    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('does not connect when serverId is null', async () => {
    const { result } = await renderHook(() => useMonitoringSocket(null, true))
    expect(io).not.toHaveBeenCalled()
    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('connects to the monitoring namespace with the auth token and subscribes', async () => {
    const fake = createFakeSocket({ ok: true })
    vi.mocked(io).mockReturnValue(fake as any)

    await renderHook(() => useMonitoringSocket('srv-1', true))

    expect(io).toHaveBeenCalledWith(
      'http://localhost:4000/monitoring',
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      })
    )
    expect(fake.emit).toHaveBeenCalledWith(
      'subscribe',
      { serverId: 'srv-1' },
      expect.any(Function)
    )
  })

  it('becomes live when the subscribe ack is ok', async () => {
    const fake = createFakeSocket({ ok: true })
    vi.mocked(io).mockReturnValue(fake as any)

    const { result } = await renderHook(() => useMonitoringSocket('srv-1', true))

    expect(result.current.wsStatus).toBe('live')
  })

  it('becomes unavailable when the subscribe ack fails', async () => {
    const fake = createFakeSocket({ ok: false })
    vi.mocked(io).mockReturnValue(fake as any)

    const { result } = await renderHook(() => useMonitoringSocket('srv-1', true))

    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('updates state from a snapshot event matching the active server', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.trigger('snapshot', {
        serverId: 'srv-1',
        activeUsers: [{ username: 'budi', ipAddress: '10.0.0.2', macAddress: 'AA:BB', uptime: '1h' }],
        resources: {
          uptime: '1h', cpuLoad: 10, cpuCount: 1, freeMemory: 1, totalMemory: 2,
          freeHddSpace: 1, totalHddSpace: 2, version: '7.1', boardName: 'hAP', architectureName: 'arm',
        },
        traffic: [{ id: 'ether1', name: 'ether1', rxByte: 100, txByte: 50, running: true }],
      })
    })

    expect(result.current.activeUsers).toEqual([
      { user: 'budi', address: '10.0.0.2', macAddress: 'AA:BB', uptime: '1h' },
    ])
    expect(result.current.resources?.boardName).toBe('hAP')
    expect(result.current.traffic).toHaveLength(1)
    expect(result.current.wsStatus).toBe('live')
  })

  it('ignores a snapshot event for a stale (non-active) server', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.trigger('snapshot', {
        serverId: 'srv-OLD',
        activeUsers: [{ username: 'harusnya-diabaikan' }],
        resources: null,
        traffic: [],
      })
    })

    expect(result.current.activeUsers).toEqual([])
  })

  it('updates routerConnected from a status event', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.trigger('status', { serverId: 'srv-1', connected: false })
    })

    expect(result.current.routerConnected).toBe(false)
  })

  it('goes unavailable and disconnects on an unauthorized event', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.trigger('unauthorized')
    })

    expect(result.current.wsStatus).toBe('unavailable')
    expect(fake.disconnect).toHaveBeenCalled()
  })

  it('goes unavailable when reconnection attempts are exhausted', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.triggerManager('reconnect_failed')
    })

    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('reuses the same socket across a serverId change: unsubscribes old, subscribes new', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { rerender, act } = await renderHook(
      ({ serverId }: { serverId: string }) => useMonitoringSocket(serverId, true),
      { initialProps: { serverId: 'srv-1' } }
    )
    await act(() => {
      rerender({ serverId: 'srv-2' })
    })

    expect(io).toHaveBeenCalledTimes(1) // socket tidak dibuat ulang
    expect(fake.emit).toHaveBeenCalledWith('unsubscribe', { serverId: 'srv-1' })
    expect(fake.emit).toHaveBeenCalledWith('subscribe', { serverId: 'srv-2' }, expect.any(Function))
  })

  it('unsubscribes and disconnects on unmount', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake as any)

    const { unmount, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      unmount()
    })

    expect(fake.emit).toHaveBeenCalledWith('unsubscribe', { serverId: 'srv-1' })
    expect(fake.disconnect).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Jalankan test, harus FAIL (hook belum ada)**

Run: `npx vitest run src/hooks/use-monitoring-socket.test.ts`
Expected: FAIL — `Cannot find module './use-monitoring-socket'`

- [ ] **Step 4: Implementasi hook**

```ts
// src/hooks/use-monitoring-socket.ts
import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth-store'
import { getSocketOrigin } from '@/lib/socket-url'
import { computeTrafficRate } from '@/lib/traffic-rate'
import type {
  ActiveUser,
  RouterResources,
  SnapshotActiveUser,
  TrafficInterface,
} from '@/features/dashboard/components/router-health-panel'

export type WsStatus = 'connecting' | 'live' | 'unavailable'

type MonitoringSnapshotPayload = {
  serverId: string
  activeUsers: SnapshotActiveUser[]
  resources: RouterResources | null
  traffic: TrafficInterface[]
}

type MonitoringStatusPayload = {
  serverId: string
  connected: boolean
  error?: string
}

type MonitoringState = {
  activeUsers: ActiveUser[]
  resources: RouterResources | null
  traffic: TrafficInterface[]
  trafficRate: { rx: number; tx: number } | null
  wsStatus: WsStatus
  routerConnected: boolean | null
}

const EMPTY_STATE: MonitoringState = {
  activeUsers: [],
  resources: null,
  traffic: [],
  trafficRate: null,
  wsStatus: 'unavailable',
  routerConnected: null,
}

function mapActiveUsers(users: SnapshotActiveUser[]): ActiveUser[] {
  return users.map((u) => ({
    user: u.username,
    address: u.ipAddress,
    macAddress: u.macAddress,
    uptime: u.uptime,
  }))
}

/**
 * Koneksi WebSocket ke namespace /monitoring backend (lihat CATATAN_FRONTEND.md
 * §8). Socket dibuat sekali selama `enabled`; ganti `serverId` cukup
 * unsubscribe+subscribe ulang tanpa membuat koneksi baru. `enabled=false`
 * (dipakai untuk role OWNER) membuat hook ini tidak connect sama sekali.
 */
export function useMonitoringSocket(
  serverId: string | null,
  enabled: boolean
): MonitoringState {
  const [state, setState] = useState<MonitoringState>(EMPTY_STATE)
  const socketRef = useRef<Socket | null>(null)
  const activeServerRef = useRef<string | null>(null)

  // Effect 1: lifecycle koneksi socket — dibuat sekali selama enabled=true,
  // TIDAK bergantung pada serverId (biar ganti router tak reconnect socket).
  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE)
      return
    }

    const token = useAuthStore.getState().auth.accessToken
    const socket = io(`${getSocketOrigin()}/monitoring`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    })
    socketRef.current = socket
    setState((s) => ({ ...s, wsStatus: 'connecting' }))

    socket.on('snapshot', (snap: MonitoringSnapshotPayload) => {
      if (snap.serverId !== activeServerRef.current) return
      const traffic = snap.traffic ?? []
      setState((s) => ({
        ...s,
        activeUsers: mapActiveUsers(snap.activeUsers ?? []),
        resources: snap.resources ?? null,
        traffic,
        trafficRate: computeTrafficRate(snap.serverId, traffic),
        wsStatus: 'live',
      }))
    })

    socket.on('status', (payload: MonitoringStatusPayload) => {
      if (payload.serverId !== activeServerRef.current) return
      setState((s) => ({ ...s, routerConnected: payload.connected }))
    })

    socket.on('unauthorized', () => {
      setState((s) => ({ ...s, wsStatus: 'unavailable' }))
      socket.disconnect()
    })

    socket.on('disconnect', () => {
      setState((s) => (s.wsStatus === 'live' ? { ...s, wsStatus: 'connecting' } : s))
    })

    socket.io.on('reconnect_failed', () => {
      setState((s) => ({ ...s, wsStatus: 'unavailable' }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  // Effect 2: subscribe/unsubscribe saat serverId berganti — pakai socket
  // yang sudah dibuat effect 1, tidak membuat koneksi baru.
  useEffect(() => {
    const socket = socketRef.current
    if (!enabled || !socket || !serverId) return

    activeServerRef.current = serverId
    socket.emit('subscribe', { serverId }, (ack: { ok: boolean }) => {
      setState((s) => ({ ...s, wsStatus: ack?.ok ? 'live' : 'unavailable' }))
    })

    return () => {
      socket.emit('unsubscribe', { serverId })
      if (activeServerRef.current === serverId) activeServerRef.current = null
    }
  }, [enabled, serverId])

  return state
}
```

- [ ] **Step 5: Jalankan test, harus PASS**

Run: `npx vitest run src/hooks/use-monitoring-socket.test.ts`
Expected: 11 passed

- [ ] **Step 6: Verifikasi**

Run: `npx tsc -b --pretty false` → 0 error.
Run: `rtk proxy npx eslint src/hooks/use-monitoring-socket.ts src/hooks/use-monitoring-socket.test.ts` → 0 problem.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/hooks/use-monitoring-socket.ts src/hooks/use-monitoring-socket.test.ts
git commit -m "feat(dashboard): hook useMonitoringSocket — koneksi WS ke namespace /monitoring

Isolasi lifecycle socket.io: connect sekali per enabled=true, ganti serverId
cukup unsubscribe+subscribe ulang (bukan reconnect), exhaust 5x
reconnectionAttempts atau event unauthorized → wsStatus='unavailable'
permanen buat sesi ini. Belum dipakai di mana pun — wiring ke dashboard di
task berikutnya.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Badge live-indicator di `RouterHealthPanel`

**Files:**
- Modify: `src/features/dashboard/components/router-health-panel.tsx`

**Interfaces:**
- Consumes: tidak ada baru.
- Produces: prop baru `liveMode: 'live' | 'connecting' | 'polling'` pada `RouterHealthPanel` — dipakai Task 7 (wiring dashboard).

Tidak ada file test untuk komponen ini (konvensi repo: komponen presentasional kartu/panel tak di-unit-test — lihat `recent-sales.tsx`, `chat-bubble.tsx`). Verifikasi manual di Task 8.

- [ ] **Step 1: Tambah prop `liveMode` ke `Props` type (baris 37-53)**

```ts
type Props = {
  resources: RouterResources | null
  hasTraffic: boolean
  trafficRate: { rx: number; tx: number } | null
  isForbidden: boolean
  isLive: boolean
  host?: string
  port?: number
  lastStatus?: string
  lastCheckedAt?: string | null
  /** Sumber data monitoring saat ini — badge kecil di header panel. */
  liveMode: 'live' | 'connecting' | 'polling'
  className?: string
}
```

- [ ] **Step 2: Tambah komponen `LiveBadge`, taruh sebelum `RouterHealthPanel` (setelah `Dash`, baris 126)**

```tsx
function LiveBadge({ mode }: { mode: 'live' | 'connecting' | 'polling' }) {
  const config = {
    live: { dot: 'bg-success', pulse: true, label: 'Live' },
    connecting: { dot: 'bg-warning', pulse: false, label: 'Menghubungkan...' },
    polling: { dot: 'bg-muted-foreground', pulse: false, label: 'Polling' },
  }[mode]
  return (
    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
      <span className='relative flex size-1.5'>
        {config.pulse && (
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full ${config.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex size-1.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </div>
  )
}
```

- [ ] **Step 3: Destructure `liveMode` di `RouterHealthPanel` (baris 132-143) dan render badge di `CardHeader` (baris 164-167)**

```tsx
export function RouterHealthPanel({
  resources,
  hasTraffic,
  trafficRate,
  isForbidden,
  isLive,
  host,
  port,
  lastStatus,
  lastCheckedAt,
  liveMode,
  className,
}: Props) {
  // ...isi function tidak berubah sampai return...

  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-start justify-between gap-2 space-y-0'>
        <div>
          <CardTitle>Router Details</CardTitle>
          <CardDescription>Kondisi perangkat saat ini</CardDescription>
        </div>
        <LiveBadge mode={liveMode} />
      </CardHeader>
      {/* ...CardContent tidak berubah... */}
```

- [ ] **Step 4: Verifikasi**

Run: `npx tsc -b --pretty false` → akan **ERROR** di `dashboard/index.tsx` (pemanggil `RouterHealthPanel` belum kasih prop `liveMode`) — ini **diharapkan**, ditutup di Task 7. Cukup pastikan errornya PERSIS di baris pemanggilan `<RouterHealthPanel` di `dashboard/index.tsx`, bukan di file ini.
Run: `rtk proxy npx eslint src/features/dashboard/components/router-health-panel.tsx` → 0 problem.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/router-health-panel.tsx
git commit -m "feat(dashboard): badge live-indicator (Live/Menghubungkan/Polling) di RouterHealthPanel

Prop baru liveMode wajib diisi — pemanggil di dashboard/index.tsx akan error
tsc sampai Task wiring berikutnya (composisi hook WS) mengisinya.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Pisah query vouchers-count di `dashboard/index.tsx`

**Files:**
- Modify: `src/features/dashboard/index.tsx`

**Interfaces:**
- Consumes: tidak ada baru.
- Produces: query key `['dashboard-vouchers-count', serverId]` — dijaga tetap ke-invalidate oleh `syncMutation`.

Refactor murni, **tanpa** WS — vouchers-count harus tetap update independen dari status WS (lihat spec). Efek samping yang disengaja: kegagalan fetch vouchers tidak lagi ikut men-trigger `isDisconnected` untuk seluruh halaman (sebelumnya coupled ke satu query gabungan) — vouchers jadi concern terisolasi.

- [ ] **Step 1: Hapus field `vouchers` dari `DashboardMetrics` & `EMPTY_METRICS` (baris 46-68)**

```ts
type DashboardMetrics = {
  activeUsers: number
  activeUsersList: ActiveUser[]
  resources: RouterResources | null
  traffic: TrafficInterface[]
  trafficRate: { rx: number; tx: number } | null
  isForbidden: boolean
  isDisconnected: boolean
  isNotFound: boolean
}

const EMPTY_METRICS: DashboardMetrics = {
  activeUsers: 0,
  activeUsersList: [],
  resources: null,
  traffic: [],
  trafficRate: null,
  isForbidden: false,
  isDisconnected: false,
  isNotFound: false,
}
```

- [ ] **Step 2: Hapus blok fetch vouchers dari `fetchDashboardMetrics` (baris 118-124 saat ini)**

```ts
// HAPUS blok ini dari dalam fetchDashboardMetrics:
// Vouchers (allowed for all roles)
try {
  const vRes = await api.get('/vouchers', { params: { serverId, take: 1 }, signal })
  metrics.vouchers = vRes.data?.meta?.total || 0
} catch (e) {
  if (!is403(e)) metrics.isDisconnected = true
}
```

Sisa `fetchDashboardMetrics` (snapshot/traffic/403/404 handling) **tidak berubah**.

- [ ] **Step 3: Tambah query independen di komponen `Dashboard`, taruh persis setelah query `dashboard-metrics` (setelah baris 177 versi saat ini)**

```ts
const { data: voucherCount = 0 } = useQuery({
  queryKey: ['dashboard-vouchers-count', activeServerId ?? 'none'],
  queryFn: ({ signal }) =>
    api
      .get('/vouchers', { params: { serverId: activeServerId, take: 1 }, signal })
      .then((res) => res.data?.meta?.total ?? 0),
  enabled: !!activeServerId,
  refetchInterval: 3000,
})
```

- [ ] **Step 4: Ganti pemakaian `metrics.vouchers` di JSX (baris ~320) jadi `voucherCount`**

```tsx
<div className='text-2xl font-semibold tracking-tight tabular-nums'>{voucherCount}</div>
```

- [ ] **Step 5: Tambah invalidation query baru di `syncMutation.onSuccess` (baris 195-200)**

```ts
onSuccess: () => {
  toast.success('Berhasil menarik data profil dan voucher terbaru dari router!')
  queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', activeServerId ?? 'none'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-vouchers-count', activeServerId ?? 'none'] })
  if (activeServerId) {
    queryClient.invalidateQueries({ queryKey: qk.vouchers(activeServerId) })
  }
},
```

- [ ] **Step 6: Verifikasi**

Run: `npx tsc -b --pretty false` → error `liveMode` dari Task 5 **masih ada**, itu wajar (ditutup Task 7). Pastikan tak ada error BARU selain itu (khususnya tak ada lagi referensi `metrics.vouchers`).
Run: `rtk proxy npx eslint src/features/dashboard/index.tsx` → 0 problem baru.

- [ ] **Step 7: Verifikasi manual**

`npm run dev` → buka `/dashboard` → kartu "Voucher" tetap tampil angka benar, klik "Sinkron" → kartu ter-refresh.

- [ ] **Step 8: Commit**

```bash
git add src/features/dashboard/index.tsx
git commit -m "refactor(dashboard): pisah query vouchers-count dari fetchDashboardMetrics

Vouchers-count harus tetap update independen dari status koneksi WS (Task
berikutnya akan bikin fetchDashboardMetrics kondisional). Efek samping yang
disengaja: kegagalan fetch vouchers tak lagi ikut men-trigger isDisconnected
seluruh halaman.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Wiring `useMonitoringSocket` ke `Dashboard` (integrasi utama)

**Files:**
- Modify: `src/features/dashboard/index.tsx`

**Interfaces:**
- Consumes: `useMonitoringSocket` (Task 4), `LiveBadge`/`liveMode` prop (Task 5), `ActiveUser`/`SnapshotActiveUser` dari `router-health-panel.tsx` (Task 3), `useAuthStore`.
- Produces: tidak ada (task terminal — titik integrasi).

Ini task inti: dashboard sekarang WS-primer untuk role non-OWNER, REST tetap jalan sebagai fallback selama WS belum/tidak `live`.

- [ ] **Step 1: Ganti definisi lokal `ActiveUser`/`SnapshotActiveUser` (baris 38-44 dan 100-105) jadi import dari `router-health-panel.tsx`**

```ts
// HAPUS definisi lokal `type ActiveUser = {...}` (baris 38-44) dan
// `type SnapshotActiveUser = {...}` (baris 100-105).

// Tambahkan ke import yang sudah ada dari router-health-panel:
import {
  RouterHealthPanel,
  type ActiveUser,
  type RouterResources,
  type SnapshotActiveUser,
  type TrafficInterface,
} from './components/router-health-panel'
```

- [ ] **Step 2: Tambah import hook & auth-store di bagian atas file**

```ts
import { useMonitoringSocket } from '@/hooks/use-monitoring-socket'
import { useAuthStore } from '@/stores/auth-store'
```

- [ ] **Step 3: Di komponen `Dashboard`, tambah role + hook, persis setelah baris `const activeServer = servers.find(...)`**

```ts
const role = useAuthStore((s) => s.auth.user?.role)
const isOwner = role === 'OWNER'
const ws = useMonitoringSocket(activeServerId, !isOwner)
const useWsData = !isOwner && ws.wsStatus === 'live'
```

- [ ] **Step 4: Ubah `enabled` pada query `dashboard-metrics` (REST) jadi kondisional — jalan terus untuk OWNER, atau untuk non-OWNER selama WS BELUM `live` (bukan cuma saat `unavailable`, biar tak ada jendela kosong data selagi WS masih handshake/reconnect)**

```ts
const { data: metrics = EMPTY_METRICS, isPending, refetch } = useQuery({
  queryKey: ['dashboard-metrics', activeServerId ?? 'none'],
  queryFn: ({ signal }) => fetchDashboardMetrics(activeServerId as string, signal),
  enabled: !!activeServerId && (isOwner || ws.wsStatus !== 'live'),
  refetchInterval: 3000,
})
```

- [ ] **Step 5: Pilih sumber data final — resources/activeUsersList/traffic/trafficRate/isForbidden/isDisconnected dari WS kalau `useWsData`, else dari `metrics` (REST) seperti sekarang. Taruh persis setelah `const isDisconnected = ...` (baris 179 versi saat ini), GANTI baris itu juga:**

```ts
const resources = useWsData ? ws.resources : metrics.resources
const activeUsersList = useWsData ? ws.activeUsers : metrics.activeUsersList
const traffic = useWsData ? ws.traffic : metrics.traffic
const trafficRate = useWsData ? ws.trafficRate : metrics.trafficRate
const isForbidden = isOwner && metrics.isForbidden
const isDisconnected =
  !isPending && (useWsData ? ws.routerConnected === false : metrics.isDisconnected)
// Catatan: isNotFound cuma terdeteksi lewat REST (404) — kalau WS sudah
// live saat router dihapus, dashboard tak akan tahu sampai WS gagal/reload.
// Backend belum punya sinyal WS setara 404. Batasan yang diketahui, di luar
// scope B7 (lihat spec §"Di luar scope").
const isNotFound = metrics.isNotFound

const liveMode: 'live' | 'connecting' | 'polling' =
  isOwner || ws.wsStatus === 'unavailable' ? 'polling' : ws.wsStatus
```

- [ ] **Step 6: Hapus baris lama `const isDisconnected = !isPending && metrics.isDisconnected` (sudah digantikan Step 5)**

- [ ] **Step 7: Ganti semua pemakaian `metrics.resources` / `metrics.activeUsersList` / `metrics.traffic` / `metrics.trafficRate` / `metrics.isForbidden` di JSX (baris ~285-348) jadi variabel lokal dari Step 5, dan isi prop `liveMode` di `RouterHealthPanel`:**

```tsx
<CardContent>
  {isForbidden ? (
    <div className='flex items-center gap-2 text-sm text-muted-foreground font-medium'>
      <Lock className='h-4 w-4' /> Akses Khusus Teknisi
    </div>
  ) : (
    <>
      <div className='text-2xl font-semibold tracking-tight tabular-nums'>{metrics.activeUsers}</div>
      <p className='text-xs text-muted-foreground'>
        pelanggan terhubung saat ini
      </p>
    </>
  )}
</CardContent>
{/* ... */}
<RouterHealthPanel
  className={`col-span-1 lg:col-span-3 ${nestedCardClass}`}
  resources={resources}
  hasTraffic={traffic.length > 0}
  trafficRate={trafficRate}
  isForbidden={isForbidden}
  isLive={!!resources}
  host={activeServer?.host}
  port={activeServer?.port}
  lastStatus={activeServer?.lastStatus}
  lastCheckedAt={activeServer?.lastCheckedAt}
  liveMode={liveMode}
/>
{/* ... */}
<RecentSales data={activeUsersList} isForbidden={isForbidden} />
```

`metrics.activeUsers` (angka, dipakai kartu "User Aktif") tetap dari REST-shape lama — tambahkan turunan lokal biar konsisten dengan sumber terpilih:

```ts
const activeUsersCount = activeUsersList.length
```

...dan pakai `{activeUsersCount}` menggantikan `{metrics.activeUsers}` di kartu "User Aktif".

- [ ] **Step 8: Verifikasi tsc & eslint — sekarang harus BERSIH TOTAL (error Task 5 & 6 yang sengaja dibiarkan sekarang tertutup)**

Run: `npx tsc -b --pretty false` → 0 error.
Run: `rtk proxy npx eslint src/features/dashboard/index.tsx` → 0 problem baru (bandingkan count sebelum Task 1 via `git stash`/`git stash pop` kalau ragu).
Run: `npx vite build --logLevel error` → `ok`.

- [ ] **Step 9: Verifikasi manual (checklist lengkap dari spec)**

`npm run dev`, login TEKNISI:
1. Buka `/dashboard`, Network tab → ada koneksi `ws://localhost:4000/monitoring`, badge di panel "Router Details" jadi **Live** begitu snapshot pertama masuk.
2. REST `GET /monitoring/snapshot` **tidak lagi** terpanggil berkala di Network tab setelah badge Live (cukup 0-1x saat transisi awal).
3. Ganti router aktif via dropdown → data ganti ke router baru tanpa kedip data lama, badge tetap Live.
4. Matikan/putuskan WS (mis. block `ws://` request di devtools) → badge jatuh ke **Polling** dalam <30 detik, data tetap mengalir (cek Network REST `/monitoring/snapshot` mulai terpanggil lagi tiap 3s).
5. Navigasi keluar dari `/dashboard` → cek koneksi WS di Network tab berstatus closed (tak ada leak).

Login OWNER:
6. Buka `/dashboard` → Network tab **tidak ada** percobaan koneksi `ws://.../monitoring` sama sekali.
7. Badge selalu **Polling**, panel "Router Details" tetap kunci (Akses Khusus Teknisi) seperti sebelum B7 — perilaku identik.

- [ ] **Step 10: Commit**

```bash
git add src/features/dashboard/index.tsx
git commit -m "feat(dashboard): wiring useMonitoringSocket — WS primer, REST fallback

Role non-OWNER: data monitoring (resources/activeUsers/traffic/trafficRate)
diambil dari WebSocket begitu wsStatus='live'; REST tetap enabled selama WS
belum live (menghindari jendela kosong saat handshake/reconnect) dan mati
otomatis begitu WS mengambil alih. Role OWNER: 100% tak berubah, tak pernah
coba WS. Badge live-indicator (Task 5) sekarang terisi.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Verifikasi akhir menyeluruh

**Files:** tidak ada perubahan kode — verifikasi lintas semua task.

- [ ] **Step 1: Full typecheck & lint**

Run: `npx tsc -b --pretty false` → `TypeScript: No errors found`.
Run: `rtk proxy npx eslint src/hooks/use-monitoring-socket.ts src/lib/traffic-rate.ts src/lib/socket-url.ts src/features/dashboard/index.tsx src/features/dashboard/components/router-health-panel.tsx` → 0 problem.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run` → semua test PASS termasuk 3 file baru (`traffic-rate.test.ts`, `socket-url.test.ts`, `use-monitoring-socket.test.ts`) dan test lama tak ada regresi.

- [ ] **Step 3: Production build**

Run: `npx vite build --logLevel error` → `ok`.

- [ ] **Step 4: Re-jalankan checklist manual Task 7 Step 9 sekali lagi end-to-end** (setelah semua task selesai, bukan cuma pas Task 7) — pastikan tak ada regresi dari task-task setelahnya.

- [ ] **Step 5: `git log` — pastikan 7 commit dari Task 1-7 semua ada, working tree bersih**

```bash
git status --short   # harus kosong
git log --oneline -10
```

Tidak ada commit tambahan di task ini kalau semua sudah bersih dari task sebelumnya.
