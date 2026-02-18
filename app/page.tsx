import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, Pricing, FAQ } from '@/components/landing';

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}
