// UI bersama monitoring uptime: bar timeline 30-hari + label availability.
// Dipakai dashboard owner & halaman /monitoring. Data dari
// GET /monitoring/health/summary (lihat @/lib/monitoring).
import { buildDayKeys, type HealthSummaryPoint } from '@/lib/monitoring'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

// "YYYY-MM-DD" → "d Mon yyyy"
function prettyDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}

type DayState = 'up' | 'down' | 'none'

export function OutletTimeline({
  points,
  days,
  isLoading,
}: {
  points?: HealthSummaryPoint[]
  days: number
  isLoading: boolean
}) {
  const byDate = new Map((points ?? []).map((p) => [p.date, p]))
  const cells = buildDayKeys(days).map((key) => {
    const point = byDate.get(key)
    let state: DayState = 'none'
    if (point) state = point.fails > 0 ? 'down' : 'up'
    return { key, state, fails: point?.fails ?? 0 }
  })

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={`flex h-6 w-full max-w-[280px] items-center justify-between gap-[2px] ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        {cells.map((cell) => (
          <Tooltip key={cell.key}>
            <TooltipTrigger asChild>
              <div
                className={`h-full flex-1 cursor-pointer rounded-[2px] transition-colors hover:opacity-80 ${
                  cell.state === 'down'
                    ? 'bg-destructive/80'
                    : cell.state === 'up'
                      ? 'bg-success/80'
                      : 'bg-muted'
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side='top' className='text-xs'>
              <p className='font-medium'>{prettyDay(cell.key)}</p>
              <p className='text-muted-foreground'>
                {cell.state === 'down'
                  ? `${cell.fails.toLocaleString('id-ID')}× terdeteksi offline`
                  : cell.state === 'up'
                    ? 'Tidak ada downtime'
                    : 'Tidak ada data'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
