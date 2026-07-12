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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { RecentSales } from './components/recent-sales'
import { ChatBubble } from './components/chat-bubble'
import {
  RouterHealthPanel,
  type RouterResources,
  type TrafficInterface,
} from './components/router-health-panel'
import { useServerStore } from '@/stores/server-store'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { DisconnectedRouterPlaceholder } from '@/components/disconnected-router-placeholder'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Lock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type ActiveUser = {
  user?: string
  name?: string
  address?: string
  macAddress?: string
  uptime?: string
}

type DashboardMetrics = {
  activeUsers: number
  activeUsersList: ActiveUser[]
  vouchers: number
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
  vouchers: 0,
  resources: null,
  traffic: [],
  trafficRate: null,
  isForbidden: false,
  isDisconnected: false,
  isNotFound: false,
}

// Counter kumulatif tick sebelumnya per router — untuk menghitung rate trafik
// (bit/detik) dari delta antar poll. Module-level agar bertahan antar render.
const prevTrafficCounters = new Map<string, { ts: number; rx: number; tx: number }>()

function computeTrafficRate(
  serverId: string,
  traffic: TrafficInterface[]
): { rx: number; tx: number } | null {
  if (!traffic.length) {
    prevTrafficCounters.delete(serverId)
    return null
  }
  const rx = traffic.reduce((s, t) => s + (t.rxByte || 0), 0)
  const tx = traffic.reduce((s, t) => s + (t.txByte || 0), 0)
  const now = Date.now()
  const prev = prevTrafficCounters.get(serverId)
  prevTrafficCounters.set(serverId, { ts: now, rx, tx })
  if (!prev || now <= prev.ts) return null // tick pertama: belum ada delta
  const dt = (now - prev.ts) / 1000
  // Counter reset (router reboot) → delta negatif → anggap 0.
  return {
    rx: (Math.max(0, rx - prev.rx) * 8) / dt,
    tx: (Math.max(0, tx - prev.tx) * 8) / dt,
  }
}

const is403 = (e: unknown) => e instanceof AxiosError && e.response?.status === 403
const is404 = (e: unknown) => e instanceof AxiosError && e.response?.status === 404

// Field snapshot activeUsers (mapper backend) → bentuk yang dipakai RecentSales.
type SnapshotActiveUser = {
  username?: string
  ipAddress?: string
  macAddress?: string
  uptime?: string
}

// Aggregates every dashboard metric in one pass. Never throws: a connection
// failure surfaces as `isDisconnected`, an OWNER-restricted panel as
// `isForbidden` — so the query always resolves with a metrics snapshot.
// Data monitoring diambil via GET /monitoring/snapshot (1 request = 1 login
// router untuk active+resources+traffic) — lihat desain/dashboard-ia-plan.md §7 D1.
async function fetchDashboardMetrics(
  serverId: string,
  signal: AbortSignal
): Promise<DashboardMetrics> {
  const metrics: DashboardMetrics = { ...EMPTY_METRICS }

  // Vouchers (allowed for all roles)
  try {
    const vRes = await api.get('/vouchers', { params: { serverId, take: 1 }, signal })
    metrics.vouchers = vRes.data?.meta?.total || 0
  } catch (e) {
    if (!is403(e)) metrics.isDisconnected = true
  }

  // Snapshot: active users + resources + traffic (TEKNISI/SUPER_ADMIN)
  try {
    const sRes = await api.get(`/monitoring/snapshot/${serverId}`, { signal })
    const snap = sRes.data ?? {}
    metrics.activeUsersList = ((snap.activeUsers ?? []) as SnapshotActiveUser[]).map(
      (u) => ({
        user: u.username,
        address: u.ipAddress,
        macAddress: u.macAddress,
        uptime: u.uptime,
      })
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
        const tRes = await api.get(`/monitoring/traffic/${serverId}`, { signal })
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

  // One aggregated query, polled every 3s (against the backend, not the
  // router directly). queryFn never throws, so failures show as isDisconnected.
  const { data: metrics = EMPTY_METRICS, isPending, refetch } = useQuery({
    queryKey: ['dashboard-metrics', activeServerId ?? 'none'],
    queryFn: ({ signal }) => fetchDashboardMetrics(activeServerId as string, signal),
    enabled: !!activeServerId,
    refetchInterval: 3000,
  })

  const isDisconnected = !isPending && metrics.isDisconnected

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
      toast.success('Berhasil menarik data profil dan voucher terbaru dari router!')
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', activeServerId ?? 'none'] })
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
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <h2 className="text-xl font-semibold mb-2">Router Tidak Ditemukan</h2>
            <p className="text-muted-foreground">Router ini mungkin telah dihapus atau Anda tidak memiliki akses.</p>
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
              <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
            <Button onClick={() => syncMutation.mutate()} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Mensinkronkan...' : 'Sinkron'}
            </Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='reports' disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Card className={nestedCardClass}>
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
                  {metrics.isForbidden ? (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground font-medium'>
                      <Lock className='h-4 w-4' /> Akses Khusus Teknisi
                    </div>
                  ) : (
                    <>
                      <div className='text-2xl font-semibold tracking-tight tabular-nums'>{metrics.activeUsers}</div>
                      <p className='text-xs text-muted-foreground'>
                        pelanggan terhubung saat ini
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card className={nestedCardClass}>
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
                  <div className='text-2xl font-semibold tracking-tight tabular-nums'>{metrics.vouchers}</div>
                  <p className='text-xs text-muted-foreground'>
                    total voucher dalam sistem
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <RouterHealthPanel
                className={`col-span-1 lg:col-span-3 ${nestedCardClass}`}
                resources={metrics.resources}
                hasTraffic={metrics.traffic.length > 0}
                trafficRate={metrics.trafficRate}
                isForbidden={metrics.isForbidden}
                isLive={!!metrics.resources}
                host={activeServer?.host}
                port={activeServer?.port}
                lastStatus={activeServer?.lastStatus}
                lastCheckedAt={activeServer?.lastCheckedAt}
              />
              <Card className={`col-span-1 lg:col-span-4 ${nestedCardClass}`}>
                <CardHeader>
                  <CardTitle>Pengguna Aktif</CardTitle>
                  <CardDescription>
                    Pelanggan terhubung saat ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales data={metrics.activeUsersList} isForbidden={metrics.isForbidden} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
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
