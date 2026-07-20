import { Link } from '@tanstack/react-router'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

const egnetLogo = '/images/egnet-favicon.svg'

export function SignUp() {
  return (
    <AuthLayout>
      <div className='flex flex-col gap-6'>
        {/* Logo + heading */}
        <div className='flex flex-col items-center gap-2 text-center'>
          <img src={egnetLogo} alt='EgNET' className='size-10' />
          <h1 className='font-nacelle text-xl font-semibold tracking-tight'>
            Buat akun EgNET
          </h1>
          <p className='text-sm text-muted-foreground'>
            Sudah punya akun?{' '}
            <Link
              to='/sign-in'
              className='font-medium text-primary underline underline-offset-4'
            >
              Masuk
            </Link>
          </p>
        </div>

        <SignUpForm />

        <p className='px-6 text-center text-xs text-muted-foreground'>
          Dengan membuat akun, Anda menyetujui{' '}
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
