import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

/**
 * Baris-baris skeleton untuk mengisi <TableBody> saat data tabel sedang dimuat.
 * Drop-in di cabang loading: `{isLoading ? <TableSkeleton rows cols /> : ...}`.
 * Lebar kolom mengikuti header tabel yang sudah ada (tak ada layout shift).
 */
export function TableSkeleton({
  rows = 8,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className='hover:bg-transparent'>
          {Array.from({ length: cols }).map((_, c) => {
            const isFirst = c === 0
            const isLast = c === cols - 1
            return (
              <TableCell
                key={c}
                className={isFirst ? 'ps-4' : isLast ? 'pe-4' : undefined}
              >
                <Skeleton
                  className={`h-4 ${isLast ? 'ms-auto w-10' : isFirst ? 'w-28' : 'w-20'}`}
                />
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}
