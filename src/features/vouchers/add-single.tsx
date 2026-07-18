import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Ticket, Store } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { toast } from 'sonner'
import { useServerStore } from '@/stores/server-store'
import { api } from '@/lib/axios'
import { qk } from '@/lib/query-keys'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldError,
} from '@/components/ui/field'

type ProfileOption = { id: string; name: string }

type SinglePayload = {
  serverId: string
  profileId: string
  username?: string
  password?: string
  outletName?: string
}

function errorMessage(error: unknown, fallback: string) {
  const msg = error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' ? msg : fallback
}

export function AddSingleVoucher() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeServerId } = useServerStore()
  const [formData, setFormData] = useState({
    profile: '',
    voucherCode: '',
    password: '',
    outletName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: profiles = [], isPending: profilesLoading } = useQuery<ProfileOption[]>({
    queryKey: qk.profiles(activeServerId ?? 'none'),
    queryFn: ({ signal }) =>
      api.get('/profiles', { params: { serverId: activeServerId }, signal }).then((r) => r.data),
    enabled: !!activeServerId,
  })

  const createMutation = useMutation({
    mutationFn: (payload: SinglePayload) => api.post('/vouchers/single', payload),
    onSuccess: () => {
      toast.success('Voucher berhasil dibuat!')
      if (activeServerId) {
        queryClient.invalidateQueries({ queryKey: qk.vouchers(activeServerId) })
      }
      router.navigate({ to: '/vouchers' })
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Gagal membuat voucher.'))
    },
  })
  const isSubmitting = createMutation.isPending

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!activeServerId) newErrors.profile = 'Pilih router dulu lewat "Pilih Router".'
    else if (!formData.profile) newErrors.profile = 'Profil Hotspot wajib dipilih'
    if (formData.voucherCode && (formData.voucherCode.length < 4 || formData.voucherCode.length > 12)) {
      newErrors.voucherCode = 'Kode voucher harus 4-12 karakter'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Masih ada isian yang terlewat atau tidak valid.')
      return
    }
    createMutation.mutate({
      serverId: activeServerId as string,
      profileId: formData.profile,
      username: formData.voucherCode || undefined,
      password: formData.password || undefined,
      outletName: formData.outletName || undefined,
    })
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 me-auto'>
          <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
            <Link to='/vouchers'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Search className='hidden sm:block' />
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={outerBoxClass}>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>Buat Voucher Tunggal</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                Buat satu voucher spesifik untuk langsung diberikan kepada pelanggan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Pengaturan Utama */}
            <Card className={`${nestedCardClass} shadow-md border`}>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Ticket className='h-5 w-5 text-primary' />
                <span>Informasi Voucher</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Tentukan paket internet dan kustomisasi kode akses sesuai kebutuhan.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-5'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Profil Hotspot */}
                <Field className='col-span-1 md:col-span-2 md:w-1/2'>
                  <FieldLabel>Profil Hotspot <span className='text-destructive'>*</span></FieldLabel>
                  <Select
                    value={formData.profile}
                    onValueChange={(val) => handleChange('profile', val)}
                    disabled={!activeServerId || profilesLoading}
                  >
                    <SelectTrigger aria-invalid={!!errors.profile}>
                      <SelectValue placeholder={profilesLoading ? 'Memuat profil...' : 'Pilih paket internet'} />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.length === 0 ? (
                        <div className='p-2 text-xs text-muted-foreground'>
                          Belum ada profil. Buat / sinkron profil dulu.
                        </div>
                      ) : (
                        profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.profile ? (
                    <FieldError>{errors.profile}</FieldError>
                  ) : (
                    <FieldDescription>Paket bandwidth dan masa aktif yang akan diterapkan ke voucher ini.</FieldDescription>
                  )}
                </Field>

                {/* Kode Voucher */}
                <Field className='col-span-1'>
                  <FieldLabel>Kode Voucher (Username)</FieldLabel>
                  <Input
                    placeholder='contoh: VIPUSER'
                    value={formData.voucherCode}
                    onChange={(e) => handleChange('voucherCode', e.target.value)}
                    aria-invalid={!!errors.voucherCode}
                  />
                  {errors.voucherCode ? (
                    <FieldError>{errors.voucherCode}</FieldError>
                  ) : (
                    <FieldDescription>Kosongkan jika ingin sistem yang membuat kode acak otomatis (4-12 karakter).</FieldDescription>
                  )}
                </Field>

                {/* Password */}
                <Field className='col-span-1'>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    placeholder='contoh: rahasia123'
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                  <FieldDescription>Kosongkan agar password disamakan dengan Kode Voucher.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Konfigurasi Tambahan */}
            <Card className={`${nestedCardClass} shadow-md border`}>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Store className='h-5 w-5 text-primary' />
                <span>Info Pencetakan</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Informasi tambahan yang akan tertera pada struk cetak nantinya.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <Field className='col-span-1 md:w-1/2'>
                <FieldLabel>Nama Outlet (Opsional)</FieldLabel>
                <Input
                  placeholder='contoh: Kedai Kopi ABC'
                  value={formData.outletName}
                  onChange={(e) => handleChange('outletName', e.target.value)}
                />
                <FieldDescription>Nama lokasi atau warung yang akan dicetak pada struk voucher.</FieldDescription>
              </Field>
            </CardContent>

            <CardFooter className='bg-muted/10 border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center'>
              <div className='hidden sm:block text-xs text-muted-foreground'>
                Pastikan paket internet sudah terkonfigurasi di MikroTik.
              </div>
              <div className='flex gap-3 w-full sm:w-auto justify-end'>
                <Button
                  type='button'
                  variant='ghost'
                  asChild
                  disabled={isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  <Link to='/vouchers'>Batal</Link>
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Voucher'}
                </Button>
              </div>
            </CardFooter>
          </Card>
          </form>
        </div>
      </Main>
    </>
  )
}
