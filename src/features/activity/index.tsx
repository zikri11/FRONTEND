import { useState } from 'react'
import { MoreHorizontalIcon, Copy, Check, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/reui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { JsonViewer } from '@/components/json-viewer'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { useServerStore } from '@/stores/server-store'

type ActivityLog = {
  id: string
  createdAt: string
  action?: string
  entity?: string
  detail?: string
  server?: { name?: string }
}

// Truncation berbasis JUMLAH KATA (bukan CSS ellipsis / lebar elemen): >5 kata
// → 5 kata pertama + '...'. Presentation only; teks penuh tetap ada (tooltip).
function truncateWords(text: string, max = 5) {
  const words = text.trim().split(/\s+/)
  if (words.length <= max) return { text, truncated: false }
  return { text: `${words.slice(0, max).join(' ')}...`, truncated: true }
}

export function ActivityHistory() {
  const { activeServerId, isLoading } = useServerStore()
  const [detailLog, setDetailLog] = useState<ActivityLog | null>(null)
  const [copied, setCopied] = useState(false)

  const detailJson = detailLog ? JSON.stringify(detailLog, null, 2) : ''

  const copyJson = () => {
    navigator.clipboard.writeText(detailJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadJson = () => {
    const blob = new Blob([detailJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-${detailLog?.id ?? 'log'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
            <div className={`${outerBoxClass} flex-1`}>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight'>Riwayat Aktivitas</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Pantau log aktivitas sistem, audit transaksi POS, & status sinkronisasi router MikroTik.
                </p>
              </div>
          <Button variant='outline'>Ekspor Log</Button>
        </div>

        <div className={`overflow-hidden rounded-xl border ${nestedCardClass}`}>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Waktu
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Aksi
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Deskripsi
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Server
                </TableHead>
                <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                  Aksi Detail
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    Memuat riwayat aktivitas...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p className="text-sm text-muted-foreground">Gagal memuat riwayat aktivitas.</p>
                    <Button variant='outline' size='sm' className='mt-2' onClick={() => refetch()}>
                      Coba Lagi
                    </Button>
                  </TableCell>
                </TableRow>
              ) : activityLogs.length === 0 ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    Belum ada riwayat aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                activityLogs.map((log) => {
                  const action = log.action ?? ''
                  const descFull = `${log.entity ? `[${log.entity}] ` : ''}${log.detail || '-'}`
                  const desc = truncateWords(descFull)
                  return (
                  <TableRow key={log.id}>
                    <TableCell className='font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                      {new Date(log.createdAt).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        size='sm'
                        variant={
                          action.startsWith('CREATE') || action.startsWith('ADD') || action.startsWith('SYNC') || action.endsWith('CREATED')
                            ? 'success-light'
                            : action.startsWith('DELETE') || action.endsWith('DELETED') || action.includes('FAILED')
                              ? 'destructive-light'
                              : 'info-light'
                        }
                      >
                        {action || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-sm text-foreground max-w-[300px] sm:max-w-none'>
                      {desc.truncated ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='cursor-default'>{desc.text}</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-sm'>
                            {descFull}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        descFull
                      )}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>{log.server?.name || '-'}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='size-8'>
                            <MoreHorizontalIcon className='h-4 w-4' />
                            <span className='sr-only'>Buka menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => setDetailLog(log)}>Lihat Detail JSON</DropdownMenuItem>
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
        </div>
        </>
        )}
      </Main>

      <Dialog
        open={!!detailLog}
        onOpenChange={(open) => {
          if (!open) {
            setDetailLog(null)
            setCopied(false)
          }
        }}
      >
        <DialogContent className='gap-0 overflow-hidden p-0 sm:max-w-[min(1000px,92vw)]'>
          <DialogHeader className='flex flex-row items-center justify-between gap-2 space-y-0 border-b px-5 py-3'>
            <DialogTitle className='text-sm font-medium'>Activity JSON</DialogTitle>
            <div className='flex items-center gap-1 pe-6'>
              <Button variant='ghost' size='sm' className='h-8 gap-1.5 text-xs' onClick={copyJson}>
                {copied ? (
                  <Check className='h-3.5 w-3.5 text-success' />
                ) : (
                  <Copy className='h-3.5 w-3.5' />
                )}
                {copied ? 'Tersalin' : 'Salin'}
              </Button>
              <Button variant='ghost' size='sm' className='h-8 gap-1.5 text-xs' onClick={downloadJson}>
                <Download className='h-3.5 w-3.5' /> Unduh
              </Button>
            </div>
          </DialogHeader>
          <div className='p-4'>
            {detailLog && <JsonViewer data={detailLog} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
