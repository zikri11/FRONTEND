import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontalIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
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
import { ProtocolBadge, StatusBadge } from './components'
import { DUMMY_ROUTERS, type RouterRow } from './data/dummy-routers'

const PAGE_SIZES = [10, 25, 50, 100]

export function KelolaRouter() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<RouterRow[]>(DUMMY_ROUTERS)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const goDetail = (router: RouterRow) => {
    navigate({ to: '/routers/$id', params: { id: router.id } })
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
                        <TableRow
                          key={router.id}
                          className='cursor-pointer'
                          onClick={() => goDetail(router)}
                        >
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
                          <TableCell
                            className='pe-4 text-right'
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                  onClick={() => goDetail(router)}
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
