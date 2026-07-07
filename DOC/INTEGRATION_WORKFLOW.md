# Panduan Integrasi Frontend (EgNET) & Backend (NestJS)

Dokumen ini berisi panduan alur kerja (*workflow*) dan fase-fase integrasi antara frontend `shadcn-admin` (React/Vite) dengan backend NestJS (Management WiFi untuk FnB).

---

## Bab 1: Ringkasan Arsitektur & Base URL

Sistem menggunakan arsitektur RESTful API modern dengan komunikasi stateful di sisi klien (menggunakan JWT).

- **Base URL API:** `http://localhost:<PORT>/api` (Global Prefix di backend).
- **Frontend Stack Utama Integrasi:** 
  - `@tanstack/react-query` (untuk *data fetching*, *caching*, dan *polling*).
  - `axios` (sebagai HTTP Client standar dengan *interceptor*).
  - `zustand` (opsional, untuk Global State Management data *User*).
- **Environment Variables (Frontend):**
  Pastikan `.env` di frontend memiliki parameter seperti:
  ```env
  VITE_API_BASE_URL=http://localhost:3000/api
  ```

---

## Bab 2: Alur Autentikasi & RBAC (Role-Based Access Control)

Backend menggunakan **Native JWT** (bukan Clerk) dengan pembagian tiga *role* utama: `SUPER_ADMIN`, `OWNER`, dan `TEKNISI`. Desain UI tetap mempertahankan estetika `shadcn-admin`, namun logika dibelakangnya diganti secara menyeluruh.

### Fase Persiapan Autentikasi
- [x] **Setup Axios Interceptor:** Buat file utilitas Axios (misal: `src/lib/axios.ts`) untuk secara otomatis menyisipkan *header* `Authorization: Bearer <accessToken>` pada setiap *request*.
- [x] **Hapus Ketergantungan Clerk:** Bersihkan instalasi dan pembungkus (*wrapper*) `@clerk/react` dari `__root.tsx` atau `main.tsx`.
- [x] **State Management Auth:** Buat *store* atau *context* yang menyimpan struktur data User hasil *login*: `{ id, email, name, role, ownerId }` dan status `isAuthenticated`.

### Alur Login & Logout
- [x] **Integrasi POST `/api/auth/login`:** 
  - Sambungkan form UI Login bawaan template ke API ini.
  - Simpan `accessToken` ke dalam `localStorage` (atau HTTP-only Cookies jika direkomendasikan kedepannya).
- [ ] **Integrasi GET `/api/auth/me`:** 
  - Buat mekanisme pengecekan saat *initial load* / *refresh page* untuk memvalidasi token dan mengambil ulang data profil *user* aktif.
- [ ] **Fungsi Logout:** Hapus token dari *storage* dan kembalikan pengguna ke rute `/login`.

### Mekanisme RBAC (Role-Based Access Control)
- [x] **Router Middleware (HOC):** Di tingkat `@tanstack/react-router`, buat logika proteksi (seperti file `_authenticated.tsx`).
- [x] **Validasi Role per Halaman:** 
  - Teknisi dicegah mengakses rute halaman `/users` dan `/billing` (lempar ke komponen halaman `403 Forbidden` atau `Dashboard`).
  - Owner dapat mengakses hampir seluruh modul *kecuali* porsi super admin.

---

## Bab 3: Fase Integrasi Fitur Utama

Integrasi dibagi dalam 4 tahap berdasarkan prioritas fungsional bisnis (diurutkan dari yang paling krusial).

### Tahap 1: Core Network & Devices (Konektivitas Dasar)
Tahap ini paling krusial karena fitur lain tidak berjalan jika router belum terhubung.
- [ ] **Integrasi POST `/api/servers/test-connection`:** Implementasi UI tombol "Test Connection" pada form tambah router.
- [ ] **Integrasi CRUD `/api/servers`:** Halaman manajemen perangkat Router MikroTik. Pastikan password router dikirimkan dengan aman.
- [ ] **Integrasi CRUD `/api/profiles`:** Halaman konfigurasi profil *hotspot* (bandwidth, durasi).
- [ ] **Integrasi POST `/api/profiles/sync/:serverId`:** Fitur *button* untuk menarik/sinkronisasi profil langsung dari MikroTik ke database.

### Tahap 2: Manajemen Voucher (Operasional Harian)
Fokus pada pembuatan dan pencetakan akses untuk pengunjung/pelanggan.
- [ ] **Integrasi POST `/api/vouchers/single` & `batch`:** Sambungkan form pembuatan voucher ke backend (termasuk *background job* via BullMQ untuk `batch`).
- [ ] **Integrasi GET `/api/vouchers`:** Tampilkan daftar voucher ke dalam tabel data.
- [ ] **Integrasi PDF Endpoint:** Sediakan tautan tombol Cetak (*Print*) yang mengarah atau melakukan *fetch* ke `GET /api/vouchers/pdf/...`.

### Tahap 3: Pemantauan & Analitik (Dashboard & Monitoring)
Memanfaatkan `@tanstack/react-query` dengan opsi `refetchInterval` untuk *real-time experience*.
- [ ] **Polling GET `/api/monitoring/active/:serverId`:** Tampilkan metrik pelanggan yang sedang aktif.
- [ ] **Polling GET `/api/monitoring/resources/:serverId`:** Render ke grafik resource (CPU/RAM/Uptime).
- [ ] **Polling GET `/api/monitoring/traffic/:serverId`:** Render metrik RX/TX ke dalam grafik *Traffic Overview* (Area Chart).

### Tahap 4: AI Assistant & Billing (Fitur Tingkat Lanjut)
*(Catatan: Modul POS ditangguhkan sementara sampai backend siap).*
- [ ] **Integrasi `/api/billing/*`:** Halaman berlangganan, *checkout* pembayaran Duitku (menerima `paymentUrl` dan merender tombol/iframe pembayaran).
- [ ] **Integrasi Chat AI `/api/ai/chat`:** Bangun UI *chat widget* di pojok bawah aplikasi, integrasikan dengan endpoint chat bersesi untuk komunikasi interaktif.
- [ ] **Integrasi Laporan AI `/api/ai/servers/:id/analyze`:** Tombol pemindaian performa konfigurasi.

---

## Bab 4: Penanganan Error (Error Handling) & Status Code

Pastikan UX tetap elegan saat masalah komunikasi frontend-backend terjadi.

- [ ] **401 Unauthorized:**
  - **Pemicu:** Token JWT hilang atau *expired*.
  - **Aksi Frontend:** Hapus data token, tampilkan *toast notification* "Sesi telah habis", *redirect* ke halaman `/login`.
- [ ] **403 Forbidden:**
  - **Pemicu:** *Teknisi* mencoba mengakses data *Owner*, atau batas router (`assertCanAddRouter`) habis karena langganan sudah *expired*.
  - **Aksi Frontend:** Tampilkan *Alert/Modal* "Akses Ditolak" atau "Silakan Upgrade Paket Layanan Anda".
- [ ] **429 Too Many Requests:**
  - **Pemicu:** Rate limiter API terpicu (contoh: *Login* > 5x per menit, *AI Analyze* > 10x per jam).
  - **Aksi Frontend:** Hentikan tombol (*disable* button) dan tampilkan hitungan mundur (*cooldown/timer*).
- [ ] **500 & 503 Internal / Service Error:**
  - **Pemicu:** Gagal menghubungi Duitku, gagal koneksi ke RouterOS API (router *offline*).
  - **Aksi Frontend:** Gunakan *Error Boundary* komponen atau *Toast* destruktif (*red alert*) dengan pesan gagal terhubung ke router. Tidak boleh menampilkan halaman "Blank White Screen".
