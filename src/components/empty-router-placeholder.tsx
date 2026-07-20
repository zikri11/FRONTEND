import { ServerOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { IconStack } from '@/components/reui/icon-stack'
import { useAuthStore } from '@/stores/auth-store'

export function EmptyRouterPlaceholder() {
  const role = useAuthStore((s) => s.auth.user?.role)
  const isOwner = role === 'OWNER'

  // Owner tak punya akses menambah router — arahkan ke teknisi, tanpa CTA tambah.
  if (isOwner) {
    return (
      <div className='flex h-[80vh] w-full flex-col items-center justify-center gap-3 text-center'>
        <IconStack aria-hidden='true' className='h-14 w-12'>
          <ServerOff className='size-4' />
        </IconStack>
        <div className='max-w-sm space-y-1.5'>
          <h2 className='text-xl font-semibold tracking-tight'>
            Belum ada router terdaftar
          </h2>
          <p className='text-sm text-muted-foreground'>
            Router MikroTik didaftarkan oleh teknisi. Minta teknisi Anda untuk
            menambahkan router agar data real-time dapat tampil di sini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-[80vh] w-full flex-col items-center justify-center gap-3 text-center'>
      <IconStack aria-hidden='true' className='h-14 w-12'>
        <ServerOff className='size-4' />
      </IconStack>
      <div className='max-w-sm space-y-1.5'>
        <h2 className='text-xl font-semibold tracking-tight'>
          Belum ada router yang dipilih
        </h2>
        <p className='text-sm text-muted-foreground'>
          Anda belum menambahkan atau memilih router MikroTik. Fitur ini
          membutuhkan koneksi ke router Anda agar dapat menampilkan data secara
          real-time.
        </p>
      </div>
      <Link to='/servers'>
        <Button size='sm' className='mt-2 text-xs'>
          Tambah Router Sekarang
        </Button>
      </Link>
    </div>
  )
}
