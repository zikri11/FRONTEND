import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/reui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// GET /auth/me → data akun (nama/email/role/bergabung). Update nama & password
// via PATCH /users/:id (OWNER/SUPER_ADMIN). TEKNISI = read-only (tak ada endpoint).
type Me = {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'TEKNISI'
  ownerId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const ROLE_LABEL: Record<Me['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  TEKNISI: 'Teknisi',
}

const profileFormSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nama minimal 2 karakter.')
      .max(60, 'Nama maksimal 60 karakter.'),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === '' || d.newPassword.length >= 6, {
    message: 'Password minimal 6 karakter.',
    path: ['newPassword'],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok.',
    path: ['confirmPassword'],
  })

type ProfileFormValues = z.infer<typeof profileFormSchema>

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function errorMessage(error: unknown, fallback: string): string {
  const m =
    error instanceof AxiosError ? error.response?.data?.message : undefined
  if (Array.isArray(m)) return m.join(', ')
  return typeof m === 'string' ? m : fallback
}

export function ProfileForm() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.auth.user)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const isReadOnly = user?.role === 'TEKNISI'

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: ({ signal }) =>
      api.get('/auth/me', { signal }).then((r) => r.data as Me),
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    // Sinkron dari server saat /auth/me tiba (tetap simpan editan pengguna).
    values: {
      name: me?.name ?? user?.name ?? '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      const payload: { name: string; password?: string } = {
        name: data.name.trim(),
      }
      if (data.newPassword) payload.password = data.newPassword
      return api.patch(`/users/${user?.id}`, payload)
    },
    onSuccess: (_res, data) => {
      toast.success('Profil berhasil diperbarui')
      if (user) setUser({ ...user, name: data.name.trim() })
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      form.reset({
        name: data.name.trim(),
        newPassword: '',
        confirmPassword: '',
      })
    },
    onError: (error) =>
      toast.error(errorMessage(error, 'Gagal memperbarui profil')),
  })

  const email = me?.email ?? user?.email ?? '—'
  const role = me?.role ?? user?.role

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className='space-y-8'
      >
        {/* Informasi akun (read-only) */}
        <div className='grid gap-5 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label className='text-muted-foreground'>Email</Label>
            <Input value={email} readOnly disabled />
            <p className='text-[0.8rem] text-muted-foreground'>
              Email tidak dapat diubah.
            </p>
          </div>
          <div className='grid gap-2'>
            <Label className='text-muted-foreground'>Peran</Label>
            <div>
              <Badge variant='secondary'>
                {role ? ROLE_LABEL[role] : '—'}
              </Badge>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label className='text-muted-foreground'>Bergabung</Label>
            <p className='text-sm tabular-nums'>{formatDate(me?.createdAt)}</p>
          </div>
        </div>

        {/* Nama */}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input
                  placeholder='Nama Anda'
                  disabled={isReadOnly}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nama yang ditampilkan di profil Anda.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ganti password (Owner/Super Admin) */}
        {!isReadOnly && (
          <div className='grid gap-5 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Kosongkan bila tak ganti'
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Ulangi password baru'
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isReadOnly ? (
          <p className='text-sm text-muted-foreground'>
            Sebagai Teknisi, Anda tidak dapat mengubah data akun. Hubungi
            Owner/Admin untuk perubahan.
          </p>
        ) : (
          <Button type='submit' disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        )}
      </form>
    </Form>
  )
}
