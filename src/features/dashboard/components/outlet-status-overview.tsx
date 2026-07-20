import { Link } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { formatDateTimeId } from '@/lib/format-datetime'
import { availabilityLabel, fetchHealthSummary } from '@/lib/monitoring'
import { OutletTimeline } from '@/components/monitoring/outlet-uptime'
import { Badge } from '@/components/reui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { useServerStore } from '@/stores/server-store'
import { normalizeStatus } from '@/features/routers/utils'

const DAYS = 30

export function OutletStatusOverview() {
  const { servers, isLoading: serversLoading } = useServerStore()

  const realTotal = servers.length
  const realOnline = servers.filter(
    (s) => normalizeStatus(s.lastStatus) === 'ONLINE'
  ).length

  // Per-outlet summary → availability (agregat), kartu "Outlet Bermasalah",
  // dan timeline tiap baris. Tak perlu call gabungan terpisah.
  const outletSummaries = useQueries({
    queries: servers.map((s) => ({
      queryKey: qk.healthSummary(s.id, DAYS),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchHealthSummary({ serverId: s.id, days: DAYS }, signal),
    })),
  })

  const summariesLoading =
    servers.length > 0 && outletSummaries.some((q) => q.isPending)
  const allPoints = outletSummaries.flatMap((q) => q.data ?? [])
  // Outlet yang punya minimal 1 cek OFFLINE dalam 30 hari.
  const troubledCount = outletSummaries.filter((q) =>
    (q.data ?? []).some((p) => p.fails > 0)
  ).length

  return (
    <div className='space-y-4'>
      {/* Ringkasan */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card className={nestedCardClass}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Outlet Online</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M12 20h.01' />
              <path d='M2 8.82a15 15 0 0 1 20 0' />
              <path d='M5 12.859a10 10 0 0 1 14 0' />
              <path d='M8.5 16.429a5 5 0 0 1 7 0' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-semibold tracking-tight tabular-nums'>
              {realOnline}/{realTotal}
            </div>
            <p className='text-xs text-muted-foreground'>
              outlet aktif saat ini
            </p>
          </CardContent>
        </Card>
        <Card className={nestedCardClass}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Availability 30 Hari
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <line x1='19' y1='5' x2='5' y2='19' />
              <circle cx='6.5' cy='6.5' r='2.5' />
              <circle cx='17.5' cy='17.5' r='2.5' />
            </svg>
          </CardHeader>
          <CardContent>
            {summariesLoading ? (
              <Skeleton className='h-8 w-20' />
            ) : (
              <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                {availabilityLabel(allPoints)}
              </div>
            )}
            <p className='mt-1 text-xs text-muted-foreground'>
              rata-rata semua outlet
            </p>
          </CardContent>
        </Card>
        <Card className={nestedCardClass}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Outlet Bermasalah
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' />
              <path d='M12 9v4' />
              <path d='M12 17h.01' />
            </svg>
          </CardHeader>
          <CardContent>
            {summariesLoading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                {troubledCount}
              </div>
            )}
            <p className='mt-1 text-xs text-muted-foreground'>
              {troubledCount > 0
                ? `dari ${realTotal} outlet sempat offline 30 hari terakhir`
                : 'semua outlet stabil 30 hari terakhir'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status per outlet */}
      <Card className={nestedCardClass}>
        <CardHeader className='flex flex-row items-start justify-between space-y-0'>
          <div>
            <CardTitle>Status Outlet</CardTitle>
            <CardDescription className='mt-1'>
              Uptime 30 hari terakhir semua outlet
            </CardDescription>
          </div>
          <Link
            to='/monitoring'
            className='text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground'
          >
            Lihat detail
          </Link>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Outlet
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Status
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Availability
                  </TableHead>
                  <TableHead className='min-w-[280px] text-xs font-medium tracking-wide text-muted-foreground'>
                    Timeline (30 Hari)
                  </TableHead>
                  <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                    Terakhir Dicek
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serversLoading && servers.length === 0 ? (
                  <TableSkeleton rows={3} cols={5} />
                ) : servers.length === 0 ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell
                      colSpan={5}
                      className='h-24 text-center text-sm text-muted-foreground'
                    >
                      Belum ada outlet (router).
                    </TableCell>
                  </TableRow>
                ) : (
                  servers.map((server, i) => {
                    const q = outletSummaries[i]
                    const status = normalizeStatus(server.lastStatus)
                    const online = status === 'ONLINE'
                    return (
                      <TableRow key={server.id}>
                        <TableCell className='text-sm text-foreground whitespace-nowrap'>
                          {server.name}
                        </TableCell>
                        <TableCell>
                          {online ? (
                            <Badge
                              size='sm'
                              className='border-success/20 bg-success/10 text-success'
                            >
                              Online
                            </Badge>
                          ) : (
                            <Badge
                              size='sm'
                              variant='secondary'
                              className='text-muted-foreground'
                            >
                              {status === 'OFFLINE' ? 'Offline' : 'Tidak diketahui'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='font-mono text-xs tabular-nums'>
                          {availabilityLabel(q?.data)}
                        </TableCell>
                        <TableCell>
                          <OutletTimeline
                            points={q?.data}
                            days={DAYS}
                            isLoading={q?.isPending ?? true}
                          />
                        </TableCell>
                        <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                          {status === 'OFFLINE'
                            ? 'Sedang offline'
                            : server.lastCheckedAt
                              ? formatDateTimeId(server.lastCheckedAt)
                              : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className='mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground'>
            <div className='flex items-center gap-4'>
              <span className='flex items-center gap-1.5'>
                <span className='h-2 w-2 rounded-[2px] bg-success/80' />
                Normal
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='h-2 w-2 rounded-[2px] bg-destructive/80' />
                Ada downtime
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='h-2 w-2 rounded-[2px] bg-muted' />
                Tidak ada data
              </span>
            </div>
            <span>30 hari lalu → Hari ini</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
