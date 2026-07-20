import { Link } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ArrowLeft, Bot, KeyRound, Loader2, Router, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

// GET /billing/plans → paket aktif. Paket yang sedang dipakai owner diambil
// dari GET /billing/me (key sama dgn halaman /billing → cache nyambung).
type Plan = {
  id: string
  code: string
  name: string
  price: number
  durationDays: number | null
  maxRouters: number
  maxTeknisi: number
  aiAccess: boolean
  apiKeyAccess: boolean
}

type CurrentStatus = { plan: { code: string; name: string } }

function formatRupiah(n: number): string {
  if (n === 0) return 'Gratis'
  return `Rp ${n.toLocaleString('id-ID')}`
}

function errorMessage(error: unknown, fallback: string): string {
  const m =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}

export function BillingUpgrade() {
  const {
    data: plans = [],
    isPending,
    isError,
    refetch,
  } = useQuery<Plan[]>({
    queryKey: qk.billingPlans,
    queryFn: ({ signal }) =>
      api.get('/billing/plans', { signal }).then((r) => r.data),
  })

  const { data: current } = useQuery<CurrentStatus>({
    queryKey: ['billing-me'],
    queryFn: ({ signal }) =>
      api.get('/billing/me', { signal }).then((r) => r.data),
  })
  const currentCode = current?.plan.code

  const checkout = useMutation({
    mutationFn: (planCode: string) =>
      api
        .post('/billing/checkout', { planCode })
        .then((r) => r.data as { paymentUrl?: string }),
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error('Gagal mendapatkan URL pembayaran.')
      }
    },
    onError: (error) =>
      toast.error(errorMessage(error, 'Gagal memproses pembayaran.')),
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-3 sm:gap-4'>
        <div>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 -ms-2 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/billing' aria-label='Kembali ke Langganan'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
        </div>

        <div className={`${outerBoxClass} flex-1`}>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              Pilih Paket Anda
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Pilih paket yang paling sesuai dengan kebutuhan jaringan Anda.
            </p>
          </div>

          {isPending ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className={nestedCardClass}>
                  <CardContent className='space-y-4 py-6'>
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-8 w-32' />
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-4/5' />
                      <Skeleton className='h-4 w-3/5' />
                    </div>
                    <Skeleton className='h-9 w-full' />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <p className='text-sm text-muted-foreground'>
                Gagal memuat daftar paket.
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Coba Lagi
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <div className='py-16 text-center text-sm text-muted-foreground'>
              Belum ada paket tersedia.
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {plans.map((plan) => {
                const isCurrent = plan.code === currentCode
                const isFree = plan.code === 'FREE'
                const isProcessing =
                  checkout.isPending && checkout.variables === plan.code
                const features = [
                  {
                    icon: Router,
                    label: `${plan.maxRouters} router`,
                    on: true,
                  },
                  {
                    icon: Users,
                    label: `${plan.maxTeknisi} teknisi`,
                    on: true,
                  },
                  {
                    icon: Bot,
                    label: plan.aiAccess ? 'Akses AI' : 'Tanpa akses AI',
                    on: plan.aiAccess,
                  },
                  {
                    icon: KeyRound,
                    label: plan.apiKeyAccess
                      ? 'API key POS'
                      : 'Tanpa API key POS',
                    on: plan.apiKeyAccess,
                  },
                ]

                return (
                  <Card
                    key={plan.id}
                    className={`${nestedCardClass} ${
                      isCurrent ? 'ring-1 ring-primary' : ''
                    }`}
                  >
                    <CardContent className='flex h-full flex-col py-6'>
                      <div className='flex items-start justify-between gap-2'>
                        <h3 className='text-base font-medium'>{plan.name}</h3>
                        {isCurrent && (
                          <Badge size='sm' variant='success-light'>
                            Paket Anda
                          </Badge>
                        )}
                      </div>

                      <div className='mt-3 flex items-baseline gap-1.5'>
                        <span className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {formatRupiah(plan.price)}
                        </span>
                        {plan.price > 0 && plan.durationDays ? (
                          <span className='text-sm text-muted-foreground'>
                            / {plan.durationDays} hari
                          </span>
                        ) : null}
                      </div>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {plan.durationDays
                          ? `Masa aktif ${plan.durationDays} hari`
                          : 'Tanpa batas waktu'}
                      </p>

                      <ul className='mt-5 flex grow flex-col gap-2.5'>
                        {features.map((feature) => (
                          <li
                            key={feature.label}
                            className={`flex items-center gap-2 text-sm ${
                              feature.on
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <feature.icon className='h-4 w-4 shrink-0 text-muted-foreground' />
                            <span className='tabular-nums'>
                              {feature.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className='mt-6 w-full'
                        variant={isCurrent || isFree ? 'outline' : 'default'}
                        disabled={isCurrent || isFree || checkout.isPending}
                        onClick={() => checkout.mutate(plan.code)}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Memproses...
                          </>
                        ) : isCurrent ? (
                          'Paket Saat Ini'
                        ) : isFree ? (
                          'Paket Gratis'
                        ) : (
                          `Pilih ${plan.name}`
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
