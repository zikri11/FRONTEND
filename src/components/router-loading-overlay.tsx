import { Spinner } from '@/components/ui/spinner'

/**
 * Overlay loading dipasang di atas area yang datanya bergantung router aktif
 * (bukan seluruh halaman) — parent WAJIB `relative` supaya `absolute inset-0`
 * pas menutupi area itu saja. Dipakai saat ganti ke router yang belum pernah
 * di-fetch sesi ini (`isPending` React Query); balik ke router yang sudah
 * pernah dibuka tidak memicu ini (data cache tampil instan).
 */
export function RouterLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-xs'>
      <Spinner className='size-6 opacity-60' />
      <span className='text-sm text-muted-foreground'>
        Memuat data router...
      </span>
    </div>
  )
}
