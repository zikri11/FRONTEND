# Design: Riwayat Transaksi POS di Dashboard (OWNER)

**Tanggal:** 2026-07-13
**Rujukan desain:** `DESIGN-vercel.md` (Geist design language), `desain/typography-improvement-plan.md` (adaptasi Geist ke EgNET)
**Rujukan data:** `doc/POS_TESTING_GUIDE.md` (bentuk transaksi POS: `transactionId`, `serverId`, `profileId`, `outletName`, `customerName`)

## Context

Card "Pengguna Aktif" di `/dashboard` (`src/features/dashboard/index.tsx:430-445`) menampilkan daftar user WiFi aktif (IP/MAC/uptime) — data teknis yang gak relevan buat role OWNER. Untuk OWNER, card ini sekarang selalu nampilin `isForbidden` (`dashboard/index.tsx:108,187`) → cuma munculin placeholder "Akses Terkunci" kosongan, gak ada value.

OWNER (pemilik bisnis FnB) lebih butuh liat **riwayat transaksi POS terbaru** (voucher yang barusan dibeli pelanggan lewat sistem kasir) daripada data teknis WiFi. Ganti isi card ini — khusus role OWNER — jadi feed transaksi POS. Role TEKNISI/SUPER_ADMIN **tidak berubah**, tetap lihat "Pengguna Aktif" seperti sekarang (mereka yang butuh data teknis buat troubleshooting).

Data POS sungguhan (dari endpoint `/pos/v1/trigger-voucher`) belum diekspos lewat REST list buat konsumsi dashboard — scope ini pakai **data dummy hardcode**; wiring ke API asli menyusul terpisah.

## Scope

**File diubah:**
- `src/features/dashboard/index.tsx` — cabang render card (baris ±430-445) berdasar `isOwner` (variabel udah ada, baris 136).

**File baru:**
- `src/features/dashboard/components/recent-pos-transactions.tsx` — sibling `recent-sales.tsx`, dipakai eksklusif buat OWNER.

**Tidak diubah:** `recent-sales.tsx`, alur data TEKNISI/SUPER_ADMIN, `isForbidden`/`RecentSales` (tetap dipakai buat role non-OWNER).

## Komponen

Dibangun dari pola ReUI **`c-item-12`** ("Activity feed items with avatars and actions" — `Item` + `Avatar` + `Badge`, `npx shadcn@latest add @reui/c-item-12`). Dipilih karena avatar+badge lebih cepat dibaca sekilas buat audiens non-teknis (OWNER) dibanding tabel data mentah, dan avatar-row pattern-nya konsisten sama card lama yang digantikan.

**Per baris (satu transaksi):**
| Elemen | Isi | Style |
|---|---|---|
| Avatar | Inisial `outletName` | sama pola `AvatarFallback` di `recent-sales.tsx:32-33` |
| Judul | `customerName` | `text-sm font-medium` (ikut `recent-sales.tsx:37`, bukan `font-semibold`) |
| Subjudul | `outletName · {transactionId}` | `text-xs text-muted-foreground`, `transactionId` di dalam `font-mono` (§6 typography plan — ID wajib mono) |
| Kanan-atas | Badge status | `<Badge variant="success-light">Sukses</Badge>` / `<Badge variant="destructive-light">Gagal</Badge>` — pakai varian bawaan `@/components/reui/badge`, bukan utility class manual |
| Kanan-bawah | Waktu relatif | `text-xs text-muted-foreground` (mis. "5 menit lalu") — teks statis, bukan hitungan real-time |

**Card header (khusus OWNER):**
- Title: "Transaksi POS Terbaru"
- Description: "Riwayat transaksi terbaru dari sistem POS"

(Pakai `CardTitle`/`CardDescription` default — sudah H3 16/600 ink + Caption 12/400 muted by design system, tidak perlu override.)

## Data (dummy)

Const array module-level di `recent-pos-transactions.tsx`, 5-6 entri, campur status `SUKSES`/`GAGAL`, outlet & nama pelanggan bervariasi, waktu relatif teks statis:

```ts
type PosTransaction = {
  transactionId: string
  outletName: string
  customerName: string
  status: 'SUKSES' | 'GAGAL'
  relativeTime: string
}
```

Tidak ada fetching/query — array inline, tidak ada loading/error state (murni dummy, sesuai instruksi eksplisit).

## Yang tidak berubah / di luar scope

- Wiring ke API POS asli (backend belum ekspos endpoint list transaksi buat dashboard — nanti scope terpisah).
- `recent-sales.tsx` dan behavior card buat TEKNISI/SUPER_ADMIN.
- Layout grid card (`col-span-1 lg:col-span-4`), posisi card dalam grid dashboard.
- Warna/token semantic baru — pakai varian `Badge` yang sudah ada (`success-light`/`destructive-light`).

## Verifikasi

1. `npx tsc -b` + `npx eslint` bersih pada file yang diubah/baru.
2. Dev server: login OWNER → `/dashboard` → card baru "Transaksi POS Terbaru" muncul, avatar+badge+mono ID tampil benar, tidak ada layout shift dibanding card lain di row yang sama.
3. Login TEKNISI/SUPER_ADMIN → `/dashboard` → card "Pengguna Aktif" tetap seperti semula (regresi check).
4. Cek light & dark mode — badge success/destructive tetap kebaca jelas di keduanya (token sudah ada, tidak baru).
