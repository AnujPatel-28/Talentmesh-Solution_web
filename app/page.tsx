import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Next-Gen AI Recruiting</span>
          <h1 className={styles.title}>
            Hire Smarter.<br />
            <span className={styles.highlight}>Find Your Dream Job.</span>
          </h1>
          <p className={styles.subtitle}>
            Experience the future of recruitment. Our AI-driven platform connects
            top talent with world-class companies through intelligent matching,
            eliminating bias and saving valuable time.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/employers" className={styles.primaryBtn}>
              I'm Hiring
            </Link>
            <Link href="/job-seekers" className={styles.secondaryBtn}>
              Find a Job
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose AI Recruit?</h2>
          <p className={styles.subtitle} style={{ marginBottom: 0 }}>
            Unified platform delivering exceptional results for both sides of the hiring equation.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.featureCard}>
            <div className={styles.icon}>🎯</div>
            <h3 className={styles.cardTitle}>Precision Matching</h3>
            <p className={styles.cardDesc}>
              Our proprietary AI analyzes 50+ data points to match skills, culture fit, and career goals with 95% accuracy.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>⚡</div>
            <h3 className={styles.cardTitle}>Instant Screening</h3>
            <p className={styles.cardDesc}>
              Automated resume parsing and initial screening reduces time-to-hire by up to 70%.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.icon}>🛡️</div>
            <h3 className={styles.cardTitle}>Bias Elimination</h3>
            <p className={styles.cardDesc}>
              Blind screening technology ensures diversity and inclusion by focusing purely on merit and potential.
            </p>
          </div>
        </div>
      </section>

      {/* Additional Section for Segments */}
      <section className={styles.features} style={{ background: '#ffffff' }}>
        <div className={styles.grid}>
          {/* Employer Side */}
          <div className={styles.featureCard} style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <h3 className={styles.cardTitle}>For Employers</h3>
            <p className={styles.cardDesc} style={{ marginBottom: '2rem' }}>
              Access a curated pool of pre-vetted candidates.
              Post jobs, manage pipelines, and schedule interviews all in one place.
            </p>
            <Link href="/employers" className={styles.primaryBtn} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Post a Job for Free
            </Link>
          </div>

          {/* Job Seeker Side */}
          <div className={styles.featureCard} style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <h3 className={styles.cardTitle}>For Job Seekers</h3>
            <p className={styles.cardDesc} style={{ marginBottom: '2rem' }}>
              One profile, endless opportunities. Let companies apply to you.
              Get career coaching insights and salary benchmarking.
            </p>
            <Link href="/job-seekers" className={styles.secondaryBtn} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Create Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
