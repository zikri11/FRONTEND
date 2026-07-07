import { useState, useEffect, useCallback } from 'react'
import { Upload, Download, Users, Tag, MoreHorizontalIcon, RefreshCw } from 'lucide-react'
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

import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { useServerStore } from '@/stores/server-store'
import { api } from '@/lib/axios'
import { toast } from 'sonner'

export function Profiles() {
  const { activeServerId, isLoading } = useServerStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null)

  const fetchProfiles = useCallback(async () => {
    if (!activeServerId) return
    setIsFetching(true)
    try {
      // Ensure the backend endpoint expects or tolerates ?serverId filter
      const res = await api.get(`/profiles`, { params: { serverId: activeServerId } })
      setProfiles(res.data)
    } catch (error) {
      toast.error('Gagal mengambil data profil')
    } finally {
      setIsFetching(false)
    }
  }, [activeServerId])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const handleDeleteConfirm = async () => {
    if (profileToDelete) {
      try {
        await api.delete(`/profiles/${profileToDelete}`)
        toast.success('Profil berhasil dihapus')
        fetchProfiles()
      } catch (error) {
        toast.error('Gagal menghapus profil')
      } finally {
        setProfileToDelete(null)
      }
    }
  }

  const handleSync = async () => {
    if (!activeServerId) return
    setIsSyncing(true)
    toast.info('Memulai proses sinkronisasi...')
    try {
      await api.post(`/profiles/sync/${activeServerId}`)
      toast.success('Profil berhasil disinkronkan dengan router!')
      // Sync endpoint is synchronous + transactional and returns a summary
      // object (not the profile list), so refetch afterwards. Awaited so the
      // spinner and the refreshed table stay coherent.
      await fetchProfiles()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mensinkronkan data profil.')
    } finally {
      setIsSyncing(false)
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
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : (
          <>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>Profil Hotspot</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Kelola paket bandwidth & masa aktif router Anda.
                </p>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Mensinkronkan...' : 'Sinkron'}
                </Button>
                <Button asChild>
                  <Link to='/profiles/add'>Buat Profil</Link>
                </Button>
              </div>
            </div>

        <div className='mt-4 rounded-md border bg-background'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead>Profil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bandwidth (Up/Down)</TableHead>
                <TableHead>Shared</TableHead>
                <TableHead>Masa Aktif</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Memuat data profil...
                  </TableCell>
                </TableRow>
              ) : profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Belum ada profil hotspot.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => {
                  const [up, down] = (profile.rateLimit || '').split('/')
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className='font-medium'>{profile.name}</div>
                        <div className='text-xs text-muted-foreground mt-1'>
                          {profile.description || 'Diimpor otomatis dari router MikroTik'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={`flex w-fit items-center font-normal rounded-full px-2.5 py-0.5 border-muted/50 whitespace-nowrap bg-background ${profile.syncedToRouter ? 'text-muted-foreground' : 'text-amber-500'}`}>
                          <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${profile.syncedToRouter ? 'bg-green-500' : 'bg-amber-500'}`} /> 
                          {profile.syncedToRouter ? 'Sinkron' : 'Belum Sinkron'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2 text-sm font-semibold'>
                          <span className='flex items-center'><Upload className='h-3.5 w-3.5 mr-1 text-muted-foreground' /> {up || '-'}</span>
                          <span className='text-muted-foreground font-normal'>/</span>
                          <span className='flex items-center'><Download className='h-3.5 w-3.5 mr-1 text-muted-foreground' /> {down || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center text-sm font-semibold'>
                          <Users className='h-3.5 w-3.5 mr-1.5 text-muted-foreground' /> {profile.sharedUsers || 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center text-sm font-semibold'>
                          <Tag className='h-3.5 w-3.5 mr-1.5 text-muted-foreground' /> {profile.validity || '-'}
                        </div>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplikat</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant='destructive' onClick={() => setProfileToDelete(profile.id)}>
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Profil Hotspot?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Profil hotspot ini akan dihapus secara permanen dari sistem dan dari router MikroTik Anda.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus Profil
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
