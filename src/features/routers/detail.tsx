import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontalIcon,
  RefreshCw,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { useServerStore } from '@/stores/server-store'
import { Badge } from '@/components/reui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { DetailRow, ProtocolBadge, StatusBadge } from './components'
import {
  buildProfiles,
  buildVouchers,
  type VoucherRow,
} from './data/dummy-router-detail'
import { DUMMY_ROUTERS } from './data/dummy-routers'

const PAGE_SIZES = [10, 25, 50, 100]

export function RouterDetail({ routerId }: { routerId: string }) {
  const navigate = useNavigate()
  const setActiveServerId = useServerStore((s) => s.setActiveServerId)

  const routerIndex = DUMMY_ROUTERS.findIndex((r) => r.id === routerId)
  const router = routerIndex >= 0 ? DUMMY_ROUTERS[routerIndex] : null

  const profiles = useMemo(
    () => (router ? buildProfiles(routerIndex) : []),
    [router, routerIndex]
  )
  const [vouchers, setVouchers] = useState<VoucherRow[]>(() =>
    router ? buildVouchers(routerIndex, buildProfiles(routerIndex), router.name) : []
  )

  const [showPassword, setShowPassword] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherRow | null>(
    null
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    let list = vouchers
    if (profileFilter !== 'all') {
      list = list.filter((v) => v.profileName === profileFilter)
    }
    if (statusFilter !== 'all') {
      list = list.filter((v) => v.status === statusFilter)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((v) => v.code.toLowerCase().includes(q))
    }
    return list
  }, [vouchers, profileFilter, statusFilter, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const totalVouchers = vouchers.length
  const unusedVouchers = vouchers.filter((v) => v.status === 'UNUSED').length
  const usedVouchers = totalVouchers - unusedVouchers

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((v) => selectedRows.has(v.id))

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      pageRows.forEach((v) => {
        if (checked === true) next.add(v.id)
        else next.delete(v.id)
      })
      return next
    })
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    setVouchers((prev) => prev.filter((v) => !selectedRows.has(v.id)))
    toast.success(`${selectedRows.size} voucher berhasil dihapus (dummy)`)
    setSelectedRows(new Set())
    setIsBulkDeleteOpen(false)
  }

  const handleSingleDelete = () => {
    if (!voucherToDelete) return
    setVouchers((prev) => prev.filter((v) => v.id !== voucherToDelete.id))
    setVoucherToDelete(null)
    toast.success('Voucher berhasil dihapus (dummy)')
  }

  // Ikatan "akses remote": set router aktif = router ini, lalu buka halaman
  // buat voucher existing (teknisi) yang membaca activeServerId dari store.
  const goCreateVoucher = (to: '/vouchers/add-single' | '/vouchers/add-bulk') => {
    if (!router) return
    setActiveServerId(router.id)
    navigate({ to })
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
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
            <Link to='/routers' aria-label='Kembali ke Kelola Router'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
        </div>
        <div className={`${outerBoxClass} flex-1`}>
          {!router ? (
            <div className='flex flex-1 flex-col items-center justify-center py-20 text-center'>
              <h2 className='mb-2 text-xl font-semibold'>
                Router Tidak Ditemukan
              </h2>
              <p className='text-sm text-muted-foreground'>
                Router ini mungkin telah dihapus.
              </p>
            </div>
          ) : (
            <>
              {/* Header router */}
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-2xl font-semibold tracking-tight'>
                    {router.name}
                  </h2>
                  <StatusBadge status={router.lastStatus} />
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  <span className='font-mono'>
                    {router.host}:{router.port}
                  </span>{' '}
                  - {router.ownerName}
                </p>
              </div>

              {/* Informasi router */}
              <Card className={nestedCardClass}>
                <CardHeader>
                  <CardTitle>Informasi Router</CardTitle>
                  <CardDescription>
                    Detail koneksi dan konfigurasi hotspot router ini.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col divide-y divide-border/40'>
                    <DetailRow label='Protokol'>
                      <ProtocolBadge useSSL={router.useSSL} />
                    </DetailRow>
                    <DetailRow label='Terakhir Dicek'>
                      <span className='font-mono text-xs text-muted-foreground tabular-nums'>
                        {router.lastCheckedAt ?? '—'}
                      </span>
                    </DetailRow>
                    <DetailRow label='Username'>
                      <span className='font-mono text-xs'>
                        {router.username}
                      </span>
                    </DetailRow>
                    <DetailRow label='Password'>
                      <span className='inline-flex items-center gap-2'>
                        <span className='font-mono text-xs select-all'>
                          {showPassword ? router.password : '••••••••'}
                        </span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-6 text-muted-foreground hover:text-foreground'
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          {showPassword ? (
                            <EyeOff className='h-3.5 w-3.5' />
                          ) : (
                            <Eye className='h-3.5 w-3.5' />
                          )}
                          <span className='sr-only'>
                            {showPassword ? 'Sembunyikan' : 'Tampilkan'}{' '}
                            password
                          </span>
                        </Button>
                      </span>
                    </DetailRow>
                    <DetailRow label='Hotspot Name'>
                      <span className='font-mono text-xs'>
                        {router.hotspotName ?? '—'}
                      </span>
                    </DetailRow>
                    <DetailRow label='DNS Login'>
                      <span className='font-mono text-xs'>
                        {router.dnsName ?? '—'}
                      </span>
                    </DetailRow>
                  </div>
                </CardContent>
              </Card>

              {/* Statistik voucher */}
              <div className='grid gap-4 sm:grid-cols-3'>
                <Card className={nestedCardClass}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Voucher
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                      {totalVouchers}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      seluruh voucher di router ini
                    </p>
                  </CardContent>
                </Card>
                <Card className={nestedCardClass}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Belum Dipakai
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                      {unusedVouchers}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      voucher masih aktif
                    </p>
                  </CardContent>
                </Card>
                <Card className={nestedCardClass}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Terpakai
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                      {usedVouchers}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      voucher sudah digunakan
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Profil hotspot */}
              <Card className={`${nestedCardClass} py-0`}>
                <CardHeader className='pt-6'>
                  <CardTitle>Profil Hotspot</CardTitle>
                  <CardDescription>
                    Paket bandwidth/durasi yang terdaftar di router ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className='px-0'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                            Profil
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Status
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Bandwidth
                          </TableHead>
                          <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Shared
                          </TableHead>
                          <TableHead className='pe-4 text-xs font-medium tracking-wide text-muted-foreground'>
                            Masa Aktif
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                              {profile.name}
                            </TableCell>
                            <TableCell>
                              {profile.syncedToRouter ? (
                                <Badge
                                  size='sm'
                                  className='border-success/20 bg-success/10 text-success'
                                >
                                  Sinkron
                                </Badge>
                              ) : (
                                <Badge
                                  size='sm'
                                  className='border-warning/20 bg-warning/10 text-warning'
                                >
                                  Belum Sinkron
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className='font-mono text-xs whitespace-nowrap'>
                              {profile.rateLimit}
                            </TableCell>
                            <TableCell className='text-right text-sm tabular-nums'>
                              {profile.sharedUsers}
                            </TableCell>
                            <TableCell className='pe-4 font-mono text-xs whitespace-nowrap'>
                              {profile.validity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Voucher */}
              <Card className={`${nestedCardClass} py-0`}>
                <CardHeader className='flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <CardTitle>Voucher</CardTitle>
                    <CardDescription className='mt-1'>
                      Seluruh voucher hotspot di router ini.
                    </CardDescription>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      onClick={() =>
                        toast.info('Sinkronisasi dimulai (dummy)')
                      }
                    >
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Sinkron
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button>Buat Voucher</Button>
                      </PopoverTrigger>
                      <PopoverContent align='end' className='w-64 p-2'>
                        <div className='grid gap-1'>
                          <Button
                            variant='ghost'
                            className='h-auto w-full flex-col items-start justify-start gap-1.5 p-2.5 font-normal'
                            onClick={() => goCreateVoucher('/vouchers/add-single')}
                          >
                            <span className='text-sm leading-none font-medium'>
                              Tunggal
                            </span>
                            <span className='text-left text-xs whitespace-normal text-muted-foreground'>
                              Buat voucher satuan secara manual.
                            </span>
                          </Button>
                          <Button
                            variant='ghost'
                            className='h-auto w-full flex-col items-start justify-start gap-1.5 p-2.5 font-normal'
                            onClick={() => goCreateVoucher('/vouchers/add-bulk')}
                          >
                            <span className='text-sm leading-none font-medium'>
                              Masal
                            </span>
                            <span className='text-left text-xs whitespace-normal text-muted-foreground'>
                              Generate banyak voucher otomatis.
                            </span>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className='px-0'>
                  {/* Toolbar */}
                  <div className='flex flex-col items-center justify-between gap-4 px-4 pb-4 sm:flex-row'>
                    <div className='relative w-full sm:max-w-sm'>
                      <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        type='search'
                        placeholder='Cari kode voucher...'
                        className='w-full pl-8'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className='flex w-full gap-2 sm:w-auto'>
                      <Select
                        value={profileFilter}
                        onValueChange={(v) => {
                          setProfileFilter(v)
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className='w-full sm:w-[180px]'>
                          <SelectValue placeholder='Filter Paket' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>Semua Paket</SelectItem>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                          setStatusFilter(v)
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className='w-full sm:w-[140px]'>
                          <SelectValue placeholder='Filter Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>Semua Status</SelectItem>
                          <SelectItem value='UNUSED'>Aktif</SelectItem>
                          <SelectItem value='USED'>Terpakai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedRows.size > 0 && (
                    <div className='mx-4 mb-2 flex items-center gap-4 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive'>
                      <span className='px-2 text-sm font-medium'>
                        {selectedRows.size} voucher dipilih
                      </span>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => setIsBulkDeleteOpen(true)}
                      >
                        <Trash2Icon className='mr-2 h-4 w-4' />
                        Hapus Massal
                      </Button>
                    </div>
                  )}

                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='w-12 text-center'>
                            <Checkbox
                              checked={allPageSelected}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Kode
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Paket
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Outlet
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Status
                          </TableHead>
                          <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Dibuat
                          </TableHead>
                          <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.length === 0 ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell
                              colSpan={7}
                              className='h-24 text-center text-sm text-muted-foreground'
                            >
                              Tidak ada voucher yang cocok.
                            </TableCell>
                          </TableRow>
                        ) : (
                          pageRows.map((voucher) => (
                            <TableRow
                              key={voucher.id}
                              data-state={
                                selectedRows.has(voucher.id)
                                  ? 'selected'
                                  : undefined
                              }
                            >
                              <TableCell className='text-center'>
                                <Checkbox
                                  checked={selectedRows.has(voucher.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(
                                      voucher.id,
                                      checked === true
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className='flex flex-col whitespace-nowrap'>
                                  <span className='font-mono text-xs text-foreground'>
                                    {voucher.code}
                                  </span>
                                  <span className='font-mono text-xs text-muted-foreground'>
                                    {voucher.password}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='text-sm text-foreground whitespace-nowrap'>
                                {voucher.profileName}
                              </TableCell>
                              <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                                {voucher.outletName}
                              </TableCell>
                              <TableCell>
                                {voucher.status === 'UNUSED' ? (
                                  <Badge
                                    size='sm'
                                    className='border-success/20 bg-success/10 text-success'
                                  >
                                    Aktif
                                  </Badge>
                                ) : (
                                  <Badge
                                    size='sm'
                                    variant='secondary'
                                    className='text-muted-foreground'
                                  >
                                    Terpakai
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                                {voucher.createdAt}
                              </TableCell>
                              <TableCell className='pe-4 text-right'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='size-8'
                                    >
                                      <MoreHorizontalIcon />
                                      <span className='sr-only'>
                                        Buka menu
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.info(
                                          'Unduh PDF belum tersambung (dummy)'
                                        )
                                      }
                                    >
                                      Unduh PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant='destructive'
                                      onClick={() =>
                                        setVoucherToDelete(voucher)
                                      }
                                    >
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                      voucher
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
                          onClick={() =>
                            setCurrentPage(Math.max(1, safePage - 1))
                          }
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
                          disabled={
                            safePage >= totalPages || totalPages === 0
                          }
                        >
                          <ChevronRight className='h-4 w-4' />
                          <span className='sr-only'>Next</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Main>

      {/* Konfirmasi hapus massal */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.size} voucher akan dihapus dari router ini.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Massal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus satuan */}
      <AlertDialog
        open={!!voucherToDelete}
        onOpenChange={(open) => !open && setVoucherToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher <strong>{voucherToDelete?.code}</strong> akan dihapus
              dari router ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVoucherToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
