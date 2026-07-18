import { nestedCardClass } from '@/lib/nested-box'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton untuk baris kartu statistik (mis. dashboard Super Admin). Grid-nya
 * sama persis dengan SuperAdminStats agar tak ada layout shift saat data masuk.
 */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className={`${nestedCardClass} h-full`}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-4 rounded-sm' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='mt-2 h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
