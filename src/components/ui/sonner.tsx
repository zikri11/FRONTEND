import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      // Wajib: tanpa richColors, sonner mengabaikan variabel --success-*/
      // --error-* dan semua toast tampil netral. Paletnya sendiri ditimpa
      // oleh variabel token proyek di bawah.
      richColors
      className='toaster group [&_div[data-content]]:w-full'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',

          // Warna per tipe dipetakan ke token semantic (theme.css) memakai
          // resep yang sama dengan badge: latar 10%, teks solid, garis 25%.
          // Dicampur ke --popover agar latar tetap opak, dan otomatis ikut
          // tema terang/gelap karena tokennya punya dua varian.
          '--success-bg': 'color-mix(in oklab, var(--success) 10%, var(--popover))',
          '--success-text': 'var(--success)',
          '--success-border':
            'color-mix(in oklab, var(--success) 25%, transparent)',

          '--error-bg': 'color-mix(in oklab, var(--error) 10%, var(--popover))',
          '--error-text': 'var(--error)',
          '--error-border':
            'color-mix(in oklab, var(--error) 25%, transparent)',

          '--warning-bg':
            'color-mix(in oklab, var(--warning) 10%, var(--popover))',
          '--warning-text': 'var(--warning)',
          '--warning-border':
            'color-mix(in oklab, var(--warning) 25%, transparent)',

          '--info-bg': 'color-mix(in oklab, var(--info) 10%, var(--popover))',
          '--info-text': 'var(--info)',
          '--info-border': 'color-mix(in oklab, var(--info) 25%, transparent)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
