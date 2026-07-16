import { nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Statistik platform untuk SUPER_ADMIN — dummy sampai backend punya endpoint
// agregat lintas tenant (count user/teknisi/router/transaksi + delta periode).
type PlatformStat = {
  title: string
  value: string
  delta: string
  deltaCaption: string
  iconPaths: string[]
}

const STATS: PlatformStat[] = [
  {
    title: 'Total User',
    value: '128',
    delta: '+12',
    deltaCaption: 'user baru bulan ini',
    iconPaths: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M22 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
  },
  {
    title: 'Total Teknisi',
    value: '47',
    delta: '+5',
    deltaCaption: 'teknisi baru bulan ini',
    iconPaths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
  },
  {
    title: 'Total Router',
    value: '86',
    delta: '+3',
    deltaCaption: 'router terhubung minggu ini',
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
    value: '1.204',
    delta: '+140',
    deltaCaption: 'lebih banyak dari minggu kemarin',
    iconPaths: [
      'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
      'M14 8H8',
      'M16 12H8',
      'M13 16H8',
    ],
  },
]

export function SuperAdminStats() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {STATS.map((stat) => (
        <Card key={stat.title} className={nestedCardClass}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
