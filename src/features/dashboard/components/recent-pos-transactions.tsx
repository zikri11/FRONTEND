import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Kolom align dengan field backend PosTransaction (tanpa harga — backend
// tidak punya field nominal). Dummy sampai endpoint list untuk owner ada.
type PosTransaction = {
  transactionId: string
  customerName: string
  outletName: string
  createdAt: string // sudah terformat, dummy
}

const DUMMY_TRANSACTIONS: PosTransaction[] = [
  {
    transactionId: 'TRX-POS-010',
    customerName: 'Budi Santoso',
    outletName: 'Outlet Pusat',
    createdAt: '14 Jul 2026, 10:52',
  },
  {
    transactionId: 'TRX-POS-009',
    customerName: 'Siti Rahma',
    outletName: 'Outlet Cabang A',
    createdAt: '14 Jul 2026, 10:31',
  },
  {
    transactionId: 'TRX-POS-008',
    customerName: 'Andi Wijaya',
    outletName: 'Outlet Pusat',
    createdAt: '14 Jul 2026, 09:58',
  },
  {
    transactionId: 'TRX-POS-007',
    customerName: 'Rina Kartika',
    outletName: 'Outlet Cabang B',
    createdAt: '13 Jul 2026, 21:14',
  },
  {
    transactionId: 'TRX-POS-006',
    customerName: 'Dewi Lestari',
    outletName: 'Outlet Pusat',
    createdAt: '13 Jul 2026, 19:40',
  },
  {
    transactionId: 'TRX-POS-005',
    customerName: 'Agus Pratama',
    outletName: 'Outlet Cabang A',
    createdAt: '13 Jul 2026, 16:22',
  },
  {
    transactionId: 'TRX-POS-004',
    customerName: 'Fitri Handayani',
    outletName: 'Outlet Cabang B',
    createdAt: '13 Jul 2026, 14:05',
  },
  {
    transactionId: 'TRX-POS-003',
    customerName: 'Joko Susilo',
    outletName: 'Outlet Pusat',
    createdAt: '13 Jul 2026, 11:47',
  },
  {
    transactionId: 'TRX-POS-002',
    customerName: 'Maya Sari',
    outletName: 'Outlet Cabang A',
    createdAt: '13 Jul 2026, 10:15',
  },
  {
    transactionId: 'TRX-POS-001',
    customerName: 'Hendra Gunawan',
    outletName: 'Outlet Pusat',
    createdAt: '13 Jul 2026, 08:03',
  },
]

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
          {DUMMY_TRANSACTIONS.map((trx) => (
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
