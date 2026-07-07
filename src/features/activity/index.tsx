import { MoreHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

// Mock data removed
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { useServerStore } from '@/stores/server-store'

export function ActivityHistory() {
  const { activeServerId } = useServerStore()
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!activeServerId) return
    setIsLoadingActivity(true)
    try {
      const res = await api.get('/activity-log', {
        params: { serverId: activeServerId, take: 50 }
      })
      // Based on docs, it might be paginated, so it could be res.data.data or res.data
      setActivityLogs(res.data.data || res.data)
    } catch (error) {
      toast.error('Gagal memuat riwayat aktivitas')
    } finally {
      setIsLoadingActivity(false)
    }
  }, [activeServerId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {!isLoadingActivity && !activeServerId ? (
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
              {isLoadingActivity ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Memuat riwayat aktivitas...
                  </TableCell>
                </TableRow>
              ) : activityLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Belum ada riwayat aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                activityLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className='font-mono text-xs text-muted-foreground'>
                      {new Date(log.createdAt).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        log.action.startsWith('CREATE') || log.action.startsWith('ADD') || log.action.startsWith('SYNC') || log.action.endsWith('CREATED')
                          ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                          : log.action.startsWith('DELETE') || log.action.endsWith('DELETED') || log.action.includes('FAILED')
                          ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                          : 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                      }`}>
                        {log.action}
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
                ))
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
