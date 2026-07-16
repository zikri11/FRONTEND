# Desain — Dashboard OWNER Lepas dari Koneksi Router (DB-only)

**Tanggal:** 2026-07-16
**Scope:** frontend, `src/features/dashboard/index.tsx` saja. Jalur TEKNISI/SUPER_ADMIN tidak berubah.

## Masalah

Dashboard OWNER ikut terikat koneksi router live: `fetchDashboardMetrics` (poll 3 dtk)
memanggil `/monitoring/snapshot` (403 untuk owner) lalu fallback `/monitoring/traffic`
(query router live). Kalau router mati, seluruh dashboard owner diganti placeholder
"Router Sementara Terputus" — padahal owner FnB tidak butuh data live router (RAM/CPU/
traffic), dan semua data yang relevan untuknya (voucher, transaksi POS, outlet) berasal
dari database.

## Keputusan (hasil QnA 2026-07-16)

| Keputusan | Pilihan |
|---|---|
| Deteksi koneksi router untuk owner | **Buang total** — owner tak pernah panggil `/monitoring/*`; dashboard selalu render |
| Tombol Sinkron untuk owner | **Sembunyikan** (aksinya operasi router live, backend menolak owner 403) |
| Sumber status outlet owner | **Tunggu endpoint histori backend** — tab Monitoring & `/monitoring` tetap dummy; tidak pakai `lastStatus` dulu |

## Perubahan (`src/features/dashboard/index.tsx`)

1. **Nonaktifkan query metrics untuk owner:**
   ```ts
   enabled: !!activeServerId && !isOwner && wsResult.wsStatus === 'unavailable'
   ```
   (sebelumnya `isOwner || wsStatus === 'unavailable'`). Efek berantai: `metrics` tetap
   `EMPTY_METRICS` → `isDisconnected`/`isNotFound` false → placeholder "Router Sementara
   Terputus" dan "Router Tidak Ditemukan" tak pernah render untuk owner, tanpa branching
   UI baru.
2. **Fix jebakan loading:** query disabled berstatus `isPending: true` permanen →
   `RouterLoadingOverlay` nyangkut. Ubah:
   ```ts
   const dashboardIsLoading = isOwner
     ? false
     : wsResult.wsStatus !== 'live' ? isPending : false
   ```
3. **Sembunyikan tombol Sinkron** untuk owner: bungkus `{!isOwner && (<Button …Sinkron…/>)}`.
   Mutation tetap ada (dipakai role lain).
4. **`handleRetry`** tak terjangkau owner (placeholder tak render) — biarkan.

## Jalur data owner sesudah perubahan

| Bagian | Sumber | Router-dependent |
|---|---|---|
| Kartu Voucher / Voucher Terpakai | `GET /vouchers` (database, poll 3 dtk) | tidak |
| Kartu Total Outlet, Total Transaksi POS, delta badge | dummy | tidak |
| Tabel Transaksi POS Terbaru + `/pos-transactions` | dummy (sumber bersama) | tidak |
| Tab Monitoring (status outlet) | dummy | tidak |
| `EmptyRouterPlaceholder` (belum pilih router) | tetap berlaku semua role | tidak |

Router mati → dashboard owner tetap tampil penuh; hanya angka voucher berhenti update
bila backend ikut mati.

## Kebutuhan backend (dicatat, di luar scope frontend ini)

Agar dummy owner bisa diganti data real, backend perlu endpoint berbasis DB:
1. Ringkasan/list transaksi POS untuk owner (`PosTransaction` per tenant, filter outlet,
   paginasi) — untuk kartu Total Transaksi POS, tabel dashboard, halaman `/pos-transactions`.
2. Jumlah outlet (= `PosApiKey`/server aktif per tenant) — kartu Total Outlet.
3. Delta mingguan transaksi/voucher (agregasi DB) — badge tren.
4. Histori status router (poller + tabel status-history + endpoint) — tab Monitoring
   owner & halaman `/monitoring` (timeline uptime real). Sampai ada: dummy.

## Di luar scope

- Perubahan apa pun di jalur TEKNISI/SUPER_ADMIN (WS, snapshot, placeholder tetap).
- Halaman `/monitoring` dan tab Monitoring owner (tetap dummy).
- Implementasi endpoint backend di atas.

## Verifikasi

1. `npx tsc -b` + `npx eslint src/features/dashboard/index.tsx` bersih.
2. Login OWNER, matikan router (atau isi host server dengan IP mati) → dashboard tetap
   render penuh, tanpa placeholder, tanpa overlay loading nyangkut, tanpa request ke
   `/monitoring/*` (cek tab Network).
3. Tombol Sinkron tak tampil untuk owner; tampil untuk TEKNISI.
4. Login TEKNISI dengan router mati → placeholder "Router Sementara Terputus" masih
   muncul (perilaku lama utuh).
