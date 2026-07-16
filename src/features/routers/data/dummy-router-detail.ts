// Dummy profil hotspot per router untuk halaman detail SA — seeded
// deterministik dari indeks router; diganti GET /profiles saat wiring.
// (Voucher & POS key sudah pakai backend nyata.)
export type HotspotProfileRow = {
  id: string
  name: string
  rateLimit: string
  sharedUsers: number
  validity: string
  syncedToRouter: boolean
}

const PROFILE_PRESETS = [
  { name: '1 Jam', rateLimit: '2M/2M', validity: '1h' },
  { name: '3 Jam', rateLimit: '3M/3M', validity: '3h' },
  { name: '1 Hari', rateLimit: '5M/5M', validity: '1d' },
  { name: '7 Hari', rateLimit: '10M/10M', validity: '7d' },
]

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
