
import { LineChart, Wrench } from "lucide-react";
import Spotlight from "@/components/landing/spotlight";

export default function Roles() {
  return (
    <section id="solution">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-300/70 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-300/70">
              <span className="inline-flex bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                Datang untuk Solusi
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-900),var(--color-indigo-600),var(--color-gray-700),var(--color-indigo-500),var(--color-gray-900))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Satu Platform, Dua Tampilan Khusus
            </h2>
            <p className="text-lg text-gray-600">
              EgNET memisahkan kerumitan teknis dari data bisnis. Owner mendapatkan laporan ringkas yang mudah dipahami, sementara Teknisi memiliki kontrol teknis penuh di belakang layar.
            </p>
          </div>
          {/* Spotlight items */}
          <Spotlight className="group mx-auto grid max-w-sm items-start gap-6 lg:max-w-4xl lg:grid-cols-2">
            {/* Card 1 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-200 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-indigo-500/80 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-indigo-500 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-white">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#374151"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Icon */}
                <div className="px-6 pt-6 pb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <LineChart className="h-7 w-7 text-indigo-600" />
                  </div>
                </div>
                {/* Content */}
                <div className="px-6 pb-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-300/.5),--theme(--color-gray-400/.5))_border-box] before:mask-border hover:bg-gray-200">
                      <span className="bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                        Untuk Owner
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Pantau jaringan kafe Anda tanpa perlu pusing dengan bahasa teknis. AI kami yang akan membacakan dan merangkum performa koneksi pelanggan untuk Anda.
                  </p>
                </div>
              </div>
            </a>
            {/* Card 2 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-200 p-px before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-indigo-500/80 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-indigo-500 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-white">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#374151"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Icon */}
                <div className="px-6 pt-6 pb-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <Wrench className="h-7 w-7 text-indigo-600" />
                  </div>
                </div>
                {/* Content */}
                <div className="px-6 pb-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-300/.5),--theme(--color-gray-400/.5))_border-box] before:mask-border hover:bg-gray-200">
                      <span className="bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                        Untuk Teknisi
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Sistem kendali mendalam. Tambahkan router, buat ratusan voucher massal, terapkan firewall, dan atur profil jaringan dengan akses penuh tanpa batas.
                  </p>
                </div>
              </div>
            </a>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
