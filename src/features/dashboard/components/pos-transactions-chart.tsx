import { type CSSProperties } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
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

// Transaksi POS harian seluruh tenant (SUPER_ADMIN) — dummy deterministik
// sampai backend punya endpoint agregat platform. Pola visual: ReUI c-chart-13
// (gradient area chart).
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

const DAYS = 30
// Hari terakhir rentang (statis, konsisten dummy lain)
const NEWEST = new Date(2026, 6, 14)

function generateDaily(): { date: string; transaksi: number }[] {
  const rows: { date: string; transaksi: number }[] = []
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(NEWEST)
    d.setDate(d.getDate() - (DAYS - 1 - i))
    rows.push({
      date: `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`,
      // Variasi deterministik tanpa Math.random: ~26-50 transaksi/hari
      transaksi: 26 + ((i * 7) % 19) + (i % 5 === 0 ? 6 : 0),
    })
  }
  return rows
}

const chartData = generateDaily()

const chartConfig = {
  transaksi: {
    label: 'Transaksi',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function PosTransactionsChart() {
  return (
    <Card className={nestedCardClass}>
      <CardHeader>
        <CardTitle>
          Transaksi POS — 30 Hari Terakhir
          <Badge variant='success-light' size='sm' className='ml-2'>
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
            +140
          </Badge>
        </CardTitle>
        <CardDescription>
          Jumlah transaksi harian dari seluruh tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                      <span className='text-xs font-medium'>{value} 2026</span>
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
                        {Number(value).toLocaleString()}
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
      </CardContent>
    </Card>
  )
}
