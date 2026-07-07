import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Header from '@/components/landing/ui/header';
import Footer from '@/components/landing/ui/footer';
import PageIllustration from '@/components/landing/page-illustration';
import Hero from '@/components/landing/hero-home';
import Roles from '@/components/landing/roles';
import Features from '@/components/landing/features';
import Pricing from '@/components/landing/pricing';
import Faq from '@/components/landing/faq';
import Cta from '@/components/landing/cta';

export function LandingPage() {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: 'phone',
      duration: 600,
      easing: 'ease-out-sine',
    });
  }, []);

  return (
    <div className="landing-page flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip bg-gray-950 font-inter text-base text-gray-200 antialiased">
      <Header />
      <main className="relative flex grow flex-col">
        <PageIllustration />
        <Hero />
        <Roles />
        <Features />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
