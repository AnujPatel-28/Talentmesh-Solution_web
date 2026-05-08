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
  Globe,
  Briefcase,
  Users,
  Phone,
  LayoutGrid,
  CalendarDays,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { invokeFunction } from '@/lib/insforge';

interface RequestAccessFormProps {
  onBack: () => void;
  variant?: 'call' | 'application';
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
  'Manufacturing', 'Real Estate', 'Logistics', 'Marketing', 'Other'
];

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

const CATEGORIES = [
  'Software Engineering', 'Product Management', 'Design',
  'Data Science', 'Marketing & Sales', 'Customer Success', 'Operations'
];

const TIMELINES = [
  'Immediately', 'Next 1-3 months', 'Next 3-6 months', 'Future planning'
];

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'
];

const RequestAccessForm: React.FC<RequestAccessFormProps> = ({ onBack, variant = 'application' }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    roleInCompany: '',
    numRoles: '',
    hiringCategories: [] as string[],
    hiringTimeline: '',
    additionalNotes: ''
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
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
    return !FREE_EMAIL_PROVIDERS.includes(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting Form Data:', formData);
    setIsLoading(true);
    setError('');

    if (!validateWorkEmail(formData.workEmail)) {
      setError('Please use your work email address. Free email providers are not accepted.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: apiError } = await invokeFunction('recruiter-request', {
        method: 'POST',
        body: {
          full_name: formData.fullName,
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          industry: formData.industry,
          company_size: formData.companySize,
          work_email: formData.workEmail,
          phone_number: formData.phoneNumber,
          role_in_company: formData.roleInCompany,
          num_roles: formData.numRoles,
          hiring_categories: formData.hiringCategories,
          hiring_timeline: formData.hiringTimeline,
          additional_notes: formData.additionalNotes,
          request_type: variant === 'call' ? 'discovery_call' : 'access_application'
        }
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to submit request');
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
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          {variant === 'call' ? 'Call Requested' : 'Application Received'}
        </h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {variant === 'call'
            ? 'Thank you! We will reach out within 4 business hours to confirm your discovery call and provide meeting details.'
            : 'Thank you for your interest! Our team will review your application and get back to you shortly to discuss your hiring needs.'
          }
          <br /><br />
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {variant === 'call' ? 'Check your email for the invite link.' : 'You\'ll receive access after verification.'}
          </span>
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Role Selection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto px-4 pb-12">
      <button
        onClick={step === 1 ? onBack : prevStep}
        className="flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-900 transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>{step === 1 ? 'Back' : 'Previous Step'}</span>
      </button>

      <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl p-6 md:p-8 no-scrollbar overflow-x-hidden">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold transition-all text-xs md:text-sm ${step === s ? 'bg-slate-900 text-white shadow-lg' :
                  step > s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-slate-900 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6 text-center px-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {step === 1 && 'Company Info'}
            {step === 2 && 'Contact Details'}
            {step === 3 && 'Hiring Needs'}
            {step === 4 && 'Final Notes'}
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            {step === 1 && 'Tell us about your organization'}
            {step === 2 && 'How can we reach you?'}
            {step === 3 && 'What kind of talent are you looking for?'}
            {step === 4 && 'Any specific preferences or requirements?'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-semibold">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step < 4) nextStep();
          else handleSubmit(e);
        }} className="space-y-6">

          {/* SECTION 1 — Company Info */}
          {step === 1 && (
            <section className="animate-slide-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Building2 size={16} className="text-slate-400" />
                    Company Name
                  </label>
                  <input
                    required name="companyName" type="text"
                    value={formData.companyName} onChange={handleChange}
                    placeholder="e.g. Acme Tech"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Globe size={16} className="text-slate-400" />
                    Company Website
                  </label>
                  <input
                    required name="companyWebsite" type="url"
                    value={formData.companyWebsite} onChange={handleChange}
                    placeholder="https://acme.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    Industry
                  </label>
                  <div className="relative">
                    <select
                      required name="industry"
                      value={formData.industry} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 appearance-none"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    Company Size
                  </label>
                  <div className="relative">
                    <select
                      required name="companySize"
                      value={formData.companySize} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 appearance-none"
                    >
                      <option value="">Select Size</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2 — Contact Info */}
          {step === 2 && (
            <section className="animate-slide-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    Full Name
                  </label>
                  <input
                    required name="fullName" type="text"
                    value={formData.fullName} onChange={handleChange}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" />
                    Work Email
                  </label>
                  <input
                    required name="workEmail" type="email"
                    value={formData.workEmail} onChange={handleChange}
                    placeholder="john@acme.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    Phone Number (Optional)
                  </label>
                  <input
                    name="phoneNumber" type="tel"
                    value={formData.phoneNumber} onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    Your Role
                  </label>
                  <input
                    required name="roleInCompany" type="text"
                    value={formData.roleInCompany} onChange={handleChange}
                    placeholder="e.g. Hiring Manager"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 — Hiring Needs */}
          {step === 3 && (
            <section className="animate-slide-in space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-slate-400" />
                    Number of Open Roles
                  </label>
                  <input
                    required name="numRoles" type="text"
                    value={formData.numRoles} onChange={handleChange}
                    placeholder="e.g. 5-10"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    Hiring Timeline
                  </label>
                  <div className="relative">
                    <select
                      required name="hiringTimeline"
                      value={formData.hiringTimeline} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 appearance-none"
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
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4 — Additional Notes */}
          {step === 4 && (
            <section className="animate-slide-in space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare size={16} className="text-slate-400" />
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes" rows={5}
                  value={formData.additionalNotes} onChange={handleChange}
                  placeholder="Anything else you'd like us to know? Specific roles, required skills, etc."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 resize-none"
                ></textarea>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  By clicking submit, you agree to allow TalentMesh to process your company details and reach out via the provided work email for scheduling.
                </p>
              </div>
            </section>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {step < 4 ? 'Next Step' : (variant === 'call' ? 'Schedule My Call' : 'Request Platform Access')}
                  </span>
                  {step < 4 ? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestAccessForm;
