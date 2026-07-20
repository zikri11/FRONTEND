import { createFileRoute } from '@tanstack/react-router'
import { Vouchers } from '@/features/vouchers'

// Owner boleh lihat voucher (read-only) — backend GET /vouchers sudah izinkan
// OWNER. Aksi buat/hapus/sinkron disembunyikan di dalam komponen (isOwner).
export const Route = createFileRoute('/_authenticated/vouchers/')({
  component: Vouchers,
})
