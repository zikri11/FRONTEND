# Desain — Halaman "Kelola Owner" `/users` (SUPER_ADMIN)

**Tanggal:** 2026-07-16
**Referensi desain:** `DESIGN-vercel.md` · `desain/typography-improvement-plan.md`
**Scope:** frontend, dummy. Route `/users` template diambil alih.

## Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Isi tabel | OWNER/tenant saja + metrik tenant (plan, teknisi, router, transaksi) |
| Route | Ambil alih `/users` (template faker bukan halaman produk); guard SA-only |
| Fitur | Full ala /pos-transactions: search + filter Plan + page size + prev/next; aksi Edit/Hapus dummy |

## 1. Route — `src/routes/_authenticated/users/index.tsx` (tulis ulang)

`beforeLoad`: `user?.role !== 'SUPER_ADMIN'` → `redirect({ to: '/' })`. Component
`KelolaOwner` dari `src/features/owners`. Template `src/features/users/**` dibiarkan
yatim (kandidat cleanup terpisah, luar scope).

## 2. Data — `src/features/owners/data/dummy-owners.ts`

```ts
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
```
Generator deterministik 30 owner (tanpa Math.random): rotasi ±15 nama Indonesia
(email diturunkan dari nama, domain contoh), plan pola rotasi Free-heavy
(mis. `i % 5`: 0-2 Free, 3 Standard, 4 → Pro tiap kelipatan), teknisi `i % 11`,
router `1 + (i*3 % 25)`, transaksi `(i*97) % 2000`.

## 3. Halaman — `src/features/owners/index.tsx` (`KelolaOwner`)

Shell standar (Header/Main/outerBox), H1 "Kelola Owner" + deskripsi muted
"Semua owner (tenant) di platform beserta pemakaiannya."

- **Toolbar** (pola /pos-transactions): search nama/email debounce 300ms;
  `SelectTrigger w-full sm:w-[160px]` filter Plan (all/Free/Standard/Pro).
- **State**: rows di `useState(DUMMY_OWNERS)` (agar Hapus/Edit terasa nyata),
  search, debouncedSearch, planFilter, currentPage, pageSize. Pipeline `useMemo`
  filter → search → slice; perubahan filter reset page 1.
- **Tabel** (card `nestedCardClass py-0` + `CardContent px-0` + overflow-x-auto):

| Kolom | Style |
|---|---|
| Nama (`ps-4`) | `text-sm text-foreground whitespace-nowrap` |
| Email | `text-sm text-muted-foreground whitespace-nowrap` |
| Plan | Badge `size='sm'`: Free → `variant='secondary' text-muted-foreground`; Standard → `info-light`; Pro → `primary-light` |
| Teknisi / Router / Transaksi POS | `text-right text-sm tabular-nums` (header ikut `text-right`) |
| Aksi (`pe-4` kanan) | `DropdownMenu` ⋯ (pola /servers): Edit, Hapus (variant destructive) |

  Header resep standar; empty state colSpan 7 `h-24` "Tidak ada owner yang cocok."
- **Footer paginasi**: "Menampilkan X–Y dari Z owner" + page size 10/25/50/100 +
  prev/next (persis /pos-transactions).
- **Edit**: Dialog form (Input Nama, Input Email, Select Plan) → Simpan: update row
  di state + toast sukses. Dummy murni.
- **Hapus**: AlertDialog konfirmasi (pola /servers, teks bahasa Indonesia) →
  hapus row dari state + toast.

## 4. Navigasi

- `sidebar-data.ts`: `{ title: 'Kelola Owner', url: '/users', icon: Users }` setelah
  Dashboard. `app-sidebar.tsx`: tampil hanya `SUPER_ADMIN`.
- Dashboard SA: kartu **Total User** dibungkus `Link to='/users'` (pola kartu Voucher:
  `active:scale-[0.98]` + `hover:bg-muted/30`, Card `h-full`).

## 5. Kebutuhan backend (dicatat)

Endpoint list owner + agregat per tenant (plan aktif, count teknisi/router/transaksi)
— belum ada. Mutasi edit/hapus owner: `PATCH/DELETE /users/:id` (SA) sudah ada di
backend, wiring menyusul.

## 6. Verifikasi

1. `vite build` (routeTree tak berubah — route /users sudah ada) + `tsc -b` + eslint bersih.
2. SA: sidebar "Kelola Owner" → tabel 30 dummy; search/filter/page-size jalan;
   Edit mengubah baris; Hapus menghilangkan baris; kartu Total User dashboard clickable.
3. OWNER/TEKNISI: akses `/users` → redirect `/`; sidebar tanpa item.
4. Light + dark mode.
