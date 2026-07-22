import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Server, Wifi, Key, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldError,
} from '@/components/ui/field'
import { AxiosError } from 'axios'
import { api } from '@/lib/axios'
import { outerBoxClass, nestedCardClass } from '@/lib/nested-box'

// Pola sama dengan form voucher: pesan dari backend bisa berupa string atau
// array (validasi class-validator).
function errorMessage(error: unknown, fallback: string) {
  const msg =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' ? msg : fallback
}

export function RegisterRouter() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    routerName: '',
    host: '',
    port: '8728',
    username: '',
    password: '',
    hotspotName: '',
    dnsName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error', message: string } | null>(null)
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
    if (!formData.routerName.trim()) newErrors.routerName = 'Nama Router wajib diisi'
    if (!formData.host.trim()) newErrors.host = 'Host IP / Domain wajib diisi'
    if (!formData.port.trim()) newErrors.port = 'Port API wajib diisi'
    if (!formData.username.trim()) newErrors.username = 'Username Admin wajib diisi'
    if (!formData.password.trim()) newErrors.password = 'Password wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Harap isi semua kolom wajib sebelum melakukan tes koneksi.')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    toast.info('Sedang menguji koneksi ke router MikroTik...')

    try {
      const response = await api.post('/servers/test-connection-custom', {
        host: formData.host,
        port: Number(formData.port),
        username: formData.username,
        password: formData.password,
      })

      if (response.data?.success) {
        toast.success(response.data.message || 'Koneksi berhasil! Router MikroTik merespons dengan baik.')
        setTestResult({ status: 'success', message: 'Koneksi Berhasil' })
      } else {
        toast.error(response.data?.error || 'Gagal terhubung ke router. Periksa IP, Port, dan Kredensial.')
        setTestResult({ status: 'error', message: 'Koneksi Gagal' })
      }
    } catch (error) {
      toast.error(
        errorMessage(
          error,
          'Gagal terhubung ke router. Periksa IP, Port, dan Kredensial.'
        )
      )
      setTestResult({ status: 'error', message: 'Koneksi Gagal' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Harap periksa kembali isian form Anda.')
      return
    }

    setIsSubmitting(true)
    toast.info('Mendaftarkan router...')

    try {
      await api.post('/servers', {
        name: formData.routerName,
        host: formData.host,
        port: Number(formData.port),
        username: formData.username,
        password: formData.password,
        hotspotName: formData.hotspotName || undefined,
        dnsName: formData.dnsName || undefined,
      })
      
      toast.success('Router berhasil didaftarkan ke sistem!')
      router.navigate({ to: '/servers' })
    } catch (error) {
      toast.error(errorMessage(error, 'Gagal mendaftarkan router.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 me-auto'>
          <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
            <Link to='/servers'>
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
              <h2 className='text-2xl font-semibold tracking-tight'>Daftarkan Router</h2>
              <p className='text-sm text-muted-foreground mt-1'>
                Masukkan konfigurasi API port dan kredensial untuk mendaftarkan router MikroTik baru.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <Card className={`${nestedCardClass} shadow-md border`}>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Server className='h-5 w-5 text-primary' />
                <span>Informasi Koneksi Router</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Kolom dengan tanda * wajib diisi. Pastikan API Port MikroTik sudah aktif.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6 space-y-5'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Router Name */}
                <Field className='col-span-1'>
                  <FieldLabel>Nama Router <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    placeholder='contoh: KANTOR UTAMA'
                    value={formData.routerName}
                    onChange={(e) => handleChange('routerName', e.target.value)}
                    aria-invalid={!!errors.routerName}
                  />
                  {errors.routerName ? (
                    <FieldError>{errors.routerName}</FieldError>
                  ) : (
                    <FieldDescription>Nama pengenal unik router dalam sistem.</FieldDescription>
                  )}
                </Field>

                {/* Host IP / Domain */}
                <Field className='col-span-1'>
                  <FieldLabel>Host IP / Domain <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    placeholder='contoh: 103.24.56.78 atau id-30.hostddns.us'
                    value={formData.host}
                    onChange={(e) => {
                      // Terima IPv4 maupun hostname/domain (huruf, angka,
                      // titik, tanda hubung) — mis. id-30.hostddns.us
                      const value = e.target.value.replace(/[^a-zA-Z0-9.-]/g, '')
                      handleChange('host', value)
                    }}
                    aria-invalid={!!errors.host}
                  />
                  {errors.host ? (
                    <FieldError>{errors.host}</FieldError>
                  ) : (
                    <FieldDescription>IP publik atau alamat tunnel/DDNS router.</FieldDescription>
                  )}
                </Field>

                {/* Port API */}
                <Field className='col-span-1'>
                  <FieldLabel>Port API <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    type='text'
                    placeholder='default: 8728'
                    value={formData.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    aria-invalid={!!errors.port}
                  />
                  {errors.port ? (
                    <FieldError>{errors.port}</FieldError>
                  ) : (
                    <FieldDescription>
                      Port API MikroTik. Bawaannya 8728.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>

              {/* Penyebab kegagalan paling sering: alamat lokal yang cuma bisa
                  dijangkau dari dalam outlet. Ditaruh tepat setelah Host & Port
                  — dua kolom yang dibicarakannya.
                  Aksen warna dari token semantic `info`, permukaan tetap datar
                  dengan hairline 1px, bukan panel berwarna tebal. */}
              <Alert className='border-info/20 bg-info/10'>
                <Globe className='text-info' />
                {/* line-clamp-none: bawaan AlertTitle memotong 1 baris, judul
                    ini terpotong di layar sempit. tracking-normal: 14/500
                    adalah Label, tracking negatif hanya untuk heading. */}
                <AlertTitle className='line-clamp-none tracking-normal text-foreground'>
                  Router harus bisa dihubungi dari internet
                </AlertTitle>
                {/* Body 14/400 pakai tangga tingkat-2 (secondary), bukan muted —
                    muted #8f8f8f gagal AA untuk teks kecil di light mode. */}
                <AlertDescription className='text-text-secondary'>
                  <p>
                    Sistem menghubungi router dari server kami, bukan dari
                    jaringan outlet. Alamat lokal seperti{' '}
                    <code className='font-mono text-sm'>192.168.x.x</code> tidak
                    akan terjangkau.
                  </p>
                  <p>
                    Pakai IP publik dengan port API yang sudah diteruskan, atau
                    layanan tunnel/DDNS bila outlet memakai IP dinamis. Belum
                    yakin? Isi dulu, lalu tekan{' '}
                    <span className='font-medium text-foreground'>
                      Uji Koneksi Router
                    </span>{' '}
                    di bawah sebelum menyimpan.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Kredensial Admin Card */}
            <Card className={`${nestedCardClass} shadow-md border`}>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Key className='h-5 w-5 text-primary' />
                <span>Kredensial Login Router</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Gunakan user MikroTik dengan hak akses minimum read/write (full disarankan).
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Username */}
                <Field className='col-span-1'>
                  <FieldLabel>Username Admin <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    placeholder='contoh: admin'
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    aria-invalid={!!errors.username}
                  />
                  {errors.username && <FieldError>{errors.username}</FieldError>}
                </Field>

                {/* Password */}
                <Field className='col-span-1'>
                  <FieldLabel>Password <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    type='password'
                    placeholder='••••••••'
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <FieldError>{errors.password}</FieldError>}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Data Hotspot (Optional) Card */}
            <Card className={`${nestedCardClass} shadow-md border`}>
            <CardHeader className='border-b bg-muted/20 px-6 py-4'>
              <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                <Wifi className='h-5 w-5 text-primary' />
                <span>Konfigurasi Hotspot (Opsional)</span>
              </CardTitle>
              <CardDescription className='text-xs'>
                Isian ini opsional. Jika diisi, sistem akan otomatis mencocokkan server hotspot Anda di MikroTik.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-6'>
              <FieldGroup className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                {/* Hotspot Name */}
                <Field className='col-span-1'>
                  <FieldLabel>Hotspot Name</FieldLabel>
                  <Input
                    placeholder='contoh: hs-outlet-1'
                    value={formData.hotspotName}
                    onChange={(e) => handleChange('hotspotName', e.target.value)}
                  />
                  <FieldDescription>Nama server hotspot yang dikonfigurasi di MikroTik.</FieldDescription>
                </Field>

                {/* DNS Name */}
                <Field className='col-span-1'>
                  <FieldLabel>DNS Name</FieldLabel>
                  <Input
                    placeholder='contoh: hotspot.wifi atau outlet1.net'
                    value={formData.dnsName}
                    onChange={(e) => handleChange('dnsName', e.target.value)}
                  />
                  <FieldDescription>DNS Name untuk mengarahkan pengguna ke portal login.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className='bg-muted/10 border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center'>
              <div className='flex items-center gap-3 w-full sm:w-auto'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleTestConnection}
                  disabled={isTesting || isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  {isTesting ? 'Sedang Tes...' : 'Uji Koneksi Router'}
                </Button>
                {testResult && (
                  <span className={`text-sm font-medium ${testResult.status === 'success' ? 'text-success' : 'text-error'}`}>
                    {testResult.message}
                  </span>
                )}
              </div>
              <div className='flex gap-3 w-full sm:w-auto justify-end'>
                <Button
                  type='button'
                  variant='ghost'
                  asChild
                  disabled={isSubmitting}
                  className='w-full sm:w-auto font-medium'
                >
                  <Link to='/servers'>Batal</Link>
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting || isTesting}
                  className='w-full sm:w-auto font-medium'
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Router'}
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
