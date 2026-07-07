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

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/axios'
import { Lock, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function Dashboard() {
  const { activeServerId, isLoading } = useServerStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnected, setIsDisconnected] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    activeUsersList: [] as any[],
    vouchers: 0,
    uptime: '-',
    interfaces: 0,
    isForbidden: false
  })

  const fetchMetrics = useCallback(async (isManualRetry = false) => {
    if (!activeServerId) return
    if (isManualRetry) setIsRetrying(true)

    let isOffline = false

    // Fetch vouchers (allowed for all)
    try {
      const vRes = await api.get('/vouchers', { params: { serverId: activeServerId } })
      setMetrics(prev => ({ ...prev, vouchers: vRes.data?.length || 0 }))
    } catch (e: any) {
      console.error(e)
      if (!e.response || e.response.status !== 403) isOffline = true
    }

    // Fetch traffic (allowed for all)
    try {
      const tRes = await api.get(`/monitoring/traffic/${activeServerId}`)
      const activeIfaces = Array.isArray(tRes.data) ? tRes.data.filter((i: any) => i.running).length : 0
      setMetrics(prev => ({ ...prev, interfaces: activeIfaces }))
    } catch (e: any) {
      console.error(e)
      if (!e.response || e.response.status !== 403) isOffline = true
    }

    // Fetch active & resources (forbidden for OWNER)
    try {
      const [aRes, rRes] = await Promise.all([
        api.get(`/monitoring/active/${activeServerId}`),
        api.get(`/monitoring/resources/${activeServerId}`)
      ])
      setMetrics(prev => ({
        ...prev,
        activeUsers: aRes.data?.length || 0,
        activeUsersList: aRes.data || [],
        uptime: rRes.data?.uptime || '-',
        isForbidden: false
      }))
    } catch (e: any) {
      if (e.response?.status === 403) {
        setMetrics(prev => ({ ...prev, isForbidden: true }))
      } else {
        isOffline = true
      }
    }

    setIsDisconnected(isOffline)
    if (isManualRetry) {
      setIsRetrying(false)
      if (!isOffline) toast.success('Berhasil terhubung kembali!')
    }
  }, [activeServerId])

  useEffect(() => {
    fetchMetrics()
    // Polling setiap 3 detik
    const interval = setInterval(() => {
      fetchMetrics()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const handleSync = async () => {
    if (!activeServerId) return
    setIsSyncing(true)
    toast.info('Memulai proses sinkronisasi...')
    try {
      await api.post(`/profiles/sync/${activeServerId}`)
      toast.success('Berhasil menarik data profil dan voucher terbaru dari router!')
      fetchMetrics() // Segarkan angka dashboard
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mensinkronkan data.')
    } finally {
      setIsSyncing(false)
    }
  }

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
            onRetry={() => fetchMetrics(true)} 
            isRetrying={isRetrying} 
          />
        ) : (
          <>
            <div className='mb-2 flex items-center justify-between space-y-2'>
              <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
            <Button onClick={handleSync} disabled={isSyncing}>
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
