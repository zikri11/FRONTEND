import { ServerOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { IconStack } from '@/components/reui/icon-stack'

export function EmptyRouterPlaceholder() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-3 text-center">
      <IconStack aria-hidden="true" className="h-14 w-12">
        <ServerOff className="size-4" />
      </IconStack>
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Belum ada router yang dipilih</h2>
        <p className="text-sm text-muted-foreground">
          Anda belum menambahkan atau memilih router MikroTik. Fitur ini membutuhkan koneksi ke router Anda agar dapat menampilkan data secara real-time.
        </p>
      </div>
      <Link to="/servers">
        <Button size="sm" className="mt-2 text-xs">
          Tambah Router Sekarang
        </Button>
      </Link>
    </div>
  )
}
