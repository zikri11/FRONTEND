import { useState } from 'react'
import { Check, MoreHorizontalIcon, PlusIcon } from 'lucide-react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

// Dummy CRUD plan (state lokal) — backend baru punya Plan {code, maxRouters,
// price, durationDays}; maxTechnicians & akses AI = kebutuhan backend baru.
type PlanRow = {
  id: string
  name: string
  maxRouters: number
  maxTechnicians: number
  aiAccess: boolean
  durationDays: number
  price: number
  period: 'Bulan' | 'Tahun'
}

const INITIAL_PLANS: PlanRow[] = [
  { id: 'plan-free', name: 'Free', maxRouters: 5, maxTechnicians: 2, aiAccess: false, durationDays: 30, price: 0, period: 'Bulan' },
  { id: 'plan-standard', name: 'Standard', maxRouters: 25, maxTechnicians: 10, aiAccess: true, durationDays: 30, price: 149000, period: 'Bulan' },
  { id: 'plan-pro', name: 'Pro', maxRouters: 100, maxTechnicians: 50, aiAccess: true, durationDays: 30, price: 299000, period: 'Bulan' },
]

const EMPTY_FORM = {
  name: '',
  maxRouters: 0,
  maxTechnicians: 0,
  aiAccess: false,
  durationDays: 30,
  price: 0,
  period: 'Bulan' as const,
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function KelolaPlan() {
  const [plans, setPlans] = useState<PlanRow[]>(INITIAL_PLANS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<PlanRow, 'id'>>(EMPTY_FORM)
  const [planToDelete, setPlanToDelete] = useState<PlanRow | null>(null)

  const editingPlan = editingId
    ? (plans.find((p) => p.id === editingId) ?? null)
    : null

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const startEdit = (plan: PlanRow) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      maxRouters: plan.maxRouters,
      maxTechnicians: plan.maxTechnicians,
      aiAccess: plan.aiAccess,
      durationDays: plan.durationDays,
      price: plan.price,
      period: plan.period,
    })
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Nama plan wajib diisi')
      return
    }
    if (editingId) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
      )
      toast.success('Plan berhasil diperbarui (dummy)')
    } else {
      setPlans((prev) => [
        ...prev,
        { id: `plan-${prev.length + 1}-${form.name.toLowerCase()}`, ...form },
      ])
      toast.success('Plan baru berhasil dibuat (dummy)')
    }
    resetForm()
  }

  const handleDeleteConfirm = () => {
    if (!planToDelete) return
    setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id))
    if (editingId === planToDelete.id) resetForm()
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
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              Kelola Plan
            </h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Atur paket langganan yang tersedia untuk owner.
            </p>
          </div>

          {/* Daftar plan */}
          <div className='flex items-center justify-between'>
            <h3 className='text-base font-semibold'>Daftar Plan</h3>
            <Button onClick={resetForm}>
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
                    {plans.length === 0 ? (
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
                                <DropdownMenuItem onClick={() => startEdit(plan)}>
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

          {/* Form buat / edit */}
          <Card className={nestedCardClass}>
            <CardHeader>
              <CardTitle>
                {editingPlan ? `Edit Plan — ${editingPlan.name}` : 'Buat Plan'}
              </CardTitle>
              <CardDescription>
                {editingPlan
                  ? 'Ubah detail plan lalu simpan.'
                  : 'Isi detail plan baru lalu simpan.'}
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-5'>
              <div className='grid gap-2'>
                <Label htmlFor='plan-name'>Nama Plan</Label>
                <Input
                  id='plan-name'
                  placeholder='mis. Standard'
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className='grid gap-5 sm:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor='plan-routers'>Maksimal Router</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='plan-routers'
                      type='number'
                      min={0}
                      className='tabular-nums'
                      value={form.maxRouters}
                      onChange={(e) =>
                        setForm({ ...form, maxRouters: Number(e.target.value) })
                      }
                    />
                    <span className='text-sm text-muted-foreground'>unit</span>
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='plan-technicians'>Maksimal Teknisi</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='plan-technicians'
                      type='number'
                      min={0}
                      className='tabular-nums'
                      value={form.maxTechnicians}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxTechnicians: Number(e.target.value),
                        })
                      }
                    />
                    <span className='text-sm text-muted-foreground'>orang</span>
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label>Akses AI</Label>
                  <RadioGroup
                    className='flex items-center gap-6 pt-1'
                    value={form.aiAccess ? 'aktif' : 'nonaktif'}
                    onValueChange={(v) =>
                      setForm({ ...form, aiAccess: v === 'aktif' })
                    }
                  >
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='aktif' id='ai-aktif' />
                      <Label htmlFor='ai-aktif' className='font-normal'>
                        Aktif
                      </Label>
                    </div>
                    <div className='flex items-center gap-2'>
                      <RadioGroupItem value='nonaktif' id='ai-nonaktif' />
                      <Label htmlFor='ai-nonaktif' className='font-normal'>
                        Nonaktif
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='plan-duration'>Masa Berlaku</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='plan-duration'
                      type='number'
                      min={1}
                      className='tabular-nums'
                      value={form.durationDays}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationDays: Number(e.target.value),
                        })
                      }
                    />
                    <span className='text-sm text-muted-foreground'>hari</span>
                  </div>
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='plan-price'>Harga</Label>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Rp</span>
                  <Input
                    id='plan-price'
                    type='number'
                    min={0}
                    className='w-[180px] tabular-nums'
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                  />
                  <span className='text-sm text-muted-foreground'>per</span>
                  <Select
                    value={form.period}
                    onValueChange={(v) =>
                      setForm({ ...form, period: v as PlanRow['period'] })
                    }
                  >
                    <SelectTrigger className='w-[110px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Bulan'>Bulan</SelectItem>
                      <SelectItem value='Tahun'>Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={resetForm}>
                  Batal
                </Button>
                <Button onClick={handleSave}>Simpan Plan</Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className={nestedCardClass}>
            <CardHeader>
              <CardTitle>Preview tampilan ke user</CardTitle>
              <CardDescription>
                Beginilah plan ini terlihat di halaman langganan owner.
              </CardDescription>
            </CardHeader>
            <CardContent className='flex justify-center'>
              <Card className={`${nestedCardClass} w-full max-w-xs`}>
                <CardContent className='flex flex-col gap-4'>
                  <div>
                    <p className='text-base font-semibold'>
                      {form.name || 'Nama Plan'}
                    </p>
                    <p className='mt-1 text-2xl font-semibold tracking-tight tabular-nums'>
                      {formatRupiah(form.price)}
                      <span className='text-sm font-normal text-muted-foreground'>
                        {' '}
                        / {form.period.toLowerCase()}
                      </span>
                    </p>
                  </div>
                  <hr className='border-border/40' />
                  <ul className='flex flex-col gap-2'>
                    <li className='flex items-center gap-2 text-sm'>
                      <Check className='h-4 w-4 text-success' />
                      {form.maxRouters} Router
                    </li>
                    <li className='flex items-center gap-2 text-sm'>
                      <Check className='h-4 w-4 text-success' />
                      {form.maxTechnicians} Teknisi
                    </li>
                    {form.aiAccess && (
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 text-success' />
                        Akses AI
                      </li>
                    )}
                  </ul>
                  <p className='text-xs text-muted-foreground'>
                    Aktif {form.durationDays} hari
                  </p>
                  <Button className='w-full'>Pilih Plan</Button>
                </CardContent>
              </Card>
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
