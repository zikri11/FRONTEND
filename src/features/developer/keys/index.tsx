import { useState } from 'react'
import { MoreHorizontalIcon, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'

import { EmptyRouterPlaceholder } from '@/components/empty-router-placeholder'
import { useServerStore } from '@/stores/server-store'

export function Keys() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { activeServerId, isLoading } = useServerStore()

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {!isLoading && !activeServerId ? (
          <EmptyRouterPlaceholder />
        ) : (
          <>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>Integrasi POS</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Hubungkan mesin kasir (POS) ke sistem. Kelola API key & baca dokumentasi API di sini.
                </p>
              </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Buat API Key</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Buat API Key Baru</DialogTitle>
                <DialogDescription>
                  Generate kunci rahasia untuk menyambungkan aplikasi kasir Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <label htmlFor="label" className="text-sm font-medium leading-none">
                    Label / Nama Outlet <span className="text-destructive">*</span>
                  </label>
                  <Input id="label" placeholder="contoh: Kasir Cabang Pusat" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="server" className="text-sm font-medium leading-none">
                    Server / Router Tujuan <span className="text-destructive">*</span>
                  </label>
                  <Select>
                    <SelectTrigger id="server" className="w-full">
                      <SelectValue placeholder="Pilih router tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KANTOR EG1">KANTOR EG1</SelectItem>
                      <SelectItem value="LYF">LYF</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Key hanya bisa akses server ini (isolasi antar outlet).
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="button" onClick={() => setIsDialogOpen(false)}>Generate Key</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className='mt-4 rounded-md border bg-background'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead>Nama Aplikasi</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Terakhir Digunakan</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Row 1 */}
              <TableRow>
                <TableCell className='font-medium'>Mesin Kasir Utama</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <code className='rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm text-muted-foreground'>
                      sk_live_12345...
                    </code>
                    <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground'>
                      <Copy className='h-3 w-3' />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className='text-green-500 border-green-500/20 bg-green-500/10 font-normal'>
                    Aktif
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground'>29 Jun 2026</TableCell>
                <TableCell className='text-muted-foreground'>Baru saja</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='size-8'>
                        <MoreHorizontalIcon />
                        <span className='sr-only'>Buka menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>Ganti Nama</DropdownMenuItem>
                      <DropdownMenuItem>Gulirkan Key (Roll)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant='destructive'>
                        Cabut Akses
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

              {/* Row 2 */}
              <TableRow>
                <TableCell className='font-medium'>Uji Coba Staging</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <code className='rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm text-muted-foreground'>
                      sk_test_67890...
                    </code>
                    <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground'>
                      <Copy className='h-3 w-3' />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className='text-muted-foreground font-normal'>
                    Dicabut
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground'>20 Jun 2026</TableCell>
                <TableCell className='text-muted-foreground'>21 Jun 2026 10:00</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='size-8'>
                        <MoreHorizontalIcon />
                        <span className='sr-only'>Buka menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>Ganti Nama</DropdownMenuItem>
                      <DropdownMenuItem disabled>Gulirkan Key (Roll)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant='destructive' disabled>
                        Cabut Akses
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        </>
        )}
      </Main>
    </>
  )
}
