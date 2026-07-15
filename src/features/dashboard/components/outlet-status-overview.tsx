import { Link } from '@tanstack/react-router'
import { nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { POS_OUTLETS } from '@/features/pos-transactions/data/dummy-transactions'

// Status uptime 30 hari per outlet — dummy sampai backend punya histori status
// router (monitoring backend saat ini realtime-only, lihat ARSITEKTUR §10).
type OutletDay = {
  date: string // "d MMM yyyy"
  downtimeMinutes: number
}

type OutletUptime = {
  name: string
  status: 'online' | 'offline'
  availability: string
  lastOffline: string | null // null → belum pernah offline
  days: OutletDay[] // 30 item, index 0 = 30 hari lalu
}

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

const DAYS = 30
// Statis agar deterministik, konsisten dengan dummy transaksi POS
const TODAY = new Date(2026, 6, 14)

function buildDays(downtime: Record<number, number>): OutletDay[] {
  return Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - (DAYS - 1 - i))
    return {
      date: `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`,
      downtimeMinutes: downtime[i] ?? 0,
    }
  })
}

const OUTLETS: OutletUptime[] = [
  {
    name: POS_OUTLETS[0],
    status: 'online',
    availability: '99.98%',
    lastOffline: '10 Jul 2026, 10:52 (6 menit)',
    days: buildDays({ 15: 4, 25: 6 }),
  },
  {
    name: POS_OUTLETS[1],
    status: 'online',
    availability: '100%',
    lastOffline: null,
    days: buildDays({}),
  },
  {
    name: POS_OUTLETS[2],
    status: 'offline',
    availability: '98.64%',
    lastOffline: 'Sedang offline',
    days: buildDays({ 27: 45, 28: 60, 29: 91 }),
  },
]

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
}

const onlineCount = OUTLETS.filter((o) => o.status === 'online').length
const avgAvailability = (
  OUTLETS.reduce((sum, o) => sum + parseFloat(o.availability), 0) /
  OUTLETS.length
).toFixed(2)
const totalDowntime = OUTLETS.reduce(
  (sum, o) => sum + o.days.reduce((s, d) => s + d.downtimeMinutes, 0),
  0
)

export function OutletStatusOverview() {
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
              {onlineCount}/{OUTLETS.length}
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
            <div className='text-2xl font-semibold tracking-tight tabular-nums'>
              {avgAvailability}%
            </div>
            <p className='text-xs text-muted-foreground'>
              rata-rata semua outlet
            </p>
          </CardContent>
        </Card>
        <Card className={nestedCardClass}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Downtime 30 Hari
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
              <circle cx='12' cy='12' r='10' />
              <path d='M12 6v6l4 2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-semibold tracking-tight tabular-nums'>
              {formatMinutes(totalDowntime)}
            </div>
            <p className='text-xs text-muted-foreground'>
              gabungan semua outlet
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
            className='text-sm text-muted-foreground transition-colors hover:text-foreground'
          >
            Lihat detail →
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
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Terakhir Offline
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OUTLETS.map((outlet) => (
                  <TableRow key={outlet.name}>
                    <TableCell className='text-sm text-foreground whitespace-nowrap'>
                      {outlet.name}
                    </TableCell>
                    <TableCell>
                      {outlet.status === 'online' ? (
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
                    <TableCell className='font-mono text-sm tabular-nums'>
                      {outlet.availability}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={100}>
                        <div className='flex h-6 w-full max-w-[280px] items-center justify-between gap-[2px]'>
                          {outlet.days.map((day, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`h-full flex-1 cursor-pointer rounded-[2px] transition-colors hover:opacity-80 ${
                                    day.downtimeMinutes === 0
                                      ? 'bg-success/80'
                                      : 'bg-destructive/80'
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent side='top' className='text-xs'>
                                <p className='font-medium'>{day.date}</p>
                                <p className='text-muted-foreground'>
                                  {day.downtimeMinutes === 0
                                    ? 'Tidak ada downtime'
                                    : `Downtime: ${formatMinutes(day.downtimeMinutes)}`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                      {outlet.lastOffline ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
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
            </div>
            <span>30 hari lalu → Hari ini</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
