import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import { qk } from '@/lib/query-keys'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  EMPTY_PLAN_FORM,
  createPlan,
  fetchPlan,
  planErrorMessage,
  updatePlan,
  type PlanPayload,
} from './data/plans-store'

// Input angka tanpa spinner (▲▼): pakai type text + saring ke digit saja
// (integer positif). inputMode numeric → keyboard angka di mobile.
function digitsOnly(v: string): string {
  return v.replace(/\D/g, '')
}

export function PlanForm({ planId }: { planId?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!planId

  const {
    data: existing,
    isPending: isLoadingPlan,
    isError: isPlanError,
  } = useQuery({
    queryKey: qk.plan(planId ?? ''),
    queryFn: ({ signal }) => fetchPlan(planId as string, signal),
    enabled: isEditing,
  })

  const [form, setForm] = useState<PlanPayload>(EMPTY_PLAN_FORM)
  // Isi form sekali saat data plan tiba (adjust-state-during-render, hindari
  // set-state-in-effect). Re-sync bila id yang termuat berubah.
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (existing && loadedId !== existing.id) {
    setLoadedId(existing.id)
    setForm({
      code: existing.code,
      name: existing.name,
      price: existing.price,
      durationDays: existing.durationDays,
      maxRouters: existing.maxRouters,
      maxTeknisi: existing.maxTeknisi,
      aiAccess: existing.aiAccess,
      apiKeyAccess: existing.apiKeyAccess,
      isActive: existing.isActive,
    })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: PlanPayload) =>
      isEditing ? updatePlan(planId as string, payload) : createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.plans })
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: qk.plan(planId as string) })
      }
      toast.success(
        isEditing ? 'Paket berhasil diperbarui' : 'Paket baru berhasil dibuat'
      )
      navigate({ to: '/plans' })
    },
    onError: (error) =>
      toast.error(planErrorMessage(error, 'Gagal menyimpan paket')),
  })

  const notFound = isEditing && isPlanError
  const loadingPlan = isEditing && isLoadingPlan

  const handleSave = () => {
    const code = form.code.trim().toUpperCase()
    if (!code) {
      toast.error('Kode paket wajib diisi')
      return
    }
    if (!/^[A-Z0-9_]+$/.test(code)) {
      toast.error('Kode hanya boleh huruf besar, angka, dan garis bawah')
      return
    }
    if (!form.name.trim()) {
      toast.error('Nama plan wajib diisi')
      return
    }
    if (form.durationDays !== null && form.durationDays < 1) {
      toast.error('Masa berlaku minimal 1 hari (atau kosongkan = tanpa batas)')
      return
    }
    saveMutation.mutate({ ...form, code, name: form.name.trim() })
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
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
          ) : loadingPlan ? (
            <Card className={nestedCardClass}>
              <CardContent className='flex flex-col gap-5 py-6'>
                <Skeleton className='h-5 w-40' />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='grid gap-2'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-9 w-full' />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <h2 className='text-2xl font-semibold tracking-tight'>
                  {isEditing ? `Edit Plan — ${existing?.name}` : 'Buat Plan'}
                </h2>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {isEditing
                    ? 'Ubah detail plan lalu simpan.'
                    : 'Isi detail plan baru lalu simpan.'}
                </p>
              </div>

              <Card className={nestedCardClass}>
                <CardHeader>
                  <CardTitle>Detail Plan</CardTitle>
                  <CardDescription>
                    Kuota, fitur, dan harga yang berlaku untuk owner pemakai
                    plan ini.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col gap-5'>
                  <div className='grid gap-5 sm:grid-cols-2'>
                    <div className='grid gap-2'>
                      <Label htmlFor='plan-code'>Kode Paket</Label>
                      <Input
                        id='plan-code'
                        placeholder='mis. STANDARD'
                        className='font-mono uppercase'
                        value={form.code}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                      <p className='text-[0.8rem] text-muted-foreground'>
                        Huruf besar, angka, garis bawah. Stabil — dipakai lookup
                        billing.
                      </p>
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='plan-name'>Nama Plan</Label>
                      <Input
                        id='plan-name'
                        placeholder='mis. Standar'
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className='grid gap-5 sm:grid-cols-2'>
                    <div className='grid gap-2'>
                      <Label htmlFor='plan-routers'>Maksimal Router</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          id='plan-routers'
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          className='tabular-nums'
                          value={form.maxRouters}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              maxRouters: Number(digitsOnly(e.target.value)),
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
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          className='tabular-nums'
                          value={form.maxTeknisi}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              maxTeknisi: Number(digitsOnly(e.target.value)),
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
                      <Label>Akses API Key</Label>
                      <RadioGroup
                        className='flex items-center gap-6 pt-1'
                        value={form.apiKeyAccess ? 'aktif' : 'nonaktif'}
                        onValueChange={(v) =>
                          setForm({ ...form, apiKeyAccess: v === 'aktif' })
                        }
                      >
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem value='aktif' id='api-aktif' />
                          <Label htmlFor='api-aktif' className='font-normal'>
                            Aktif
                          </Label>
                        </div>
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem value='nonaktif' id='api-nonaktif' />
                          <Label htmlFor='api-nonaktif' className='font-normal'>
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
                          type='text'
                          inputMode='numeric'
                          pattern='[0-9]*'
                          placeholder='Kosongkan = tanpa batas'
                          className='tabular-nums'
                          value={form.durationDays ?? ''}
                          onChange={(e) => {
                            const d = digitsOnly(e.target.value)
                            setForm({
                              ...form,
                              durationDays: d === '' ? null : Number(d),
                            })
                          }}
                        />
                        <span className='text-sm text-muted-foreground'>
                          hari
                        </span>
                      </div>
                    </div>
                    <div className='grid gap-2'>
                      <Label>Status Paket</Label>
                      <RadioGroup
                        className='flex items-center gap-6 pt-1'
                        value={form.isActive ? 'aktif' : 'nonaktif'}
                        onValueChange={(v) =>
                          setForm({ ...form, isActive: v === 'aktif' })
                        }
                      >
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem value='aktif' id='status-aktif' />
                          <Label htmlFor='status-aktif' className='font-normal'>
                            Aktif
                          </Label>
                        </div>
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem
                            value='nonaktif'
                            id='status-nonaktif'
                          />
                          <Label
                            htmlFor='status-nonaktif'
                            className='font-normal'
                          >
                            Nonaktif
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='plan-price'>Harga</Label>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm text-muted-foreground'>Rp</span>
                      <Input
                        id='plan-price'
                        type='text'
                        inputMode='numeric'
                        pattern='[0-9]*'
                        placeholder='0'
                        className='w-[180px] tabular-nums'
                        // Tampil ber-grup ribuan (id-ID → titik: 1000 → 1.000);
                        // digitsOnly buang titik saat simpan → tetap integer.
                        value={
                          form.price === 0
                            ? ''
                            : form.price.toLocaleString('id-ID')
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            price: Number(digitsOnly(e.target.value)),
                          })
                        }
                      />
                      <span className='text-sm text-muted-foreground'>
                        (0 = gratis)
                      </span>
                    </div>
                  </div>

                  <div className='flex justify-end gap-2'>
                    <Button variant='outline' asChild>
                      <Link to='/plans'>Batal</Link>
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Plan'}
                    </Button>
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
