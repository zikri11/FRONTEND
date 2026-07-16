import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontalIcon,
  SearchIcon,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DUMMY_ROUTERS,
  type RouterRow,
  type RouterStatus,
} from './data/dummy-routers'

const PAGE_SIZES = [10, 25, 50, 100]

function StatusBadge({ status }: { status: RouterStatus }) {
  if (status === 'ONLINE') {
    return (
      <Badge size='sm' className='border-success/20 bg-success/10 text-success'>
        Online
      </Badge>
    )
  }
  if (status === 'OFFLINE') {
    return (
      <Badge size='sm' variant='secondary' className='text-muted-foreground'>
        Offline
      </Badge>
    )
  }
  return (
    <Badge size='sm' className='border-warning/20 bg-warning/10 text-warning'>
      Unknown
    </Badge>
  )
}

function ProtocolBadge({ useSSL }: { useSSL: boolean }) {
  return (
    <Badge
      size='sm'
      variant='secondary'
      className='gap-1 font-normal text-muted-foreground'
    >
      {useSSL ? (
        <>
          <ShieldCheck className='text-success' /> HTTPS / SSL
        </>
      ) : (
        <>
          <ShieldAlert /> HTTP
        </>
      )}
    </Badge>
  )
}

// Baris detail: label kiri muted, nilai kanan (mono untuk data mesin)
function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-4 py-2'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='text-end'>{children}</span>
    </div>
  )
}

export function KelolaRouter() {
  const [rows, setRows] = useState<RouterRow[]>(DUMMY_ROUTERS)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [routerDetail, setRouterDetail] = useState<RouterRow | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [routerToDelete, setRouterToDelete] = useState<RouterRow | null>(null)
  const [routerToEdit, setRouterToEdit] = useState<RouterRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editHost, setEditHost] = useState('')
  const [editPort, setEditPort] = useState(8728)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    let list = rows
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.lastStatus === statusFilter)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.host.toLowerCase().includes(q)
      )
    }
    return list
  }, [rows, statusFilter, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const openDetail = (router: RouterRow) => {
    setShowPassword(false)
    setRouterDetail(router)
  }

  const openEdit = (router: RouterRow) => {
    setRouterToEdit(router)
    setEditName(router.name)
    setEditHost(router.host)
    setEditPort(router.port)
  }

  const handleEditSave = () => {
    if (!routerToEdit) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === routerToEdit.id
          ? { ...r, name: editName, host: editHost, port: editPort }
          : r
      )
    )
    setRouterToEdit(null)
    toast.success('Data router berhasil diperbarui (dummy)')
  }

  const handleDeleteConfirm = () => {
    if (!routerToDelete) return
    setRows((prev) => prev.filter((r) => r.id !== routerToDelete.id))
    setRouterToDelete(null)
    toast.success('Router berhasil dihapus (dummy)')
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
        <div className={`${outerBoxClass} flex-1`}>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              Kelola Router
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Seluruh router yang terdaftar di platform, semua tenant.
            </p>
          </div>

          {/* Toolbar */}
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='relative w-full sm:max-w-sm'>
              <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Cari router, owner, atau host...'
                className='w-full pl-8'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex w-full gap-2 sm:w-auto'>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[160px]'>
                  <SelectValue placeholder='Filter Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Status</SelectItem>
                  <SelectItem value='ONLINE'>Online</SelectItem>
                  <SelectItem value='OFFLINE'>Offline</SelectItem>
                  <SelectItem value='UNKNOWN'>Unknown</SelectItem>
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
                        Router
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Owner
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Status
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Protokol
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Terakhir Dicek
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
                          colSpan={6}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Tidak ada router yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((router) => (
                        <TableRow key={router.id}>
                          <TableCell className='ps-4'>
                            <div className='flex flex-col whitespace-nowrap'>
                              <span className='text-sm text-foreground'>
                                {router.name}
                              </span>
                              <span className='font-mono text-xs text-muted-foreground'>
                                {router.host}:{router.port}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {router.ownerName}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={router.lastStatus} />
                          </TableCell>
                          <TableCell>
                            <ProtocolBadge useSSL={router.useSSL} />
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                            {router.lastCheckedAt ?? '—'}
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
                                  onClick={() => openDetail(router)}
                                >
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEdit(router)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant='destructive'
                                  onClick={() => setRouterToDelete(router)}
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
                  router
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

      {/* Dialog detail */}
      <Dialog
        open={!!routerDetail}
        onOpenChange={(open) => !open && setRouterDetail(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Detail Router</DialogTitle>
            <DialogDescription>
              Informasi lengkap {routerDetail?.name} milik{' '}
              {routerDetail?.ownerName}.
            </DialogDescription>
          </DialogHeader>
          {routerDetail && (
            <div className='no-scrollbar -mx-6 max-h-[70vh] overflow-y-auto px-6'>
            <div className='flex flex-col divide-y divide-border/40'>
              <DetailRow label='Router'>
                <span className='text-sm text-foreground'>
                  {routerDetail.name}
                </span>
              </DetailRow>
              <DetailRow label='Owner'>
                <span className='text-sm text-foreground'>
                  {routerDetail.ownerName}
                </span>
              </DetailRow>
              <DetailRow label='Status'>
                <StatusBadge status={routerDetail.lastStatus} />
              </DetailRow>
              <DetailRow label='Protokol'>
                <ProtocolBadge useSSL={routerDetail.useSSL} />
              </DetailRow>
              <DetailRow label='Terakhir Dicek'>
                <span className='font-mono text-xs text-muted-foreground tabular-nums'>
                  {routerDetail.lastCheckedAt ?? '—'}
                </span>
              </DetailRow>
              <DetailRow label='Host'>
                <span className='font-mono text-xs'>{routerDetail.host}</span>
              </DetailRow>
              <DetailRow label='Port'>
                <span className='font-mono text-xs tabular-nums'>
                  {routerDetail.port}
                </span>
              </DetailRow>
              <DetailRow label='Username'>
                <span className='font-mono text-xs'>
                  {routerDetail.username}
                </span>
              </DetailRow>
              <DetailRow label='Password'>
                <span className='inline-flex items-center gap-2'>
                  <span className='font-mono text-xs select-all'>
                    {showPassword ? routerDetail.password : '••••••••'}
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
                      {showPassword ? 'Sembunyikan' : 'Tampilkan'} password
                    </span>
                  </Button>
                </span>
              </DetailRow>
              <DetailRow label='Hotspot Name'>
                <span className='font-mono text-xs'>
                  {routerDetail.hotspotName ?? '—'}
                </span>
              </DetailRow>
              <DetailRow label='DNS Login'>
                <span className='font-mono text-xs'>
                  {routerDetail.dnsName ?? '—'}
                </span>
              </DetailRow>
            </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog edit (dummy) */}
      <Dialog
        open={!!routerToEdit}
        onOpenChange={(open) => !open && setRouterToEdit(null)}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Router</DialogTitle>
            <DialogDescription>
              Ubah data router. Perubahan hanya dummy (belum tersambung
              backend).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='router-name'>Nama</Label>
              <Input
                id='router-name'
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='router-host'>Host</Label>
              <Input
                id='router-host'
                className='font-mono'
                value={editHost}
                onChange={(e) => setEditHost(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='router-port'>Port</Label>
              <Input
                id='router-port'
                type='number'
                min={1}
                className='w-[140px] tabular-nums'
                value={editPort}
                onChange={(e) => setEditPort(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRouterToEdit(null)}>
              Batal
            </Button>
            <Button onClick={handleEditSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={!!routerToDelete}
        onOpenChange={(open) => !open && setRouterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Router <strong>{routerToDelete?.name}</strong> milik{' '}
              <strong>{routerToDelete?.ownerName}</strong> akan dihapus dari
              platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRouterToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Router
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
