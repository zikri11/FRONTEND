# Desain — Tabel "Transaksi POS Terbaru" Full Width (Dashboard OWNER)

**Tanggal:** 2026-07-15
**Referensi desain:** `D:\MAGANG-KP\PROJEK\DEMO\FRONTEND\DESIGN-vercel.md` · `D:\MAGANG-KP\PROJEK\DEMO\FRONTEND\desain\typography-improvement-plan.md`
**Scope:** hanya branch OWNER di `/dashboard`. Branch TEKNISI/SUPER_ADMIN tidak berubah.

## Ringkasan

Card "Monitoring Router" (`RouterStatusHistory`) dihapus dari baris bawah dashboard OWNER.
Card "Transaksi POS Terbaru" mengisi full width. Tabelnya ditulis ulang: 4 kolom yang
align dengan field backend `PosTransaction` (tanpa kolom fiktif Nominal, tanpa status,
tanpa avatar), data dummy 10 baris.

## 1. Perubahan Layout — `src/features/dashboard/index.tsx`

- Hapus pemakaian `<RouterStatusHistory>` di branch owner + import-nya.
- Hapus wrapper `<div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>` pada branch
  owner; card "Transaksi POS Terbaru" berdiri sendiri full width (tanpa `col-span`).
- Hapus file `src/features/dashboard/components/router-status-history.tsx`
  (tidak ada pemakai lain; riwayat tetap ada di git).
- Judul card "Transaksi POS Terbaru" + deskripsi "Riwayat transaksi terbaru dari sistem
  POS" + `nestedCardClass` dipertahankan.

## 2. Tabel — `src/features/dashboard/components/recent-pos-transactions.tsx`

Komponen `RecentPosTransactions` ditulis ulang. shadcn `Table`. Import `Badge`,
`Avatar*` dihapus.

### Kolom

| # | Header | Field backend | Contoh | Style |
|---|--------|---------------|--------|-------|
| 1 | ID Transaksi | `transactionId` | `TRX-POS-010` | `font-mono text-xs text-muted-foreground` |
| 2 | Pelanggan | `customerName` | `Budi` | `text-sm text-foreground` (400, bukan medium) |
| 3 | Outlet | `outletName` | `Outlet Pusat` | `text-sm text-muted-foreground` |
| 4 | Waktu (rata kanan) | `createdAt` | `14 Jul 2026, 10:52` | `font-mono text-xs text-muted-foreground tabular-nums text-right` |

### Aturan tampilan (dari typography plan)

- Header kolom: `text-xs font-medium tracking-wide text-muted-foreground` —
  **tanpa uppercase** (plan §11 melarang uppercase di UI kecuali Mono Eyebrow).
- Cell utama 14/400 ink; cell sekunder muted; data mesin (ID, timestamp) Geist Mono (§6).
- `tabular-nums` pada waktu; tracking mono selalu 0; tanpa italic/bold.
- Pemisah baris hairline + hover halus: default shadcn `TableRow`.
- Header row tanpa hover (`hover:bg-transparent`).

### Data dummy

10 transaksi hardcode, urut terbaru di atas:

- `transactionId`: `TRX-POS-001` … `TRX-POS-010` (format sesuai kesepakatan).
- `customerName`: nama Indonesia (Budi, Siti, Andi, Rina, …).
- `outletName`: rotasi 3 outlet — Outlet Pusat, Outlet Cabang A, Outlet Cabang B
  (konsisten dengan kartu statistik "Total Outlet" = 3).
- Waktu: string statis 13–14 Jul 2026, format `d MMM yyyy, HH:mm`.

Tipe row lokal di file komponen:

```ts
type PosTransaction = {
  transactionId: string
  customerName: string
  outletName: string
  createdAt: string // sudah terformat, dummy
}
```

## 3. Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Sumber kolom | Align field backend `PosTransaction` — tanpa Nominal (backend tak punya field harga) |
| Kolom status | Tidak ditampilkan (4 kolom saja) |
| Avatar pelanggan | Dihapus |
| Jumlah baris | 10 dummy |
| Format waktu | Absolut, Geist Mono, muted |
| Gaya | Tabel klasik ber-header (opsi A) |

## 4. Di luar scope

- Wiring ke endpoint backend nyata (belum ada endpoint list PosTransaction untuk owner).
- Pagination / link "lihat semua".
- Halaman detail transaksi POS.

## 5. Verifikasi

`npx tsc -b` bersih · `npx eslint` pada 2 file target bersih · cek visual dashboard
OWNER light + dark mode · branch TEKNISI tidak berubah.
