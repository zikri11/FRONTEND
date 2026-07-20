import { Link } from "@tanstack/react-router";
import { BackgroundBeams } from "@/components/landing/ui/background-beams";
import { SiAnthropic, SiGooglegemini } from "react-icons/si";
import { TbBrain, TbBrandOpenai } from "react-icons/tb";

export default function HeroHome() {
  return (
    <section className="relative">
      <BackgroundBeams />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-900),var(--color-indigo-600),var(--color-gray-700),var(--color-indigo-500),var(--color-gray-900))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              Satu Dashboard untuk Semua Outlet Anda
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-gray-600"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                Manajemen router, integrasi sistem POS, dan pembuatan voucher WiFi dalam satu platform. Dirancang super simpel untuk Owner, namun sangat tangguh untuk Teknisi.
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <Link
                    className="btn group mb-4 w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    to="/sign-in"
                  >
                    <span className="relative inline-flex items-center">
                      Mulai Gratis Sekarang
                      <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </Link>
                </div>
                <div data-aos="fade-up" data-aos-delay={600}>
                  <a
                    className="btn relative w-full bg-linear-to-b from-gray-100 to-gray-200 bg-[length:100%_100%] bg-[bottom] text-gray-600 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-200),var(--color-gray-300),var(--color-gray-200))_border-box] before:mask-border hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                    href="#features"
                  >
                    <span className="relative z-10">Pelajari Fitur</span>
                  </a>
                </div>
              </div>
            </div>

            {/* AI Brands */}
            <div className="pt-16 pb-8 text-center" data-aos="fade-up" data-aos-delay={800}>
              <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">Terintegrasi dengan Teknologi Terbaik</p>
              
              {/* Main Custom Logo */}
              <div className="flex justify-center mb-10">
                {/* 
                  Gambar ini akan otomatis berwarna putih (berkat class brightness-0 invert). 
                  Pastikan file gambar Anda berupa PNG transparan.
                */}
                <img 
                  src="/images/main-logo.png" 
                  alt="Main Brand Logo" 
                  className="h-16 md:h-20 w-auto brightness-0 opacity-80 transition-opacity hover:opacity-100" 
                />
              </div>

              {/* Other AI Logos */}
              <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14 opacity-70">
                <div className="flex items-center gap-2.5 text-gray-900">
                  <TbBrandOpenai className="text-3xl" />
                  <span className="font-semibold text-xl tracking-tight">ChatGPT</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-900">
                  <SiAnthropic className="text-3xl" />
                  <span className="font-semibold text-xl tracking-tight">Claude</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-900">
                  <SiGooglegemini className="text-3xl" />
                  <span className="font-semibold text-xl tracking-tight">Gemini</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-900">
                  <TbBrain className="text-3xl" />
                  <span className="font-semibold text-xl tracking-tight">GLM</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
