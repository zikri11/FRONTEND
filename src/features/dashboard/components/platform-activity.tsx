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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Aktivitas lintas tenant untuk SUPER_ADMIN — dummy; wiring nanti ke
// GET /activity-log (scope SA memang global).
type PlatformActivityRow = {
  time: string
  action: string
  description: string
  owner: string
}

const DUMMY_ACTIVITY: PlatformActivityRow[] = [
  { time: '14 Jul 2026, 10:52', action: 'POS_VOUCHER_GENERATED', description: 'Voucher dibuat dari transaksi kasir', owner: 'Kopi Nusantara' },
  { time: '14 Jul 2026, 10:31', action: 'VOUCHER_CREATED', description: 'Batch 50 voucher paket 1 Jam', owner: 'Warung Bu Sari' },
  { time: '14 Jul 2026, 09:58', action: 'SERVER_ADDED', description: 'Router baru Outlet Cabang B didaftarkan', owner: 'Kopi Nusantara' },
  { time: '14 Jul 2026, 09:12', action: 'LOGIN_FAILED', description: 'Percobaan login gagal 3 kali', owner: 'Resto Padang Jaya' },
  { time: '13 Jul 2026, 21:14', action: 'PAYMENT_RECEIVED', description: 'Pembayaran paket Standard diterima', owner: 'Warung Bu Sari' },
  { time: '13 Jul 2026, 19:40', action: 'PROFILE_UPDATED', description: 'Profil hotspot 3 Jam diubah', owner: 'Kafe Senja' },
  { time: '13 Jul 2026, 16:22', action: 'VOUCHER_DELETED', description: 'Hapus massal 20 voucher kedaluwarsa', owner: 'Resto Padang Jaya' },
  { time: '13 Jul 2026, 14:05', action: 'USER_CREATED', description: 'Akun teknisi baru dibuat', owner: 'Kafe Senja' },
]

function actionVariant(
  action: string
): 'success-light' | 'destructive-light' | 'info-light' {
  if (
    action.startsWith('CREATE') ||
    action.startsWith('ADD') ||
    action.startsWith('SYNC') ||
    action.endsWith('CREATED') ||
    action.endsWith('ADDED') ||
    action.endsWith('GENERATED') ||
    action.endsWith('RECEIVED')
  ) {
    return 'success-light'
  }
  if (action.includes('FAILED') || action.endsWith('DELETED')) {
    return 'destructive-light'
  }
  return 'info-light'
}

export function PlatformActivity({ className }: { className?: string }) {
  return (
    <Card className={`${nestedCardClass} py-0 ${className || ''}`}>
      <CardHeader className='pt-6'>
        <CardTitle>Aktivitas Platform Terbaru</CardTitle>
        <CardDescription>Aktivitas terbaru dari seluruh tenant.</CardDescription>
      </CardHeader>
      <CardContent className='px-0'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                  Waktu
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Aksi
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Deskripsi
                </TableHead>
                <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                  Owner
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_ACTIVITY.map((row) => (
                <TableRow key={`${row.time}-${row.action}`}>
                  <TableCell className='ps-4 font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                    {row.time}
                  </TableCell>
                  <TableCell>
                    <Badge size='sm' variant={actionVariant(row.action)}>
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-foreground'>
                    {row.description}
                  </TableCell>
                  <TableCell className='pe-4 text-right text-sm text-muted-foreground whitespace-nowrap'>
                    {row.owner}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
