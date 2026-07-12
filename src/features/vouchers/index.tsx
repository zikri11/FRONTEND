import * as React from 'react'
import { AxiosError } from 'axios'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  MoreHorizontalIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  RefreshCw,
  Trash2Icon,
  PrinterIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useServerStore } from '@/stores/server-store'
import { api } from '@/lib/axios'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
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
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Badge } from '@/components/reui/badge'
import { RouterLoadingOverlay } from '@/components/router-loading-overlay'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type Voucher = {
  id: string
  username?: string
  kode?: string
  password?: string
  profile?: { name?: string }
  paket?: string
  outletName?: string
  outlet?: string
  status?: string
  createdAt: string
}

export function Vouchers() {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const { servers, activeServerId, isLoading } = useServerStore()
  const role = useAuthStore((s) => s.auth.user?.role)
  const isOwner = role === 'OWNER'
  const queryClient = useQueryClient()
  const activeServer = servers.find((s) => s.id === activeServerId)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [profileFilter, setProfileFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  // Pagination & Action States
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const {
    data: vouchersResponse = {
      data: [],
      meta: { total: 0, skip: 0, take: 10 },
    },
    isPending,
    isError,
    refetch,
  } = useQuery<{
    data: Voucher[]
    meta: { total: number; skip: number; take: number }
  }>({
    queryKey: qk.vouchers(activeServerId ?? 'none', {
      search: debouncedSearch || undefined,
      profileId: profileFilter === 'all' ? undefined : profileFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: {
            serverId: activeServerId,
            search: debouncedSearch || undefined,
            profileId: profileFilter === 'all' ? undefined : profileFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
          },
          signal,
        })
        .then((res) => res.data),
    enabled: !!activeServerId,
    placeholderData: keepPreviousData,
  })

  const { data: profiles = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: qk.profiles(activeServerId ?? 'none'),
    queryFn: ({ signal }) =>
      api
        .get('/profiles', { params: { serverId: activeServerId }, signal })
        .then((res) => res.data),
    enabled: !!activeServerId,
  })

  // Total per-status (scoped ke seluruh router, independen dari pagination/filter halaman aktif)
  const { data: unusedVouchers = 0 } = useQuery({
    queryKey: qk.vouchers(activeServerId ?? 'none', {
      status: 'UNUSED',
      take: 1,
    }),
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: activeServerId, status: 'UNUSED', take: 1 },
          signal,
        })
        .then((res) => res.data.meta.total as number),
    enabled: !!activeServerId,
  })
  const { data: usedVouchers = 0 } = useQuery({
    queryKey: qk.vouchers(activeServerId ?? 'none', {
      status: 'USED',
      take: 1,
    }),
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: activeServerId, status: 'USED', take: 1 },
          signal,
        })
        .then((res) => res.data.meta.total as number),
    enabled: !!activeServerId,
  })

  // Action States
  const [voucherToDelete, setVoucherToDelete] = React.useState<string | null>(
    null
  )
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] =
    React.useState(false)

  const vouchers = vouchersResponse.data
  const totalVouchers = vouchersResponse.meta.total

  const dynamicPieData = [
    {
      name: 'Belum Dipakai',
      value: unusedVouchers,
      fill: 'hsl(var(--primary))',
    },
    {
      name: 'Terpakai',
      value: usedVouchers,
      fill: 'hsl(var(--muted-foreground))',
    },
  ]

  const totalPages = Math.ceil(totalVouchers / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))

  const invalidateVouchers = () => {
    if (activeServerId) {
      queryClient.invalidateQueries({ queryKey: qk.vouchers(activeServerId) })
    }
  }

  const selectAll = selectedRows.size === vouchers.length && vouchers.length > 0

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(vouchers.map((row) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/profiles/sync/${activeServerId}`),
    onMutate: () => {
      toast.info('Memulai sinkronisasi...')
    },
    onSuccess: () => {
      toast.success('Data voucher & profil berhasil disinkronkan dari router!')
      invalidateVouchers()
    },
    onError: (error) => {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined
      toast.error(msg || 'Gagal mensinkronkan data.')
    },
  })
  const isSyncing = syncMutation.isPending

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/vouchers/delete-bulk', { ids }),
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} Voucher berhasil dihapus`)
      setSelectedRows(new Set())
      invalidateVouchers()
    },
    onError: (error) => {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined
      toast.error(msg || 'Gagal menghapus voucher')
    },
  })

  const handlePrintSingle = (id: string) => {
    const baseUrl = api.defaults.baseURL || 'http://localhost:3000/api'
    window.open(`${baseUrl}/vouchers/pdf/single/${id}`, '_blank')
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : (
          <>
            <div className={`${outerBoxClass} flex-1`}>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                  <h2 className='text-2xl font-semibold tracking-tight'>
                    Voucher Hotspot
                  </h2>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Buat voucher instan & massal di{' '}
                    {activeServer?.name || activeServer?.host || 'router ini'}.
                  </p>
                </div>
                {!isOwner && (
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => syncMutation.mutate()}
                      disabled={isSyncing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                      />
                      {isSyncing ? 'Mensinkronkan...' : 'Sinkron'}
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
                            asChild
                          >
                            <Link to='/vouchers/add-single'>
                              <span className='text-sm leading-none font-medium'>
                                Tunggal
                              </span>
                              <span className='text-left text-xs whitespace-normal text-muted-foreground'>
                                Buat voucher satuan secara manual.
                              </span>
                            </Link>
                          </Button>
                          <Button
                            variant='ghost'
                            className='h-auto w-full flex-col items-start justify-start gap-1.5 p-2.5 font-normal'
                            asChild
                          >
                            <Link to='/vouchers/add-bulk'>
                              <span className='text-sm leading-none font-medium'>
                                Masal
                              </span>
                              <span className='text-left text-xs whitespace-normal text-muted-foreground'>
                                Generate banyak voucher otomatis.
                              </span>
                            </Link>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <Tabs defaultValue='list' className='w-full'>
                <TabsList className='mb-4'>
                  <TabsTrigger value='list'>List View</TabsTrigger>
                  <TabsTrigger value='analytics'>Analytics View</TabsTrigger>
                </TabsList>

                <TabsContent value='list' className='relative space-y-4'>
                  <RouterLoadingOverlay show={isPending} />
                  {/* Info Cards */}
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    <Card className={nestedCardClass}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          Total Voucher
                        </CardTitle>
                        <TicketIcon className='h-4 w-4 text-muted-foreground' />
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {totalVouchers}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          Total di router ini
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={nestedCardClass}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          Belum Dipakai
                        </CardTitle>
                        <CheckCircleIcon className='h-4 w-4 text-success' />
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {unusedVouchers}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {totalVouchers > 0
                            ? Math.round((unusedVouchers / totalVouchers) * 100)
                            : 0}
                          % dari total voucher
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={nestedCardClass}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          Terpakai
                        </CardTitle>
                        <XCircleIcon className='h-4 w-4 text-muted-foreground' />
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                          {usedVouchers}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {totalVouchers > 0
                            ? Math.round((usedVouchers / totalVouchers) * 100)
                            : 0}
                          % dari total voucher
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Toolbar: Search & Filter */}
                  <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                    <div className='relative w-full sm:max-w-sm'>
                      <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        type='search'
                        placeholder='Cari kode atau username...'
                        className='w-full pl-8'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className='flex w-full gap-2 sm:w-auto'>
                      <div className='w-full sm:w-[180px]'>
                        <Select
                          value={profileFilter}
                          onValueChange={(v) => {
                            setProfileFilter(v)
                            setCurrentPage(1)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Filter Profil' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>Semua Profil</SelectItem>
                            {profiles.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='w-full sm:w-[160px]'>
                        <Select
                          value={statusFilter}
                          onValueChange={(v) => {
                            setStatusFilter(v)
                            setCurrentPage(1)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Filter Status' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>Semua Status</SelectItem>
                            <SelectItem value='UNUSED'>
                              Belum Dipakai
                            </SelectItem>
                            <SelectItem value='USED'>Terpakai</SelectItem>
                            <SelectItem value='REVOKED'>Dicabut</SelectItem>
                            <SelectItem value='EXPIRED'>Kedaluwarsa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {!isOwner && selectedRows.size > 0 && (
                    <div className='mb-2 flex items-center gap-4 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive'>
                      <span className='px-2 text-sm font-medium'>
                        {selectedRows.size} voucher dipilih
                      </span>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => setIsBulkDeleteAlertOpen(true)}
                      >
                        <Trash2Icon className='mr-2 h-4 w-4' />
                        Hapus Massal
                      </Button>
                    </div>
                  )}

                  <div
                    className={`overflow-hidden rounded-xl border ${nestedCardClass}`}
                  >
                    <Table>
                      <TableHeader className='bg-muted/50'>
                        <TableRow>
                          <TableHead className='w-12 text-center'>
                            <Checkbox
                              id='select-all-checkbox'
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Paket</TableHead>
                          <TableHead>Outlet</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead className='text-right'>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isError ? (
                          <TableRow>
                            <TableCell colSpan={7} className='py-6 text-center'>
                              <p className='text-muted-foreground'>
                                Gagal mengambil data voucher.
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
                        ) : vouchers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className='py-6 text-center text-muted-foreground'
                            >
                              {debouncedSearch ||
                              profileFilter !== 'all' ||
                              statusFilter !== 'all'
                                ? 'Tidak ada voucher yang cocok.'
                                : 'Belum ada voucher.'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          vouchers.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={
                                selectedRows.has(row.id)
                                  ? 'selected'
                                  : undefined
                              }
                            >
                              <TableCell className='text-center'>
                                <Checkbox
                                  id={`row-${row.id}-checkbox`}
                                  checked={selectedRows.has(row.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(row.id, checked === true)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-3'>
                                  <div className='flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted'>
                                    <TicketIcon
                                      className='size-4 text-muted-foreground'
                                      aria-hidden='true'
                                    />
                                  </div>
                                  <div className='flex flex-col'>
                                    <span className='font-mono text-sm font-medium'>
                                      {row.username || row.kode}
                                    </span>
                                    <span className='font-mono text-xs text-muted-foreground'>
                                      {row.password}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {row.profile?.name || row.paket || '-'}
                              </TableCell>
                              <TableCell>
                                {row.outletName || row.outlet || '-'}
                              </TableCell>
                              <TableCell>
                                {row.status === 'UNUSED' ||
                                row.status === 'Aktif' ? (
                                  <Badge
                                    size='sm'
                                    className='border-success/20 bg-success/10 text-success'
                                  >
                                    Aktif
                                  </Badge>
                                ) : row.status === 'USED' ||
                                  row.status === 'Terpakai' ? (
                                  <Badge
                                    size='sm'
                                    variant='secondary'
                                    className='text-muted-foreground'
                                  >
                                    Terpakai
                                  </Badge>
                                ) : (
                                  <Badge
                                    size='sm'
                                    className='border-error/20 bg-error/10 text-error'
                                  >
                                    {row.status}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className='text-muted-foreground'>
                                {new Date(row.createdAt).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )}
                              </TableCell>
                              <TableCell className='text-right'>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      className='size-8'
                                    >
                                      <MoreHorizontalIcon />
                                      <span className='sr-only'>Buka menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuItem
                                      onClick={() => handlePrintSingle(row.id)}
                                    >
                                      <PrinterIcon className='mr-2 h-4 w-4' />{' '}
                                      Cetak PDF
                                    </DropdownMenuItem>
                                    {!isOwner && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          variant='destructive'
                                          onClick={() =>
                                            setVoucherToDelete(row.id)
                                          }
                                        >
                                          <Trash2Icon className='mr-2 h-4 w-4' />{' '}
                                          Hapus
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <div className='flex items-center justify-between border-t px-4 py-3'>
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
                            {[10, 20, 50, 100].map((size) => (
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
                        <div className='px-2 text-sm font-medium'>
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
                </TabsContent>

                <TabsContent value='analytics' className='space-y-4'>
                  <Card className={`flex flex-col ${nestedCardClass}`}>
                    <CardHeader className='items-center pb-0'>
                      <CardTitle>Rasio Pemakaian Voucher</CardTitle>
                      <CardDescription>Bulan Ini (Juni 2026)</CardDescription>
                    </CardHeader>
                    <CardContent className='mt-4 flex-1 pb-0'>
                      <div className='mx-auto aspect-square max-h-[300px] pb-0'>
                        <ResponsiveContainer width='100%' height='100%'>
                          <PieChart>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'var(--color-background)',
                                borderColor: 'var(--color-border)',
                                borderRadius: '8px',
                              }}
                              itemStyle={{ color: 'var(--color-foreground)' }}
                            />
                            <Pie
                              data={dynamicPieData}
                              dataKey='value'
                              nameKey='name'
                              label
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className='mt-4 flex-col gap-2 text-sm'>
                      <div className='flex items-center gap-2 leading-none font-medium'>
                        {usedVouchers} voucher telah digunakan
                      </div>
                      <div className='text-center leading-none text-muted-foreground'>
                        Menampilkan rasio voucher aktif vs terpakai
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            {/* Alert Dialog Hapus Satuan */}
            <AlertDialog
              open={!!voucherToDelete}
              onOpenChange={(open) => !open && setVoucherToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Voucher?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Voucher yang dihapus tidak dapat dipulihkan kembali dan akan
                    terhapus juga di router MikroTik.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setVoucherToDelete(null)}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (voucherToDelete)
                        deleteMutation.mutate([voucherToDelete])
                      setVoucherToDelete(null)
                    }}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Hapus Voucher
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog Hapus Massal */}
            <AlertDialog
              open={isBulkDeleteAlertOpen}
              onOpenChange={setIsBulkDeleteAlertOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Hapus {selectedRows.size} Voucher Sekaligus?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua voucher yang dipilih
                    secara permanen dari sistem dan router.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setIsBulkDeleteAlertOpen(false)}
                  >
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteMutation.mutate(Array.from(selectedRows))
                      setIsBulkDeleteAlertOpen(false)
                    }}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Hapus Massal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </Main>
    </>
  )
}
