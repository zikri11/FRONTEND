import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/reui/badge'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const months = [
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

const years = [
  { label: '2024', value: '2024' },
  { label: '2025', value: '2025' },
  { label: '2026', value: '2026' },
  { label: '2027', value: '2027' },
]

const dummyOutlets = [
  { name: 'Bandung', status: 'Online', availability: '99.98%', lastOffline: '10 Jul • 10:52 • 6m', days: [...Array(30)].map((_, i) => i === 15 || i === 16 ? 'down' : 'up') },
  { name: 'Jakarta', status: 'Online', availability: '99.91%', lastOffline: '06 Jul • 08:12 • 2m', days: [...Array(30)].map(() => 'up') },
  { name: 'Garut', status: 'Offline', availability: '96.72%', lastOffline: 'Sedang Offline', days: [...Array(30)].map((_, i) => i >= 18 && i <= 20 ? 'down' : 'up') },
  { name: 'Tasikmalaya', status: 'Online', availability: '99.99%', lastOffline: '01 Jul • 03:12 • 1m', days: [...Array(30)].map(() => 'up') },
  { name: 'Sumedang', status: 'Online', availability: '99.83%', lastOffline: '09 Jul • 17:08 • 3m', days: [...Array(30)].map((_, i) => i === 10 ? 'down' : 'up') },
]

export function Monitoring() {
  return (
    <Main>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className={outerBoxClass}>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Monitoring Outlet</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Pantau status dan ketersediaan semua router di tiap cabang secara menyeluruh.
            </p>
          </div>
          
          {/* Filters */}
          <div className='flex items-center gap-3'>
            <Select defaultValue="07">
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="2026">
              <SelectTrigger className="w-[100px] bg-background">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className={`${nestedCardClass} py-0`}>
          <CardContent className='px-0'>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="ps-4 text-xs font-medium tracking-wide text-muted-foreground">
                    Outlet
                  </TableHead>
                  <TableHead className="text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium tracking-wide text-muted-foreground">
                    Availability
                  </TableHead>
                  <TableHead className="min-w-[280px] text-xs font-medium tracking-wide text-muted-foreground">
                    Timeline (30 Hari)
                  </TableHead>
                  <TableHead className="pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Last Offline
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyOutlets.map((outlet, i) => (
                  <TableRow key={i}>
                    <TableCell className="ps-4 text-sm text-foreground whitespace-nowrap">{outlet.name}</TableCell>
                    <TableCell>
                      {outlet.status === 'Online' ? (
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
                    <TableCell className="font-mono text-xs tabular-nums">{outlet.availability}</TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={100}>
                        <div className="flex items-center justify-between gap-[2px] h-6 w-full max-w-[280px]">
                          {outlet.days.map((day, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`h-full flex-1 rounded-[2px] cursor-pointer transition-colors hover:opacity-80
                                    ${day === 'up' ? 'bg-success/80' : 'bg-destructive/80'}
                                  `}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>{day === 'up' ? 'Normal' : 'Downtime terdeteksi'}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap">{outlet.lastOffline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}
