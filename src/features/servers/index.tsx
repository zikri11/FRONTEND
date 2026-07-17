import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Server,
  ServerOff,
  MoreHorizontalIcon,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/reui/badge'
import { IconStack } from '@/components/reui/icon-stack'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'
import { useServerStore } from '@/stores/server-store'
import { useAuthStore } from '@/stores/auth-store'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'

function StatusBadge({ status }: { status: string }) {
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : 'Unknown'
  if (status === 'ONLINE') {
    return (
      <Badge size='sm' className='border-success/20 bg-success/10 text-success'>
        {label}
      </Badge>
    )
  }
  if (status === 'OFFLINE') {
    return (
      <Badge size='sm' variant='secondary' className='text-muted-foreground'>
        {label}
      </Badge>
    )
  }
  return (
    <Badge size='sm' className='border-warning/20 bg-warning/10 text-warning'>
      {label}
    </Badge>
  )
}

export function Servers() {
  const { servers, isLoading, fetchServers } = useServerStore()
  const role = useAuthStore((s) => s.auth.user?.role)
  const isOwner = role === 'OWNER'
  const [testingId, setTestingId] = useState<string | null>(null)
  const [serverToDelete, setServerToDelete] = useState<string | null>(null)

  const handleDeleteConfirm = async () => {
    if (serverToDelete) {
      try {
        await api.delete(`/servers/${serverToDelete}`)
        toast.success('Router berhasil dihapus secara permanen')
        await fetchServers()
      } catch (error) {
        const msg = error instanceof AxiosError ? error.response?.data?.message : undefined
        toast.error(msg || 'Gagal menghapus router')
      } finally {
        setServerToDelete(null)
      }
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    toast.info('Sedang menguji koneksi ke router...')
    try {
      const response = await api.post(`/servers/${id}/test-connection`)
      toast.success(response.data.message || 'Koneksi berhasil!')
      await fetchServers() // Refresh the list to get updated status
    } catch (error) {
      const msg = error instanceof AxiosError ? error.response?.data?.message : undefined
      toast.error(msg || 'Gagal terhubung ke router.')
      await fetchServers() // Refresh anyway to get OFFLINE status if it changed
    } finally {
      setTestingId(null)
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
        {/* flex-1: card fills the remaining viewport height (empty space stays
            inside the card, below the table) yet grows past it when rows overflow */}
        <div className={`${outerBoxClass} flex-1`}>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Server Router</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Kelola koneksi multi-server MikroTik, uji latensi API, & atur kredensial.
            </p>
          </div>
          {!isOwner && (
            <Button asChild>
              <Link to='/servers/add'>Daftarkan Router</Link>
            </Button>
          )}
        </div>

        <div className={`overflow-hidden rounded-xl border ${nestedCardClass}`}>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Router
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Status
                </TableHead>
                <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                  Protokol
                </TableHead>
                <TableHead className='w-10 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={4} className='h-24 text-center text-sm text-muted-foreground'>
                    Memuat data router...
                  </TableCell>
                </TableRow>
              ) : servers.length === 0 ? (
                <TableRow className='hover:bg-transparent'>
                  <TableCell
                    colSpan={4}
                    className='py-12 text-center text-sm text-muted-foreground'
                  >
                    <div className='flex flex-col items-center gap-3'>
                      <IconStack aria-hidden='true'>
                        <ServerOff className='size-5' />
                      </IconStack>
                      <span>Belum ada router yang terdaftar.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='bg-muted rounded-sm flex size-9 shrink-0 items-center justify-center'>
                          <Server className='text-muted-foreground size-4' aria-hidden='true' />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-sm text-foreground'>{server.name}</span>
                          <span className='text-muted-foreground font-mono text-xs'>
                            {server.host}:{server.port}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={server.lastStatus} />
                    </TableCell>
                    <TableCell>
                      <Badge size='sm' variant='secondary' className='gap-1 font-normal text-muted-foreground'>
                        {server.useSSL ? (
                          <>
                            <ShieldCheck className='text-success' /> HTTPS / SSL
                          </>
                        ) : (
                          <>
                            <ShieldAlert /> HTTP
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='size-8'>
                            <MoreHorizontalIcon />
                            <span className='sr-only'>Buka menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {!isOwner && (
                            <DropdownMenuItem asChild>
                              <Link to='/servers/edit/$id' params={{ id: server.id }}>Edit</Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleTestConnection(server.id)}
                            disabled={testingId === server.id}
                          >
                            {testingId === server.id ? 'Menguji...' : 'Test Koneksi'}
                          </DropdownMenuItem>
                          {!isOwner && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant='destructive' onClick={() => setServerToDelete(server.id)}>
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
        </div>
        </div>

        <AlertDialog open={!!serverToDelete} onOpenChange={(open) => !open && setServerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Router ini akan dihapus secara permanen dari sistem Anda.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServerToDelete(null)}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                Lanjutkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
