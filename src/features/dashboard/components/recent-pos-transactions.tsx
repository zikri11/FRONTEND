import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DUMMY_POS_TRANSACTIONS } from '@/features/pos-transactions/data/dummy-transactions'

// 10 transaksi terbaru dari sumber dummy bersama (lihat halaman
// /pos-transactions untuk daftar lengkap + filter).
const RECENT_TRANSACTIONS = DUMMY_POS_TRANSACTIONS.slice(0, 10)

export function RecentPosTransactions() {
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
          {RECENT_TRANSACTIONS.map((trx) => (
            <TableRow key={trx.transactionId}>
              <TableCell className='font-mono text-xs text-muted-foreground whitespace-nowrap'>
                {trx.transactionId}
              </TableCell>
              <TableCell className='text-sm text-foreground whitespace-nowrap'>
                {trx.customerName}
              </TableCell>
              <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                {trx.outletName}
              </TableCell>
              <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                {trx.createdAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
