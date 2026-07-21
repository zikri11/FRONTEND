import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
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
import {
  applyAuthSession,
  getAuthErrorMessage,
  safeRedirect,
} from '../../auth-session'
import { GoogleAuthButton } from '../../components/google-auth-button'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Masukkan email Anda.' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Masukkan kata sandi Anda.')
    .min(7, 'Kata sandi minimal 7 karakter.'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      })

      // Simpan user dan token ke Zustand Auth Store
      applyAuthSession(response.data, auth)

      toast.success(`Selamat datang kembali, ${response.data.user.name}!`)

      // Arahkan ke tujuan aman (buang redirect nested / auth / eksternal)
      navigate({ to: safeRedirect(redirectTo), replace: true })
    } catch (error) {
      const errorMessage = getAuthErrorMessage(
        error,
        'Login gagal, periksa kredensial Anda'
      )
      toast.error(errorMessage)
      form.setError('email', { type: 'manual', message: '' })
      form.setError('password', { type: 'manual', message: errorMessage })
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
            <FormItem className='relative'>
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Lupa kata sandi?
              </Link>
            </FormItem>
          )}
        />
        <Button
          className='mt-2 w-full bg-indigo-600 text-white hover:bg-indigo-700'
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Masuk
        </Button>

        <GoogleAuthButton redirectTo={redirectTo} />
      </form>
    </Form>
  )
}
