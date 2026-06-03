import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <Link href="/" className="text-slate-500 hover:text-slate-900 mb-8 inline-flex items-center gap-2 transition-colors">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, and profile information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Information</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We may use the information we collect to provide, maintain, and improve our services, including to match candidates with relevant job opportunities, process transactions, send related information, and provide customer support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Information Sharing</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We may share your information with employers or recruiters when you apply for a job or opt-in to be visible in our talent network. We do not sell your personal data to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@talentmesh.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
