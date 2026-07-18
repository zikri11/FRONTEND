import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ReceiptText, SearchIcon } from 'lucide-react'
import { api } from '@/lib/axios'
import { formatDateTimeId } from '@/lib/format-datetime'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Badge } from '@/components/reui/badge'
import { IconStack } from '@/components/reui/icon-stack'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const PAGE_SIZES = [10, 25, 50, 100]

type PosTxStatus = 'SUCCESS' | 'FAILED'

type PosTransactionRow = {
  id: string
  transactionId: string
  customerName: string | null
  outletName: string | null
  status: PosTxStatus
  createdAt: string
  server: { id: string; name: string } | null
  profile: { id: string; name: string } | null
  voucher: { id: string; username: string; status: string } | null
}

type PosTxResponse = {
  data: PosTransactionRow[]
  meta: { total: number; skip: number; take: number }
}

type ServerLite = { id: string; name: string }

function TxStatusBadge({ status }: { status: PosTxStatus }) {
  return status === 'SUCCESS' ? (
    <Badge size='sm' variant='success-light'>
      Sukses
    </Badge>
  ) : (
    <Badge size='sm' variant='destructive-light'>
      Gagal
    </Badge>
  )
}

export function PosTransactionsHistory() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [serverFilter, setServerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PosTxStatus>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Daftar router milik owner untuk dropdown filter (scope ditangani backend).
  const { data: servers } = useQuery({
    queryKey: ['servers-list'],
    queryFn: async () => (await api.get('/servers')).data as ServerLite[],
    staleTime: 60_000,
  })

  const skip = (currentPage - 1) * pageSize

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [
      'pos-transactions',
      { skip, take: pageSize, serverFilter, statusFilter, debouncedSearch },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { skip, take: pageSize }
      if (serverFilter !== 'all') params.serverId = serverFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const q = debouncedSearch.trim()
      if (q) params.search = q
      const res = await api.get('/pos/transactions', { params })
      return res.data as PosTxResponse
    },
    placeholderData: keepPreviousData,
  })

  const rows = data?.data ?? []
  const total = data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeStart = total === 0 ? 0 : skip + 1
  const rangeEnd = Math.min(skip + pageSize, total)

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
              Riwayat Transaksi POS
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Riwayat transaksi voucher dari sistem POS pada seluruh router Anda.
            </p>
          </div>

          {/* Toolbar: Search & Filter */}
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='relative w-full sm:max-w-sm'>
              <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Cari ID, pelanggan, atau outlet...'
                className='w-full pl-8'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex w-full flex-wrap gap-2 sm:w-auto'>
              <Select
                value={serverFilter}
                onValueChange={(v) => {
                  setServerFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Filter Router' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Router</SelectItem>
                  {(servers ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as 'all' | PosTxStatus)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[150px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Status</SelectItem>
                  <SelectItem value='SUCCESS'>Sukses</SelectItem>
                  <SelectItem value='FAILED'>Gagal</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}
              >
                <SelectTrigger className='w-full sm:w-[190px]'>
                  <SelectValue placeholder='Urutkan' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>Terbaru</SelectItem>
                  {/* Backend belum dukung sort naik (orderBy createdAt desc
                      hardcoded). Aktifkan saat param ?order= tersedia. */}
                  <SelectItem value='oldest' disabled>
                    Terlama (menunggu backend)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabel */}
          <Card className={`${nestedCardClass} py-0`}>
            <CardContent className='px-0'>
              <div className='overflow-x-auto'>
                <Table
                  className={
                    isFetching && !isLoading
                      ? 'opacity-60 transition-opacity'
                      : undefined
                  }
                >
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                        ID Transaksi
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Pelanggan
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Outlet
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Paket
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Voucher
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Status
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Waktu
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton rows={8} cols={7} />
                    ) : isError ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={7}
                          className='h-24 text-center text-sm text-destructive'
                        >
                          Gagal memuat transaksi. Coba muat ulang halaman.
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={7}
                          className='py-12 text-center text-sm text-muted-foreground'
                        >
                          <div className='flex flex-col items-center gap-3'>
                            <IconStack aria-hidden='true'>
                              <ReceiptText className='size-5' />
                            </IconStack>
                            <span>Belum ada transaksi POS.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((trx) => (
                        <TableRow key={trx.id}>
                          <TableCell className='ps-4 font-mono text-xs text-muted-foreground whitespace-nowrap'>
                            {trx.transactionId}
                          </TableCell>
                          <TableCell className='text-sm text-foreground whitespace-nowrap'>
                            {trx.customerName ?? '—'}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {trx.outletName ?? trx.server?.name ?? '—'}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {trx.profile?.name ?? '—'}
                          </TableCell>
                          <TableCell className='font-mono text-xs text-muted-foreground whitespace-nowrap'>
                            {trx.voucher?.username ?? '—'}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <TxStatusBadge status={trx.status} />
                          </TableCell>
                          <TableCell className='pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                            {formatDateTimeId(trx.createdAt)}
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
                  Menampilkan {rangeStart}–{rangeEnd} dari {total} transaksi
                </div>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                    <span>Tampilkan</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(v) => {
                        setPageSize(Number(v))
                        setCurrentPage(1)
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
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      <span className='sr-only'>Previous</span>
                    </Button>
                    <div className='px-2 text-sm font-medium tabular-nums'>
                      Hal {currentPage} dari {totalPages}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className='h-4 w-4' />
                      <span className='sr-only'>Next</span>
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
