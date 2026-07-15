import { useState } from 'react'
import { MoreHorizontalIcon, Copy, Check, TriangleAlert, KeyRound } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Badge } from '@/components/reui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { toast } from 'sonner'

import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { useServerStore } from '@/stores/server-store'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'

type PosKey = {
  id: string
  label: string
  serverId: string
  serverName?: string
  maskedKey: string
  isActive: boolean
  lastUsedAt?: string | null
  createdAt: string
}

// Raw key — returned by POST once, never persisted anywhere.
type CreatedKey = {
  id: string
  label: string
  serverName?: string
  key: string
  message?: string
}

function errorMessage(error: unknown, fallback: string) {
  const m = error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}

function formatDate(value?: string | null) {
  if (!value) return 'Belum dipakai'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Keys() {
  const { servers, activeServerId, isLoading } = useServerStore()
  const queryClient = useQueryClient()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [serverId, setServerId] = useState('')
  const [revealed, setRevealed] = useState<CreatedKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<PosKey | null>(null)

  const {
    data: allKeys = [],
    isPending,
    isError,
    refetch,
  } = useQuery<PosKey[]>({
    queryKey: qk.posKeys,
    queryFn: ({ signal }) => api.get('/pos-keys', { signal }).then((r) => r.data),
    enabled: !!activeServerId,
  })
  // Backend GET /pos-keys returns ALL keys (no serverId/owner scope — a backend
  // gap). Scope to the active router client-side per the "Pilih Router" model.
  const keys = allKeys.filter((k) => k.serverId === activeServerId)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.posKeys })

  const createMutation = useMutation({
    mutationFn: (body: { label: string; serverId: string }) =>
      api.post('/pos-keys', body).then((r) => r.data as CreatedKey),
    onSuccess: (data) => {
      setIsCreateOpen(false)
      setLabel('')
      setCopied(false)
      setRevealed(data) // show the raw key ONCE
      invalidate()
    },
    onError: (error) => toast.error(errorMessage(error, 'Gagal membuat API key.')),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/pos-keys/${id}`, { isActive }),
    onSuccess: () => {
      toast.success('Status API key diperbarui')
      invalidate()
    },
    onError: (error) => toast.error(errorMessage(error, 'Gagal mengubah status key.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pos-keys/${id}`),
    onSuccess: () => {
      toast.success('API key berhasil dihapus')
      invalidate()
    },
    onError: (error) => toast.error(errorMessage(error, 'Gagal menghapus key.')),
    onSettled: () => setKeyToDelete(null),
  })

  const openCreate = () => {
    setLabel('')
    setServerId(activeServerId ?? '')
    setIsCreateOpen(true)
  }

  const submitCreate = () => {
    if (!label.trim()) return toast.error('Label / nama outlet wajib diisi.')
    if (!serverId) return toast.error('Pilih server tujuan.')
    createMutation.mutate({ label: label.trim(), serverId })
  }

  const copyRawKey = () => {
    if (!revealed) return
    navigator.clipboard.writeText(revealed.key)
    setCopied(true)
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
                <h2 className='text-2xl font-semibold tracking-tight'>Integrasi POS</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Hubungkan mesin kasir (POS) ke sistem. Kelola API key untuk router yang dipilih.
                </p>
              </div>
              <Button onClick={openCreate}>Buat API Key</Button>
            </div>

            <div className={`overflow-hidden rounded-xl border ${nestedCardClass}`}>
              <Table>
                <TableHeader>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                      Nama Outlet
                    </TableHead>
                    <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                      Server
                    </TableHead>
                    <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                      Status
                    </TableHead>
                    <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                      Dibuat
                    </TableHead>
                    <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                      Terakhir Digunakan
                    </TableHead>
                    <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={6} className='h-24 text-center text-sm text-muted-foreground'>
                        Memuat API key...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={6} className='h-24 text-center'>
                        <p className='text-sm text-muted-foreground'>Gagal memuat API key.</p>
                        <Button variant='outline' size='sm' className='mt-2' onClick={() => refetch()}>
                          Coba Lagi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : keys.length === 0 ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={6} className='h-24 text-center text-sm text-muted-foreground'>
                        Belum ada API key untuk router ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <div className='bg-muted rounded-sm flex size-9 shrink-0 items-center justify-center'>
                              <KeyRound className='text-muted-foreground size-4' aria-hidden='true' />
                            </div>
                            <div className='flex flex-col'>
                              <span className='text-sm text-foreground'>{key.label}</span>
                              <span className='text-muted-foreground font-mono text-xs'>{key.maskedKey}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{key.serverName || '-'}</TableCell>
                        <TableCell>
                          {key.isActive ? (
                            <Badge size='sm' className='border-success/20 bg-success/10 text-success'>
                              Aktif
                            </Badge>
                          ) : (
                            <Badge size='sm' variant='secondary' className='text-muted-foreground'>
                              Nonaktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>{formatDate(key.createdAt)}</TableCell>
                        <TableCell className='text-right font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap'>{formatDate(key.lastUsedAt)}</TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='size-8'>
                                <MoreHorizontalIcon />
                                <span className='sr-only'>Buka menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                              >
                                {key.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant='destructive' onClick={() => setKeyToDelete(key)}>
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
            </div>
          </>
        )}
      </Main>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Buat API Key Baru</DialogTitle>
            <DialogDescription>
              Generate kunci rahasia untuk menyambungkan aplikasi kasir Anda.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-5 py-4'>
            <div className='grid gap-2'>
              <label htmlFor='label' className='text-sm font-medium leading-none'>
                Label / Nama Outlet <span className='text-destructive'>*</span>
              </label>
              <Input
                id='label'
                placeholder='contoh: Kasir Cabang Pusat'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <label htmlFor='server' className='text-sm font-medium leading-none'>
                Server / Router Tujuan <span className='text-destructive'>*</span>
              </label>
              <Select value={serverId} onValueChange={setServerId}>
                <SelectTrigger id='server' className='w-full'>
                  <SelectValue placeholder='Pilih router tujuan' />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.host})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-[0.8rem] text-muted-foreground'>
                Key hanya bisa akses server ini (isolasi antar outlet).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
              Batal
            </Button>
            <Button type='button' onClick={submitCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Membuat...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal-once dialog */}
      <Dialog open={!!revealed} onOpenChange={(open) => !open && setRevealed(null)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>API Key Berhasil Dibuat</DialogTitle>
            <DialogDescription>
              {revealed?.label ? `Outlet: ${revealed.label}` : 'Salin key ini sekarang.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 py-2'>
            <div className='flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              <TriangleAlert className='mt-0.5 h-4 w-4 shrink-0' />
              <span>Simpan key ini sekarang. Key mentah <b>tidak akan ditampilkan lagi</b> setelah dialog ditutup.</span>
            </div>
            <div className='flex items-center gap-2'>
              <code className='flex-1 break-all rounded bg-muted px-3 py-2 font-mono text-sm'>
                {revealed?.key}
              </code>
              <Button variant='outline' size='icon' onClick={copyRawKey} aria-label='Salin key'>
                {copied ? <Check className='h-4 w-4 text-success' /> : <Copy className='h-4 w-4' />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealed(null)}>Selesai &amp; Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Key <b>{keyToDelete?.label}</b> akan dihapus permanen. Aplikasi kasir yang memakai key
              ini akan langsung kehilangan akses. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => keyToDelete && deleteMutation.mutate(keyToDelete.id)}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
