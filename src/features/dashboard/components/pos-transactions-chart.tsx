import { type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// Transaksi POS harian seluruh tenant (SUPER_ADMIN, scope global) via
// GET /pos/transactions/stats — semua status, hari kosong sudah diisi 0 backend.
const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

type PosStatPoint = { date: string; count: number }

// "YYYY-MM-DD" → "d Mon"
function formatDay(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]}`
}

const chartConfig = {
  transaksi: {
    label: 'Transaksi',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function PosTransactionsChart() {
  // Ambil 60 hari: 30 untuk grafik + 30 sebelumnya sebagai baseline tren.
  // `from` dihitung di queryFn (bukan render) agar bebas efek samping tanggal.
  const { data, isPending, isError } = useQuery({
    queryKey: qk.posStats('sa-daily-60d'),
    queryFn: ({ signal }) => {
      const from = new Date(Date.now() - 59 * 86_400_000)
        .toISOString()
        .slice(0, 10)
      return api
        .get('/pos/transactions/stats', {
          params: { groupBy: 'day', from },
          signal,
        })
        .then((r) => (r.data as { data: PosStatPoint[] }).data)
    },
  })

  const series = data ?? []
  const recent = series.slice(-30)
  const prev = series.slice(0, Math.max(0, series.length - 30))
  const recentSum = recent.reduce((a, p) => a + p.count, 0)
  const prevSum = prev.reduce((a, p) => a + p.count, 0)
  // Tren % vs 30 hari sebelumnya; null bila belum ada data pembanding.
  const deltaPct =
    prevSum > 0 ? Math.round(((recentSum - prevSum) / prevSum) * 100) : null

  const chartData = recent.map((p) => ({
    date: formatDay(p.date),
    transaksi: p.count,
  }))

  return (
    <Card className={nestedCardClass}>
      <CardHeader>
        <CardTitle>
          Transaksi POS — 30 Hari Terakhir
          {deltaPct !== null && (
            <Badge
              variant={deltaPct >= 0 ? 'success-light' : 'destructive-light'}
              size='sm'
              className='ml-2'
            >
              {deltaPct >= 0 ? (
                <TrendingUp className='size-3' />
              ) : (
                <TrendingDown className='size-3' />
              )}
              {deltaPct >= 0 ? '+' : ''}
              {deltaPct}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Jumlah transaksi harian dari seluruh tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-[300px] w-full' />
        ) : isError ? (
          <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>
            Gagal memuat data grafik.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[300px] w-full'
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id='pos-chart-gradient'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'
                >
                  <stop
                    offset='5%'
                    stopColor='var(--color-transaksi)'
                    stopOpacity={0.5}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-transaksi)'
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='dot'
                    className='min-w-40 gap-2.5'
                    labelFormatter={(value) => (
                      <div className='border-border/50 mb-0.5 border-b pb-2'>
                        <span className='text-xs font-medium'>{value}</span>
                      </div>
                    )}
                    formatter={(value, name) => (
                      <div className='flex w-full items-center justify-between gap-2'>
                        <div className='flex items-center gap-1.5'>
                          <div
                            className='h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)'
                            style={
                              {
                                '--color-bg': `var(--color-${name})`,
                              } as CSSProperties
                            }
                          />
                          <span className='text-muted-foreground'>
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                          </span>
                        </div>
                        <span className='text-foreground font-semibold tabular-nums'>
                          {Number(value).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey='transaksi'
                type='natural'
                fill='url(#pos-chart-gradient)'
                stroke='var(--color-transaksi)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
