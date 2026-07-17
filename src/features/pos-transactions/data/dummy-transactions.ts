// Nama outlet dummy untuk ringkasan Monitoring di dashboard
// (outlet-status-overview). Riwayat transaksi POS kini memakai data nyata dari
// GET /pos/transactions (lihat features/pos-transactions/index.tsx dan
// dashboard/components/recent-pos-transactions.tsx).
export const POS_OUTLETS = [
  'Outlet Pusat',
  'Outlet Cabang A',
  'Outlet Cabang B',
] as const
