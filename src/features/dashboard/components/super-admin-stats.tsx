import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { nestedCardClass } from '@/lib/nested-box'
import { useServerStore } from '@/stores/server-store'
import { Badge } from '@/components/reui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Statistik platform SUPER_ADMIN — semua kartu pakai data nyata global:
// User (owner) & Teknisi dari GET /users?role=, Router dari GET /servers,
// Transaksi POS dari GET /pos/transactions. Delta "baru bulan ini" dihitung
// dari createdAt tiap entitas; POS tanpa delta (endpoint tak punya filter
// tanggal).
type PlatformStat = {
  title: string
  value: string
  delta?: string // ada → tampil badge tren; tak ada → pakai `subtitle`
  deltaCaption?: string
  subtitle?: string
  iconPaths: string[]
  href?: '/users'
}

type UserLite = { id: string; createdAt: string }

export function SuperAdminStats() {
  const { servers } = useServerStore()
  const nowDate = new Date()
  const createdThisMonth = (iso: string) => {
    const d = new Date(iso)
    return (
      d.getFullYear() === nowDate.getFullYear() &&
      d.getMonth() === nowDate.getMonth()
    )
  }

  const { data: owners = [] } = useQuery({
    queryKey: ['sa-users', 'OWNER'],
    queryFn: ({ signal }) =>
      api
        .get('/users', { params: { role: 'OWNER' }, signal })
        .then((r) => (r.data ?? []) as UserLite[]),
    staleTime: 60_000,
  })

  const { data: teknisi = [] } = useQuery({
    queryKey: ['sa-users', 'TEKNISI'],
    queryFn: ({ signal }) =>
      api
        .get('/users', { params: { role: 'TEKNISI' }, signal })
        .then((r) => (r.data ?? []) as UserLite[]),
    staleTime: 60_000,
  })

  const { data: posTotal = 0 } = useQuery({
    queryKey: ['sa-pos-total'],
    queryFn: ({ signal }) =>
      api
        .get('/pos/transactions', { params: { take: 1 }, signal })
        .then((r) => r.data?.meta?.total ?? 0),
  })

  const ownerNew = owners.filter((u) => createdThisMonth(u.createdAt)).length
  const teknisiNew = teknisi.filter((u) => createdThisMonth(u.createdAt)).length
  const routerNew = servers.filter((s) => createdThisMonth(s.createdAt)).length

  const stats: PlatformStat[] = [
    {
      title: 'Total User',
      value: owners.length.toLocaleString('id-ID'),
      delta: ownerNew > 0 ? `+${ownerNew}` : undefined,
      deltaCaption: 'owner baru bulan ini',
      subtitle: 'total owner terdaftar',
      href: '/users',
      iconPaths: [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M22 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
      ],
    },
    {
      title: 'Total Teknisi',
      value: teknisi.length.toLocaleString('id-ID'),
      delta: teknisiNew > 0 ? `+${teknisiNew}` : undefined,
      deltaCaption: 'teknisi baru bulan ini',
      subtitle: 'total teknisi terdaftar',
      iconPaths: [
        'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
      ],
    },
    {
      title: 'Total Router',
      value: servers.length.toLocaleString('id-ID'),
      delta: routerNew > 0 ? `+${routerNew}` : undefined,
      deltaCaption: 'router baru bulan ini',
      subtitle: 'total router terdaftar',
      iconPaths: [
        'M6.01 18H6',
        'M10.01 18H10',
        'M15 10v4',
        'M17.84 7.17a4 4 0 0 0-5.66 0',
        'M20.66 4.34a8 8 0 0 0-11.31 0',
      ],
    },
    {
      title: 'Total Transaksi POS',
      value: posTotal.toLocaleString('id-ID'),
      subtitle: 'total transaksi POS',
      iconPaths: [
        'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
        'M14 8H8',
        'M16 12H8',
        'M13 16H8',
      ],
    },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map((stat) => {
        const card = (
          <Card
            className={`${nestedCardClass} h-full ${
              stat.href ? 'transition-colors hover:bg-muted/30' : ''
            }`}
          >
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
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
                {stat.title === 'Total Router' && (
                  <rect width='20' height='8' x='2' y='14' rx='2' />
                )}
                {stat.iconPaths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                {stat.value}
              </div>
              {stat.delta ? (
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
                    {stat.delta}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {stat.deltaCaption}
                  </span>
                </div>
              ) : (
                <p className='mt-1 text-xs text-muted-foreground'>
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        )
        return stat.href ? (
          <Link
            key={stat.title}
            to={stat.href}
            className='block h-full transition-transform active:scale-[0.98]'
          >
            {card}
          </Link>
        ) : (
          <div key={stat.title} className='h-full'>
            {card}
          </div>
        )
      })}
    </div>
  )
}
