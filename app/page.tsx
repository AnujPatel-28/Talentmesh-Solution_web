import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, JobListings } from '@/components/landing';

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <JobListings />
       <HowItWorks />
      <Features />
     
      <Testimonials />
      <CTA />
    </div>
  );
}

