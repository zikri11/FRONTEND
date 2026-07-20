import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/reui/badge'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { availabilityLabel, fetchHealthSummary } from '@/lib/monitoring'
import { formatDateTimeId } from '@/lib/format-datetime'
import { OutletTimeline } from '@/components/monitoring/outlet-uptime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { useServerStore } from '@/stores/server-store'
import { normalizeStatus } from '@/features/routers/utils'

const RANGES = [
  { label: '7 hari', value: 7 },
  { label: '30 hari', value: 30 },
  { label: '90 hari', value: 90 },
]

export function Monitoring() {
  const { servers, isLoading: serversLoading } = useServerStore()
  const [days, setDays] = useState(30)

  const outletSummaries = useQueries({
    queries: servers.map((s) => ({
      queryKey: qk.healthSummary(s.id, days),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchHealthSummary({ serverId: s.id, days }, signal),
    })),
  })

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
            <h1 className='text-2xl font-semibold tracking-tight'>
              Monitoring Outlet
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Pantau status dan ketersediaan semua router di tiap cabang secara
              menyeluruh.
            </p>
          </div>

          {/* Rentang (backend agregat per hari, param `days`) */}
          <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
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
        </div>

        <Card className={`${nestedCardClass} py-0`}>
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
                      Timeline ({days} Hari)
                    </TableHead>
                    <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                      Terakhir Dicek
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serversLoading && servers.length === 0 ? (
                    <TableSkeleton rows={5} cols={5} />
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
                          <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
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
                                {status === 'OFFLINE'
                                  ? 'Offline'
                                  : 'Tidak diketahui'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className='font-mono text-xs tabular-nums'>
                            {availabilityLabel(q?.data)}
                          </TableCell>
                          <TableCell>
                            <OutletTimeline
                              points={q?.data}
                              days={days}
                              isLoading={q?.isPending ?? true}
                            />
                          </TableCell>
                          <TableCell className='pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
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
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}
