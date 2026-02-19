import { Hero, Features, HowItWorks, Testimonials, Stats, CTA, FAQ, Industries, JobListings, UserSegments, SuperhumanPowers,  } from '@/components/landing';

export default function Home() {
  return (
    <div>
      <Hero />
      <UserSegments />
      <SuperhumanPowers />
      <Stats />
      <Industries />
      <JobListings />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTA />
    </div>
  );
}

