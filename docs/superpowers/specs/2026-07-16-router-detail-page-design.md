# Desain — Halaman Detail Router `/routers/$id` (SUPER_ADMIN, "akses remote")

**Tanggal:** 2026-07-16 · **Referensi:** `DESIGN-vercel.md` · `typography-improvement-plan.md`
**Layout referensi:** `/billing` (disesuaikan). Menggantikan dialog "Lihat Detail" di `/routers`.
Satu halaman mencakup rasa `/profiles` + `/vouchers` untuk 1 router — SA punya semua akses.

## Keputusan (QnA)

| Keputusan | Pilihan |
|---|---|
| Struktur | Panah kembali → header router → Informasi Router → 3 kartu statistik voucher → Profil Hotspot → Voucher |
| Buat Voucher | Popover Tunggal/Masal persis /vouchers → set `activeServerId` (server-store) = router ini → Link ke `/vouchers/add-single` / `add-bulk` existing (ikatan "pilih di tabel = ikat router") |
| Isi tabel | Voucher full (checkbox bulk-delete, search, filter Paket+Status, aksi, paginasi); Profil Hotspot ringkas tanpa aksi |

## Route & navigasi

- `src/routes/_authenticated/routers/$id.tsx` — guard SA-only, `Route.useParams()` →
  `<RouterDetail routerId={id} />`.
- `features/routers/index.tsx` (list): baris clickable → detail (Aksi stopPropagation);
  dropdown: "Lihat Detail" → navigate; **dialog Detail + state-nya dihapus**
  (Edit/Hapus dialog tetap).

## Halaman — `src/features/routers/detail.tsx`

1. **Panah kembali** ghost icon di luar box (pola `/users/$id`).
2. **Header**: nama router `text-2xl font-semibold tracking-tight` + `StatusBadge`
   sejajar; subline: `host:port` (`font-mono text-sm muted`) ` - {ownerName}`.
   Router tak ketemu → "Router Tidak Ditemukan".
3. **Card Informasi Router** — baris `DetailRow` (label `text-xs` muted kiri, nilai
   kanan): Protokol (`ProtocolBadge`), Terakhir Dicek (mono muted), Username (mono),
   Password (mask `••••••••` + toggle mata + `select-all`), Hotspot Name (mono, "—"),
   DNS Login (mono, "—"). StatusBadge/ProtocolBadge/DetailRow diekspor dari list atau
   dipindah ke file bersama `components.tsx` kecil dalam feature.
4. **3 kartu statistik** (`sm:grid-cols-3`, pola kartu dashboard): Total Voucher,
   Belum Dipakai, Terpakai — DIHITUNG dari dummy voucher router ini
   (`rows.length`, `filter UNUSED`, `filter USED`), angka `tabular-nums`.
5. **Card Profil Hotspot** (`py-0`+`CardContent px-0`, tanpa aksi): kolom Profil
   (`ps-4` ink) · Status (badge Sinkron success soft / Belum Sinkron warning soft —
   pola /profiles) · Bandwidth (`font-mono text-xs`) · Shared (`tabular-nums` kanan) ·
   Masa Aktif (`font-mono text-xs`, `pe-4`). 3–4 baris dummy per router.
6. **Card Voucher (full)**:
   - Header card: judul "Voucher" + deskripsi; kanan: tombol **Sinkron** (outline,
     toast "Sinkronisasi dimulai (dummy)") + **Buat Voucher** Popover Tunggal/Masal
     (markup persis /vouchers:331-367); onClick pilihan → `useServerStore` set
     `activeServerId = router.id` → navigate `/vouchers/add-single` / `add-bulk`.
     (Cari setter existing di server-store; kalau hanya ada state, pakai
     `useServerStore.setState`.)
   - Toolbar: search kode (debounce 300ms) + Select Paket (dari profil dummy router,
     `sm:w-[180px]`) + Select Status (Aktif/Terpakai, `sm:w-[140px]`).
   - Tabel persis /vouchers: checkbox select-all + per-baris; bar merah "N voucher
     dipilih" + tombol Hapus Massal (AlertDialog → hapus state + toast); kolom
     Kode (kode ink + password muted, keduanya `font-mono text-xs`) · Paket · Outlet
     (muted) · Status (badge Aktif success soft / Terpakai secondary) · Dibuat (mono
     muted `tabular-nums` kanan) · Aksi (dropdown: "Unduh PDF" toast, "Hapus"
     AlertDialog single).
   - Footer paginasi standar 10/25/50/100.
7. **Data** — `features/routers/data/dummy-router-detail.ts`: generator deterministik
   seeded indeks router: 20–60 voucher (kode `VC-{seed}-{n}` + password numerik,
   paket dari profil router, status rotasi ±2/3 UNUSED, createdAt Jun–Jul 2026) dan
   3–4 profil (nama "1 Jam/3 Jam/1 Hari/7 Hari", rateLimit "2M/2M" dst., sharedUsers,
   validity, syncedToRouter rotasi).

## Wiring backend (dicatat)

Prasyarat ikatan add-voucher jalan end-to-end: tabel `/routers` di-wiring ke
`GET /servers` (SA scope global, id real). Voucher/profil per server: endpoint sudah
ada (`GET /vouchers`, `GET /profiles`, delete-bulk, PDF publik).

## Verifikasi

`vite build` + `tsc` + eslint bersih; klik baris /routers → detail; statistik = isi
tabel; bulk delete & filter jalan; Buat Voucher → halaman add existing dengan router
terikat; non-SA redirect; halaman /vouchers & /profiles teknisi tak berubah.
