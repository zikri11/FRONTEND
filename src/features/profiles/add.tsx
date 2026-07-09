import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Settings, Users, Clock, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { api } from '@/lib/axios'
import { useServerStore } from '@/stores/server-store'

export function AddProfile() {
  const router = useRouter()
  const { activeServerId } = useServerStore()
  const [formData, setFormData] = useState({
    profileName: '',
    rateLimit: '',
    sharedUsers: '1',
    validity: '',
    sessionTimeout: '',
    idleTimeout: '',
    description: '',
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
    if (!formData.profileName.trim()) newErrors.profileName = 'Nama profil wajib diisi'
    if (!formData.rateLimit.trim()) newErrors.rateLimit = 'Batas kecepatan (Rate Limit) wajib diisi'
    if (!activeServerId) newErrors.profileName = 'Silakan pilih router terlebih dahulu di bagian atas.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      if (!activeServerId) toast.error('Router belum dipilih! Silakan pilih router aktif terlebih dahulu.')
      else toast.error('Masih ada isian yang terlewat atau tidak valid.')
      return
    }

    setIsSubmitting(true)
    toast.info('Menyimpan profil hotspot...')

    try {
      await api.post('/profiles', {
        serverId: activeServerId,
        name: formData.profileName,
        rateLimit: formData.rateLimit,
        sharedUsers: Number(formData.sharedUsers) || 1,
        validity: formData.validity || undefined,
        description: formData.description || undefined,
        sessionTimeout: formData.sessionTimeout || undefined,
        idleTimeout: formData.idleTimeout || undefined,
      })

      toast.success('Profil hotspot berhasil dibuat!')
      router.navigate({ to: '/profiles' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan profil hotspot.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 me-auto'>
          <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
            <Link to='/profiles'>
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
            <h2 className='text-2xl font-semibold tracking-tight'>Buat Profil Hotspot Baru</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Tentukan paket bandwidth, masa aktif, dan batasan sesi untuk pengguna Anda.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='mt-2 space-y-6'>
          {/* Konfigurasi Dasar */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Settings className='h-5 w-5 text-primary' />
                <span>Pengaturan Utama</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Atur nama paket dan kecepatan internet yang akan didapatkan pelanggan.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-5'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Profile Name */}
                <Field className='col-span-1'>
                  <FieldLabel>Nama Profil <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    placeholder='contoh: PAKET 1 BULAN'
                    value={formData.profileName}
                    onChange={(e) => handleChange('profileName', e.target.value)}
                    aria-invalid={!!errors.profileName}
                  />
                  {errors.profileName ? (
                    <FieldError>{errors.profileName}</FieldError>
                  ) : (
                    <FieldDescription>Beri nama yang mudah dikenali untuk paket ini.</FieldDescription>
                  )}
                </Field>

                {/* Rate Limit */}
                <Field className='col-span-1'>
                  <FieldLabel>Rate Limit (Up/Down) <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    placeholder='contoh: 1M/2M'
                    value={formData.rateLimit}
                    onChange={(e) => handleChange('rateLimit', e.target.value)}
                    aria-invalid={!!errors.rateLimit}
                  />
                  {errors.rateLimit ? (
                    <FieldError>{errors.rateLimit}</FieldError>
                  ) : (
                    <FieldDescription>Kecepatan internet maksimal (Upload / Download).</FieldDescription>
                  )}
                </Field>

                {/* Shared Users */}
                <Field className='col-span-1 md:col-span-2 md:w-1/2'>
                  <FieldLabel>Shared Users</FieldLabel>
                  <div className='relative'>
                    <Users className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='number'
                      min='1'
                      className='pl-9'
                      placeholder='1'
                      value={formData.sharedUsers}
                      onChange={(e) => handleChange('sharedUsers', e.target.value)}
                    />
                  </div>
                  <FieldDescription>Berapa banyak perangkat yang bisa login bersamaan dengan 1 akun.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Pengaturan Waktu & Sesi */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Clock className='h-5 w-5 text-primary' />
                <span>Pengaturan Waktu & Sesi</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Kontrol berapa lama voucher atau akun pelanggan ini bisa digunakan.<br/>
                <span className="text-destructive">Gunakan Format: s (detik), m (menit), h (jam), d (hari), w (minggu).</span>
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Masa Aktif (Validity) */}
                <Field className='col-span-1'>
                  <FieldLabel>Masa Aktif (Validity)</FieldLabel>
                  <Input
                    placeholder='contoh: 30d (30 hari), 12h (12 jam)'
                    value={formData.validity}
                    onChange={(e) => handleChange('validity', e.target.value)}
                  />
                  <FieldDescription>Batas waktu akun akan kedaluwarsa setelah pertama kali dibeli atau digunakan.</FieldDescription>
                </Field>

                {/* Session Timeout */}
                <Field className='col-span-1'>
                  <FieldLabel>Session Timeout</FieldLabel>
                  <Input
                    placeholder='contoh: 4h untuk 4 jam'
                    value={formData.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                  />
                  <FieldDescription>Waktu maksimal sesi sebelum otomatis terputus (opsional).</FieldDescription>
                </Field>

                {/* Idle Timeout */}
                <Field className='col-span-1'>
                  <FieldLabel>Idle Timeout</FieldLabel>
                  <Input
                    placeholder='contoh: 15m untuk 15 menit'
                    value={formData.idleTimeout}
                    onChange={(e) => handleChange('idleTimeout', e.target.value)}
                  />
                  <FieldDescription>Otomatis terputus jika tidak ada aktivitas.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
          
          {/* Tambahan Info */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <FileText className='h-5 w-5 text-primary' />
                <span>Informasi Tambahan (Opsional)</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Tambahkan deskripsi internal mengenai profil ini.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <Field className='col-span-1'>
                <FieldLabel>Deskripsi Profil</FieldLabel>
                <Textarea
                  placeholder='Contoh: Paket ini khusus untuk pelanggan VIP dengan prioritas bandwidth tinggi...'
                  className='resize-none h-24'
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                <FieldDescription>Catatan internal, tidak terlihat oleh pengguna.</FieldDescription>
              </Field>
            </CardContent>

            <CardFooter className='bg-muted/10 border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center'>
              <div className='hidden sm:block text-xs text-muted-foreground'>
                Pastikan konfigurasi sesuai dengan kapasitas jaringan router Anda.
              </div>
              <div className='flex gap-3 w-full sm:w-auto justify-end'>
                <Button
                  type='button'
                  variant='ghost'
                  asChild
                  disabled={isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  <Link to='/profiles'>Batal</Link>
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Main>
    </>
  )
}
