'use client';

import React, { useState } from 'react';
import {
  Building2,
  Mail,
  User,
  MessageSquare,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  CalendarDays,
  ChevronDown,
  ArrowRight,
  Phone,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

interface BookACallFormProps {
  onBack: () => void;
}

const CATEGORIES = [
  'Software Engineering', 'Product Management', 'Design',
  'Data Science', 'Marketing & Sales', 'Customer Success', 'Operations'
];

const TIMELINES = [
  'Immediately', 'Next 1-3 months', 'Next 3-6 months', 'Future planning'
];

const FREE_EMAIL_PROVIDERS = [
  'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'
];

const BookACallForm: React.FC<BookACallFormProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    companyName: '',
    numRoles: '',
    hiringCategories: [] as string[],
    hiringTimeline: '',
    additionalNotes: ''
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      hiringCategories: prev.hiringCategories.includes(category)
        ? prev.hiringCategories.filter(c => c !== category)
        : [...prev.hiringCategories, category]
    }));
  };

  const validateWorkEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return !FREE_EMAIL_PROVIDERS.includes(domain || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateWorkEmail(formData.workEmail)) {
      setError('Please use your work email address. Free email providers (except Gmail) are not accepted.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 'c755ba58-1a02-45d6-b021-3b66f62eb9fb',
          subject: `New Discovery Call Request from ${formData.companyName}`,
          from_name: 'TalentMesh Discovery',
          name: formData.fullName,
          email: formData.workEmail,
          company: formData.companyName,
          phone: formData.phoneNumber,
          openRoles: formData.numRoles,
          timeline: formData.hiringTimeline,
          categories: formData.hiringCategories.join(', '),
          notes: formData.additionalNotes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request to Web3Forms');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center text-center p-6 md:p-12 bg-white rounded-3xl border-2 border-slate-100 shadow-xl max-w-md mx-auto my-12">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Calendar size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Call Requested</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Thank you! We will reach out within 4 business hours to confirm your discovery call and provide meeting details.
          <br /><br />
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Check your email for the invite link.
          </span>
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 font-semibold hover:text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto px-4 pb-12">
      <button
        onClick={step === 1 ? onBack : prevStep}
        className="flex items-center gap-2 text-slate-500 font-semibold hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>{step === 1 ? 'Back' : 'Previous Step'}</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 no-scrollbar overflow-x-hidden">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold transition-all text-xs md:text-sm ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                  step > s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6 text-center px-2">
          <div className="flex justify-center mb-3 text-primary">
            <Calendar size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {step === 1 && "Let's Connect"}
            {step === 2 && 'Hiring Needs'}
            {step === 3 && 'Final Notes'}
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            {step === 1 && 'Provide your details to schedule a discovery call.'}
            {step === 2 && 'What kind of talent are you looking for?'}
            {step === 3 && 'Any specific preferences or requirements?'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-semibold">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) nextStep();
          else handleSubmit(e);
        }} className="space-y-6">

          {/* SECTION 1 — Contact Info */}
          {step === 1 && (
            <section className="animate-slide-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    Full Name
                  </label>
                  <input
                    required name="fullName" type="text"
                    value={formData.fullName} onChange={handleChange}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    Work Email
                  </label>
                  <input
                    required name="workEmail" type="email"
                    value={formData.workEmail} onChange={handleChange}
                    placeholder="john@acme.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-primary" />
                    Phone Number
                  </label>
                  <input
                    required name="phoneNumber" type="tel"
                    value={formData.phoneNumber} onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    Company Name
                  </label>
                  <input
                    required name="companyName" type="text"
                    value={formData.companyName} onChange={handleChange}
                    placeholder="e.g. Acme Tech"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2 — Hiring Needs */}
          {step === 2 && (
            <section className="animate-slide-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-primary" />
                    Number of Open Roles
                  </label>
                  <input
                    required name="numRoles" type="text"
                    value={formData.numRoles} onChange={handleChange}
                    placeholder="e.g. 5-10"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={16} className="text-primary" />
                    Hiring Timeline
                  </label>
                  <div className="relative">
                    <select
                      required name="hiringTimeline"
                      value={formData.hiringTimeline} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 appearance-none"
                    >
                      <option value="">Select Timeline</option>
                      {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-slate-700">Hiring Categories (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${formData.hiringCategories.includes(category)
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-primary/50 hover:text-primary'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 — Additional Notes */}
          {step === 3 && (
            <section className="animate-slide-in space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="additionalNotes" rows={5}
                  value={formData.additionalNotes} onChange={handleChange}
                  placeholder="Anything else you'd like us to know before the call?"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 resize-none"
                ></textarea>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-1 h-4 w-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By clicking submit, I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a>, and allow TalentMesh to process my details.
                  </p>
                </label>
              </div>
            </section>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {step < 3 ? 'Next Step' : 'Schedule My Call'}
                  </span>
                  {step < 3 ? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookACallForm;
