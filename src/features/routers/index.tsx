import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontalIcon,
  SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { useServerStore, type MikrotikServer } from '@/stores/server-store'
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
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
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
import { formatCheckedAt, normalizeStatus, useOwnersMap } from './utils'

const PAGE_SIZES = [10, 25, 50, 100]

export function KelolaRouter() {
  const navigate = useNavigate()
  const { servers, isLoading, error, fetchServers } = useServerStore()
  const ownersMap = useOwnersMap()

  useEffect(() => {
    fetchServers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [routerToDelete, setRouterToDelete] = useState<MikrotikServer | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [routerToEdit, setRouterToEdit] = useState<MikrotikServer | null>(null)
  const [editName, setEditName] = useState('')
  const [editHost, setEditHost] = useState('')
  const [editPort, setEditPort] = useState(8728)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    let list = servers
    if (statusFilter !== 'all') {
      list = list.filter((s) => normalizeStatus(s.lastStatus) === statusFilter)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (ownersMap[s.ownerId] ?? '').toLowerCase().includes(q) ||
          s.host.toLowerCase().includes(q)
      )
    }
    return list
  }, [servers, ownersMap, statusFilter, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const goDetail = (server: MikrotikServer) => {
    navigate({ to: '/routers/$id', params: { id: server.id } })
  }

  const openEdit = (server: MikrotikServer) => {
    setRouterToEdit(server)
    setEditName(server.name)
    setEditHost(server.host)
    setEditPort(server.port)
  }

  const handleEditSave = async () => {
    if (!routerToEdit) return
    setIsSaving(true)
    try {
      await api.patch(`/servers/${routerToEdit.id}`, {
        name: editName,
        host: editHost,
        port: editPort,
      })
      await fetchServers()
      setRouterToEdit(null)
      toast.success('Data router berhasil diperbarui')
    } catch (err) {
      const msg =
        err instanceof AxiosError ? err.response?.data?.message : undefined
      toast.error(msg || 'Gagal memperbarui router')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!routerToDelete) return
    setIsDeleting(true)
    try {
      await api.delete(`/servers/${routerToDelete.id}`)
      await fetchServers()
      setRouterToDelete(null)
      toast.success('Router berhasil dihapus')
    } catch (err) {
      const msg =
        err instanceof AxiosError ? err.response?.data?.message : undefined
      toast.error(msg || 'Gagal menghapus router')
    } finally {
      setIsDeleting(false)
    }
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
                    {isLoading && servers.length === 0 ? (
                      <TableSkeleton rows={8} cols={6} />
                    ) : error ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell colSpan={6} className='h-24 text-center'>
                          <p className='text-sm text-muted-foreground'>
                            Gagal memuat data router.
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2'
                            onClick={() => fetchServers()}
                          >
                            Coba Lagi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : pageRows.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={6}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          {servers.length === 0
                            ? 'Belum ada router yang terdaftar.'
                            : 'Tidak ada router yang cocok.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((server) => (
                        <TableRow
                          key={server.id}
                          className='cursor-pointer'
                          onClick={() => goDetail(server)}
                        >
                          <TableCell className='ps-4'>
                            <div className='flex flex-col whitespace-nowrap'>
                              <span className='text-sm text-foreground'>
                                {server.name}
                              </span>
                              <span className='font-mono text-xs text-muted-foreground'>
                                {server.host}:{server.port}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {ownersMap[server.ownerId] ?? '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={normalizeStatus(server.lastStatus)}
                            />
                          </TableCell>
                          <TableCell>
                            <ProtocolBadge useSSL={server.useSSL} />
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>
                            {formatCheckedAt(server.lastCheckedAt) ?? '—'}
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
                                  onClick={() => goDetail(server)}
                                >
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEdit(server)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant='destructive'
                                  onClick={() => setRouterToDelete(server)}
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

      {/* Dialog edit */}
      <Dialog
        open={!!routerToEdit}
        onOpenChange={(open) => !open && setRouterToEdit(null)}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Router</DialogTitle>
            <DialogDescription>
              Ubah data router milik tenant ini.
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
            <Button
              variant='outline'
              onClick={() => setRouterToEdit(null)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
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
              <strong>
                {routerToDelete ? (ownersMap[routerToDelete.ownerId] ?? '—') : ''}
              </strong>{' '}
              akan dihapus permanen beserta profil dan voucher-nya (cascade).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRouterToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Menghapus...' : 'Hapus Router'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
