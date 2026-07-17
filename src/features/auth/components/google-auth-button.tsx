import { useNavigate } from '@tanstack/react-router'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth-store'
import { applyAuthSession, getAuthErrorMessage } from '../auth-session'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined

/**
 * Tombol "Lanjut dengan Google". Memakai flow ID-token dari Google Identity
 * Services (`<GoogleLogin>` mengembalikan `credential` = ID token yang diminta
 * backend di `POST /auth/google`). Otomatis tidak dirender bila
 * `VITE_GOOGLE_CLIENT_ID` belum di-set (form email/password tetap berfungsi).
 */
export function GoogleAuthButton({ redirectTo }: { redirectTo?: string }) {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  if (!GOOGLE_CLIENT_ID) return null

  async function handleCredential(idToken: string) {
    try {
      const response = await api.post('/auth/google', { idToken })
      applyAuthSession(response.data, auth)
      toast.success(`Selamat datang, ${response.data.user.name}!`)
      navigate({ to: redirectTo || '/dashboard', replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Login Google gagal, coba lagi'))
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className='relative my-2'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background px-2 text-muted-foreground'>
            Or continue with
          </span>
        </div>
      </div>

      <div className='flex justify-center'>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              handleCredential(credentialResponse.credential)
            } else {
              toast.error('Tidak mendapat token dari Google')
            }
          }}
          onError={() => toast.error('Login Google gagal, coba lagi')}
          text='continue_with'
          shape='rectangular'
          width='320'
        />
      </div>
    </GoogleOAuthProvider>
  )
}
