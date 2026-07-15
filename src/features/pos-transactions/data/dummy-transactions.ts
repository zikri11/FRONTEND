// Dummy transaksi POS — satu sumber untuk dashboard (10 teratas) dan halaman
// Riwayat Transaksi POS. Kolom align field backend PosTransaction; dihapus
// saat endpoint list untuk owner tersedia.
export type PosTransaction = {
  transactionId: string
  customerName: string
  outletName: string
  createdAt: string // "d MMM yyyy, HH:mm", sudah terformat
}

export const POS_OUTLETS = [
  'Outlet Pusat',
  'Outlet Cabang A',
  'Outlet Cabang B',
] as const

const NAMES = [
  'Budi Santoso',
  'Siti Rahma',
  'Andi Wijaya',
  'Rina Kartika',
  'Dewi Lestari',
  'Agus Pratama',
  'Fitri Handayani',
  'Joko Susilo',
  'Maya Sari',
  'Hendra Gunawan',
  'Putri Amelia',
]

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function formatDateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`
}

const TOTAL = 120
// Waktu transaksi paling baru (statis agar deterministik antar render/build)
const NEWEST = new Date(2026, 6, 14, 10, 52).getTime()

function generate(): PosTransaction[] {
  const list: PosTransaction[] = []
  let time = NEWEST
  for (let i = 0; i < TOTAL; i++) {
    list.push({
      transactionId: `TRX-POS-${String(TOTAL - i).padStart(3, '0')}`,
      customerName: NAMES[i % NAMES.length],
      outletName: POS_OUTLETS[i % POS_OUTLETS.length],
      createdAt: formatDateTime(new Date(time)),
    })
    // Mundur 97–319 menit per transaksi, deterministik tanpa Math.random
    time -= (97 + ((i * 53) % 223)) * 60_000
  }
  return list
}

// Urutan array = waktu menurun (terbaru dulu)
export const DUMMY_POS_TRANSACTIONS: PosTransaction[] = generate()
