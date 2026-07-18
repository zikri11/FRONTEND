import { useState, useEffect } from 'react'
import { Link, useRouter, useParams } from '@tanstack/react-router'
import { ArrowLeft, Server, Wifi, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { api } from '@/lib/axios'

export function EditRouter() {
  const router = useRouter()
  // @ts-ignore - Route generic typing will handle this in actual implementation
  const { id } = useParams({ strict: false })
  
  const [formData, setFormData] = useState({
    routerName: '',
    host: '',
    port: '8728',
    useSsl: false,
    username: '',
    password: '',
    hotspotName: '',
    dnsName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error', message: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const res = await api.get(`/servers/${id}`)
        const serverData = res.data
        setFormData({
          routerName: serverData.name || '',
          host: serverData.host || '',
          port: String(serverData.port) || '8728',
          useSsl: serverData.useSSL || false,
          username: serverData.username || '',
          password: '', // Empty password field
          hotspotName: serverData.hotspotName || '',
          dnsName: serverData.dnsName || '',
        })
      } catch (error) {
        toast.error('Gagal mengambil data server')
        router.navigate({ to: '/servers' })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchServer()
    }
  }, [id, router])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'useSsl') {
        updated.port = value ? '8729' : '8728'
      }
      return updated
    })
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
    // Password is not required on edit
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
      if (formData.password) {
        const response = await api.post('/servers/test-connection-custom', {
          host: formData.host,
          port: Number(formData.port),
          username: formData.username,
          password: formData.password,
          useSSL: formData.useSsl,
        })
        if (response.data?.success) {
          toast.success(response.data.message || 'Koneksi berhasil! Router MikroTik merespons dengan baik.')
          setTestResult({ status: 'success', message: 'Koneksi Berhasil' })
        } else {
          toast.error(response.data?.error || 'Gagal terhubung ke router. Periksa IP, Port, dan Kredensial.')
          setTestResult({ status: 'error', message: 'Koneksi Gagal' })
        }
      } else {
        toast.info('Tes koneksi menggunakan password tersimpan. Jika Anda merubah IP/Username, silakan simpan dulu.')
        const response = await api.post(`/servers/${id}/test-connection`)
        if (response.data?.success) {
          toast.success(response.data.message || 'Koneksi berhasil! Router MikroTik merespons dengan baik.')
          setTestResult({ status: 'success', message: 'Koneksi Berhasil' })
        } else {
          toast.error(response.data?.error || 'Gagal terhubung ke router. Periksa konfigurasi.')
          setTestResult({ status: 'error', message: 'Koneksi Gagal' })
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal terhubung ke router. Periksa IP, Port, dan Kredensial.')
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
    toast.info('Menyimpan perubahan router...')

    try {
      const payload: any = {
        name: formData.routerName,
        host: formData.host,
        port: Number(formData.port),
        username: formData.username,
        useSSL: formData.useSsl,
        hotspotName: formData.hotspotName || undefined,
        dnsName: formData.dnsName || undefined,
      }
      
      if (formData.password) {
        payload.password = formData.password
      }

      await api.patch(`/servers/${id}`, payload)
      
      toast.success('Router berhasil diperbarui!')
      // Refresh the server list by updating the store or letting the list fetch it
      router.navigate({ to: '/servers' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui router.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className='flex items-center gap-2 me-auto'>
            <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
              <Link to='/servers'>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </Button>
          </div>
          <ThemeSwitch />
          <ProfileDropdown />
        </Header>
        <Main className='flex flex-1 flex-col items-center justify-center'>
          <p className='text-muted-foreground'>Memuat data router...</p>
        </Main>
      </>
    )
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
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>Edit Router</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Perbarui konfigurasi API port dan kredensial router MikroTik Anda.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='mt-2 space-y-6'>
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
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
                    placeholder='contoh: 192.168.1.1 atau router.mydomain.com'
                    value={formData.host}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      handleChange('host', value)
                    }}
                    aria-invalid={!!errors.host}
                  />
                  {errors.host ? (
                    <FieldError>{errors.host}</FieldError>
                  ) : (
                    <FieldDescription>IP Address publik/lokal atau nama domain router.</FieldDescription>
                  )}
                </Field>

                {/* Port API */}
                <Field className='col-span-1'>
                  <FieldLabel>Port API <span className='text-destructive'>*</span></FieldLabel>
                  <Input
                    type='text'
                    placeholder='default: 8728 (atau 8729 untuk SSL)'
                    value={formData.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    aria-invalid={!!errors.port}
                  />
                  {errors.port && <FieldError>{errors.port}</FieldError>}
                  <div className='flex items-center space-x-2 mt-3.5'>
                    <Checkbox
                      id='useSsl'
                      checked={formData.useSsl}
                      onCheckedChange={(checked) => handleChange('useSsl', !!checked)}
                    />
                    <label
                      htmlFor='useSsl'
                      className='text-xs text-muted-foreground font-medium cursor-pointer select-none'
                    >
                      Gunakan SSL untuk koneksi aman (port default berubah ke 8729)
                    </label>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Kredensial Admin Card */}
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
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
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type='password'
                    placeholder='Kosongkan jika tidak ingin mengubah password'
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
          <Card className='shadow-md border bg-card/40 backdrop-blur-xs'>
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Main>
    </>
  )
}
