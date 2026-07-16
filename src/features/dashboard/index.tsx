import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useServerStore } from '@/stores/server-store'
import { api } from '@/lib/axios'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { computeTrafficRate } from '@/lib/traffic-rate'
import { parseMikrotikTime } from '@/lib/mikrotik-time'
import { useMonitoringSocket } from '@/hooks/use-monitoring-socket'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { DisconnectedRouterPlaceholder } from '@/components/disconnected-router-placeholder'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { RouterLoadingOverlay } from '@/components/router-loading-overlay'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { ChatBubble } from './components/chat-bubble'
import { OutletStatusOverview } from './components/outlet-status-overview'
import { RecentSales } from './components/recent-sales'
import { RecentPosTransactions } from './components/recent-pos-transactions'
import {
  RouterHealthPanel,
  type ActiveUser,
  type RouterResources,
  type SnapshotActiveUser,
  type TrafficInterface,
} from './components/router-health-panel'

type DashboardMetrics = {
  activeUsers: number
  activeUsersList: ActiveUser[]
  resources: RouterResources | null
  traffic: TrafficInterface[]
  trafficRate: { rx: number; tx: number } | null
  isForbidden: boolean
  isDisconnected: boolean
  isNotFound: boolean
}

const EMPTY_METRICS: DashboardMetrics = {
  activeUsers: 0,
  activeUsersList: [],
  resources: null,
  traffic: [],
  trafficRate: null,
  isForbidden: false,
  isDisconnected: false,
  isNotFound: false,
}

const is403 = (e: unknown) =>
  e instanceof AxiosError && e.response?.status === 403
const is404 = (e: unknown) =>
  e instanceof AxiosError && e.response?.status === 404

// Snapshot activeUsers (mapper backend) → bentuk yang dipakai RecentSales.
// Dipakai baik dari REST fetchDashboardMetrics maupun dari event WS 'snapshot'
// (lihat useMonitoringSocket), shape-nya identik di kedua sumber.
function mapSnapshotActiveUsers(list: SnapshotActiveUser[]): ActiveUser[] {
  return list.map((u) => ({
    user: u.username,
    address: u.ipAddress,
    macAddress: u.macAddress,
    uptime: u.uptime,
  }))
}

// Aggregates dashboard metrics (monitoring snapshot only — jumlah voucher
// dipisah ke query sendiri, lihat useQuery(['dashboard-vouchers-count',…])).
// Never throws: a connection failure surfaces as `isDisconnected`, an
// OWNER-restricted panel as `isForbidden` — so the query always resolves
// with a metrics snapshot. REST fallback-only kalau WS 'live' (lihat B7:
// docs/superpowers/specs/2026-07-12-websocket-monitoring-design.md).
async function fetchDashboardMetrics(
  serverId: string,
  signal: AbortSignal
): Promise<DashboardMetrics> {
  const metrics: DashboardMetrics = { ...EMPTY_METRICS }

  // Snapshot: active users + resources + traffic (TEKNISI/SUPER_ADMIN)
  try {
    const sRes = await api.get(`/monitoring/snapshot/${serverId}`, { signal })
    const snap = sRes.data ?? {}
    metrics.activeUsersList = mapSnapshotActiveUsers(
      (snap.activeUsers ?? []) as SnapshotActiveUser[]
    )
    metrics.activeUsers = metrics.activeUsersList.length
    metrics.resources = snap.resources ?? null
    metrics.traffic = Array.isArray(snap.traffic) ? snap.traffic : []
    metrics.trafficRate = computeTrafficRate(serverId, metrics.traffic)
  } catch (e) {
    if (is403(e)) {
      // OWNER: snapshot terlarang — ambil traffic yang memang boleh OWNER.
      metrics.isForbidden = true
      try {
        const tRes = await api.get(`/monitoring/traffic/${serverId}`, {
          signal,
        })
        metrics.traffic = Array.isArray(tRes.data) ? tRes.data : []
        metrics.trafficRate = computeTrafficRate(serverId, metrics.traffic)
      } catch (e2) {
        if (is404(e2)) metrics.isNotFound = true
        else if (!is403(e2)) metrics.isDisconnected = true
      }
    } else if (is404(e)) {
      metrics.isNotFound = true
    } else {
      metrics.isDisconnected = true
    }
  }

  return metrics
}

export function Dashboard() {
  const { activeServerId, isLoading, servers } = useServerStore()
  const activeServer = servers.find((s) => s.id === activeServerId)
  const queryClient = useQueryClient()
  const [isRetrying, setIsRetrying] = useState(false)

  const role = useAuthStore((s) => s.auth.user?.role)
  const isOwner = role === 'OWNER'

  // WS primer untuk resources/active users/traffic — OWNER tetap 100% di
  // jalur REST lama (kontrak WS+RBAC belum terkonfirmasi backend), lihat B7.
  const wsResult = useMonitoringSocket(activeServerId, !isOwner)
  const useWsData = !isOwner && wsResult.wsStatus === 'live'

  // Jumlah voucher: dipisah dari fetchDashboardMetrics, selalu aktif tak
  // terikat status WS.
  const { data: vouchers = 0 } = useQuery({
    queryKey: ['dashboard-vouchers-count', activeServerId ?? 'none'],
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: activeServerId, take: 1 },
          signal,
        })
        .then((r) => r.data?.meta?.total || 0),
    enabled: !!activeServerId,
    refetchInterval: 3000,
  })

  const { data: usedVouchers = 0 } = useQuery({
    queryKey: ['dashboard-used-vouchers-count', activeServerId ?? 'none'],
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: activeServerId, status: 'USED', take: 1 },
          signal,
        })
        .then((r) => r.data?.meta?.total || 0),
    enabled: !!activeServerId,
    refetchInterval: 3000,
  })

  // REST fallback non-owner — polled every 3s (against the backend, not the
  // router directly). queryFn never throws, so failures show as
  // isDisconnected. No-op kalau WS sedang 'live'. OWNER tidak pernah memanggil
  // /monitoring/* — dashboard-nya murni data database, router mati pun tetap
  // render (spec 2026-07-16-owner-dashboard-db-only).
  const {
    data: metrics = EMPTY_METRICS,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-metrics', activeServerId ?? 'none'],
    queryFn: ({ signal }) =>
      fetchDashboardMetrics(activeServerId as string, signal),
    enabled:
      !!activeServerId && !isOwner && wsResult.wsStatus === 'unavailable',
    refetchInterval: 3000,
  })

  const isForbidden = useWsData ? false : metrics.isForbidden
  const resources = useWsData ? wsResult.resources : metrics.resources
  const activeUsersList = useWsData
    ? mapSnapshotActiveUsers(wsResult.activeUsers)
    : metrics.activeUsersList
  const traffic = useWsData ? wsResult.traffic : metrics.traffic
  const wsTrafficRate = useMemo(
    () =>
      activeServerId
        ? computeTrafficRate(activeServerId, wsResult.traffic)
        : null,
    [activeServerId, wsResult.traffic]
  )
  const trafficRate = useWsData ? wsTrafficRate : metrics.trafficRate
  const isDisconnected = useWsData
    ? wsResult.routerConnected === false
    : !isPending && metrics.isDisconnected
  const liveMode: 'live' | 'polling' | 'connecting' = isOwner
    ? 'polling'
    : wsResult.wsStatus === 'live'
      ? 'live'
      : wsResult.wsStatus === 'connecting'
        ? 'connecting'
        : 'polling'

  // Overlay loading saat ganti router: ikut isPending REST kalau WS belum
  // atau tidak live. OWNER selalu false — query metrics-nya disabled dan
  // query disabled berstatus isPending permanen (overlay bakal nyangkut).
  const dashboardIsLoading = isOwner
    ? false
    : wsResult.wsStatus !== 'live'
      ? isPending
      : false

  const handleRetry = async () => {
    setIsRetrying(true)
    const res = await refetch()
    setIsRetrying(false)
    if (res.data && !res.data.isDisconnected) {
      toast.success('Berhasil terhubung kembali!')
    }
  }

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/profiles/sync/${activeServerId}`),
    onMutate: () => {
      toast.info('Memulai proses sinkronisasi...')
    },
    onSuccess: () => {
      toast.success(
        'Berhasil menarik data profil dan voucher terbaru dari router!'
      )
      queryClient.invalidateQueries({
        queryKey: ['dashboard-metrics', activeServerId ?? 'none'],
      })
      queryClient.invalidateQueries({
        queryKey: ['dashboard-vouchers-count', activeServerId ?? 'none'],
      })
      if (activeServerId) {
        queryClient.invalidateQueries({ queryKey: qk.vouchers(activeServerId) })
      }
    },
    onError: (error) => {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined
      toast.error(msg || 'Gagal mensinkronkan data.')
    },
  })
  const isSyncing = syncMutation.isPending

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : metrics.isNotFound ? (
          <div className='flex flex-1 flex-col items-center justify-center py-20 text-center'>
            <h2 className='mb-2 text-xl font-semibold'>
              Router Tidak Ditemukan
            </h2>
            <p className='text-muted-foreground'>
              Router ini mungkin telah dihapus atau Anda tidak memiliki akses.
            </p>
          </div>
        ) : isDisconnected ? (
          <DisconnectedRouterPlaceholder
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        ) : (
          <>
            <div className={`${outerBoxClass} flex-1`}>
              <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold tracking-tight'>
                  Dashboard
                </h1>
                {!isOwner && (
                  <div className='flex items-center space-x-2'>
                    <Button
                      onClick={() => syncMutation.mutate()}
                      disabled={isSyncing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                      />
                      {isSyncing ? 'Mensinkronkan...' : 'Sinkron'}
                    </Button>
                  </div>
                )}
              </div>
              <Tabs
                orientation='vertical'
                defaultValue='overview'
                className='space-y-4'
              >
                <div className='w-full overflow-x-auto pb-2'>
                  <TabsList>
                    <TabsTrigger value='overview'>Overview</TabsTrigger>
                    <TabsTrigger value='analytics'>
                      {isOwner ? 'Monitoring' : 'Analytics'}
                    </TabsTrigger>
                    {!isOwner && (
                      <>
                        <TabsTrigger value='reports' disabled>
                          Reports
                        </TabsTrigger>
                        <TabsTrigger value='notifications' disabled>
                          Notifications
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>
                </div>
                <TabsContent value='overview' className='relative space-y-4'>
                  <RouterLoadingOverlay show={dashboardIsLoading} />
                  <div
                    className={`grid gap-4 ${isOwner ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}
                  >
                    {isOwner && (
                      <Card className={nestedCardClass}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                          <CardTitle className='text-sm font-medium'>
                            Total Outlet
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
                            <path d='m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7' />
                            <path d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8' />
                            <path d='M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4' />
                            <path d='M2 7h20' />
                            <path d='M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7' />
                          </svg>
                        </CardHeader>
                        <CardContent>
                          <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                            3
                          </div>
                          <div className='mt-1 flex items-center gap-1.5'>
                            <Badge variant='success-light' size='sm'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                              >
                                <path d='M16 7h6v6' />
                                <path d='m22 7-8.5 8.5-5-5L2 17' />
                              </svg>
                              +1
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              outlet baru bulan ini
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {isOwner ? (
                      <Link to='/pos-transactions' className='block transition-transform active:scale-[0.98]'>
                      <Card className={`${nestedCardClass} h-full hover:bg-muted/30 transition-colors`}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                          <CardTitle className='text-sm font-medium'>
                            Total Transaksi POS
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
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                          </svg>
                        </CardHeader>
                        <CardContent>
                          <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                            6
                          </div>
                          <div className='mt-1 flex items-center gap-1.5'>
                            <Badge variant='success-light' size='sm'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                              >
                                <path d='M16 7h6v6' />
                                <path d='m22 7-8.5 8.5-5-5L2 17' />
                              </svg>
                              +40
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              lebih banyak dari minggu kemarin
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      </Link>
                    ) : (
                      <Link to='/active-users' className='block transition-transform active:scale-[0.98]'>
                        <Card className={`${nestedCardClass} h-full hover:bg-muted/30 transition-colors`}>
                          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                              User Aktif
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
                              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                            </svg>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                              {activeUsersList.length}
                            </div>
                            <p className='text-xs text-muted-foreground'>
                              pelanggan terhubung saat ini
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    )}
                    <Link to='/vouchers' className='block transition-transform active:scale-[0.98]'>
                      <Card className={`${nestedCardClass} h-full hover:bg-muted/30 transition-colors`}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                          <CardTitle className='text-sm font-medium'>
                            Voucher
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
                          <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                          <circle cx='9' cy='7' r='4' />
                          <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {vouchers}
                        </div>
                        {isOwner ? (
                          <div className='mt-1 flex items-center gap-1.5'>
                            <Badge variant='success-light' size='sm'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                              >
                                <path d='M16 7h6v6' />
                                <path d='m22 7-8.5 8.5-5-5L2 17' />
                              </svg>
                              +120
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              lebih banyak dari minggu kemarin
                            </span>
                          </div>
                        ) : (
                          <p className='text-xs text-muted-foreground'>
                            total voucher dalam sistem
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    </Link>
                    <Card className={nestedCardClass}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          Voucher Terpakai
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
                          <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                          <circle cx='9' cy='7' r='4' />
                          <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {usedVouchers}
                        </div>
                        {isOwner ? (
                          <div className='mt-1 flex items-center gap-1.5'>
                            <Badge variant='success-light' size='sm'>
                              35
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              pengguna aktif sekarang dari seluruh outlet
                            </span>
                          </div>
                        ) : (
                          <p className='text-xs text-muted-foreground'>
                            voucher yang sudah digunakan
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  {isOwner ? (
                    <Link
                      to='/pos-transactions'
                      className='block transition-transform active:scale-[0.98]'
                    >
                      <Card
                        className={`${nestedCardClass} hover:bg-muted/30 transition-colors`}
                      >
                        <CardHeader>
                          <CardTitle>Transaksi POS Terbaru</CardTitle>
                          <CardDescription>Riwayat transaksi terbaru dari sistem POS</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <RecentPosTransactions />
                        </CardContent>
                      </Card>
                    </Link>
                  ) : (
                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                      <RouterHealthPanel
                        className={`col-span-1 lg:col-span-3 ${nestedCardClass}`}
                        resources={resources}
                        hasTraffic={traffic.length > 0}
                        trafficRate={trafficRate}
                        isForbidden={isForbidden}
                        isLive={!!resources}
                        liveMode={liveMode}
                        host={activeServer?.host}
                        port={activeServer?.port}
                        lastStatus={activeServer?.lastStatus}
                        lastCheckedAt={activeServer?.lastCheckedAt}
                      />
                      <Card className={`col-span-1 lg:col-span-4 ${nestedCardClass}`}>
                        <CardHeader>
                          <CardTitle>Pengguna Aktif</CardTitle>
                          <CardDescription>Pelanggan terhubung saat ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <RecentSales
                            data={[...activeUsersList]
                              .sort((a, b) => parseMikrotikTime(a.uptime) - parseMikrotikTime(b.uptime))
                              .slice(0, 5)}
                            isForbidden={isForbidden}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value='analytics' className='space-y-4'>
                  {isOwner ? <OutletStatusOverview /> : <Analytics />}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </Main>

      {/* ===== AI Chat Bubble ===== */}
      <ChatBubble />
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
