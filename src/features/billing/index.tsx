import { useState } from 'react'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BillingUpgradeDialog } from '@/components/billing-upgrade-dialog'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

// Dummy — nanti diganti GET /billing/me (plan aktif + kuota router) dan endpoint
// list PaymentTransaction per owner. Kuota teknisi & API key belum ada di backend.
const CURRENT_PLAN = {
  name: 'Standard',
  price: 'Rp 149.000',
  period: '/bulan',
  activeUntil: '14 Agu 2026',
}

const USAGE = [
  { label: 'Router', used: 18, limit: 25, caption: 'dari kuota paket Standard' },
  { label: 'Teknisi', used: 4, limit: 10, caption: 'dari kuota paket Standard' },
  { label: 'API Key', used: 7, limit: 15, caption: 'dari kuota paket Standard' },
]

type InvoiceStatus = 'Lunas' | 'Pending' | 'Gagal'

type Invoice = {
  id: string
  plan: string
  status: InvoiceStatus
  date: string
  amount: string
}

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'success-light' | 'warning-light' | 'destructive-light'
> = {
  Lunas: 'success-light',
  Pending: 'warning-light',
  Gagal: 'destructive-light',
}

const DUMMY_INVOICES: Invoice[] = [
  { id: 'INV-2026-07-010', plan: 'Standard', status: 'Pending', date: '14 Jul 2026, 09:12', amount: 'Rp 149.000' },
  { id: 'INV-2026-06-009', plan: 'Standard', status: 'Lunas', date: '14 Jun 2026, 08:55', amount: 'Rp 149.000' },
  { id: 'INV-2026-05-008', plan: 'Standard', status: 'Lunas', date: '14 Mei 2026, 10:03', amount: 'Rp 149.000' },
  { id: 'INV-2026-04-007', plan: 'Standard', status: 'Lunas', date: '14 Apr 2026, 09:47', amount: 'Rp 149.000' },
  { id: 'INV-2026-04-006', plan: 'Standard', status: 'Gagal', date: '12 Apr 2026, 16:20', amount: 'Rp 149.000' },
  { id: 'INV-2026-03-005', plan: 'Standard', status: 'Lunas', date: '14 Mar 2026, 08:30', amount: 'Rp 149.000' },
  { id: 'INV-2026-02-004', plan: 'Standard', status: 'Lunas', date: '14 Feb 2026, 11:15', amount: 'Rp 149.000' },
  { id: 'INV-2026-02-003', plan: 'Standard', status: 'Lunas', date: '14 Feb 2026, 09:02', amount: 'Rp 149.000' },
]

export function BillingPage() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={`${outerBoxClass} flex-1`}>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Billing</h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Kelola paket langganan dan lihat riwayat tagihan.
            </p>
          </div>

          {/* Paket saat ini */}
          <Card className={nestedCardClass}>
            <CardContent className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
              <div>
                <p className='text-xs text-muted-foreground'>Paket saat ini</p>
                <div className='mt-1 flex items-center gap-2'>
                  <span className='text-2xl font-semibold tracking-tight'>
                    {CURRENT_PLAN.name}
                  </span>
                  <Badge variant='success-light' size='sm'>
                    Aktif
                  </Badge>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Berlaku sampai {CURRENT_PLAN.activeUntil}
                </p>
              </div>
              <div className='flex items-center gap-4'>
                <div>
                  <span className='text-2xl font-semibold tracking-tight tabular-nums'>
                    {CURRENT_PLAN.price}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {CURRENT_PLAN.period}
                  </span>
                </div>
                <Button onClick={() => setUpgradeOpen(true)}>Upgrade</Button>
              </div>
            </CardContent>
          </Card>

          {/* Pemakaian periode ini */}
          <div className='grid gap-4 sm:grid-cols-3'>
            {USAGE.map((item) => (
              <Card key={item.label} className={nestedCardClass}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                    {item.used}{' '}
                    <span className='text-base font-normal text-muted-foreground'>
                      / {item.limit}
                    </span>
                  </div>
                  <Progress
                    value={Math.round((item.used / item.limit) * 100)}
                    className='mt-3 h-2'
                  />
                  <p className='mt-2 text-xs text-muted-foreground'>
                    {item.caption}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Riwayat invoice */}
          <Card className={`${nestedCardClass} py-0`}>
            <CardHeader className='pt-6'>
              <CardTitle>Riwayat Invoice</CardTitle>
              <CardDescription>
                Semua tagihan dan status pembayarannya.
              </CardDescription>
            </CardHeader>
            <CardContent className='px-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                        ID Invoice
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Plan
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Status
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Tanggal
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Nominal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DUMMY_INVOICES.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={5}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Belum ada invoice.
                        </TableCell>
                      </TableRow>
                    ) : (
                      DUMMY_INVOICES.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className='ps-4 font-mono text-xs text-muted-foreground whitespace-nowrap'>
                            {invoice.id}
                          </TableCell>
                          <TableCell className='text-sm text-foreground whitespace-nowrap'>
                            {invoice.plan}
                          </TableCell>
                          <TableCell>
                            <Badge size='sm' variant={STATUS_VARIANT[invoice.status]}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                            {invoice.date}
                          </TableCell>
                          <TableCell className='pe-4 text-right font-mono text-xs tabular-nums whitespace-nowrap'>
                            {invoice.amount}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>

      <BillingUpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}
