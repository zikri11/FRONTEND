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
import { useServerStore } from '@/stores/server-store'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { DisconnectedRouterPlaceholder } from '@/components/disconnected-router-placeholder'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
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
  uptime: string
  interfaces: number
  isForbidden: boolean
  isDisconnected: boolean
}

const EMPTY_METRICS: DashboardMetrics = {
  activeUsers: 0,
  activeUsersList: [],
  vouchers: 0,
  uptime: '-',
  interfaces: 0,
  isForbidden: false,
  isDisconnected: false,
}

const is403 = (e: unknown) => e instanceof AxiosError && e.response?.status === 403

// Aggregates every dashboard metric in one pass. Never throws: a connection
// failure surfaces as `isDisconnected`, an OWNER-restricted panel as
// `isForbidden` — so the query always resolves with a metrics snapshot.
async function fetchDashboardMetrics(
  serverId: string,
  signal: AbortSignal
): Promise<DashboardMetrics> {
  const metrics: DashboardMetrics = { ...EMPTY_METRICS }

  // Vouchers (allowed for all roles)
  try {
    const vRes = await api.get('/vouchers', { params: { serverId }, signal })
    metrics.vouchers = vRes.data?.length || 0
  } catch (e) {
    if (!is403(e)) metrics.isDisconnected = true
  }

  // Traffic (allowed for all roles)
  try {
    const tRes = await api.get(`/monitoring/traffic/${serverId}`, { signal })
    metrics.interfaces = Array.isArray(tRes.data)
      ? tRes.data.filter((i: { running?: boolean }) => i.running).length
      : 0
  } catch (e) {
    if (!is403(e)) metrics.isDisconnected = true
  }

  // Active users + resources (forbidden for OWNER)
  try {
    const [aRes, rRes] = await Promise.all([
      api.get(`/monitoring/active/${serverId}`, { signal }),
      api.get(`/monitoring/resources/${serverId}`, { signal }),
    ])
    metrics.activeUsers = aRes.data?.length || 0
    metrics.activeUsersList = aRes.data || []
    metrics.uptime = rRes.data?.uptime || '-'
  } catch (e) {
    if (is403(e)) metrics.isForbidden = true
    else metrics.isDisconnected = true
  }

  return metrics
}

export function Dashboard() {
  const { activeServerId, isLoading } = useServerStore()
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
      <Main>
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : isDisconnected ? (
          <DisconnectedRouterPlaceholder
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        ) : (
          <>
            <div className='mb-2 flex items-center justify-between space-y-2'>
              <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
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
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
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
                      <div className='text-2xl font-bold'>{metrics.activeUsers}</div>
                      <p className='text-xs text-muted-foreground'>
                        pelanggan terhubung saat ini
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
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
                  <div className='text-2xl font-bold'>{metrics.vouchers}</div>
                  <p className='text-xs text-muted-foreground'>
                    total voucher dalam sistem
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Uptime Router</CardTitle>
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
                    <rect width='20' height='14' x='2' y='5' rx='2' />
                    <path d='M2 10h20' />
                  </svg>
                </CardHeader>
                <CardContent>
                  {metrics.isForbidden ? (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground font-medium'>
                      <Lock className='h-4 w-4' /> Akses Khusus Teknisi
                    </div>
                  ) : (
                    <>
                      <div className='text-2xl font-bold'>{metrics.uptime}</div>
                      <p className='text-xs text-muted-foreground'>
                        waktu router menyala
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Interface Aktif
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
                    <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{metrics.interfaces}</div>
                  <p className='text-xs text-muted-foreground'>
                    antarmuka jaringan berjalan
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-7'>
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
