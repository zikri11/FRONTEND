import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Bot, KeyRound, ReceiptText, Router, Users } from 'lucide-react'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { IconStack } from '@/components/reui/icon-stack'
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
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

// GET /billing/me: paket + kuota (router & teknisi) + harga (via subscription)
// = REAL. AI & API Key = flag boolean (backend tak kirim kuota → badge fitur).
// Riwayat invoice = REAL via GET /billing/invoices.
type BillingStatus = {
  plan: {
    code: string
    name: string
    maxRouters: number
    maxTeknisi: number
    aiAccess: boolean
    apiKeyAccess: boolean
  }
  maxRouters: number
  used: number
  remaining: number
  expiredAt: string | null
  expired: boolean
  usage: {
    routers: { used: number; max: number }
    teknisi: { used: number; max: number }
    aiAccess: boolean
    apiKeyAccess: boolean
  }
  subscription: {
    plan: {
      code: string
      name: string
      price: number
      durationDays: number | null
    }
    status: string
    startedAt: string | null
    expiredAt: string | null
  } | null
}

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'

type Invoice = {
  id: string
  merchantOrderId: string
  plan: { code: string; name: string } | null
  amount: number
  status: PaymentStatus
  paymentMethod: string | null
  paidAt: string | null
  createdAt: string
  paymentUrl: string | null
}

type InvoicesResponse = {
  data: Invoice[]
  meta: { total: number; skip: number; take: number }
}

const INVOICE_STATUS: Record<
  PaymentStatus,
  {
    label: string
    variant:
      | 'success-light'
      | 'warning-light'
      | 'destructive-light'
      | 'secondary'
  }
> = {
  PAID: { label: 'Lunas', variant: 'success-light' },
  PENDING: { label: 'Pending', variant: 'warning-light' },
  FAILED: { label: 'Gagal', variant: 'destructive-light' },
  EXPIRED: { label: 'Kadaluarsa', variant: 'secondary' },
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// >85% = warning (hampir penuh), 100% = destructive (kuota habis)
function progressStateClass(pct: number): string {
  if (pct >= 100)
    return 'bg-destructive/20 [&>[data-slot=progress-indicator]]:bg-destructive'
  if (pct > 85)
    return 'bg-warning/20 [&>[data-slot=progress-indicator]]:bg-warning'
  return ''
}

function FeatureBadge({ on }: { on: boolean }) {
  return on ? (
    <Badge size='sm' variant='success-light'>
      Aktif
    </Badge>
  ) : (
    <Badge size='sm' variant='secondary' className='text-muted-foreground'>
      Nonaktif
    </Badge>
  )
}

export function BillingPage() {
  const { data: billing } = useQuery({
    queryKey: ['billing-me'],
    queryFn: ({ signal }) =>
      api.get('/billing/me', { signal }).then((r) => r.data as BillingStatus),
  })

  const {
    data: invoicesResp,
    isPending: invoicesPending,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useQuery<InvoicesResponse>({
    queryKey: qk.billingInvoices({ take: 20 }),
    queryFn: ({ signal }) =>
      api
        .get('/billing/invoices', { params: { take: 20 }, signal })
        .then((r) => r.data),
  })
  const invoices = invoicesResp?.data ?? []

  const sub = billing?.subscription ?? null
  const planName = billing?.plan.name ?? '—'
  const isExpired = billing?.expired ?? false
  const activeUntil = billing?.expiredAt ? formatDate(billing.expiredAt) : null

  const price = sub ? formatRupiah(sub.plan.price) : 'Rp 0'
  const period = sub?.plan.durationDays ? `/ ${sub.plan.durationDays} hari` : ''

  const usageMeters = [
    {
      label: 'Router',
      used: billing?.usage.routers.used ?? 0,
      limit: billing?.usage.routers.max ?? 0,
      unit: 'router',
      icon: Router,
    },
    {
      label: 'Teknisi',
      used: billing?.usage.teknisi.used ?? 0,
      limit: billing?.usage.teknisi.max ?? 0,
      unit: 'teknisi',
      icon: Users,
    },
  ]

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={`${outerBoxClass} flex-1`}>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Langganan</h2>
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
                    {planName}
                  </span>
                  {isExpired ? (
                    <Badge variant='destructive-light' size='sm'>
                      Kadaluarsa
                    </Badge>
                  ) : (
                    <Badge variant='success-light' size='sm'>
                      Aktif
                    </Badge>
                  )}
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {activeUntil
                    ? `Berlaku sampai ${activeUntil}`
                    : 'Tanpa batas waktu'}
                </p>
              </div>
              <div className='flex items-center gap-4'>
                <div>
                  <span className='text-2xl font-semibold tracking-tight tabular-nums'>
                    {price}
                  </span>
                  {period && (
                    <span className='text-sm text-muted-foreground'> {period}</span>
                  )}
                </div>
                <Button asChild>
                  <Link to='/billing/upgrade'>Upgrade</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pemakaian periode ini */}
          <Card className={nestedCardClass}>
            <CardHeader>
              <CardTitle>Pemakaian Periode Ini</CardTitle>
              <CardDescription>
                Kuota terpakai dari paket {planName}.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-6'>
              <div className='grid gap-6 sm:grid-cols-2'>
                {usageMeters.map((item) => {
                  const pct =
                    item.limit > 0
                      ? Math.round((item.used / item.limit) * 100)
                      : 0
                  return (
                    <div key={item.label}>
                      <div className='flex items-center justify-between'>
                        <span className='flex items-center gap-2 text-sm font-medium'>
                          <item.icon className='h-4 w-4 text-muted-foreground' />
                          {item.label}
                        </span>
                        <span className='text-sm font-medium tabular-nums'>
                          {pct}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, pct)}
                        className={`mt-2 h-2 ${progressStateClass(pct)}`}
                      />
                      <p className='mt-2 text-xs text-muted-foreground tabular-nums'>
                        {item.used} dari {item.limit} {item.unit}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Fitur paket (boolean — backend tak kirim kuota API key/AI) */}
              <div className='flex flex-wrap gap-6 border-t pt-4'>
                <div className='flex items-center gap-2 text-sm'>
                  <Bot className='h-4 w-4 text-muted-foreground' />
                  <span className='font-medium'>Akses AI</span>
                  <FeatureBadge on={!!billing?.usage.aiAccess} />
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <KeyRound className='h-4 w-4 text-muted-foreground' />
                  <span className='font-medium'>Akses API Key</span>
                  <FeatureBadge on={!!billing?.usage.apiKeyAccess} />
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Nominal
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesPending ? (
                      <TableSkeleton rows={4} cols={6} />
                    ) : invoicesError ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <p className='text-sm text-muted-foreground'>
                            Gagal memuat riwayat invoice.
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => refetchInvoices()}
                          >
                            Coba Lagi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : invoices.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={6}
                          className='py-12 text-center text-sm text-muted-foreground'
                        >
                          <div className='flex flex-col items-center gap-3'>
                            <IconStack aria-hidden='true'>
                              <ReceiptText className='size-5' />
                            </IconStack>
                            <span>Belum ada invoice.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => {
                        const st = INVOICE_STATUS[invoice.status]
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className='ps-4 font-mono text-xs text-muted-foreground whitespace-nowrap'>
                              {invoice.merchantOrderId}
                            </TableCell>
                            <TableCell className='text-sm text-foreground whitespace-nowrap'>
                              {invoice.plan?.name ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Badge size='sm' variant={st.variant}>
                                {st.label}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                              {formatDate(invoice.createdAt)}
                            </TableCell>
                            <TableCell className='text-right font-mono text-xs tabular-nums whitespace-nowrap'>
                              {formatRupiah(invoice.amount)}
                            </TableCell>
                            <TableCell className='pe-4 text-right'>
                              {invoice.status === 'PENDING' &&
                              invoice.paymentUrl ? (
                                <Button variant='outline' size='sm' asChild>
                                  <a
                                    href={invoice.paymentUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    Bayar
                                  </a>
                                </Button>
                              ) : (
                                <span className='text-xs text-muted-foreground'>
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
