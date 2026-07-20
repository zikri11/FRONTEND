import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { applyAuthSession, getAuthErrorMessage } from '../../auth-session'
import { GoogleAuthButton } from '../../components/google-auth-button'

const formSchema = z
  .object({
    name: z.string().min(1, 'Masukkan nama Anda.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Masukkan email Anda.' : undefined),
    }),
    password: z
      .string()
      .min(1, 'Masukkan kata sandi Anda.')
      .min(7, 'Kata sandi minimal 7 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi Anda.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      })

      applyAuthSession(response.data, auth)
      toast.success(
        `Akun berhasil dibuat. Selamat datang, ${response.data.user.name}!`
      )

      navigate({ to: '/dashboard', replace: true })
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        'Registrasi gagal, silakan coba lagi'
      )
      toast.error(message)
      form.setError('email', { type: 'manual', message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input placeholder='Nama lengkap' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
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
              <FormLabel>Konfirmasi Kata Sandi</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className='mt-2 w-full bg-indigo-600 text-white hover:bg-indigo-700'
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          Buat Akun
        </Button>

        <GoogleAuthButton />
      </form>
    </Form>
  )
}
