# Desain — Halaman Detail Owner `/users/$id` (SUPER_ADMIN)

**Tanggal:** 2026-07-16 · **Referensi:** `DESIGN-vercel.md` · `typography-improvement-plan.md`
**Layout referensi:** `/billing`; bagian bawah = tabel `/monitoring`. Dummy.

## Keputusan (QnA)

| Keputusan | Pilihan |
|---|---|
| Navigasi | Baris tabel Kelola Owner clickable + item "Lihat Detail" di dropdown (Aksi stopPropagation) |
| Card paket | Persis /billing TANPA tombol Upgrade |
| Monitoring | Tabel polos tanpa filter Bulan/Tahun |

## Route

`src/routes/_authenticated/users/$id.tsx` — guard SA-only, `Route.useParams()` →
`<OwnerDetail ownerId={id} />`. `id` tak ketemu di `DUMMY_OWNERS` → "Owner tidak
ditemukan" + link kembali.

## Halaman (`src/features/owners/detail.tsx`)

1. **Header**: Link muted "← Kelola Owner" → H1 nama owner → email `text-sm muted`
   → "Akun dibuat {createdAt}" `text-xs muted`. (`createdAt` ditambah ke generator
   `dummy-owners.ts`, deterministik.)
2. **Card Paket**: tier + badge Aktif `success-light` + harga (Free Rp 0 / Standard
   Rp 149.000 / Pro Rp 299.000) + "/bulan"; "Berlaku sampai 14 Agu 2026"
   (Free: "Tanpa masa berlaku"). Tanpa Upgrade.
3. **Pemakaian Periode Ini**: 1 card 3 meter horizontal (pola /billing): Router
   `owner.routers`/kuota, Teknisi `owner.technicians`/kuota, API Key (= 1 per outlet,
   `owner.routers`)/kuota. Kuota per plan: Free 5/2/5 · Standard 25/10/15 ·
   Pro 100/50/100. Bar: >85% warning, ≥100% destructive (pct bar di-clamp 100);
   helper `progressStateClass` diduplikasi lokal.
4. **Card "Monitoring Outlet"**: tabel persis /monitoring (Outlet · Status badge ·
   Availability mono · Timeline 30 balok + tooltip tanggal/downtime · Last Offline
   mono kanan), frame `py-0`+`CardContent px-0`+`ps-4/pe-4`. Outlet dummy
   deterministik per owner: `min(owner.routers, 5)` baris, pola down seeded dari
   indeks owner.

## Perubahan `features/owners/index.tsx`

Baris: `cursor-pointer` + `onClick` navigate `/users/$id`; cell Aksi
`onClick={(e) => e.stopPropagation()}`; dropdown + item "Lihat Detail".

## Backend (dicatat)

Endpoint detail owner + agregat + monitoring per tenant — belum ada.

## Verifikasi

`vite build` (routeTree regen route baru) + `tsc -b` + eslint bersih; klik baris →
detail sesuai; owner Free router berlebih → bar merah; non-SA → redirect.
