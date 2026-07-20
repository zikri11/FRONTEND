import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SearchIcon } from 'lucide-react'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  fetchOwners,
  type OwnerPlan,
  type OwnersResponse,
} from './data/owners-store'

const PAGE_SIZES = [10, 25, 50, 100]
const COLS = 6

// Paket dinamis (kode dari backend). FREE = netral, selain itu = info.
function PlanBadge({ plan }: { plan: OwnerPlan | null }) {
  if (!plan) {
    return (
      <Badge size='sm' variant='secondary' className='text-muted-foreground'>
        —
      </Badge>
    )
  }
  if (plan.code === 'FREE') {
    return (
      <Badge size='sm' variant='secondary' className='text-muted-foreground'>
        {plan.name}
      </Badge>
    )
  }
  return (
    <Badge size='sm' variant='info-light'>
      {plan.name}
    </Badge>
  )
}

export function KelolaOwner() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Debounce pencarian → param server; reset ke halaman 1 saat query berubah.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const skip = (page - 1) * pageSize
  const params = {
    skip,
    take: pageSize,
    search: debouncedSearch.trim() || undefined,
    planCode: planFilter === 'all' ? undefined : planFilter,
  }

  const { data, isPending, isError, refetch } = useQuery<OwnersResponse>({
    queryKey: qk.owners(params),
    queryFn: ({ signal }) => fetchOwners(params, signal),
    placeholderData: keepPreviousData,
  })

  const rows = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeStart = total === 0 ? 0 : skip + 1
  const rangeEnd = skip + rows.length

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
            <h2 className='text-2xl font-semibold tracking-tight'>
              Kelola Owner
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Semua owner (tenant) di platform beserta pemakaiannya.
            </p>
          </div>

          {/* Toolbar */}
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='relative w-full sm:max-w-sm'>
              <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Cari nama atau email...'
                className='w-full pl-8'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex w-full gap-2 sm:w-auto'>
              <Select
                value={planFilter}
                onValueChange={(v) => {
                  setPlanFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[160px]'>
                  <SelectValue placeholder='Filter Plan' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Plan</SelectItem>
                  <SelectItem value='FREE'>Free</SelectItem>
                  <SelectItem value='STANDARD'>Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabel */}
          <Card className={`${nestedCardClass} py-0`}>
            <CardContent className='px-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                        Nama
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Email
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Plan
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Teknisi
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Router
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Transaksi POS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableSkeleton rows={8} cols={COLS} />
                    ) : isError ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell colSpan={COLS} className='h-24 text-center'>
                          <p className='text-sm text-muted-foreground'>
                            Gagal memuat daftar owner.
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => refetch()}
                          >
                            Coba Lagi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={COLS}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Tidak ada owner yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((owner) => (
                        <TableRow
                          key={owner.id}
                          className='cursor-pointer'
                          onClick={() =>
                            navigate({
                              to: '/users/$id',
                              params: { id: owner.id },
                            })
                          }
                        >
                          <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                            {owner.name}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {owner.email}
                          </TableCell>
                          <TableCell>
                            <PlanBadge plan={owner.plan} />
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {owner.teknisiCount}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {owner.routerCount}
                          </TableCell>
                          <TableCell className='pe-4 text-right text-sm tabular-nums'>
                            {owner.posCount.toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Footer paginasi */}
              <div className='flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row'>
                <div className='text-sm text-muted-foreground tabular-nums'>
                  Menampilkan {rangeStart}–{rangeEnd} dari {total} owner
                </div>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                    <span>Tampilkan</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(v) => {
                        setPageSize(Number(v))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className='h-8 w-[70px]'>
                        <SelectValue placeholder={pageSize.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZES.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>per halaman</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      <span className='sr-only'>Sebelumnya</span>
                    </Button>
                    <div className='px-2 text-sm font-medium tabular-nums'>
                      Hal {page} dari {totalPages}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className='h-4 w-4' />
                      <span className='sr-only'>Berikutnya</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
