import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { formatDateTimeId } from '@/lib/format-datetime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type RecentRow = {
  id: string
  transactionId: string
  customerName: string | null
  outletName: string | null
  createdAt: string
  server: { id: string; name: string } | null
}

type RecentResponse = {
  data: RecentRow[]
  meta: { total: number; skip: number; take: number }
}

// 10 transaksi POS terbaru (ter-scope per Owner oleh backend). Daftar lengkap
// + filter ada di halaman /pos-transactions.
export function RecentPosTransactions() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pos-transactions', 'recent'],
    queryFn: async () => {
      const res = await api.get('/pos/transactions', {
        params: { skip: 0, take: 10 },
      })
      return res.data as RecentResponse
    },
  })

  const rows = data?.data ?? []

  return (
    <div className='mx-auto flex w-full flex-col overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
              ID Transaksi
            </TableHead>
            <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
              Pelanggan
            </TableHead>
            <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
              Outlet
            </TableHead>
            <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
              Waktu
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={4}
                className='h-24 text-center text-sm text-muted-foreground'
              >
                Memuat transaksi…
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={4}
                className='h-24 text-center text-sm text-destructive'
              >
                Gagal memuat transaksi.
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={4}
                className='h-24 text-center text-sm text-muted-foreground'
              >
                Belum ada transaksi POS.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((trx) => (
              <TableRow key={trx.id}>
                <TableCell className='font-mono text-xs text-muted-foreground whitespace-nowrap'>
                  {trx.transactionId}
                </TableCell>
                <TableCell className='text-sm text-foreground whitespace-nowrap'>
                  {trx.customerName ?? '—'}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                  {trx.outletName ?? trx.server?.name ?? '—'}
                </TableCell>
                <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                  {formatDateTimeId(trx.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
