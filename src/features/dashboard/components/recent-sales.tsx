import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Lock } from 'lucide-react'

interface RecentSalesProps {
  data: any[];
  isForbidden?: boolean;
}

export function RecentSales({ data = [], isForbidden = false }: RecentSalesProps) {
  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <Lock className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Akses Terkunci</p>
        <p className="text-xs">Hanya teknisi atau admin yang dapat melihat pengguna aktif.</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        Belum ada pengguna yang terhubung.
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {data.map((user, idx) => (
        <div key={idx} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{(user.user || user.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{user.user || user.name || 'Unknown'}</p>
              <p className='font-mono text-xs text-muted-foreground'>
                IP: {user.address || '-'} • MAC: {user.macAddress || '-'}
              </p>
            </div>
            <div className='text-xs font-medium tabular-nums'>Uptime: {user.uptime || '-'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
