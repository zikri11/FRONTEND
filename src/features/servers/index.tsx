import { MoreHorizontalIcon, ShieldAlert } from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { toast } from 'sonner'
import { api } from '@/lib/axios'

import { useServerStore } from '@/stores/server-store'
import { Shield, ShieldCheck, BadgeCheck, XCircle, Clock } from 'lucide-react'
import { useState } from 'react'

export function Servers() {
  const { servers, isLoading, fetchServers } = useServerStore()
  const [testingId, setTestingId] = useState<string | null>(null)
  const [serverToDelete, setServerToDelete] = useState<string | null>(null)

  const handleDeleteConfirm = async () => {
    if (serverToDelete) {
      try {
        await api.delete(`/servers/${serverToDelete}`)
        toast.success('Router berhasil dihapus secara permanen')
        await fetchServers()
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menghapus router')
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal terhubung ke router.')
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
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Server Router</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Kelola koneksi multi-server MikroTik, uji latensi API, & atur kredensial.
            </p>
          </div>
          <Button asChild>
            <Link to='/servers/add'>Daftarkan Router</Link>
          </Button>
        </div>

        <div className='mt-4 rounded-md border bg-background'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead>Nama Router</TableHead>
                <TableHead>IP & Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Protokol</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Memuat data router...
                  </TableCell>
                </TableRow>
              ) : servers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Belum ada router yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className='font-medium'>{server.name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {server.host}:{server.port}
                    </TableCell>
                    <TableCell>
                      {server.lastStatus === 'ONLINE' ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                          <BadgeCheck className="w-3.5 h-3.5 mr-1" data-icon="inline-start" />
                          ONLINE
                        </Badge>
                      ) : server.lastStatus === 'OFFLINE' ? (
                        <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20">
                          <XCircle className="w-3.5 h-3.5 mr-1" data-icon="inline-start" />
                          OFFLINE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
                          <Clock className="w-3.5 h-3.5 mr-1" data-icon="inline-start" />
                          {server.lastStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='text-muted-foreground font-normal rounded-md border-muted/50'>
                        {server.useSSL ? (
                          <><ShieldCheck className='mr-1.5 h-3 w-3 text-green-500' /> HTTPS / SSL</>
                        ) : (
                          <><ShieldAlert className='mr-1.5 h-3 w-3' /> HTTP</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='size-8'>
                            <MoreHorizontalIcon />
                            <span className='sr-only'>Buka menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild>
                            <Link to="/servers/edit/$id" params={{ id: server.id }}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleTestConnection(server.id)}
                            disabled={testingId === server.id}
                          >
                            {testingId === server.id ? 'Menguji...' : 'Test Koneksi'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant='destructive' onClick={() => setServerToDelete(server.id)}>
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
