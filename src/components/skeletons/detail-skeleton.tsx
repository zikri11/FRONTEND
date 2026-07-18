import { nestedCardClass } from '@/lib/nested-box'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Skeleton untuk halaman detail (mis. detail router): kartu info + baris kartu
 * statistik. Meniru struktur atas halaman agar transisi mulus tanpa layout
 * shift saat data masuk.
 */
export function DetailSkeleton() {
  return (
    <div className='space-y-4'>
      {/* Kartu info */}
      <Card className={nestedCardClass}>
        <CardContent className='space-y-4 py-5'>
          <Skeleton className='h-5 w-40' />
          <div className='grid gap-3 sm:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center justify-between gap-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-32' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Baris kartu statistik */}
      <div className='grid gap-4 sm:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className={nestedCardClass}>
            <CardContent className='space-y-2 py-5'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-7 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
