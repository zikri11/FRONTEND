import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  EMPTY_PLAN_FORM,
  getPlan,
  upsertPlan,
  type PlanRow,
} from './data/plans-store'

export function PlanForm({ planId }: { planId?: string }) {
  const navigate = useNavigate()
  const existing = planId ? getPlan(planId) : undefined
  const [form, setForm] = useState<Omit<PlanRow, 'id'>>(
    existing
      ? {
          name: existing.name,
          maxRouters: existing.maxRouters,
          maxTechnicians: existing.maxTechnicians,
          aiAccess: existing.aiAccess,
          durationDays: existing.durationDays,
          price: existing.price,
          period: existing.period,
        }
      : EMPTY_PLAN_FORM
  )

  const notFound = !!planId && !existing

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Nama plan wajib diisi')
      return
    }
    upsertPlan(form, planId)
    toast.success(
      planId
        ? 'Plan berhasil diperbarui (dummy)'
        : 'Plan baru berhasil dibuat (dummy)'
    )
    navigate({ to: '/plans' })
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-3 sm:gap-4'>
        <div>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 -ms-2 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/plans' aria-label='Kembali ke Kelola Plan'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
        </div>
        <div className={`${outerBoxClass} flex-1`}>
          {notFound ? (
            <div className='flex flex-1 flex-col items-center justify-center py-20 text-center'>
              <h2 className='mb-2 text-xl font-semibold'>
                Plan Tidak Ditemukan
              </h2>
              <p className='text-sm text-muted-foreground'>
                Plan ini mungkin telah dihapus.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  {planId ? `Edit Plan — ${existing?.name}` : 'Buat Plan'}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {planId
                    ? 'Ubah detail plan lalu simpan.'
                    : 'Isi detail plan baru lalu simpan.'}
                </p>
              </div>

              <Card className={nestedCardClass}>
                <CardHeader>
                  <CardTitle>Detail Plan</CardTitle>
                  <CardDescription>
                    Kuota dan harga yang berlaku untuk owner pemakai plan ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-5'>
                  <div className='grid gap-2'>
                    <Label htmlFor='plan-name'>Nama Plan</Label>
                    <Input
                      id='plan-name'
                      placeholder='mis. Standard'
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                            setForm({
                              ...form,
                              maxRouters: Number(e.target.value),
                            })
                          }
                        />
                        <span className='text-sm text-muted-foreground'>
                          unit
                        </span>
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
                        <span className='text-sm text-muted-foreground'>
                          orang
                        </span>
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
                        <span className='text-sm text-muted-foreground'>
                          hari
                        </span>
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
                    <Button variant='outline' asChild>
                      <Link to='/plans'>Batal</Link>
                    </Button>
                    <Button onClick={handleSave}>Simpan Plan</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </Main>
    </>
  )
}
