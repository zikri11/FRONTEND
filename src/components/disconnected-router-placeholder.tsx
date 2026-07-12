import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DisconnectedRouterPlaceholderProps {
  onRetry: () => void
  isRetrying?: boolean
}

export function DisconnectedRouterPlaceholder({ onRetry, isRetrying }: DisconnectedRouterPlaceholderProps) {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-6">
        <WifiOff className="h-10 w-10 text-destructive" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Router Sementara Terputus</h2>
        <p className="text-sm text-muted-foreground">
          Sistem gagal terhubung ke router MikroTik Anda. Kami akan mencoba menghubungkan ulang secara otomatis, atau Anda dapat menekan tombol di bawah.
        </p>
      </div>
      <Button 
        onClick={onRetry} 
        disabled={isRetrying}
        variant="outline"
        className="mt-4 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Mencoba Terhubung...' : 'Coba Hubungkan Ulang'}
      </Button>
    </div>
  )
}
