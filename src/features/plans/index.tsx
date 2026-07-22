import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, MoreHorizontalIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
import { Badge } from '@/components/reui/badge'
import { IconStack } from '@/components/reui/icon-stack'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  fetchPlans,
  formatRupiah,
  planErrorMessage,
  removePlan,
  type Plan,
} from './data/plans-store'

const COLS = 10

// Badge fitur (AI / API Key): aktif = hijau, nonaktif = abu.
function FeatureBadge({ on }: { on: boolean }) {
  return on ? (
    <Badge size='sm' variant='success-light'>
      Aktif
    </Badge>
  ) : (
    <Badge size='sm' variant='secondary' className='text-muted-foreground'>
      Nonaktif
    </Badge>
  )
}

export function KelolaPlan() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)

  const {
    data: plans = [],
    isPending,
    isError,
    refetch,
  } = useQuery<Plan[]>({
    queryKey: qk.plans,
    queryFn: ({ signal }) => fetchPlans(signal),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePlan(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.plans })
      toast.success(
        result.softDeleted
          ? 'Paket dinonaktifkan (masih dipakai langganan aktif)'
          : 'Paket dihapus permanen'
      )
    },
    onError: (error) =>
      toast.error(planErrorMessage(error, 'Gagal menghapus paket')),
    onSettled: () => setPlanToDelete(null),
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={`${outerBoxClass} flex-1`}>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>
                Kelola Plan
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                Atur paket langganan yang tersedia untuk owner.
              </p>
            </div>
            <Button onClick={() => navigate({ to: '/plans/add' })}>
              <PlusIcon className='mr-2 h-4 w-4' />
              Tambah Plan
            </Button>
          </div>

          <Card className={`${nestedCardClass} py-0`}>
            <CardContent className='px-0'>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='ps-4 text-xs font-medium tracking-wide text-muted-foreground'>
                        Kode
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Nama
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Router
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Teknisi
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        AI
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        API Key
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Masa
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Harga
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Status
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableSkeleton rows={5} cols={COLS} />
                    ) : isError ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell colSpan={COLS} className='h-24 text-center'>
                          <p className='text-sm text-muted-foreground'>
                            Gagal memuat daftar paket.
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
                    ) : plans.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={COLS}
                          className='py-12 text-center text-sm text-muted-foreground'
                        >
                          <div className='flex flex-col items-center gap-3'>
                            <IconStack aria-hidden='true'>
                              <Layers className='size-5' />
                            </IconStack>
                            <span>Belum ada paket.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => {
                        const isFree = plan.code === 'FREE'
                        return (
                          <TableRow
                            key={plan.id}
                            className={plan.isActive ? undefined : 'opacity-60'}
                          >
                            <TableCell className='ps-4 font-mono text-xs text-muted-foreground whitespace-nowrap'>
                              {plan.code}
                            </TableCell>
                            <TableCell className='text-sm text-foreground whitespace-nowrap'>
                              {plan.name}
                            </TableCell>
                            <TableCell className='text-right text-sm tabular-nums'>
                              {plan.maxRouters}
                            </TableCell>
                            <TableCell className='text-right text-sm tabular-nums'>
                              {plan.maxTeknisi}
                            </TableCell>
                            <TableCell>
                              <FeatureBadge on={plan.aiAccess} />
                            </TableCell>
                            <TableCell>
                              <FeatureBadge on={plan.apiKeyAccess} />
                            </TableCell>
                            <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                              {plan.durationDays
                                ? `${plan.durationDays} hari`
                                : 'Tanpa batas'}
                            </TableCell>
                            <TableCell className='text-right font-mono text-xs tabular-nums whitespace-nowrap'>
                              {formatRupiah(plan.price)}
                            </TableCell>
                            <TableCell>
                              {plan.isActive ? (
                                <Badge size='sm' variant='success-light'>
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
                                    onClick={() =>
                                      navigate({
                                        to: '/plans/edit/$id',
                                        params: { id: plan.id },
                                      })
                                    }
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant='destructive'
                                    disabled={isFree}
                                    onClick={() => setPlanToDelete(plan)}
                                  >
                                    {isFree ? 'Hapus (FREE dilindungi)' : 'Hapus'}
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
            </CardContent>
          </Card>
        </div>
      </Main>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket <strong>{planToDelete?.name}</strong> akan dihapus. Bila
              masih dipakai langganan aktif, paket hanya dinonaktifkan (histori
              tagihan tetap utuh); bila tidak, dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                planToDelete && deleteMutation.mutate(planToDelete.id)
              }
              disabled={deleteMutation.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
