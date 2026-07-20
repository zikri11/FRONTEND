import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Bot, KeyRound, Router, Users } from 'lucide-react'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { formatDateTimeId } from '@/lib/format-datetime'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DetailSkeleton } from '@/components/skeletons/detail-skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  fetchHealthSummary,
  fetchOwnerDetail,
  formatDateId,
  formatRupiah,
  type HealthSummaryPoint,
} from './data/owners-store'

const RANGES = [
  { label: '7 hari', value: 7 },
  { label: '30 hari', value: 30 },
  { label: '90 hari', value: 90 },
]

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

// >85% = warning (hampir penuh), >=100% = destructive (kuota habis)
function progressStateClass(pct: number): string {
  if (pct >= 100)
    return 'bg-destructive/20 [&>[data-slot=progress-indicator]]:bg-destructive'
  if (pct > 85)
    return 'bg-warning/20 [&>[data-slot=progress-indicator]]:bg-warning'
  return ''
}

// Kunci hari UTC (cocok dgn date_trunc('day') backend) untuk `days` terakhir.
function buildDayKeys(days: number): string[] {
  const now = new Date()
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10))
  }
  return keys
}

function prettyDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}

type DayState = 'up' | 'down' | 'none'

function OutletTimeline({
  points,
  days,
  isLoading,
}: {
  points: HealthSummaryPoint[] | undefined
  days: number
  isLoading: boolean
}) {
  const byDate = new Map((points ?? []).map((p) => [p.date, p]))
  const cells = buildDayKeys(days).map((key) => {
    const point = byDate.get(key)
    let state: DayState = 'none'
    if (point) state = point.fails > 0 ? 'down' : 'up'
    return { key, state, fails: point?.fails ?? 0 }
  })

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={`flex h-6 w-full max-w-[320px] items-center justify-between gap-[2px] ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        {cells.map((cell) => (
          <Tooltip key={cell.key}>
            <TooltipTrigger asChild>
              <div
                className={`h-full flex-1 cursor-pointer rounded-[2px] transition-colors hover:opacity-80 ${
                  cell.state === 'down'
                    ? 'bg-destructive/80'
                    : cell.state === 'up'
                      ? 'bg-success/80'
                      : 'bg-muted'
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side='top' className='text-xs'>
              <p className='font-medium'>{prettyDay(cell.key)}</p>
              <p className='text-muted-foreground'>
                {cell.state === 'down'
                  ? `${cell.fails.toLocaleString('id-ID')}× terdeteksi offline`
                  : cell.state === 'up'
                    ? 'Tidak ada downtime'
                    : 'Tidak ada data'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

function availabilityLabel(points: HealthSummaryPoint[] | undefined): string {
  const pts = points ?? []
  const checks = pts.reduce((a, p) => a + p.checks, 0)
  if (checks === 0) return '—'
  const fails = pts.reduce((a, p) => a + p.fails, 0)
  const pct = Math.round(((checks - fails) / checks) * 10000) / 100
  return `${pct}%`
}

export function OwnerDetail({ ownerId }: { ownerId: string }) {
  const [days, setDays] = useState(30)

  const {
    data: owner,
    isPending,
    isError,
  } = useQuery({
    queryKey: qk.owner(ownerId),
    queryFn: ({ signal }) => fetchOwnerDetail(ownerId, signal),
  })

  const outlets = owner?.monitoring.outlets ?? []
  const summaryQueries = useQueries({
    queries: outlets.map((o) => ({
      queryKey: qk.healthSummary(o.serverId, days),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchHealthSummary(o.serverId, days, signal),
    })),
  })

  const sub = owner?.subscription ?? null
  const usage = owner?.usage

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-3 sm:gap-4'>
        <div>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 -ms-2 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/users' aria-label='Kembali ke Kelola Owner'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
        </div>
        <div className={`${outerBoxClass} flex-1`}>
          {isError ? (
            <div className='flex flex-1 flex-col items-center justify-center py-20 text-center'>
              <h2 className='mb-2 text-xl font-semibold'>
                Owner Tidak Ditemukan
              </h2>
              <p className='text-sm text-muted-foreground'>
                Owner ini mungkin telah dihapus.
              </p>
              <Link
                to='/users'
                className='mt-4 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground'
              >
                Kembali ke Kelola Owner
              </Link>
            </div>
          ) : isPending || !owner ? (
            <DetailSkeleton />
          ) : (
            <>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  {owner.name}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {owner.email} · Akun dibuat {formatDateId(owner.createdAt)}
                </p>
              </div>

              {/* Paket saat ini */}
              <Card className={nestedCardClass}>
                <CardContent className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Paket saat ini
                    </p>
                    <div className='mt-1 flex items-center gap-2'>
                      <span className='text-2xl font-semibold tracking-tight'>
                        {sub?.plan.name ?? 'Tanpa Paket'}
                      </span>
                      {sub?.status === 'ACTIVE' ? (
                        <Badge variant='success-light' size='sm'>
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant='secondary'
                          size='sm'
                          className='text-muted-foreground'
                        >
                          Tidak aktif
                        </Badge>
                      )}
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {sub?.expiredAt
                        ? `Berlaku sampai ${formatDateId(sub.expiredAt)}`
                        : 'Tanpa masa berlaku'}
                    </p>
                  </div>
                  <div>
                    <span className='text-2xl font-semibold tracking-tight tabular-nums'>
                      {sub ? formatRupiah(sub.plan.price) : 'Rp 0'}
                    </span>
                    {sub && sub.plan.durationDays ? (
                      <span className='text-sm text-muted-foreground'>
                        {' '}
                        / {sub.plan.durationDays} hari
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* Pemakaian periode ini */}
              <Card className={nestedCardClass}>
                <CardHeader>
                  <CardTitle>Pemakaian Periode Ini</CardTitle>
                  <CardDescription>
                    Kuota terpakai dari paket {sub?.plan.name ?? 'saat ini'}.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-6'>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    {[
                      {
                        label: 'Router',
                        used: usage?.routers.used ?? 0,
                        limit: usage?.routers.max ?? 0,
                        unit: 'router',
                        icon: Router,
                      },
                      {
                        label: 'Teknisi',
                        used: usage?.teknisi.used ?? 0,
                        limit: usage?.teknisi.max ?? 0,
                        unit: 'teknisi',
                        icon: Users,
                      },
                    ].map((item) => {
                      const pct =
                        item.limit > 0
                          ? Math.round((item.used / item.limit) * 100)
                          : 0
                      return (
                        <div key={item.label}>
                          <div className='flex items-center justify-between'>
                            <span className='flex items-center gap-2 text-sm font-medium'>
                              <item.icon className='h-4 w-4 text-muted-foreground' />
                              {item.label}
                            </span>
                            <span className='text-sm font-medium tabular-nums'>
                              {pct}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, pct)}
                            className={`mt-2 h-2 ${progressStateClass(pct)}`}
                          />
                          <p className='mt-2 text-xs text-muted-foreground tabular-nums'>
                            {item.used} dari {item.limit} {item.unit}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Fitur paket (boolean — backend tak kirim kuota API key) */}
                  <div className='flex flex-wrap gap-6 border-t pt-4'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Bot className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Akses AI</span>
                      <FeatureBadge on={!!usage?.aiAccess} />
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <KeyRound className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Akses API Key</span>
                      <FeatureBadge on={!!usage?.apiKeyAccess} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring outlet */}
              <Card className={`${nestedCardClass} py-0`}>
                <CardHeader className='flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <CardTitle>Monitoring Outlet</CardTitle>
                    <CardDescription className='mt-1'>
                      Status dan ketersediaan router milik owner ini.
                    </CardDescription>
                  </div>
                  <Select
                    value={days.toString()}
                    onValueChange={(v) => setDays(Number(v))}
                  >
                    <SelectTrigger className='w-[140px] bg-background'>
                      <SelectValue placeholder='Rentang' />
                    </SelectTrigger>
                    <SelectContent>
                      {RANGES.map((r) => (
                        <SelectItem key={r.value} value={r.value.toString()}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className='px-0'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                            Outlet
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Status
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Availability
                          </TableHead>
                          <TableHead className='min-w-[320px] text-xs font-medium tracking-wide text-muted-foreground'>
                            Timeline ({days} Hari)
                          </TableHead>
                          <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Terakhir Dicek
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outlets.length === 0 ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell
                              colSpan={5}
                              className='h-24 text-center text-sm text-muted-foreground'
                            >
                              Owner ini belum punya outlet (router).
                            </TableCell>
                          </TableRow>
                        ) : (
                          outlets.map((outlet, i) => {
                            const q = summaryQueries[i]
                            const points = q?.data
                            const online = outlet.lastStatus === 'ONLINE'
                            return (
                              <TableRow key={outlet.serverId}>
                                <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                                  {outlet.name}
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
                                      Offline
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className='font-mono text-xs tabular-nums'>
                                  {availabilityLabel(points)}
                                </TableCell>
                                <TableCell>
                                  <OutletTimeline
                                    points={points}
                                    days={days}
                                    isLoading={q?.isPending ?? true}
                                  />
                                </TableCell>
                                <TableCell className='pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                                  {outlet.lastCheckedAt
                                    ? formatDateTimeId(outlet.lastCheckedAt)
                                    : '—'}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Main>
    </>
  )
}

function FeatureBadge({ on }: { on: boolean }) {
  return on ? (
    <Badge size='sm' variant='success-light'>
      Aktif
    </Badge>
  ) : (
    <Badge size='sm' variant='secondary' className='text-muted-foreground'>
      Nonaktif
    </Badge>
  )
}
