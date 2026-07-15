import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, SearchIcon } from 'lucide-react'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  DUMMY_POS_TRANSACTIONS,
  POS_OUTLETS,
} from './data/dummy-transactions'

const PAGE_SIZES = [10, 25, 50, 100]

export function PosTransactionsHistory() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [outletFilter, setOutletFilter] = useState('all')
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

  const filtered = useMemo(() => {
    let rows = DUMMY_POS_TRANSACTIONS
    if (outletFilter !== 'all') {
      rows = rows.filter((t) => t.outletName === outletFilter)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (t) =>
          t.transactionId.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.outletName.toLowerCase().includes(q)
      )
    }
    // Sumber data sudah urut terbaru → terlama cukup dibalik
    return sortOrder === 'oldest' ? [...rows].reverse() : rows
  }, [outletFilter, debouncedSearch, sortOrder])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

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
            <h2 className='text-2xl font-semibold tracking-tight'>
              Riwayat Transaksi POS
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Seluruh transaksi voucher dari sistem POS di semua outlet.
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
            <div className='flex w-full gap-2 sm:w-auto'>
              <div className='w-full sm:w-[180px]'>
                <Select
                  value={outletFilter}
                  onValueChange={(v) => {
                    setOutletFilter(v)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Filter Outlet' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Semua Outlet</SelectItem>
                    {POS_OUTLETS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-full sm:w-[140px]'>
                <Select
                  value={sortOrder}
                  onValueChange={(v) => {
                    setSortOrder(v as 'newest' | 'oldest')
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Urutkan' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Terbaru</SelectItem>
                    <SelectItem value='oldest'>Terlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                        ID Transaksi
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Pelanggan
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Outlet
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Waktu
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={4}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Tidak ada transaksi yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((trx) => (
                        <TableRow key={trx.transactionId}>
                          <TableCell className='ps-4 font-mono text-xs text-muted-foreground whitespace-nowrap'>
                            {trx.transactionId}
                          </TableCell>
                          <TableCell className='text-sm text-foreground whitespace-nowrap'>
                            {trx.customerName}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {trx.outletName}
                          </TableCell>
                          <TableCell className='pe-4 text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                            {trx.createdAt}
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
                  Menampilkan {rangeStart}–{rangeEnd} dari {filtered.length}{' '}
                  transaksi
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
                      onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      <span className='sr-only'>Previous</span>
                    </Button>
                    <div className='px-2 text-sm font-medium tabular-nums'>
                      Hal {safePage} dari {totalPages || 1}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, safePage + 1))
                      }
                      disabled={safePage >= totalPages || totalPages === 0}
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
