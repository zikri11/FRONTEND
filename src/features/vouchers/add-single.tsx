import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Ticket, Store } from 'lucide-react'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'
import { toast } from 'sonner'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldError,
} from '@/components/ui/field'

export function AddSingleVoucher() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    profile: '',
    voucherCode: '',
    password: '',
    outletName: 'KANTOR EG1',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!formData.profile) newErrors.profile = 'Profil Hotspot wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Masih ada isian yang terlewat atau tidak valid.')
      return
    }

    setIsSubmitting(true)
    toast.info('Membuat voucher tunggal...')

    // Mock submit
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success('Voucher berhasil dibuat!')
      router.navigate({ to: '/vouchers' })
    }, 1200)
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
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Buat Voucher Tunggal</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Buat satu voucher spesifik untuk langsung diberikan kepada pelanggan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='mt-2 space-y-6'>
          {/* Pengaturan Utama */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
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
                  >
                    <SelectTrigger aria-invalid={!!errors.profile}>
                      <SelectValue placeholder='Pilih paket internet' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1orang'>1ORANG (1 Hari - 1M/2M)</SelectItem>
                      <SelectItem value='default'>default (1 Hari - 2M/2M)</SelectItem>
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
                    placeholder='contoh: VIP-USER'
                    value={formData.voucherCode}
                    onChange={(e) => handleChange('voucherCode', e.target.value)}
                  />
                  <FieldDescription>Kosongkan jika ingin sistem yang membuat kode acak otomatis.</FieldDescription>
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
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
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
      </Main>
    </>
  )
}
