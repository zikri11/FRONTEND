import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  deletePlan,
  formatRupiah,
  getPlans,
  type PlanRow,
} from './data/plans-store'

export function KelolaPlan() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<PlanRow[]>(() => getPlans())
  const [planToDelete, setPlanToDelete] = useState<PlanRow | null>(null)
  // Placeholder loading — ganti dengan isPending dari useQuery saat Kelola Plan
  // di-wire ke GET /plans (data saat ini masih dummy sinkron).
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleDeleteConfirm = () => {
    if (!planToDelete) return
    deletePlan(planToDelete.id)
    setPlans(getPlans())
    setPlanToDelete(null)
    toast.success('Plan berhasil dihapus (dummy)')
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
                        Masa
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Harga
                      </TableHead>
                      <TableHead className='pe-4 text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton rows={5} cols={7} />
                    ) : plans.length === 0 ? (
                      <TableRow className='hover:bg-transparent'>
                        <TableCell
                          colSpan={7}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Belum ada plan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                            {plan.name}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {plan.maxRouters}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {plan.maxTechnicians}
                          </TableCell>
                          <TableCell>
                            {plan.aiAccess ? (
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
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {plan.durationDays} hari
                          </TableCell>
                          <TableCell className='text-right font-mono text-xs tabular-nums whitespace-nowrap'>
                            {formatRupiah(plan.price)}
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
                                  onClick={() => setPlanToDelete(plan)}
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
              Plan <strong>{planToDelete?.name}</strong> akan dihapus. Owner
              yang sedang memakai plan ini tidak terpengaruh (dummy).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlanToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
