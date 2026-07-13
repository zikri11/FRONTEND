import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Badge } from '@/components/reui/badge'

type PosTransaction = {
  transactionId: string
  outletName: string
  customerName: string
  status: 'SUKSES' | 'GAGAL'
  relativeTime: string
}

const DUMMY_TRANSACTIONS: PosTransaction[] = [
  {
    transactionId: 'TRX-1042',
    outletName: 'Outlet A',
    customerName: 'Budi Santoso',
    status: 'SUKSES',
    relativeTime: '5 menit lalu',
  },
  {
    transactionId: 'TRX-1041',
    outletName: 'Outlet B',
    customerName: 'Siti Aminah',
    status: 'SUKSES',
    relativeTime: '18 menit lalu',
  },
  {
    transactionId: 'TRX-1040',
    outletName: 'Outlet A',
    customerName: 'Andi Wijaya',
    status: 'GAGAL',
    relativeTime: '32 menit lalu',
  },
  {
    transactionId: 'TRX-1039',
    outletName: 'Outlet C',
    customerName: 'Dewi Lestari',
    status: 'SUKSES',
    relativeTime: '1 jam lalu',
  },
  {
    transactionId: 'TRX-1038',
    outletName: 'Outlet B',
    customerName: 'Rudi Hartono',
    status: 'SUKSES',
    relativeTime: '2 jam lalu',
  },
  {
    transactionId: 'TRX-1037',
    outletName: 'Outlet A',
    customerName: 'Maya Puspita',
    status: 'GAGAL',
    relativeTime: '3 jam lalu',
  },
]

export function RecentPosTransactions() {
  return (
    <div className='space-y-2'>
      {DUMMY_TRANSACTIONS.map((trx) => (
        <Item key={trx.transactionId}>
          <ItemMedia>
            <Avatar className='h-9 w-9'>
              <AvatarFallback>
                {trx.outletName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle className='text-sm font-medium'>
              {trx.customerName}
            </ItemTitle>
            <ItemDescription className='text-xs text-muted-foreground'>
              {trx.outletName} ·{' '}
              <span className='font-mono'>{trx.transactionId}</span>
            </ItemDescription>
          </ItemContent>
          <ItemActions className='flex flex-col items-end gap-1'>
            <Badge
              variant={trx.status === 'SUKSES' ? 'success-light' : 'destructive-light'}
            >
              {trx.status === 'SUKSES' ? 'Sukses' : 'Gagal'}
            </Badge>
            <span className='text-xs text-muted-foreground'>
              {trx.relativeTime}
            </span>
          </ItemActions>
        </Item>
      ))}
    </div>
  )
}
