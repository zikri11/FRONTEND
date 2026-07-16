// Dummy daftar owner (tenant) platform untuk SUPER_ADMIN — sampai backend punya
// endpoint list owner + agregat per tenant (plan, count teknisi/router/transaksi).
export type PlanTier = 'Free' | 'Standard' | 'Pro'

export type OwnerRow = {
  id: string
  name: string
  email: string
  plan: PlanTier
  technicians: number
  routers: number
  posTransactions: number
}

export const PLAN_TIERS: PlanTier[] = ['Free', 'Standard', 'Pro']

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
  'Rizky Ramadhan',
  'Lina Marlina',
  'Teguh Prasetyo',
  'Nur Aini',
]

function emailFromName(name: string, i: number): string {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, '.')
  return `${slug}${i}@example.com`
}

function planFor(i: number): PlanTier {
  const mod = i % 5
  if (mod === 3) return 'Standard'
  if (mod === 4) return 'Pro'
  return 'Free'
}

const TOTAL = 30

function generate(): OwnerRow[] {
  const list: OwnerRow[] = []
  for (let i = 0; i < TOTAL; i++) {
    const name = NAMES[i % NAMES.length]
    list.push({
      id: `owner-${String(i + 1).padStart(2, '0')}`,
      name,
      email: emailFromName(name, i + 1),
      plan: planFor(i),
      technicians: i % 11,
      routers: 1 + ((i * 3) % 25),
      posTransactions: (i * 97) % 2000,
    })
  }
  return list
}

export const DUMMY_OWNERS: OwnerRow[] = generate()
