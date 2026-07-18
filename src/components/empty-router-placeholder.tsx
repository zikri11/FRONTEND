import { ServerOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { IconStack } from '@/components/reui/icon-stack'

export function EmptyRouterPlaceholder() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
      <IconStack aria-hidden="true">
        <ServerOff className="size-5" />
      </IconStack>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Belum ada router yang dipilih</h2>
        <p className="text-sm text-muted-foreground">
          Anda belum menambahkan atau memilih router MikroTik. Fitur ini membutuhkan koneksi ke router Anda agar dapat menampilkan data secara real-time.
        </p>
      </div>
      <Link to="/servers">
        <Button className="mt-4">
          Tambah Router Sekarang
        </Button>
      </Link>
    </div>
  )
}
