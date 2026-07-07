import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Store, Zap, KeyRound } from 'lucide-react'
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

export function AddBulkVoucher() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    profile: '',
    quantity: '10',
    prefix: '',
    length: '4',
    charType: 'alphanumeric', // letters, numbers, alphanumeric
    charCase: 'uppercase', // uppercase, lowercase, mixed
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
    
    const qty = parseInt(formData.quantity)
    if (!formData.quantity || isNaN(qty) || qty < 1) {
      newErrors.quantity = 'Jumlah voucher tidak valid'
    } else if (qty > 200) {
      newErrors.quantity = 'Maksimal pembuatan 200 voucher per batch'
    }

    const len = parseInt(formData.length)
    if (!formData.length || isNaN(len) || len < 3 || len > 12) {
      newErrors.length = 'Panjang karakter antara 3-12'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Harap periksa kembali isian Anda.')
      return
    }

    setIsSubmitting(true)
    toast.info(`Membuat ${formData.quantity} voucher massal...`)

    // Mock submit
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(`${formData.quantity} voucher berhasil di-generate!`)
      router.navigate({ to: '/vouchers' })
    }, 1500)
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
            <h2 className='text-2xl font-bold tracking-tight'>Buat Voucher Massal</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Generate ratusan kode voucher secara instan dalam satu langkah.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='mt-2 space-y-6'>
          {/* Pengaturan Utama */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Zap className='h-5 w-5 text-primary' />
                <span>Pengaturan Utama</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Tentukan paket dan jumlah voucher yang ingin digenerate.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-5'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Profil Hotspot */}
                <Field className='col-span-1'>
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
                    <FieldDescription>Paket yang akan diaplikasikan ke semua voucher.</FieldDescription>
                  )}
                </Field>

                {/* Jumlah Voucher */}
                <Field className='col-span-1'>
                  <FieldLabel>Jumlah Voucher <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    type='number'
                    min='1'
                    max='200'
                    placeholder='10'
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    aria-invalid={!!errors.quantity}
                  />
                  {errors.quantity ? (
                    <FieldError>{errors.quantity}</FieldError>
                  ) : (
                    <FieldDescription>Berapa banyak voucher yang akan dibuat (Maks 200 per batch).</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Format Kode */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <KeyRound className='h-5 w-5 text-primary' />
                <span>Format Kode</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Atur prefix (awalan), panjang karakter, dan kombinasi huruf/angka.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Prefix Kode */}
                <Field className='col-span-1'>
                  <FieldLabel>Prefix Kode (Opsional)</FieldLabel>
                  <Input
                    placeholder='contoh: KAFE-'
                    value={formData.prefix}
                    onChange={(e) => handleChange('prefix', e.target.value)}
                  />
                  <FieldDescription>Teks awalan sebelum kode acak (misal: KAFE-WXBZ).</FieldDescription>
                </Field>

                {/* Panjang Karakter */}
                <Field className='col-span-1'>
                  <FieldLabel>Panjang Karakter Acak <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    type='number'
                    min='3'
                    max='12'
                    placeholder='4'
                    value={formData.length}
                    onChange={(e) => handleChange('length', e.target.value)}
                    aria-invalid={!!errors.length}
                  />
                  {errors.length ? (
                    <FieldError>{errors.length}</FieldError>
                  ) : (
                    <FieldDescription>Jumlah karakter acak yang menempel setelah prefix (contoh: 4 = WXBZ).</FieldDescription>
                  )}
                </Field>

                {/* Tipe Karakter */}
                <Field className='col-span-1'>
                  <FieldLabel>Kombinasi Karakter</FieldLabel>
                  <Select
                    value={formData.charType}
                    onValueChange={(val) => handleChange('charType', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='letters'>Huruf Saja (Tanpa angka)</SelectItem>
                      <SelectItem value='numbers'>Angka Saja (0-9)</SelectItem>
                      <SelectItem value='alphanumeric'>Huruf + Angka (Campuran)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Pilih jenis karakter yang akan digunakan untuk kode.</FieldDescription>
                </Field>

                {/* Huruf Besar/Kecil */}
                <Field className='col-span-1'>
                  <FieldLabel>Format Huruf</FieldLabel>
                  <Select
                    value={formData.charCase}
                    onValueChange={(val) => handleChange('charCase', val)}
                    disabled={formData.charType === 'numbers'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='uppercase'>AA (Huruf Besar A-Z)</SelectItem>
                      <SelectItem value='lowercase'>aa (Huruf Kecil a-z)</SelectItem>
                      <SelectItem value='mixed'>Aa (Campur Besar/Kecil)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {formData.charType === 'numbers' 
                      ? 'Tidak berlaku untuk Angka Saja.' 
                      : 'Atur kapitalisasi huruf pada kode voucher.'}
                  </FieldDescription>
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
                Informasi tambahan yang akan tertera pada struk cetak massal nantinya.
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
                <FieldDescription>Nama lokasi atau warung yang akan dicetak pada tiap struk voucher.</FieldDescription>
              </Field>
            </CardContent>

            <CardFooter className='bg-muted/10 border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center'>
              <div className='hidden sm:block text-xs text-muted-foreground'>
                Semua voucher yang terbuat otomatis di-set Aktif.
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
                  {isSubmitting ? 'Generate Voucher...' : 'Generate Massal'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Main>
    </>
  )
}
