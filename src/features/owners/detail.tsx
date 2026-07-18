import { Link } from '@tanstack/react-router'
import { ArrowLeft, KeyRound, Router, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DUMMY_OWNERS, type PlanTier } from './data/dummy-owners'

const FILTER_MONTHS = [
  { label: 'Januari', value: '01' },
  { label: 'Februari', value: '02' },
  { label: 'Maret', value: '03' },
  { label: 'April', value: '04' },
  { label: 'Mei', value: '05' },
  { label: 'Juni', value: '06' },
  { label: 'Juli', value: '07' },
  { label: 'Agustus', value: '08' },
  { label: 'September', value: '09' },
  { label: 'Oktober', value: '10' },
  { label: 'November', value: '11' },
  { label: 'Desember', value: '12' },
]

const FILTER_YEARS = ['2024', '2025', '2026', '2027']

// Kuota dummy per plan — sampai backend punya endpoint detail/agregat per tenant.
const PLAN_META: Record<
  PlanTier,
  { price: string; routers: number; technicians: number; apiKeys: number }
> = {
  Free: { price: 'Rp 0', routers: 5, technicians: 2, apiKeys: 5 },
  Standard: { price: 'Rp 149.000', routers: 25, technicians: 10, apiKeys: 15 },
  Pro: { price: 'Rp 299.000', routers: 100, technicians: 50, apiKeys: 100 },
}

// >85% = warning (hampir penuh), >=100% = destructive (kuota habis)
function progressStateClass(pct: number): string {
  if (pct >= 100)
    return 'bg-destructive/20 [&>[data-slot=progress-indicator]]:bg-destructive'
  if (pct > 85)
    return 'bg-warning/20 [&>[data-slot=progress-indicator]]:bg-warning'
  return ''
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
// Statis, konsisten dummy lain
const TODAY = new Date(2026, 6, 14)

type OutletMonitor = {
  name: string
  online: boolean
  availability: string
  lastOffline: string
  days: { date: string; down: boolean }[]
}

// Outlet monitoring dummy deterministik per owner (seed = indeks owner)
function buildOutlets(seed: number, routerCount: number): OutletMonitor[] {
  const count = Math.max(1, Math.min(routerCount, 5))
  const outlets: OutletMonitor[] = []
  for (let n = 0; n < count; n++) {
    const downDay = (seed * 3 + n * 7) % DAYS
    const hasDown = (seed + n) % 3 !== 0
    const online = (seed + n) % 4 !== 0
    const days = Array.from({ length: DAYS }, (_, d) => {
      const date = new Date(TODAY)
      date.setDate(date.getDate() - (DAYS - 1 - d))
      const isLastAndOffline = !online && d === DAYS - 1
      return {
        date: `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`,
        down: (hasDown && d === downDay) || isLastAndOffline,
      }
    })
    const downCount = days.filter((d) => d.down).length
    outlets.push({
      name: `Outlet ${n + 1}`,
      online,
      availability: `${(100 - downCount * 0.42).toFixed(2)}%`,
      lastOffline: !online
        ? 'Sedang offline'
        : hasDown
          ? `${days[downDay].date}, 09:${String(10 + ((seed + n) % 45)).padStart(2, '0')} (${4 + ((seed * n) % 20)} menit)`
        : '—',
      days,
    })
  }
  return outlets
}

export function OwnerDetail({ ownerId }: { ownerId: string }) {
  const ownerIndex = DUMMY_OWNERS.findIndex((o) => o.id === ownerId)
  const owner = ownerIndex >= 0 ? DUMMY_OWNERS[ownerIndex] : null

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
          {!owner ? (
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
          ) : (
            <>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  {owner.name}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {owner.email} - Akun dibuat {owner.createdAt}
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
                        {owner.plan}
                      </span>
                      <Badge variant='success-light' size='sm'>
                        Aktif
                      </Badge>
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {owner.plan === 'Free'
                        ? 'Tanpa masa berlaku'
                        : 'Berlaku sampai 14 Agu 2026'}
                    </p>
                  </div>
                  <div>
                    <span className='text-2xl font-semibold tracking-tight tabular-nums'>
                      {PLAN_META[owner.plan].price}
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      /bulan
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Pemakaian periode ini */}
              <Card className={nestedCardClass}>
                <CardHeader>
                  <CardTitle>Pemakaian Periode Ini</CardTitle>
                  <CardDescription>
                    Kuota terpakai dari paket {owner.plan}.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6 sm:grid-cols-3'>
                  {[
                    {
                      label: 'Router',
                      used: owner.routers,
                      limit: PLAN_META[owner.plan].routers,
                      unit: 'router',
                      icon: Router,
                    },
                    {
                      label: 'Teknisi',
                      used: owner.technicians,
                      limit: PLAN_META[owner.plan].technicians,
                      unit: 'teknisi',
                      icon: Users,
                    },
                    {
                      label: 'API Key',
                      used: owner.routers,
                      limit: PLAN_META[owner.plan].apiKeys,
                      unit: 'API key',
                      icon: KeyRound,
                    },
                  ].map((item) => {
                    const pct = Math.round((item.used / item.limit) * 100)
                    const barPct = Math.min(100, pct)
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
                          value={barPct}
                          className={`mt-2 h-2 ${progressStateClass(pct)}`}
                        />
                        <p className='mt-2 text-xs text-muted-foreground tabular-nums'>
                          {item.used} dari {item.limit} {item.unit}
                        </p>
                      </div>
                    )
                  })}
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
                  <div className='flex items-center gap-2'>
                    <Select defaultValue='07'>
                      <SelectTrigger className='w-[140px] bg-background'>
                        <SelectValue placeholder='Bulan' />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select defaultValue='2026'>
                      <SelectTrigger className='w-[100px] bg-background'>
                        <SelectValue placeholder='Tahun' />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_YEARS.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                          <TableHead className='min-w-[280px] text-xs font-medium tracking-wide text-muted-foreground'>
                            Timeline (30 Hari)
                          </TableHead>
                          <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Last Offline
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buildOutlets(ownerIndex, owner.routers).map(
                          (outlet) => (
                            <TableRow key={outlet.name}>
                              <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                                {outlet.name}
                              </TableCell>
                              <TableCell>
                                {outlet.online ? (
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
                                              day.down
                                                ? 'bg-destructive/80'
                                                : 'bg-success/80'
                                            }`}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side='top'
                                          className='text-xs'
                                        >
                                          <p className='font-medium'>
                                            {day.date}
                                          </p>
                                          <p className='text-muted-foreground'>
                                            {day.down
                                              ? 'Downtime terdeteksi'
                                              : 'Tidak ada downtime'}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className='pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                                {outlet.lastOffline}
                              </TableCell>
                            </TableRow>
                          )
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
