import { Link, useSearch } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

const egnetLogo = '/images/egnet-favicon.svg'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <div className='flex flex-col gap-6'>
        {/* Logo + heading */}
        <div className='flex flex-col items-center gap-2 text-center'>
          <img src={egnetLogo} alt='EgNET' className='size-10' />
          <h1 className='font-nacelle text-xl font-semibold tracking-tight'>
            Selamat datang kembali
          </h1>
          <p className='text-sm text-muted-foreground'>
            Belum punya akun?{' '}
            <Link
              to='/sign-up'
              className='font-medium text-primary underline underline-offset-4'
            >
              Daftar
            </Link>
          </p>
        </div>

        <UserAuthForm redirectTo={redirect} />

        <p className='px-6 text-center text-xs text-muted-foreground'>
          Dengan masuk, Anda menyetujui{' '}
          <a
            href='/terms'
            className='underline underline-offset-4 hover:text-primary'
          >
            Ketentuan Layanan
          </a>{' '}
          dan{' '}
          <a
            href='/privacy'
            className='underline underline-offset-4 hover:text-primary'
          >
            Kebijakan Privasi
          </a>{' '}
          kami.
        </p>
      </div>
    </AuthLayout>
  )
}
