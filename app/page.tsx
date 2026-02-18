import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, Pricing, FAQ, FeaturedJobs, Industries } from '@/components/landing';
import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, JobListings } from '@/components/landing';

export default function Home() {
  return (
    <div>
      <Hero />
      <Stats />
      <JobListings />
       <HowItWorks />
      <Industries />
      <FeaturedJobs />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}

