import { MoreHorizontalIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'

import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { useServerStore } from '@/stores/server-store'

type ActivityLog = {
  id: string
  createdAt: string
  action?: string
  entity?: string
  detail?: string
  server?: { name?: string }
}

export function ActivityHistory() {
  const { activeServerId, isLoading } = useServerStore()

  // Live activity feed — polled every 3s to meet the <5s freshness SLA. This
  // hits the backend log endpoint (DB), NOT the router, so it's cheap.
  const {
    data: activityLogs = [],
    isPending,
    isError,
    refetch,
  } = useQuery<ActivityLog[]>({
    queryKey: qk.activity(activeServerId ?? 'none'),
    queryFn: ({ signal }) =>
      api
        .get('/activity-log', { params: { serverId: activeServerId, take: 50 }, signal })
        .then((res) => res.data?.data ?? res.data ?? []),
    enabled: !!activeServerId,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : (
          <>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>Riwayat Aktivitas</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Pantau log aktivitas sistem, audit transaksi POS, & status sinkronisasi router MikroTik.
                </p>
              </div>
          <Button variant='outline'>Ekspor Log</Button>
        </div>

        <div className='mt-4 rounded-md border bg-background'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Server</TableHead>
                <TableHead className='text-right'>Aksi Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Memuat riwayat aktivitas...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <p className="text-muted-foreground">Gagal memuat riwayat aktivitas.</p>
                    <Button variant='outline' size='sm' className='mt-2' onClick={() => refetch()}>
                      Coba Lagi
                    </Button>
                  </TableCell>
                </TableRow>
              ) : activityLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Belum ada riwayat aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                activityLogs.map((log) => {
                  const action = log.action ?? ''
                  return (
                  <TableRow key={log.id}>
                    <TableCell className='font-mono text-xs text-muted-foreground'>
                      {new Date(log.createdAt).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        action.startsWith('CREATE') || action.startsWith('ADD') || action.startsWith('SYNC') || action.endsWith('CREATED')
                          ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                          : action.startsWith('DELETE') || action.endsWith('DELETED') || action.includes('FAILED')
                          ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                      }`}>
                        {action || '-'}
                      </span>
                    </TableCell>
                    <TableCell className='font-medium max-w-[300px] truncate sm:max-w-none'>
                      {log.entity ? `[${log.entity}] ` : ''}{log.detail || '-'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{log.server?.name || '-'}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='size-8'>
                            <MoreHorizontalIcon className='h-4 w-4' />
                            <span className='sr-only'>Buka menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(log, null, 2))}>Lihat Detail JSON</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.id)}>Salin ID Log</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        </>
        )}
      </Main>
    </>
  )
}
