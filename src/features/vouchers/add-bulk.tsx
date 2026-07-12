import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Store, Zap, KeyRound } from 'lucide-react'
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
import { ConfigDrawer } from '@/components/config-drawer'
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

type CharFormat =
  | 'UPPERCASE'
  | 'LOWERCASE'
  | 'MIXED_CASE'
  | 'LETTERS_ONLY'
  | 'NUMBERS_ONLY'
  | 'ALPHANUMERIC'

type BatchPayload = {
  serverId: string
  profileId: string
  count: number
  usernamePrefix?: string
  charLength?: number
  charFormat?: CharFormat
  outletName?: string
}

// The two form selects (letters/numbers/alphanumeric + case) map onto the
// backend's single CharFormat enum.
function toCharFormat(charType: string, charCase: string): CharFormat {
  if (charType === 'numbers') return 'NUMBERS_ONLY'
  if (charType === 'alphanumeric') return 'ALPHANUMERIC'
  if (charCase === 'lowercase') return 'LOWERCASE'
  if (charCase === 'mixed') return 'MIXED_CASE'
  return 'UPPERCASE'
}

function errorMessage(error: unknown, fallback: string) {
  const msg = error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' ? msg : fallback
}

export function AddBulkVoucher() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeServerId } = useServerStore()
  const [formData, setFormData] = useState({
    profile: '',
    quantity: '10',
    prefix: '',
    length: '6',
    charType: 'alphanumeric', // letters, numbers, alphanumeric
    charCase: 'uppercase', // uppercase, lowercase, mixed
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
    mutationFn: (payload: BatchPayload) => api.post('/vouchers/batch', payload),
    onSuccess: (_res, payload) => {
      toast.success(`${payload.count} voucher sedang dibuat di background — akan muncul bertahap.`)
      if (activeServerId) {
        queryClient.invalidateQueries({ queryKey: qk.vouchers(activeServerId) })
      }
      router.navigate({ to: '/vouchers' })
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Gagal membuat voucher massal.'))
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

    const qty = parseInt(formData.quantity)
    if (!formData.quantity || isNaN(qty) || qty < 1) {
      newErrors.quantity = 'Jumlah voucher tidak valid'
    } else if (qty > 200) {
      newErrors.quantity = 'Maksimal pembuatan 200 voucher per batch'
    }

    const len = parseInt(formData.length)
    if (!formData.length || isNaN(len) || len < 4 || len > 10) {
      newErrors.length = 'Panjang karakter antara 4-10'
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
    createMutation.mutate({
      serverId: activeServerId as string,
      profileId: formData.profile,
      count: parseInt(formData.quantity),
      usernamePrefix: formData.prefix || undefined,
      charLength: parseInt(formData.length),
      charFormat: toCharFormat(formData.charType, formData.charCase),
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
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={outerBoxClass}>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div>
              <h2 className='text-2xl font-semibold tracking-tight'>Buat Voucher Massal</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                Generate ratusan kode voucher secara instan dalam satu langkah.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Pengaturan Utama */}
            <Card className={`${nestedCardClass} shadow-md border`}>
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
            <Card className={`${nestedCardClass} shadow-md border`}>
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
                    min='4'
                    max='10'
                    placeholder='6'
                    value={formData.length}
                    onChange={(e) => handleChange('length', e.target.value)}
                    aria-invalid={!!errors.length}
                  />
                  {errors.length ? (
                    <FieldError>{errors.length}</FieldError>
                  ) : (
                    <FieldDescription>Jumlah karakter acak yang menempel setelah prefix (4-10).</FieldDescription>
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
            <Card className={`${nestedCardClass} shadow-md border`}>
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
        </div>
      </Main>
    </>
  )
}
