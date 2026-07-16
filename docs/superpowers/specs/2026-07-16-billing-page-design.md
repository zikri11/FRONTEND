# Desain — Halaman `/billing` (OWNER)

**Tanggal:** 2026-07-16
**Referensi desain:** `DESIGN-vercel.md` · `desain/typography-improvement-plan.md`
**Scope:** frontend, dummy data. Reuse `BillingUpgradeDialog` existing untuk aksi upgrade.

## Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Tier | Free / Standard / **Pro** — Free & Standard align backend, Pro dummy. Aktif dummy: Standard |
| Akses | Owner-only (guard redirect `/`) + 2 pintu: sidebar "Billing" (owner) + menu Billing dropdown profil → halaman (bukan dialog) |
| Usage | 3 kartu terpisah (pola kartu statistik dashboard) + Progress bar |
| Invoice | 5 kolom: ID, Plan, Status, Tanggal, Nominal — align `PaymentTransaction` backend |

## 1. Route — `src/routes/_authenticated/billing/index.tsx`

Pola `/pos-transactions`: `beforeLoad` → `user?.role !== 'OWNER'` → `redirect({ to: '/' })`.
Component `BillingPage` dari `src/features/billing`.

## 2. Halaman — `src/features/billing/index.tsx`

Shell standar: `Header` (Search/ThemeSwitch/ConfigDrawer/ProfileDropdown) + `Main` +
`outerBoxClass`. H1 "Billing" (`text-2xl font-semibold tracking-tight`) + deskripsi
`mt-1 text-sm text-muted-foreground` ("Kelola paket langganan dan lihat riwayat tagihan.").

### 2a. Card Paket (`nestedCardClass`, full width)

- Kiri: caption `text-xs text-muted-foreground` "Paket saat ini" → baris nama tier:
  **"Standard"** `text-2xl font-semibold tracking-tight` + `Badge variant='success-light'
  size='sm'` "Aktif" sejajar; bawahnya caption muted "Berlaku sampai 14 Agu 2026" (dummy).
- Kanan (sejajar, `flex items-center gap-4`): harga `text-2xl font-semibold tracking-tight
  tabular-nums` "Rp 149.000" + `text-sm text-muted-foreground` "/bulan"; tombol
  `Button` "Upgrade" → buka `BillingUpgradeDialog` existing (state lokal `open`).
- Responsive: kolom menumpuk di mobile (`flex-col sm:flex-row justify-between`).

### 2b. Pemakaian Periode Ini — 3 kartu (`grid gap-4 sm:grid-cols-3`)

Heading section `text-base font-semibold` "Pemakaian Periode Ini" di atas grid
(atau langsung grid — pilih heading kecil agar section jelas).

| Kartu | Dummy | Caption |
|---|---|---|
| Router | `18 / 25` | dari kuota paket Standard |
| Teknisi | `4 / 10` | dari kuota paket Standard |
| API Key | `7 / 15` | dari kuota paket Standard |

Tiap kartu (`nestedCardClass`): title `text-sm font-medium`, angka
`text-2xl font-semibold tracking-tight tabular-nums` (format `18 / 25`, pembagi muted),
`Progress value={pct}` h-2 (warna default primary — tanpa warna dekoratif), caption
`text-xs text-muted-foreground`.

### 2c. Card Riwayat Invoice (`nestedCardClass py-0` + `CardContent px-0`)

Header card: `CardTitle` "Riwayat Invoice" + `CardDescription` "Semua tagihan dan
status pembayarannya." (pakai `CardHeader` normal — card ini `py-0`, jadi header
diberi `pt-6`). Tabel standar fasetabel:

| Kolom | Style |
|---|---|
| ID Invoice (`ps-4`) | `font-mono text-xs text-muted-foreground whitespace-nowrap` |
| Plan | `text-sm text-foreground` |
| Status | Badge `success-light` "Lunas" / `warning-light` "Pending" / `destructive-light` "Gagal", `size='sm'` |
| Tanggal (kanan) | `font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap text-right` |
| Nominal (kanan, `pe-4`) | `font-mono text-xs tabular-nums text-right whitespace-nowrap` (ink — nilai penting) |

Header kolom: resep standar (`text-xs font-medium tracking-wide text-muted-foreground`,
tanpa uppercase, row `hover:bg-transparent`). 8 baris dummy `INV-2026-07-010` …
`INV-2026-02-003` (urut terbaru; 6 Lunas, 1 Pending, 1 Gagal; nominal Rp 149.000,
baris lama boleh Rp 0 saat masih Free → pakai Rp 149.000 semua biar sederhana).
Empty state colSpan 5 `h-24` (tak terpakai dengan dummy, tapi pola tetap ditulis).

## 3. Navigasi

- `sidebar-data.ts`: item `{ title: 'Billing', url: '/billing', icon: CreditCard }`
  setelah "Transaksi POS". `app-sidebar.tsx`: sembunyikan bila `role !== 'OWNER'`
  (tambah kondisi seperti 'Transaksi POS').
- `nav-user.tsx` + `profile-dropdown.tsx`: item menu "Billing" → `Link to='/billing'`
  menggantikan `setBillingOpen(true)`; item hanya render bila OWNER. `BillingUpgradeDialog`
  + state-nya dilepas dari kedua file itu (dialog tetap hidup, dipakai halaman billing).

## 4. Data dummy & wiring nanti

Dummy di file komponen. Endpoint real untuk wiring nanti: `GET /billing/me` (plan aktif,
kuota router, expired), `GET /billing/plans`. Kebutuhan backend baru (belum ada):
kuota teknisi, kuota API key, list `PaymentTransaction` per owner (riwayat invoice),
tier PRO.

## 5. Verifikasi

1. `npx tsc -b` + eslint file baru/tersentuh bersih; `vite build` (regen routeTree).
2. Owner: sidebar ada Billing; dropdown profil Billing → halaman; card paket + 3 meter +
   tabel invoice tampil light+dark; tombol Upgrade membuka dialog plans existing.
3. TEKNISI/SUPER_ADMIN: tanpa item sidebar/dropdown; akses langsung `/billing` → redirect `/`.
