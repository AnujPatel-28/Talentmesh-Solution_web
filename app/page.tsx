import { Hero, Features, HowItWorks, Testimonials, Stats, CTA } from '@/components/landing';

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </div>
  );
}
