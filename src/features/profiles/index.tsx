import { useState } from 'react'
import { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoreHorizontalIcon, RefreshCw, Gauge } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Badge } from '@/components/reui/badge'
import { RouterLoadingOverlay } from '@/components/router-loading-overlay'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

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
  const role = useAuthStore((s) => s.auth.user?.role)
  const isOwner = role === 'OWNER'
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
            <div className={`${outerBoxClass} flex-1`}>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                  <h2 className='text-2xl font-semibold tracking-tight'>
                    Profil Hotspot
                  </h2>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Kelola paket bandwidth & masa aktif router Anda.
                  </p>
                </div>
                {!isOwner && (
                  <div className='flex gap-2'>
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
                    <Button asChild>
                      <Link to='/profiles/add'>Buat Profil</Link>
                    </Button>
                  </div>
                )}
              </div>

              <div
                className={`relative overflow-hidden rounded-xl border ${nestedCardClass}`}
              >
                <RouterLoadingOverlay show={isPending} />
                <Table>
                  <TableHeader className='bg-muted/50'>
                    <TableRow>
                      <TableHead>Profil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bandwidth</TableHead>
                      <TableHead>Shared</TableHead>
                      <TableHead>Masa Aktif</TableHead>
                      <TableHead className='text-right'>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className='py-6 text-center'>
                          <p className='text-muted-foreground'>
                            Gagal memuat data profil.
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
                    ) : profiles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='py-6 text-center text-muted-foreground'
                        >
                          Belum ada profil hotspot.
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => {
                        const [up, down] = (profile.rateLimit || '').split('/')
                        return (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <div className='flex items-center gap-3'>
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted'>
                                  <Gauge
                                    className='size-4 text-muted-foreground'
                                    aria-hidden='true'
                                  />
                                </div>
                                <div className='flex flex-col'>
                                  <span className='text-sm font-medium'>
                                    {profile.name}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {profile.description ||
                                      'Diimpor otomatis dari router MikroTik'}
                                  </span>
                                </div>
                              </div>
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
                            <TableCell>
                              {up || '-'} / {down || '-'}
                            </TableCell>
                            <TableCell>{profile.sharedUsers || 1}</TableCell>
                            <TableCell>{profile.validity || '-'}</TableCell>
                            <TableCell className='text-right'>
                              {!isOwner && (
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
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem>
                                      Duplikat
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant='destructive'
                                      onClick={() =>
                                        setProfileToDelete(profile.id)
                                      }
                                    >
                                      Hapus
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <AlertDialog
              open={!!profileToDelete}
              onOpenChange={(open) => !open && setProfileToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Profil Hotspot?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Profil hotspot ini akan
                    dihapus secara permanen dari sistem dan dari router MikroTik
                    Anda.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setProfileToDelete(null)}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      profileToDelete && deleteMutation.mutate(profileToDelete)
                    }
                    disabled={deleteMutation.isPending}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
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
