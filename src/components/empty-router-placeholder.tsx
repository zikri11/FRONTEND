import { ServerOff, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function EmptyRouterPlaceholder() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <ServerOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Belum ada router yang dipilih</h2>
        <p className="text-sm text-muted-foreground">
          Anda belum menambahkan atau memilih router MikroTik. Fitur ini membutuhkan koneksi ke router Anda agar dapat menampilkan data secara real-time.
        </p>
      </div>
      <Link to="/servers">
        <Button className="mt-4 gap-2">
          <Plus className="h-4 w-4" />
          Tambah Router Sekarang
        </Button>
      </Link>
    </div>
  )
}
