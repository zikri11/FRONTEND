import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/axios'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'

interface Technician {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface EditTechnicianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  technician: Technician | null
}

export function EditTechnicianDialog({
  open,
  onOpenChange,
  onSuccess,
  technician,
}: EditTechnicianDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (technician && open) {
      setFormData({
        name: technician.name,
        password: '',
        isActive: technician.isActive,
      })
      setError(null)
    }
  }, [technician, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!technician) return

    setLoading(true)
    setError(null)

    // Only send fields that are actually updated
    const payload: any = {}
    if (formData.name !== technician.name) payload.name = formData.name
    if (formData.isActive !== technician.isActive) payload.isActive = formData.isActive
    if (formData.password) payload.password = formData.password

    if (Object.keys(payload).length === 0) {
      onOpenChange(false)
      setLoading(false)
      return
    }

    try {
      await api.patch(`/users/${technician.id}`, payload)
      toast.success('Data teknisi berhasil diperbarui!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Gagal memperbarui teknisi.')
      toast.error('Gagal memperbarui teknisi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Teknisi</DialogTitle>
          <DialogDescription>
            Ubah nama, password, atau status akses untuk teknisi <strong>{technician?.email}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Password Baru (Opsional)</Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                placeholder="Biarkan kosong jika tidak diubah"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-xs">
            <div className="space-y-0.5">
              <Label className="text-base">Akses Akun</Label>
              <p className="text-sm text-muted-foreground">
                Izinkan teknisi ini untuk masuk ke dashboard.
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
