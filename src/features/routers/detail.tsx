import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontalIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
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
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  buildProfiles,
  type HotspotProfileRow,
} from './data/dummy-router-detail'
import {
  formatCheckedAt,
  normalizeStatus,
  seedFromId,
  useOwnersMap,
} from './utils'

const PAGE_SIZES = [10, 25, 50, 100]

// POS API key dari backend (GET /pos-keys) — di-mask oleh server
type PosKey = {
  id: string
  label: string
  serverId: string
  maskedKey: string
  isActive: boolean
  lastUsedAt?: string | null
}

// Key mentah — dikembalikan POST sekali, tak pernah disimpan
type CreatedKey = {
  id: string
  label: string
  key: string
}

// Baris voucher dari GET /vouchers
type VoucherApiRow = {
  id: string
  username?: string
  password?: string
  profile?: { name?: string }
  outletName?: string
  status?: string
  createdAt: string
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const m =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}

export function RouterDetail({ routerId }: { routerId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setActiveServerId = useServerStore((s) => s.setActiveServerId)
  const { servers, isLoading, fetchServers } = useServerStore()
  const ownersMap = useOwnersMap()

  useEffect(() => {
    fetchServers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const router = servers.find((s) => s.id === routerId) ?? null
  const seed = router ? seedFromId(router.id) : 0

  const [profiles, setProfiles] = useState<HotspotProfileRow[]>([])
  const [dataForRouterId, setDataForRouterId] = useState<string | null>(null)

  // Profil Hotspot masih dummy seeded per router — regenerate saat router
  // termuat/berganti. Pola "adjust state during render" (react.dev).
  if (router && dataForRouterId !== router.id) {
    setDataForRouterId(router.id)
    setProfiles(buildProfiles(seed))
  }

  // Integrasi POS — data nyata GET /pos-keys?serverId= (backend mendukung
  // filter server-side + scope SA global; lihat pos-keys.service).
  const { data: posKeys = [] } = useQuery<PosKey[]>({
    queryKey: ['pos-keys', routerId],
    queryFn: ({ signal }) =>
      api
        .get('/pos-keys', { params: { serverId: routerId }, signal })
        .then((r) => r.data),
    enabled: !!router,
  })
  const invalidatePosKeys = () =>
    queryClient.invalidateQueries({ queryKey: ['pos-keys', routerId] })

  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false)
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [revealedKey, setRevealedKey] = useState<CreatedKey | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const createKeyMutation = useMutation({
    mutationFn: (label: string) =>
      api
        .post('/pos-keys', { label, serverId: routerId })
        .then((r) => r.data as CreatedKey),
    onSuccess: (data) => {
      setIsCreateKeyOpen(false)
      setNewKeyLabel('')
      setKeyCopied(false)
      setRevealedKey(data)
      invalidatePosKeys()
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Gagal membuat API key')),
  })

  const submitCreateKey = () => {
    if (!newKeyLabel.trim()) {
      toast.error('Label / nama outlet wajib diisi')
      return
    }
    createKeyMutation.mutate(newKeyLabel.trim())
  }

  const copyRawKey = () => {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey.key)
    setKeyCopied(true)
  }

  const toggleKeyMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/pos-keys/${id}`, { isActive }),
    onSuccess: () => {
      toast.success('Status API key diperbarui')
      invalidatePosKeys()
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Gagal mengubah status key')),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pos-keys/${id}`),
    onSuccess: () => {
      toast.success('API key berhasil dihapus')
      invalidatePosKeys()
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Gagal menghapus key')),
    onSettled: () => setKeyToDelete(null),
  })

  const [profileToEdit, setProfileToEdit] = useState<HotspotProfileRow | null>(
    null
  )
  const [editProfileName, setEditProfileName] = useState('')
  const [editRateLimit, setEditRateLimit] = useState('')
  const [editValidity, setEditValidity] = useState('')
  const [profileToDelete, setProfileToDelete] =
    useState<HotspotProfileRow | null>(null)
  const [keyToDelete, setKeyToDelete] = useState<PosKey | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherApiRow | null>(
    null
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Profil untuk filter Paket — data nyata GET /profiles?serverId=
  const { data: voucherProfiles = [] } = useQuery<
    { id: string; name: string }[]
  >({
    queryKey: ['router-profiles', routerId],
    queryFn: ({ signal }) =>
      api
        .get('/profiles', { params: { serverId: routerId }, signal })
        .then((r) => r.data),
    enabled: !!router,
  })

  // Tabel voucher — data nyata GET /vouchers (server-side filter + paginasi)
  const voucherParams = {
    serverId: routerId,
    search: debouncedSearch || undefined,
    profileId: profileFilter === 'all' ? undefined : profileFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  }
  const {
    data: vouchersResponse = {
      data: [],
      meta: { total: 0, skip: 0, take: pageSize },
    },
    isPending: vouchersPending,
    isError: vouchersError,
  } = useQuery<{
    data: VoucherApiRow[]
    meta: { total: number; skip: number; take: number }
  }>({
    queryKey: ['router-vouchers', routerId, voucherParams],
    queryFn: ({ signal }) =>
      api.get('/vouchers', { params: voucherParams, signal }).then((r) => r.data),
    enabled: !!router,
    placeholderData: keepPreviousData,
  })
  const pageRows = vouchersResponse.data
  const voucherTotal = vouchersResponse.meta.total
  const totalPages = Math.ceil(voucherTotal / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const rangeStart = voucherTotal === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, voucherTotal)

  const invalidateVouchers = () => {
    queryClient.invalidateQueries({ queryKey: ['router-vouchers', routerId] })
    queryClient.invalidateQueries({
      queryKey: ['router-voucher-count', routerId],
    })
  }

  const deleteVouchersMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/vouchers/delete-bulk', { ids }),
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} voucher berhasil dihapus`)
      setSelectedRows(new Set())
      invalidateVouchers()
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Gagal menghapus voucher')),
    onSettled: () => {
      setIsBulkDeleteOpen(false)
      setVoucherToDelete(null)
    },
  })

  const printSingleVoucher = (id: string) => {
    const baseUrl = api.defaults.baseURL || 'http://localhost:4000/api'
    window.open(`${baseUrl}/vouchers/pdf/single/${id}`, '_blank')
  }

  // Statistik voucher — count nyata dari GET /vouchers?serverId=&status= (bug
  // filter serverId sudah diperbaiki backend; scope SA global). take=1, ambil
  // meta.total. Tabel voucher di bawah masih dummy (menyusul).
  const { data: totalVouchers = 0 } = useQuery({
    queryKey: ['router-voucher-count', routerId, 'all'],
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', { params: { serverId: routerId, take: 1 }, signal })
        .then((r) => (r.data?.meta?.total as number) ?? 0),
    enabled: !!router,
  })
  const { data: unusedVouchers = 0 } = useQuery({
    queryKey: ['router-voucher-count', routerId, 'UNUSED'],
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: routerId, take: 1, status: 'UNUSED' },
          signal,
        })
        .then((r) => (r.data?.meta?.total as number) ?? 0),
    enabled: !!router,
  })
  const { data: usedVouchers = 0 } = useQuery({
    queryKey: ['router-voucher-count', routerId, 'USED'],
    queryFn: ({ signal }) =>
      api
        .get('/vouchers', {
          params: { serverId: routerId, take: 1, status: 'USED' },
          signal,
        })
        .then((r) => (r.data?.meta?.total as number) ?? 0),
    enabled: !!router,
  })

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
    deleteVouchersMutation.mutate(Array.from(selectedRows))
  }

  const handleSingleDelete = () => {
    if (!voucherToDelete) return
    deleteVouchersMutation.mutate([voucherToDelete.id])
  }

  const openProfileEdit = (profile: HotspotProfileRow) => {
    setProfileToEdit(profile)
    setEditProfileName(profile.name)
    setEditRateLimit(profile.rateLimit)
    setEditValidity(profile.validity)
  }

  const handleProfileEditSave = () => {
    if (!profileToEdit) return
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileToEdit.id
          ? {
              ...p,
              name: editProfileName,
              rateLimit: editRateLimit,
              validity: editValidity,
            }
          : p
      )
    )
    setProfileToEdit(null)
    toast.success('Profil berhasil diperbarui (dummy)')
  }

  const handleProfileDelete = () => {
    if (!profileToDelete) return
    setProfiles((prev) => prev.filter((p) => p.id !== profileToDelete.id))
    setProfileToDelete(null)
    toast.success('Profil berhasil dihapus (dummy)')
  }

  const toggleKeyActive = (key: PosKey) => {
    toggleKeyMutation.mutate({ id: key.id, isActive: !key.isActive })
  }

  const handleKeyDelete = () => {
    if (!keyToDelete) return
    deleteKeyMutation.mutate(keyToDelete.id)
  }

  // Ikatan "akses remote": set router aktif = router ini, lalu buka halaman
  // buat voucher/profil existing (teknisi) yang membaca activeServerId dari store.
  const goCreate = (
    to: '/vouchers/add-single' | '/vouchers/add-bulk' | '/profiles/add'
  ) => {
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
          {isLoading && !router ? (
            <div className='flex flex-1 flex-col items-center justify-center py-20 text-center'>
              <p className='text-sm text-muted-foreground'>
                Memuat data router...
              </p>
            </div>
          ) : !router ? (
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
                  <StatusBadge status={normalizeStatus(router.lastStatus)} />
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  <span className='font-mono'>
                    {router.host}:{router.port}
                  </span>{' '}
                  - {ownersMap[router.ownerId] ?? '—'}
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
                        {formatCheckedAt(router.lastCheckedAt) ?? '—'}
                      </span>
                    </DetailRow>
                    <DetailRow label='Username'>
                      <span className='font-mono text-xs'>
                        {router.username}
                      </span>
                    </DetailRow>
                    <DetailRow label='Password'>
                      <span className='text-xs text-muted-foreground'>
                        Terenkripsi (AES-256-GCM)
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

              {/* Integrasi POS */}
              <Card className={`${nestedCardClass} py-0`}>
                <CardHeader className='flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <CardTitle>Integrasi POS</CardTitle>
                    <CardDescription className='mt-1'>
                      API key kasir yang terikat ke router ini.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setNewKeyLabel('')
                      setIsCreateKeyOpen(true)
                    }}
                  >
                    Buat API Key
                  </Button>
                </CardHeader>
                <CardContent className='px-0'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                          <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                            Outlet
                          </TableHead>
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Status
                          </TableHead>
                          <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Terakhir Digunakan
                          </TableHead>
                          <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posKeys.length === 0 ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell
                              colSpan={4}
                              className='h-24 text-center text-sm text-muted-foreground'
                            >
                              Belum ada API key untuk router ini.
                            </TableCell>
                          </TableRow>
                        ) : (
                          posKeys.map((key) => (
                            <TableRow key={key.id}>
                              <TableCell className='ps-4'>
                                <div className='flex flex-col whitespace-nowrap'>
                                  <span className='text-sm text-foreground'>
                                    {key.label}
                                  </span>
                                  <span className='font-mono text-xs text-muted-foreground'>
                                    {key.maskedKey}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {key.isActive ? (
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
                                    Nonaktif
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                                {formatCheckedAt(key.lastUsedAt) ?? '—'}
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
                                      onClick={() => toggleKeyActive(key)}
                                    >
                                      {key.isActive
                                        ? 'Nonaktifkan'
                                        : 'Aktifkan'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant='destructive'
                                      onClick={() => setKeyToDelete(key)}
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
                <CardHeader className='flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between'>
                  <div>
                    <CardTitle>Profil Hotspot</CardTitle>
                    <CardDescription className='mt-1'>
                      Paket bandwidth/durasi yang terdaftar di router ini.
                    </CardDescription>
                  </div>
                  <Button onClick={() => goCreate('/profiles/add')}>
                    Buat Profil
                  </Button>
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
                          <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                            Masa Aktif
                          </TableHead>
                          <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                            Aksi
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
                            <TableCell className='font-mono text-xs whitespace-nowrap'>
                              {profile.validity}
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
                                    <span className='sr-only'>Buka menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem
                                    onClick={() => openProfileEdit(profile)}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant='destructive'
                                    onClick={() => setProfileToDelete(profile)}
                                  >
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button>Buat Voucher</Button>
                      </PopoverTrigger>
                      <PopoverContent align='end' className='w-64 p-2'>
                        <div className='grid gap-1'>
                          <Button
                            variant='ghost'
                            className='h-auto w-full flex-col items-start justify-start gap-1.5 p-2.5 font-normal'
                            onClick={() => goCreate('/vouchers/add-single')}
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
                            onClick={() => goCreate('/vouchers/add-bulk')}
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
                          {voucherProfiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
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
                        {vouchersPending ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell
                              colSpan={7}
                              className='h-24 text-center text-sm text-muted-foreground'
                            >
                              Memuat voucher...
                            </TableCell>
                          </TableRow>
                        ) : vouchersError ? (
                          <TableRow className='hover:bg-transparent'>
                            <TableCell
                              colSpan={7}
                              className='h-24 text-center text-sm text-muted-foreground'
                            >
                              Gagal memuat voucher.
                            </TableCell>
                          </TableRow>
                        ) : pageRows.length === 0 ? (
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
                                    {voucher.username}
                                  </span>
                                  <span className='font-mono text-xs text-muted-foreground'>
                                    {voucher.password}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='text-sm text-foreground whitespace-nowrap'>
                                {voucher.profile?.name ?? '—'}
                              </TableCell>
                              <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                                {voucher.outletName ?? '—'}
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
                                {new Date(voucher.createdAt).toLocaleDateString(
                                  'id-ID',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )}
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
                                        printSingleVoucher(voucher.id)
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
                      Menampilkan {rangeStart}–{rangeEnd} dari {voucherTotal}{' '}
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

      {/* Dialog buat API key POS */}
      <Dialog open={isCreateKeyOpen} onOpenChange={setIsCreateKeyOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Buat API Key Baru</DialogTitle>
            <DialogDescription>
              Key terikat ke router{' '}
              <strong>{router?.name}</strong> — kasir yang memakainya hanya bisa
              membuat voucher di sini.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2 py-2'>
            <Label htmlFor='key-label'>
              Label / Nama Outlet <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='key-label'
              placeholder='contoh: Kasir Cabang Pusat'
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateKeyOpen(false)}
              disabled={createKeyMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={submitCreateKey}
              disabled={createKeyMutation.isPending}
            >
              {createKeyMutation.isPending ? 'Membuat...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reveal-once */}
      <Dialog
        open={!!revealedKey}
        onOpenChange={(open) => !open && setRevealedKey(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>API Key Berhasil Dibuat</DialogTitle>
            <DialogDescription>
              {revealedKey?.label
                ? `Outlet: ${revealedKey.label}`
                : 'Salin key ini sekarang.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              <TriangleAlert className='mt-0.5 h-4 w-4 shrink-0' />
              <span>
                Simpan key ini sekarang. Key mentah{' '}
                <b>tidak akan ditampilkan lagi</b> setelah dialog ditutup.
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <code className='flex-1 rounded bg-muted px-3 py-2 font-mono text-sm break-all'>
                {revealedKey?.key}
              </code>
              <Button
                variant='outline'
                size='icon'
                onClick={copyRawKey}
                aria-label='Salin key'
              >
                {keyCopied ? (
                  <Check className='h-4 w-4 text-success' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealedKey(null)}>Selesai & Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog edit profil (dummy) */}
      <Dialog
        open={!!profileToEdit}
        onOpenChange={(open) => !open && setProfileToEdit(null)}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
            <DialogDescription>
              Ubah profil hotspot. Perubahan hanya dummy (belum tersambung
              backend).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='profile-name'>Nama Profil</Label>
              <Input
                id='profile-name'
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='profile-rate'>Bandwidth (rate limit)</Label>
              <Input
                id='profile-rate'
                className='font-mono'
                value={editRateLimit}
                onChange={(e) => setEditRateLimit(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='profile-validity'>Masa Aktif</Label>
              <Input
                id='profile-validity'
                className='w-[140px] font-mono'
                value={editValidity}
                onChange={(e) => setEditValidity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setProfileToEdit(null)}>
              Batal
            </Button>
            <Button onClick={handleProfileEditSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus profil */}
      <AlertDialog
        open={!!profileToDelete}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Profil <strong>{profileToDelete?.name}</strong> akan dihapus dari
              router ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProfileDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Profil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus API key */}
      <AlertDialog
        open={!!keyToDelete}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              API key <strong>{keyToDelete?.label}</strong> akan dicabut —
              mesin kasir yang memakainya tidak bisa membuat voucher lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKeyDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus API Key
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
              Voucher <strong>{voucherToDelete?.username}</strong> akan dihapus
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
