import { Lock } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

// Bentuk response GET /monitoring/resources|snapshot (lihat desain/dashboard-ia-plan.md §3.1)
export type RouterResources = {
  serverId?: string
  serverName?: string
  uptime: string
  cpuLoad: number
  cpuCount: number
  freeMemory: number
  totalMemory: number
  freeHddSpace: number
  totalHddSpace: number
  version: string
  boardName: string
  architectureName: string
}

export type TrafficInterface = {
  id: string
  name: string
  type?: string
  rxByte: number
  txByte: number
  running: boolean
  disabled?: boolean
}

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
  bytesIn?: number
  bytesOut?: number
  sessionTimeLeft?: string
  idleTime?: string
}

type Props = {
  resources: RouterResources | null
  /** Ada data traffic di tick ini (rate mungkin masih dihitung di tick pertama). */
  hasTraffic: boolean
  /** Rate bit/detik dari delta counter antar poll — dihitung di data layer. */
  trafficRate: { rx: number; tx: number } | null
  /** Snapshot 403 (role OWNER) — data resources/active tidak tersedia. */
  isForbidden: boolean
  /** Snapshot terakhir berhasil = router terjangkau sekarang (status live). */
  isLive: boolean
  /** Mode transport data monitoring saat ini (WS live/connecting, atau REST polling). */
  liveMode?: 'live' | 'polling' | 'connecting'
  host?: string
  port?: number
  /** Status tersimpan dari /servers — fallback saat tidak ada sinyal live. */
  lastStatus?: string
  lastCheckedAt?: string | null
  className?: string
}

const MB = 1024 * 1024

function formatMb(bytes: number) {
  if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toFixed(1)} GB`
  return `${Math.round(bytes / MB)} MB`
}

function formatRate(bps: number) {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`
  return `${Math.max(0, Math.round(bps / 1000))} Kbps`
}

// "1w2d3h4m33s" (format mentah RouterOS) → "1 minggu 2 hari" — dua unit
// terbesar saja, detik dibuang supaya tidak berkedip tiap poll 3 detik.
function formatUptime(raw?: string) {
  if (!raw || raw === '-') return null
  const m = raw.match(/^(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/)
  if (!m) return raw // format tak dikenal → tampilkan apa adanya
  const [, w, d, h, min, s] = m
  const parts: string[] = []
  if (w) parts.push(`${w} minggu`)
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (min) parts.push(`${min} menit`)
  if (parts.length === 0) return s ? 'kurang dari 1 menit' : raw
  return parts.slice(0, 2).join(' ')
}

function relTime(iso?: string | null) {
  if (!iso) return null
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s lalu`
  if (s < 3600) return `${Math.round(s / 60)}m lalu`
  return `${Math.round(s / 3600)}j lalu`
}

// Progress proporsi: normal → warning ≥70% → error ≥90% (token semantic).
function UsageBar({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const fill =
    clamped >= 90 ? 'bg-error' : clamped >= 70 ? 'bg-warning' : 'bg-primary'
  return (
    <div className='flex items-center gap-3'>
      <div className='h-2 w-24 overflow-hidden rounded-full bg-muted'>
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className='text-sm text-muted-foreground tabular-nums'>{label}</span>
    </div>
  )
}

// Badge transport data monitoring — terpisah dari `isLive` (yang berarti
// "ada data resource"), ini soal jalur data: WS live/connecting atau REST polling.
// function LiveModeBadge({ mode }: { mode: 'live' | 'polling' | 'connecting' }) {
//   const dotClass =
//     mode === 'live'
//       ? 'bg-success'
//       : mode === 'connecting'
//         ? 'bg-warning'
//         : 'bg-muted-foreground'
//   const label =
//     mode === 'live' ? 'Live' : mode === 'connecting' ? 'Menghubungkan...' : 'Polling'
//   const textClass =
//     mode === 'live'
//       ? 'text-success'
//       : mode === 'connecting'
//         ? 'text-warning'
//         : 'text-muted-foreground'
//   return (
//     <span className='flex items-center gap-1.5'>
//       <span className='relative flex size-2'>
//         {mode === 'live' && (
//           <span className='absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75' />
//         )}
//         <span className={`relative inline-flex size-2 rounded-full ${dotClass}`} />
//       </span>
//       <span className={`text-xs font-medium ${textClass}`}>{label}</span>
//     </span>
//   )
// }

function HealthRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <TableRow className='hover:bg-transparent'>
      <TableCell className='w-32 bg-muted/50 py-2 text-sm font-medium'>
        {label}
      </TableCell>
      <TableCell className='py-2'>{children}</TableCell>
    </TableRow>
  )
}

const Dash = () => <span className='text-sm text-muted-foreground'>—</span>

/**
 * Panel "Router Details" — spec-sheet vertikal untuk router aktif,
 * diadaptasi dari @reui/c-table-17 (lihat desain/dashboard-ia-plan.md §6).
 */
export function RouterHealthPanel({
  resources,
  hasTraffic,
  trafficRate,
  isForbidden,
  isLive,
  // liveMode,
  host,
  port,
  lastStatus,
  lastCheckedAt,
  className,
}: Props) {
  // Status: sinyal live (snapshot sukses) menang; OWNER pakai status tersimpan.
  const status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN' = isLive
    ? 'ONLINE'
    : isForbidden
      ? ((lastStatus as 'ONLINE' | 'OFFLINE' | 'UNKNOWN') ?? 'UNKNOWN')
      : 'OFFLINE'
  const checked = isForbidden ? relTime(lastCheckedAt) : null

  const memPct = resources?.totalMemory
    ? ((resources.totalMemory - resources.freeMemory) / resources.totalMemory) *
      100
    : 0
  const hddPct = resources?.totalHddSpace
    ? ((resources.totalHddSpace - resources.freeHddSpace) /
        resources.totalHddSpace) *
      100
    : 0

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Router Details</CardTitle>
          {/* {liveMode && <LiveModeBadge mode={liveMode} />} */}
        </div>
        <CardDescription>Kondisi perangkat saat ini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableBody>
              <HealthRow label='Status'>
                <div className='flex items-center gap-2'>
                  <span className='relative flex size-2'>
                    {status === 'ONLINE' && (
                      <span className='absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75' />
                    )}
                    <span
                      className={`relative inline-flex size-2 rounded-full ${
                        status === 'ONLINE'
                          ? 'bg-success'
                          : status === 'OFFLINE'
                            ? 'bg-error'
                            : 'bg-muted-foreground'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      status === 'ONLINE'
                        ? 'text-success'
                        : status === 'OFFLINE'
                          ? 'text-error'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {status === 'ONLINE'
                      ? 'Online'
                      : status === 'OFFLINE'
                        ? 'Offline'
                        : 'Tidak diketahui'}
                  </span>
                  {checked && (
                    <span className='text-xs text-muted-foreground'>
                      · dicek {checked}
                    </span>
                  )}
                </div>
              </HealthRow>

              {isForbidden ? (
                <HealthRow label='Perangkat'>
                  <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                    <Lock className='h-4 w-4' /> CPU, memori & uptime khusus
                    teknisi
                  </div>
                </HealthRow>
              ) : (
                <>
                  <HealthRow label='Board'>
                    <span className='text-sm'>{resources?.boardName || '—'}</span>
                  </HealthRow>
                  <HealthRow label='RouterOS'>
                    {resources ? (
                      <span className='font-mono text-sm'>
                        v{resources.version} ({resources.architectureName})
                      </span>
                    ) : (
                      <Dash />
                    )}
                  </HealthRow>
                  <HealthRow label='CPU'>
                    {resources ? (
                      <UsageBar
                        pct={resources.cpuLoad}
                        label={`${resources.cpuLoad}%${resources.cpuCount > 1 ? ` · ${resources.cpuCount} core` : ''}`}
                      />
                    ) : (
                      <Dash />
                    )}
                  </HealthRow>
                  <HealthRow label='Memori'>
                    {resources?.totalMemory ? (
                      <UsageBar
                        pct={memPct}
                        label={`${formatMb(resources.totalMemory - resources.freeMemory)} / ${formatMb(resources.totalMemory)}`}
                      />
                    ) : (
                      <Dash />
                    )}
                  </HealthRow>
                  <HealthRow label='Disk'>
                    {resources?.totalHddSpace ? (
                      <UsageBar
                        pct={hddPct}
                        label={`${formatMb(resources.totalHddSpace - resources.freeHddSpace)} / ${formatMb(resources.totalHddSpace)}`}
                      />
                    ) : (
                      <Dash />
                    )}
                  </HealthRow>
                  <HealthRow label='Uptime'>
                    <span className='text-sm tabular-nums'>
                      {formatUptime(resources?.uptime) || '—'}
                    </span>
                  </HealthRow>
                </>
              )}

              <HealthRow label='Trafik'>
                {trafficRate ? (
                  <span className='text-sm tabular-nums'>
                    ↓ {formatRate(trafficRate.rx)} · ↑ {formatRate(trafficRate.tx)}
                  </span>
                ) : (
                  <span className='text-sm text-muted-foreground'>
                    {hasTraffic ? 'menghitung…' : '—'}
                  </span>
                )}
              </HealthRow>

              <HealthRow label='Host'>
                {host ? (
                  <span className='font-mono text-sm'>
                    {host}
                    {port ? `:${port}` : ''}
                  </span>
                ) : (
                  <Dash />
                )}
              </HealthRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
