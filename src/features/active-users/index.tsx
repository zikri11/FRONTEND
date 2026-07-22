import { useServerStore } from '@/stores/server-store'
import { useMonitoringSocket } from '@/hooks/use-monitoring-socket'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from "@/components/ui/progress"
import { Badge } from '@/components/reui/badge'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { parseMikrotikTime, formatToReadableTime } from '@/lib/mikrotik-time'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { ArrowDown, ArrowUp, Users } from 'lucide-react'
// Interfaces

const formatBytes = (bytes?: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function ActiveUsersFeature() {
  const { activeServerId, servers, isLoading: isLoadingServers } = useServerStore()
  const activeServer = servers.find((s) => s.id === activeServerId)

  // Gunakan WebSocket untuk monitoring user aktif (sama dengan dashboard)
  const { activeUsers: activeUsersData, wsStatus, routerConnected } = useMonitoringSocket(
    activeServerId,
    true
  )
  
  const isLoadingUsers = wsStatus === 'connecting'
  const isError = wsStatus === 'unavailable' || routerConnected === false

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={outerBoxClass}>
          <div className='mb-6 flex flex-col sm:flex-row items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground'>User Aktif</h1>
              <p className='text-sm text-text-secondary mt-1'>
                Pantau daftar pengguna hotspot yang sedang terhubung secara real-time
                {activeServer && ` pada router ${activeServer.name}`}.
              </p>
            </div>
          </div>

          <Card className={nestedCardClass}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base font-semibold text-foreground flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Daftar Pengguna Aktif
              </CardTitle>
              <CardDescription className='text-xs text-muted-foreground'>
                Data diperbarui setiap 5 detik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border border-border overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Pengguna
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Identitas Perangkat
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Pemakaian Data
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Durasi / Sisa Waktu
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground text-center'>
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!activeServerId ? (
                      <TableRow>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <div className='flex flex-col items-center justify-center text-text-secondary'>
                            <p className='text-sm font-medium'>Silakan pilih router terlebih dahulu di menu atas.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : isLoadingUsers || isLoadingServers ? (
                      <TableSkeleton rows={5} cols={6} />
                    ) : isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <div className='flex flex-col items-center justify-center text-error'>
                            <p className='text-sm font-medium'>Gagal memuat data dari router.</p>
                            <p className='text-xs opacity-80'>Pastikan koneksi router stabil.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : activeUsersData && activeUsersData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <div className='flex flex-col items-center justify-center text-text-secondary'>
                            <p className='text-sm font-medium'>Tidak ada pengguna aktif saat ini.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeUsersData?.map((user, idx) => (
                        <TableRow key={idx} className='hover:bg-muted/30 transition-colors duration-200'>
                          <TableCell className='font-medium text-sm text-foreground'>
                            {user.username || '-'}
                          </TableCell>
                          
                          <TableCell>
                            <div className='flex flex-col gap-0.5'>
                              <span className='font-mono text-xs text-foreground tabular-nums'>{user.ipAddress || '-'}</span>
                              <span className='font-mono text-xs text-muted-foreground tabular-nums'>{user.macAddress || '-'}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell className='min-w-[170px]'>
                            <div className='flex items-center gap-3 text-xs font-mono tabular-nums'>
                              <div className='flex items-center gap-1'>
                                <ArrowDown className='h-3.5 w-3.5 text-success' />
                                <span className='text-foreground'>{formatBytes(user.bytesIn)}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <ArrowUp className='h-3.5 w-3.5 text-info' />
                                <span className='text-foreground'>{formatBytes(user.bytesOut)}</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className='w-[180px]'>
                            {(() => {
                              const uptimeSec = parseMikrotikTime(user.uptime)
                              const timeLeftSec = parseMikrotikTime(user.sessionTimeLeft)
                              const totalSec = uptimeSec + timeLeftSec
                              
                              if (totalSec === 0 || !user.sessionTimeLeft) {
                                // Unlimited atau tidak ada batas waktu
                                return (
                                  <div className='flex flex-col'>
                                    <span className='font-mono text-xs text-foreground'>
                                      {formatToReadableTime(user.uptime)}
                                    </span>
                                    <span className='text-[11px] text-muted-foreground'>Tak terbatas</span>
                                  </div>
                                )
                              }

                              const percentUsed = Math.round((uptimeSec / totalSec) * 100)
                              return (
                                <div className="flex flex-col gap-1.5 w-full">
                                  <Progress value={percentUsed} className="h-2 w-full" />
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                      {percentUsed}% Terpakai
                                    </span>
                                    <span className="font-mono text-[11px] font-medium text-foreground">
                                      {formatToReadableTime(user.sessionTimeLeft)} Tersisa
                                    </span>
                                  </div>
                                </div>
                              )
                            })()}
                          </TableCell>
                          
                          <TableCell className='text-center'>
                            {user.idleTime && (user.idleTime.includes('m') || user.idleTime.includes('h')) ? (
                              <Badge variant="warning-light" size="sm">Menganggur</Badge>
                            ) : (
                              <Badge variant="success-light" size="sm">Aktif</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
