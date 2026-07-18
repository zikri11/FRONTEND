import { useState } from 'react'
import { Copy, Check, InfoIcon } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { outerBoxClass } from '@/lib/nested-box'

// Komponen CodeBlock sederhana pengganti kibo-ui karena kodenya belum tersedia
function SimpleCodeBlock({ language, filename, code }: { language: string, filename?: string, code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    // Code block ikut tema (token, tanpa warna hardcode) — filosofi Vercel:
    // surface elevated + hairline border + ink. Label header = mono eyebrow.
    <div className="w-full my-6 rounded-lg overflow-hidden border bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="font-mono text-xs font-medium text-muted-foreground">{filename || language}</span>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-foreground font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export function Docs() {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className={`${outerBoxClass} flex-1`}>
        <div className="mx-auto w-full max-w-4xl pb-12">
          
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
            Pengenalan API
          </h1>
          <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground">
            API Integrasi POS memungkinkan sistem kasir (Point of Sale) kamu membuat voucher WiFi hotspot secara otomatis saat transaksi. Setiap permintaan dari POS akan langsung membuat kode voucher baru di router MikroTik, lalu mengembalikan data voucher (kode, QR, tata cara) untuk dicetak di struk.
          </p>

          <Alert className="my-8">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              <ul className="my-2 ml-6 list-disc [&>li]:mt-2">
                <li>Voucher dibuat BARU ke MikroTik saat ada permintaan POS — bukan ambil stok lama.</li>
                <li>1 permintaan = 1 voucher. Mau banyak? Kirim beberapa kali (transactionId beda).</li>
                <li>Kode voucher digenerate sistem (6 digit angka). POS tidak perlu menentukan.</li>
                <li>API key sudah terikat ke 1 server/outlet — POS tak perlu kirim Server ID.</li>
              </ul>
            </AlertDescription>
          </Alert>

          <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
            API Gateway URL
          </h2>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Semua endpoint POS diawali dengan base URL berikut. Ganti host/port sesuai server produksi kamu saat deploy.
          </p>

          <SimpleCodeBlock 
            language="bash"
            filename="Base URL"
            code="http://localhost:4100/api"
          />

          <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
            Autentikasi
          </h2>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Setiap permintaan POS wajib menyertakan API key pada header <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">x-api-key</code>. Buat API key di tab Kelola Key (key terikat ke 1 outlet).
          </p>

          <SimpleCodeBlock 
            language="http"
            filename="Header"
            code="x-api-key: pos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />

          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">x-api-key</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>API key outlet. Tanpa ini → 401.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0 mt-12 mb-4 flex items-center gap-3">
            <Badge className="text-sm bg-info/10 text-info ring-1 ring-inset ring-info/20 rounded-md px-2 py-0.5">GET</Badge>
            Endpoint — Daftar Paket WiFi
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-6 bg-muted p-2 rounded-md w-fit">
            /pos/v1/profiles
          </p>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Mengambil daftar paket (profil hotspot) yang tersedia pada server yang terikat ke API key. Dipakai kasir untuk memilih paket sebelum membuat voucher.
          </p>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Headers
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">x-api-key</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>API key outlet.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Contoh Permintaan
          </h3>
          <SimpleCodeBlock 
            language="bash"
            filename="cURL"
            code={`curl http://localhost:4100/api/pos/v1/profiles \\
  -H "x-api-key: pos_xxxxxxxx..."`}
          />

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Contoh Respons
          </h3>
          <SimpleCodeBlock 
            language="json"
            filename="200 OK"
            code={`{
  "servers": [
    {
      "serverId": "cmqa8lvx40009z8us9542d23p",
      "serverName": "Outlet A",
      "profiles": [
        {
          "profileId": "cmqa8lw9u000bz8us0tip6xab",
          "name": "1 Jam",
          "rateLimit": "2M/2M",
          "validity": "1d",
          "sharedUsers": 1
        }
      ]
    }
  ]
}`}
          />

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Deskripsi Respons
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">servers[]</TableCell>
                  <TableCell>array</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Daftar server (berisi 1, milik API key).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">serverId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>ID server.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">serverName</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Nama server/outlet.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">profiles[]</TableCell>
                  <TableCell>array</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Daftar paket pada server.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">profileId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>ID paket — dipakai saat trigger voucher.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">name</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Nama paket (mis. '1 Jam').</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">rateLimit</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Batas kecepatan (upload/download).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">validity</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Opsional</TableCell>
                  <TableCell>Masa aktif (mis. '1d').</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">sharedUsers</TableCell>
                  <TableCell>number</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Jumlah perangkat per voucher.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0 mt-12 mb-4 flex items-center gap-3">
            <Badge className="text-sm bg-success/10 text-success ring-1 ring-inset ring-success/20 rounded-md px-2 py-0.5">POST</Badge>
            Endpoint — Buat Voucher
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-6 bg-muted p-2 rounded-md w-fit">
            /pos/v1/trigger-voucher
          </p>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Membuat 1 voucher baru di MikroTik lalu mengembalikan datanya (kode, QR, instruksi) untuk dicetak di struk. Tidak perlu kirim serverId — sudah ditentukan oleh API key.
          </p>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Headers
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">x-api-key</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>API key outlet.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">Content-Type</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>application/json</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Body (JSON)
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">transactionId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>ID transaksi unik dari POS. Kunci idempotensi (cegah voucher dobel).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">profileId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>ID paket yang dipilih kasir (dari endpoint profiles).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">outletName</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Opsional</TableCell>
                  <TableCell>Nama outlet — tampil di struk.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">customerName</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Opsional</TableCell>
                  <TableCell>Nama pelanggan.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Contoh Permintaan
          </h3>
          <SimpleCodeBlock 
            language="bash"
            filename="cURL"
            code={`curl -X POST http://localhost:4100/api/pos/v1/trigger-voucher \\
  -H "x-api-key: pos_xxxxxxxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "TRX-POS-001",
    "profileId": "cmqa8lw9u000bz8us0tip6xab",
    "outletName": "Outlet A",
    "customerName": "Budi"
  }'`}
          />

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Contoh Respons
          </h3>
          <SimpleCodeBlock 
            language="json"
            filename="201 Created"
            code={`{
  "transactionId": "TRX-POS-001",
  "voucher": {
    "username": "738142",
    "password": "738142",
    "profileName": "1 Jam",
    "rateLimit": "2M/2M",
    "validity": "1d",
    "loginUrl": "http://hotspot.outletA.com/login?username=738142&password=738142",
    "qrBase64": "data:image/png;base64,iVBORw0KGgo...",
    "instructions": "Sambungkan ke WiFi 'Outlet A' → scan QR atau buka halaman login → masukkan username & password."
  }
}`}
          />

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Deskripsi Respons
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Field
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Tipe
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Wajib
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Keterangan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">transactionId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Echo transactionId dari permintaan.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.username</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Kode voucher (juga username login).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.password</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Password login (sama dengan kode).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.profileName</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Nama paket.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.rateLimit</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Batas kecepatan.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.validity</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Opsional</TableCell>
                  <TableCell>Masa aktif.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.loginUrl</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>URL halaman login hotspot.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.qrBase64</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Gambar QR (data URI) — siap dicetak/ditampilkan.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">voucher.instructions</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Ya</TableCell>
                  <TableCell>Tata cara pakai untuk pelanggan.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <h3 className="scroll-m-20 text-base font-semibold mt-8 mb-4">
            Kode Respons
          </h3>
          <div className="my-6 w-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Kode
                  </TableHead>
                  <TableHead className='text-xs font-medium tracking-wide text-muted-foreground'>
                    Arti
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono font-medium">200</TableCell>
                  <TableCell>transactionId sudah pernah diproses — voucher yang sama dikembalikan (idempoten).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">201</TableCell>
                  <TableCell>Voucher baru berhasil dibuat.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">400</TableCell>
                  <TableCell>Body tidak valid (mis. transactionId kosong).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">401</TableCell>
                  <TableCell>API key tidak valid / kosong / nonaktif.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">403</TableCell>
                  <TableCell>API key tidak berhak mengakses server tersebut.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">404</TableCell>
                  <TableCell>Profil tidak ditemukan pada server.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono font-medium">502</TableCell>
                  <TableCell>Router tidak dapat dijangkau saat membuat voucher — coba lagi.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

        </div>
        </div>
      </Main>
    </>
  )
}
