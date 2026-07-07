import { useState } from 'react'
import { Upload, Download, Users, Tag, MoreHorizontalIcon, RefreshCw } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
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
import { qk } from '@/lib/query-keys'
import { toast } from 'sonner'

type HotspotProfile = {
  id: string
  name: string
  rateLimit?: string
  description?: string
  syncedToRouter?: boolean
  sharedUsers?: number
  validity?: string
}

export function Profiles() {
  const { activeServerId, isLoading } = useServerStore()
  const queryClient = useQueryClient()
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null)

  // Profiles list — scoped to the active router. `signal` cancels the request
  // when the router changes quickly, killing the stale-write race.
  const {
    data: profiles = [],
    isPending,
    isError,
    refetch,
  } = useQuery<HotspotProfile[]>({
    queryKey: qk.profiles(activeServerId ?? 'none'),
    queryFn: ({ signal }) =>
      api
        .get('/profiles', { params: { serverId: activeServerId }, signal })
        .then((res) => res.data),
    enabled: !!activeServerId,
  })

  const invalidateProfiles = () => {
    if (activeServerId) {
      queryClient.invalidateQueries({ queryKey: qk.profiles(activeServerId) })
    }
  }

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/profiles/sync/${activeServerId}`),
    onMutate: () => {
      toast.info('Memulai proses sinkronisasi...')
    },
    onSuccess: () => {
      toast.success('Profil berhasil disinkronkan dengan router!')
      // Sync returns a summary object (not the list) and is synchronous +
      // transactional, so invalidating triggers a fresh, correct refetch.
      invalidateProfiles()
    },
    onError: (error) => {
      const msg =
        error instanceof AxiosError ? error.response?.data?.message : undefined
      toast.error(msg || 'Gagal mensinkronkan data profil.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/profiles/${id}`),
    onSuccess: () => {
      toast.success('Profil berhasil dihapus')
      invalidateProfiles()
    },
    onError: () => {
      toast.error('Gagal menghapus profil')
    },
    onSettled: () => {
      setProfileToDelete(null)
    },
  })

  const isSyncing = syncMutation.isPending

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
                <Button variant='outline' onClick={() => syncMutation.mutate()} disabled={isSyncing}>
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
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Memuat data profil...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <p className="text-muted-foreground">Gagal memuat data profil.</p>
                    <Button variant='outline' size='sm' className='mt-2' onClick={() => refetch()}>
                      Coba Lagi
                    </Button>
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
                onClick={() => profileToDelete && deleteMutation.mutate(profileToDelete)}
                disabled={deleteMutation.isPending}
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
