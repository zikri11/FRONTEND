import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontalIcon,
  SearchIcon,
} from 'lucide-react'
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
import {
  DUMMY_OWNERS,
  PLAN_TIERS,
  type OwnerRow,
  type PlanTier,
} from './data/dummy-owners'

const PAGE_SIZES = [10, 25, 50, 100]

function PlanBadge({ plan }: { plan: PlanTier }) {
  if (plan === 'Pro') {
    return (
      <Badge size='sm' variant='warning-light'>
        Pro
      </Badge>
    )
  }
  if (plan === 'Standard') {
    return (
      <Badge size='sm' variant='info-light'>
        Standard
      </Badge>
    )
  }
  return (
    <Badge size='sm' variant='secondary' className='text-muted-foreground'>
      Free
    </Badge>
  )
}

export function KelolaOwner() {
  const [rows, setRows] = useState<OwnerRow[]>(DUMMY_OWNERS)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [ownerToDelete, setOwnerToDelete] = useState<OwnerRow | null>(null)
  const [ownerToEdit, setOwnerToEdit] = useState<OwnerRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPlan, setEditPlan] = useState<PlanTier>('Free')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    let list = rows
    if (planFilter !== 'all') {
      list = list.filter((o) => o.plan === planFilter)
    }
    const q = debouncedSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [rows, planFilter, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const safePage = Math.min(currentPage, Math.max(1, totalPages))
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const openEdit = (owner: OwnerRow) => {
    setOwnerToEdit(owner)
    setEditName(owner.name)
    setEditEmail(owner.email)
    setEditPlan(owner.plan)
  }

  const handleEditSave = () => {
    if (!ownerToEdit) return
    setRows((prev) =>
      prev.map((o) =>
        o.id === ownerToEdit.id
          ? { ...o, name: editName, email: editEmail, plan: editPlan }
          : o
      )
    )
    setOwnerToEdit(null)
    toast.success('Data owner berhasil diperbarui (dummy)')
  }

  const handleDeleteConfirm = () => {
    if (!ownerToDelete) return
    setRows((prev) => prev.filter((o) => o.id !== ownerToDelete.id))
    setOwnerToDelete(null)
    toast.success('Owner berhasil dihapus (dummy)')
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
              Kelola Owner
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Semua owner (tenant) di platform beserta pemakaiannya.
            </p>
          </div>

          {/* Toolbar */}
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='relative w-full sm:max-w-sm'>
              <SearchIcon className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Cari nama atau email...'
                className='w-full pl-8'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className='flex w-full gap-2 sm:w-auto'>
              <Select
                value={planFilter}
                onValueChange={(v) => {
                  setPlanFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[160px]'>
                  <SelectValue placeholder='Filter Plan' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Plan</SelectItem>
                  {PLAN_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
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
                        Nama
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Email
                      </TableHead>
                      <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                        Plan
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Teknisi
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Router
                      </TableHead>
                      <TableHead className='text-right text-xs font-medium tracking-wide text-muted-foreground'>
                        Transaksi POS
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
                          colSpan={7}
                          className='h-24 text-center text-sm text-muted-foreground'
                        >
                          Tidak ada owner yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((owner) => (
                        <TableRow key={owner.id}>
                          <TableCell className='ps-4 text-sm text-foreground whitespace-nowrap'>
                            {owner.name}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                            {owner.email}
                          </TableCell>
                          <TableCell>
                            <PlanBadge plan={owner.plan} />
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {owner.technicians}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {owner.routers}
                          </TableCell>
                          <TableCell className='text-right text-sm tabular-nums'>
                            {owner.posTransactions.toLocaleString('id-ID')}
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
                                <DropdownMenuItem onClick={() => openEdit(owner)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant='destructive'
                                  onClick={() => setOwnerToDelete(owner)}
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
                  owner
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
        open={!!ownerToEdit}
        onOpenChange={(open) => !open && setOwnerToEdit(null)}
      >
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
            <DialogDescription>
              Ubah data owner. Perubahan hanya dummy (belum tersambung backend).
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label htmlFor='owner-name'>Nama</Label>
              <Input
                id='owner-name'
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='owner-email'>Email</Label>
              <Input
                id='owner-email'
                type='email'
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Plan</Label>
              <Select
                value={editPlan}
                onValueChange={(v) => setEditPlan(v as PlanTier)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Pilih plan' />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOwnerToEdit(null)}>
              Batal
            </Button>
            <Button onClick={handleEditSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus (dummy) */}
      <AlertDialog
        open={!!ownerToDelete}
        onOpenChange={(open) => !open && setOwnerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun owner{' '}
              <strong>{ownerToDelete?.name}</strong> beserta seluruh datanya
              akan dihapus dari platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOwnerToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Hapus Owner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
