type AuthLayoutProps = {
  children: React.ReactNode
}

// Pola login-05 (shadcn): form terpusat, minimalis. Aksen brand landing
// (glow indigo halus) tanpa mengganggu keterbacaan. Theme-aware.
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-background p-6 md:p-10'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/10 to-transparent'
      />
      <div className='relative w-full max-w-sm'>{children}</div>
    </div>
  )
}
