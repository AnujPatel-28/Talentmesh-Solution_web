import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, Pricing, FAQ, FeaturedJobs, Industries, JobListings } from '@/components/landing';

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
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}

