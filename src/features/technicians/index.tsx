import { useEffect, useState } from 'react'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PlusIcon, Loader2, RefreshCw, BadgeCheck, XCircle } from 'lucide-react'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { CreateTechnicianDialog } from './components/create-technician-dialog'
import { EditTechnicianDialog } from './components/edit-technician-dialog'

interface Technician {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

export function Technicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { user } = useAuthStore.getState().auth

  const fetchTechnicians = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/users?role=TEKNISI')
      setTechnicians(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Gagal memuat data teknisi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const handleEditClick = (tech: Technician) => {
    setSelectedTechnician(tech)
    setIsEditOpen(true)
  }

  const handleDeleteClick = (tech: Technician) => {
    setTechnicianToDelete(tech)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!technicianToDelete) return
    setIsDeleting(true)
    try {
      await api.delete(`/users/${technicianToDelete.id}`)
      toast.success('Teknisi berhasil dihapus.')
      fetchTechnicians()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Gagal menghapus teknisi.')
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
      setTechnicianToDelete(null)
    }
  }

  if (user?.role === 'TEKNISI') {
    return (
      <Main>
        <Header>
          <Search />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <div className="p-6 flex justify-center items-center h-[50vh]">
          <p className="text-destructive text-lg font-semibold">Anda tidak punya hak akses untuk halaman ini.</p>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className='p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Kelola Teknisi</h1>
            <p className='text-muted-foreground'>
              Manajemen akun teknisi yang dapat mengelola router Anda.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' onClick={fetchTechnicians}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusIcon className='mr-2 h-4 w-4' />
              Tambah Teknisi
            </Button>
          </div>
        </div>

        <div className='rounded-md border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center'>
                    <Loader2 className='mx-auto h-6 w-6 animate-spin text-primary' />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center text-destructive'>
                    {error}
                  </TableCell>
                </TableRow>
              ) : technicians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                    Belum ada data teknisi.
                  </TableCell>
                </TableRow>
              ) : (
                technicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell className='font-medium'>{tech.name}</TableCell>
                    <TableCell>{tech.email}</TableCell>
                    <TableCell>
                      {tech.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                          <BadgeCheck className="w-3.5 h-3.5 mr-1" data-icon="inline-start" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20">
                          <XCircle className="w-3.5 h-3.5 mr-1" data-icon="inline-start" />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(tech.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm' onClick={() => handleEditClick(tech)}>Edit</Button>
                      <Button variant='ghost' size='sm' className='text-destructive' onClick={() => handleDeleteClick(tech)}>Hapus</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateTechnicianDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={fetchTechnicians} 
      />

      <EditTechnicianDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={fetchTechnicians}
        technician={selectedTechnician}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun teknisi{' '}
              <strong>{technicianToDelete?.name}</strong> dan menghapus aksesnya ke dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}
