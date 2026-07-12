# B7 — Monitoring Real-Time via WebSocket

**Tanggal:** 2026-07-12
**Sumber kontrak:** `doc/CATATAN_FRONTEND.md` §8 (backend repo `backendWebManagementWiFiuntukFnB`)

## Context

Dashboard (`src/features/dashboard/index.tsx`) saat ini polling `GET /monitoring/snapshot/:serverId` tiap 3 detik (`refetchInterval: 3000`) buat tiap client/tab yang buka `/dashboard`. Backend sudah bangun WebSocket push (socket.io, namespace `/monitoring`) supaya router cukup di-poll **1× terpusat** per interval regardless jumlah client, lalu di-diff & push hanya saat berubah — mengurangi beban ke router MikroTik (lihat log timeout RouterOS di percakapan: beberapa koneksi bersamaan ke router yang sama adalah salah satu penyebab intermittent timeout, ditegaskan di `CATATAN_BACKEND.md` B5/B7).

Backend eksplisit minta: *"Ganti `refetchInterval` monitoring → listener WebSocket... REST `GET /monitoring/*` tetap ada sebagai fallback."*

Tujuan kerjaan ini: migrasi jalur data monitoring dashboard dari REST-polling-selalu-on ke WebSocket-primer dengan REST sebagai fallback, tanpa mengubah computeTrafficRate, tanpa mengubah RBAC OWNER yang baru saja selesai dikerjakan (lihat commit `58db82e`).

## Keputusan desain (hasil brainstorming)

1. **WS primer, REST fallback-only.** Bukan hybrid dual-poll, bukan WS-only tanpa fallback.
2. **OWNER tetap 100% di jalur REST lama** (403→traffic-fallback yang sudah ada) — tidak coba WS sama sekali. Kontrak WS+RBAC belum terkonfirmasi backend, jangan menebak.
3. **Hook terisolasi** `useMonitoringSocket` — bukan ditumpuk di `dashboard/index.tsx`.
4. **Badge live-indicator** di header `RouterHealthPanel` (Live/Polling/Menghubungkan).

## Arsitektur

```
dashboard/index.tsx
 ├─ useVoucherCount(serverId)          [BARU — dipisah dari fetchDashboardMetrics]
 ├─ useMonitoringSocket(serverId)      [BARU — WS, aktif kalau role != OWNER]
 └─ useQuery(['dashboard-metrics',…])  [EXISTING fetchDashboardMetrics, jadi REST fallback
                                         + jalur OWNER, enabled: isOwner || wsStatus==='unavailable']
```

### 1. `src/hooks/use-monitoring-socket.ts` (baru)

```ts
function useMonitoringSocket(serverId: string | null, enabled: boolean): {
  resources: ResourcesSnapshot | null
  activeUsers: SnapshotActiveUser[]
  traffic: TrafficInterface[]
  wsStatus: 'connecting' | 'live' | 'unavailable'
  routerConnected: boolean | null   // dari event 'status', null = belum ada info
}
```

- `enabled=false` (role OWNER, atau `serverId` null) → hook no-op, `wsStatus` tetap `'unavailable'`, tidak connect socket sama sekali.
- Socket dibuat sekali per mount hook (bukan per `serverId`). Ganti `serverId` → `socket.emit('unsubscribe', {serverId: old})` lalu `socket.emit('subscribe', {serverId: new})`, socket connection tetap sama.
- Unmount → unsubscribe + `socket.disconnect()`.
- URL: turunkan origin dari `VITE_API_BASE_URL` yang sudah dipakai `src/lib/axios.ts` (strip suffix `/api`; kalau env value relatif (`/api`), pakai `window.location.origin`). Namespace `/monitoring`.
- Auth: `auth: { token: useAuthStore.getState().auth.accessToken }` saat `io(...)` — pola sama seperti header `Authorization` di `axios.ts:14`.
- Opsi socket.io: `transports: ['websocket']`, `reconnectionAttempts: 5` (di luar itu → `wsStatus='unavailable'`, berhenti coba, biar REST fallback yang ambil alih permanen untuk sisa sesi).

**Event handling:**
| Event | Aksi |
|---|---|
| `connect` + ack `subscribe` `{ok:true}` | `wsStatus='live'` |
| `snapshot` (`{serverId, activeUsers[], resources{}, traffic[]}`) | update state, HANYA kalau `serverId` cocok dengan yang aktif sekarang (guard race saat ganti router cepat) |
| `status` (`{serverId, connected, error?}`) | update `routerConnected` |
| `unauthorized` | `wsStatus='unavailable'` langsung, tidak retry (token session ini dianggap invalid buat WS) |
| `connect_error` (habis `reconnectionAttempts`) | `wsStatus='unavailable'` |
| `disconnect` (transient, sebelumnya `live`) | `wsStatus='connecting'` sementara — socket.io auto-reconnect jalan; kalau balik connect → `live` lagi, kalau exhaust attempts → `unavailable` |

### 2. Refactor `fetchDashboardMetrics` (`dashboard/index.tsx`)

Pisah concern vouchers-count (independen dari WS, harus tetap update terus):

```ts
// baru — query kecil, selalu aktif, tak terikat status WS
useQuery({
  queryKey: ['dashboard-vouchers-count', activeServerId],
  queryFn: () => api.get('/vouchers', { params: { serverId, take: 1 } }).then(r => r.data.meta.total),
  refetchInterval: 3000,
  enabled: !!activeServerId,
})
```

`fetchDashboardMetrics` yang lama (snapshot/traffic/403/404 handling, `computeTrafficRate`) **tidak diubah isinya** — cuma jadi REST-fallback: `enabled: !!activeServerId && (isOwner || wsStatus === 'unavailable')`, `refetchInterval` tetap 3000 (perilaku sekarang, no-op kalau disabled).

### 3. Komposisi di komponen `Dashboard`

```ts
const wsResult = useMonitoringSocket(activeServerId, !isOwner)
const useWsData = !isOwner && wsResult.wsStatus === 'live'
const resources = useWsData ? wsResult.resources : restMetrics.resources
const trafficRate = computeTrafficRate(activeServerId, useWsData ? wsResult.traffic : restMetrics.traffic)
// dst — sumber data dipilih per-field berdasar useWsData, fallback REST kalau WS belum/tidak live
```

`computeTrafficRate` (module-level Map delta calc) **reuse 100% tanpa ubah** — dipanggil tiap kali data baru masuk (dari WS `snapshot` event atau REST poll tick), shape traffic array identik di kedua sumber.

### 4. UI — badge live-indicator

Prop baru di `RouterHealthPanel`: `liveMode: 'live' | 'polling' | 'connecting'` (terpisah dari `isLive` yang sudah ada — itu artinya "ada data resource", bukan "transport mode"). Render titik status di header panel:
- `live` → hijau pulsing, label "Live"
- `connecting` → kuning, label "Menghubungkan..."
- `polling` → abu-abu, label "Polling" (OWNER selalu di sini, atau TEKNISI saat WS `unavailable`)

## Error handling

- Router mati/timeout (RouterOS gagal) → tidak berubah dari sekarang: WS kirim `status:{connected:false}` atau REST balas 502 → `isDisconnected` state existing (`DisconnectedRouterPlaceholder`) tetap dipakai apa adanya.
- Socket gagal connect dari awal (WS diblok proxy/firewall prod, dsb.) → fallback REST otomatis nyala, user tidak lihat error — cuma badge "Polling".
- Ganti router aktif cepat-cepat (dropdown) → guard `serverId` match di event `snapshot` mencegah data router lama nyasar ke router baru.

## Dependency baru

`socket.io-client` — install via `pnpm add socket.io-client` (bukan `npm`, sesuai konvensi repo ini).

## Verifikasi

1. `npx tsc -b --pretty false` + `rtk proxy npx eslint` pada file baru/diubah → 0 error baru.
2. Manual, login TEKNISI: buka `/dashboard`, cek Network tab ada koneksi `wss://.../monitoring`, badge jadi "Live" begitu snapshot pertama masuk, data resource/traffic update tanpa REST poll (Network tab REST `/monitoring/snapshot` tidak lagi terpanggil berkala).
3. Manual, login OWNER: buka `/dashboard`, pastikan **tidak ada** percobaan koneksi WS sama sekali (cek Network tab), badge selalu "Polling" atau disembunyikan, perilaku identik sebelum B7.
4. Ganti router aktif via dropdown saat `/dashboard` terbuka → data ke-update ke router baru, tidak ada kedipan data router lama.
5. Matikan backend / block WebSocket (mis. devtools throttle/offline sesaat) → badge jatuh ke "Polling" dalam &lt;30 detik (5× `reconnectionAttempts` dengan backoff default socket.io), data tetap mengalir lewat REST, tidak ada error unhandled di console.
6. Navigasi keluar dari `/dashboard` → cek socket ke-disconnect (Network tab WS connection closed), tidak ada leak saat balik lagi ke halaman.
7. Kartu jumlah voucher di dashboard tetap update tiap ~3 detik regardless status WS (bukti pemisahan concern berhasil).

## Di luar scope

- Tidak mengubah RBAC OWNER (sudah selesai, commit `58db82e`).
- Tidak mengubah backend / RouterOS connectivity — WS hanya mengurangi jumlah koneksi bersamaan ke router, bukan memperbaiki router yang memang unreachable.
- Tidak migrasi kartu voucher atau data lain ke WS — scope backend §8 cuma monitoring (snapshot/active/resources/traffic).
