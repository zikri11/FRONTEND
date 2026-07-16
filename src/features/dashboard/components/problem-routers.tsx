import { nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Router offline lintas tenant untuk SUPER_ADMIN — dummy sampai backend punya
// status router global.
type ProblemRouter = {
  name: string
  owner: string
  offlineSince: string
}

const DUMMY_PROBLEM_ROUTERS: ProblemRouter[] = [
  { name: 'Router Cabang B', owner: 'Kopi Nusantara', offlineSince: '2 jam lalu' },
  { name: 'Router Utama', owner: 'Resto Padang Jaya', offlineSince: '5 jam lalu' },
  { name: 'Router Teras', owner: 'Kafe Senja', offlineSince: '1 hari lalu' },
]

export function ProblemRouters({ className }: { className?: string }) {
  return (
    <Card className={`${nestedCardClass} h-fit self-start ${className || ''}`}>
      <CardHeader>
        <CardTitle>Router Bermasalah</CardTitle>
        <CardDescription>Router yang sedang offline di seluruh tenant.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {DUMMY_PROBLEM_ROUTERS.length === 0 ? (
          <div className='flex items-center gap-2'>
            <Badge size='sm' className='border-success/20 bg-success/10 text-success'>
              OK
            </Badge>
            <span className='text-sm text-muted-foreground'>
              Semua router online.
            </span>
          </div>
        ) : (
          DUMMY_PROBLEM_ROUTERS.map((router) => (
            <div
              key={`${router.owner}-${router.name}`}
              className='flex items-center justify-between gap-3'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm text-foreground'>{router.name}</p>
                <p className='truncate text-xs text-muted-foreground'>
                  {router.owner}
                </p>
              </div>
              <div className='flex shrink-0 flex-col items-end gap-0.5'>
                <Badge size='sm' variant='secondary' className='text-muted-foreground'>
                  Offline
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  sejak {router.offlineSince}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
