import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/axios'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  code: string
  name: string
  maxRouters: number
  price: number
  durationDays: number | null
}

interface BillingUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingUpgradeDialog({ open, onOpenChange }: BillingUpgradeDialogProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [processingCode, setProcessingCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPlans()
    }
  }, [open])

  const fetchPlans = async () => {
    setLoadingPlans(true)
    setError(null)
    try {
      const res = await api.get('/billing/plans')
      setPlans(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Gagal memuat paket langganan.')
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleCheckout = async (planCode: string) => {
    if (planCode === 'FREE') {
      toast.error('Paket gratis tidak memerlukan pembayaran.')
      return
    }
    setProcessingCode(planCode)
    try {
      const res = await api.post('/billing/checkout', { planCode })
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl
      } else {
        toast.error('Gagal mendapatkan URL pembayaran.')
      }
    } catch (err: any) {
      console.error(err)
      const errMsg = err.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran.'
      toast.error(errMsg)
    } finally {
      setProcessingCode(null)
    }
  }

  const formatRupiah = (amount: number) => {
    if (amount === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Pilih Paket Anda</DialogTitle>
          <DialogDescription>
            Pilih paket yang paling sesuai dengan kebutuhan jaringan Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loadingPlans ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => {
                const isPopular = plan.code === 'STANDARD'
                const isProcessing = processingCode === plan.code

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border ${
                      isPopular ? 'border-primary shadow-lg ring-1 ring-primary' : 'border-border'
                    } p-6 bg-card`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 -mr-2 -mt-2">
                        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                          Terpopuler
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {plan.code === 'FREE' ? 'Untuk uji coba ringan.' : 'Untuk kebutuhan bisnis.'}
                    </p>
                    
                    <div className="my-6 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatRupiah(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">
                          / {plan.durationDays} hari
                        </span>
                      )}
                    </div>
                    
                    <ul className="mb-6 flex flex-col gap-3 grow text-sm text-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>Maksimal {plan.maxRouters} Router</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{plan.durationDays ? `Masa Aktif ${plan.durationDays} Hari` : 'Aktif Selamanya'}</span>
                      </li>
                      {isPopular && (
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Analisis AI Real-time</span>
                        </li>
                      )}
                    </ul>
                    
                    <Button
                      variant={isPopular ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleCheckout(plan.code)}
                      disabled={plan.code === 'FREE' || !!processingCode}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : plan.code === 'FREE' ? (
                        'Saat Ini'
                      ) : (
                        `Pilih ${plan.name}`
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
