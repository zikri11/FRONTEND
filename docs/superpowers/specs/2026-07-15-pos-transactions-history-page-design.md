# Desain — Halaman "Riwayat Transaksi POS" (OWNER)

**Tanggal:** 2026-07-15
**Referensi desain:** `DESIGN-vercel.md` · `desain/typography-improvement-plan.md`
**Spec terkait:** `2026-07-15-pos-transactions-table-design.md` (tabel dashboard)
**Scope:** frontend, dummy data. Belum ada endpoint backend list PosTransaction untuk owner.

## Ringkasan

Card "Transaksi POS Terbaru" di dashboard OWNER jadi clickable → halaman baru
`/pos-transactions` ("Riwayat Transaksi POS"). Halaman menampilkan seluruh transaksi
dummy dengan filter outlet, search, sort terbaru/terlama, dan page size 10/25/50/100.
Pola UI mengikuti halaman `/vouchers` (pattern list-page standar codebase) — tanpa
komponen atau style baru.

## Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Akses | Card dashboard clickable + entri sidebar (hanya OWNER) |
| Kolom tabel | 4 kolom sama dashboard: ID Transaksi, Pelanggan, Outlet, Waktu |
| Pendekatan | Pola manual `/vouchers` (bukan TanStack Table) — filter/sort/paginasi client-side `useMemo` |
| Data | Dummy generator deterministik, satu sumber dipakai dashboard + halaman |

## 1. Data dummy — `src/features/pos-transactions/data/dummy-transactions.ts`

- Export `DUMMY_POS_TRANSACTIONS: PosTransaction[]` — 120 item, terbaru dulu.
- Generator module-level (loop deterministik, tanpa `Math.random`): `TRX-POS-120` …
  `TRX-POS-001`; rotasi ±10 nama Indonesia; rotasi 3 outlet (Outlet Pusat, Outlet
  Cabang A, Outlet Cabang B); waktu mundur dari 14 Jul 2026 (interval bervariasi
  deterministik, rentang ± Mei–Jul 2026).
- Tipe:
  ```ts
  export type PosTransaction = {
    transactionId: string
    customerName: string
    outletName: string
    createdAt: string // "d MMM yyyy, HH:mm", sudah terformat
  }
  ```
- Urutan array = urutan waktu menurun → sort Terbaru = array asli, Terlama = reversed
  (tanpa parsing tanggal).
- `RecentPosTransactions` (dashboard) hapus dummy lokalnya → impor
  `DUMMY_POS_TRANSACTIONS.slice(0, 10)`.

## 2. Route — `src/routes/_authenticated/pos-transactions/index.tsx`

Pola sama `profiles/index.tsx`:

```tsx
export const Route = createFileRoute('/_authenticated/pos-transactions/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role !== 'OWNER') throw redirect({ to: '/' })
  },
  component: PosTransactionsHistory,
})
```

`routeTree.gen.ts` regenerate otomatis (vite plugin).

## 3. Halaman — `src/features/pos-transactions/index.tsx`

Shell standar (pola vouchers): `Header` (Search, ThemeSwitch, ConfigDrawer,
ProfileDropdown) + `Main` + container `outerBoxClass`.

- **Judul:** H1 "Riwayat Transaksi POS" — `text-2xl font-semibold tracking-tight`;
  deskripsi `text-muted-foreground text-sm` ("Seluruh transaksi voucher dari sistem
  POS di semua outlet").
- **Toolbar** (flex wrap, pola vouchers):
  - `Input` search — placeholder "Cari ID, pelanggan, atau outlet…", debounce 300ms,
    match case-insensitive terhadap `transactionId`, `customerName`, `outletName`.
  - `Select` outlet — "Semua Outlet" (default) + daftar outlet unik dari data.
  - `Select` urutan — "Terbaru" (default) / "Terlama".
- **Tabel** dalam card `nestedCardClass` — 4 kolom persis komponen dashboard:
  | Kolom | Style |
  |---|---|
  | ID Transaksi | `font-mono text-xs text-muted-foreground whitespace-nowrap` |
  | Pelanggan | `text-sm text-foreground whitespace-nowrap` |
  | Outlet | `text-sm text-muted-foreground whitespace-nowrap` |
  | Waktu (kanan) | `font-mono text-xs text-muted-foreground tabular-nums text-right whitespace-nowrap` |
  Header kolom `text-xs font-medium tracking-wide text-muted-foreground`, tanpa
  uppercase; header row `hover:bg-transparent`.
  - Empty state: satu `TableRow` colSpan 4 — "Tidak ada transaksi yang cocok."
- **Footer paginasi** (pola vouchers): teks "Menampilkan X–Y dari Z transaksi"
  (muted, `tabular-nums`) · `Select` page size 10/25/50/100 (default 10) ·
  tombol Sebelumnya/Berikutnya (`Button variant='outline' size='sm'`, disabled di
  ujung).
- **State:** `search`, `debouncedSearch`, `outletFilter`, `sortOrder`, `page`,
  `pageSize`. Pipeline `useMemo`: filter outlet → search → sort → slice. Perubahan
  filter/search/sort/pageSize reset `page` ke 1.
- Tidak ada fetch/polling — murni dummy.

## 4. Dashboard — card clickable

`src/features/dashboard/index.tsx` (branch owner): bungkus card "Transaksi POS
Terbaru" dengan `<Link to='/pos-transactions' className='block transition-transform
active:scale-[0.98]'>` + tambah `hover:bg-muted/30 transition-colors` pada Card —
persis pola card Voucher.

## 5. Sidebar

- `src/components/layout/data/sidebar-data.ts`: tambah item
  `{ title: 'Transaksi POS', url: '/pos-transactions', icon: ReceiptText }`
  (lucide-react) — di group yang sama dengan Dashboard, setelah Dashboard.
- `src/components/layout/app-sidebar.tsx`: perluas filter role existing — item
  'Transaksi POS' disembunyikan bila role bukan OWNER.

## 6. Di luar scope

- Wiring backend (endpoint list PosTransaction owner belum ada).
- Filter rentang tanggal, kolom status/paket/voucher, export CSV.
- Halaman detail transaksi.

## 7. Verifikasi

1. `npx tsc -b` + `npx eslint` (file baru + file yang diedit) bersih.
2. Visual (owner, light + dark): card dashboard clickable → `/pos-transactions`;
   search/filter/sort/page-size bekerja; empty state saat search tak cocok;
   sidebar tampil "Transaksi POS".
3. TEKNISI/SUPER_ADMIN: sidebar tanpa item itu; akses langsung `/pos-transactions`
   → redirect `/`.
4. Dashboard tetap 10 baris (slice dari sumber data baru).
