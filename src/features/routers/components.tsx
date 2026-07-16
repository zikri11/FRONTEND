import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/reui/badge'
import { type RouterStatus } from './utils'

export function StatusBadge({ status }: { status: RouterStatus }) {
  if (status === 'ONLINE') {
    return (
      <Badge size='sm' className='border-success/20 bg-success/10 text-success'>
        Online
      </Badge>
    )
  }
  if (status === 'OFFLINE') {
    return (
      <Badge size='sm' variant='secondary' className='text-muted-foreground'>
        Offline
      </Badge>
    )
  }
  return (
    <Badge size='sm' className='border-warning/20 bg-warning/10 text-warning'>
      Unknown
    </Badge>
  )
}

export function ProtocolBadge({ useSSL }: { useSSL: boolean }) {
  return (
    <Badge
      size='sm'
      variant='secondary'
      className='gap-1 font-normal text-muted-foreground'
    >
      {useSSL ? (
        <>
          <ShieldCheck className='text-success' /> HTTPS / SSL
        </>
      ) : (
        <>
          <ShieldAlert /> HTTP
        </>
      )}
    </Badge>
  )
}

// Baris detail: label kiri muted, nilai kanan (mono untuk data mesin)
export function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-4 py-2'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='text-end'>{children}</span>
    </div>
  )
}
