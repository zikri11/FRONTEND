// Dummy profil hotspot + voucher per router untuk halaman detail SA — seeded
// deterministik dari indeks router; diganti GET /profiles & GET /vouchers saat wiring.
export type HotspotProfileRow = {
  id: string
  name: string
  rateLimit: string
  sharedUsers: number
  validity: string
  syncedToRouter: boolean
}

export type VoucherRow = {
  id: string
  code: string
  password: string
  profileName: string
  outletName: string
  status: 'UNUSED' | 'USED'
  createdAt: string // "d MMM yyyy"
}

export type PosKeyRow = {
  id: string
  label: string
  maskedKey: string
  isActive: boolean
  lastUsedAt: string | null // "d MMM yyyy, HH:mm"
}

// API key POS per router (per-outlet, terikat 1 server) — dummy
export function buildPosKeys(seed: number): PosKeyRow[] {
  const count = 1 + (seed % 3)
  return Array.from({ length: count }, (_, n) => {
    const hex = ((seed * 2654435761 + n * 40503) >>> 0)
      .toString(16)
      .padStart(8, '0')
      .slice(0, 8)
    const active = (seed + n) % 4 !== 1
    return {
      id: `poskey-${seed}-${n + 1}`,
      label: `Kasir ${n + 1}`,
      maskedKey: `pos_${hex}••••••••`,
      isActive: active,
      lastUsedAt:
        (seed + n) % 5 === 0
          ? null
          : `${13 + ((seed + n) % 2)} Jul 2026, ${String(9 + ((seed + n) % 10)).padStart(2, '0')}:${String((seed * 7 + n * 13) % 60).padStart(2, '0')}`,
    }
  })
}

const PROFILE_PRESETS = [
  { name: '1 Jam', rateLimit: '2M/2M', validity: '1h' },
  { name: '3 Jam', rateLimit: '3M/3M', validity: '3h' },
  { name: '1 Hari', rateLimit: '5M/5M', validity: '1d' },
  { name: '7 Hari', rateLimit: '10M/10M', validity: '7d' },
]

const MONTHS_ID = ['Jun', 'Jul']

export function buildProfiles(seed: number): HotspotProfileRow[] {
  const count = 3 + (seed % 2)
  return Array.from({ length: count }, (_, n) => {
    const preset = PROFILE_PRESETS[n % PROFILE_PRESETS.length]
    return {
      id: `profile-${seed}-${n + 1}`,
      name: preset.name,
      rateLimit: preset.rateLimit,
      sharedUsers: 1 + ((seed + n) % 3),
      validity: preset.validity,
      syncedToRouter: (seed + n) % 4 !== 0,
    }
  })
}

export function buildVouchers(
  seed: number,
  profiles: HotspotProfileRow[],
  routerName: string
): VoucherRow[] {
  const count = 20 + ((seed * 7) % 41) // 20-60
  return Array.from({ length: count }, (_, n) => {
    const day = 1 + ((seed * 3 + n) % 28)
    const month = MONTHS_ID[(seed + n) % 2]
    return {
      id: `voucher-${seed}-${n + 1}`,
      code: `VC-${String(seed + 1).padStart(2, '0')}-${String(n + 1).padStart(3, '0')}`,
      password: String(100000 + ((seed * 131 + n * 977) % 900000)),
      profileName: profiles[n % profiles.length].name,
      outletName: routerName,
      status: (seed + n) % 3 === 0 ? 'USED' : 'UNUSED',
      createdAt: `${day} ${month} 2026`,
    }
  })
}
