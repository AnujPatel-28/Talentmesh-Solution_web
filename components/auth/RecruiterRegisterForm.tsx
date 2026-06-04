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
  Users,
  Phone,
  ChevronDown,
  ArrowRight,
  FileText,
  Upload,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { invokeFunction } from '@/lib/insforge';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface RecruiterRegisterFormProps {
  onBack: () => void;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
  'Manufacturing', 'Real Estate', 'Logistics', 'Marketing', 'Other'
];

const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

const FREE_EMAIL_PROVIDERS = [
  'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'
];

const HIRING_TIMELINES = [
  'Immediate (less than 1 month)',
  '1-3 months',
  '3-6 months',
  'Flexible'
];

const NUM_ROLES_OPTIONS = [
  '1-5 roles',
  '6-15 roles',
  '16-50 roles',
  '50+ roles'
];

const RecruiterRegisterForm: React.FC<RecruiterRegisterFormProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBase64, setDocumentBase64] = useState('');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycBase64, setKycBase64] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBase64, setLogoBase64] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    companyAddress: '',
    gstin: '',
    tan: '',
    fullName: '',
    workEmail: '',
    phoneNumber: '',
    roleInCompany: '',
    additionalNotes: '',
    rolesToHire: '',
    hiringTimeline: '',
    numRoles: '',
    panNumber: '',
    aadhaarNumber: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyAddress: ''
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        setError('Please upload a PDF or Image for company verification document.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      setDocumentFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateGSTIN = (gst: string) => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.toUpperCase());
  };

  const validateTAN = (tan: string) => {
    return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/i.test(tan.toUpperCase());
  };

  const validateWorkEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return !FREE_EMAIL_PROVIDERS.includes(domain || '');
  };

  const handleKycFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        setError('Please upload a PDF or Image for KYC document.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('KYC file size must be less than 5MB.');
        return;
      }
      setKycFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setKycBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePAN = (pan: string) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  };

  const validateAadhaar = (aadhaar: string) => {
    return /^[2-9]{1}[0-9]{11}$/.test(aadhaar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!documentBase64) {
      setError('Please upload a Company Verification Document.');
      setIsLoading(false);
      return;
    }

    if (formData.gstin && !validateGSTIN(formData.gstin)) {
      setError('Please enter a valid GSTIN (e.g. 22AAAAA0000A1Z5).');
      setIsLoading(false);
      return;
    }

    if (formData.tan && !validateTAN(formData.tan)) {
      setError('Please enter a valid TAN (e.g. ABCD12345E).');
      setIsLoading(false);
      return;
    }

    if (!validateWorkEmail(formData.workEmail)) {
      setError('Please use your work email address. Free email providers (except Gmail) are not accepted.');
      setIsLoading(false);
      return;
    }

    if (!kycBase64) {
      setError('Please upload Aadhaar/PAN Copy.');
      setIsLoading(false);
      return;
    }

    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      setError('Please enter a valid 10-character PAN Card Number (e.g. ABCDE1234F).');
      setIsLoading(false);
      return;
    }

    if (formData.aadhaarNumber && !validateAadhaar(formData.aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar Card Number.');
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
          company_address: formData.companyAddress,
          company_gstin: formData.gstin.toUpperCase(),
          company_tan: formData.tan.toUpperCase(),
          work_email: formData.workEmail,
          phone_number: formData.phoneNumber,
          role_in_company: formData.roleInCompany,
          additional_notes: formData.additionalNotes,
          request_type: 'access_application',
          document_base64: documentBase64,
          document_name: documentFile?.name,
          num_roles: formData.numRoles,
          hiring_timeline: formData.hiringTimeline,
          hiring_categories: formData.rolesToHire ? formData.rolesToHire.split(',').map(r => r.trim()).filter(Boolean) : [],
          pan_number: formData.panNumber.toUpperCase(),
          aadhaar_number: formData.aadhaarNumber,
          emergency_contact_name: formData.emergencyName,
          emergency_contact_phone: formData.emergencyPhone,
          emergency_contact_address: formData.emergencyAddress,
          kyc_document_base64: kycBase64,
          kyc_document_name: kycFile?.name,
          company_logo_base64: logoBase64,
          company_logo_name: logoFile?.name
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
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Received</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Thank you for your interest! Our team will review your company details and verify your account.
          <br /><br />
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            You'll receive an email once approved.
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
    <div className="animate-fade-in w-full max-w-xl mx-auto px-4 pb-4">
      <button
        onClick={step === 1 ? onBack : prevStep}
        className="flex items-center gap-2 text-slate-500 font-semibold hover:text-primary transition-colors mb-3 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>{step === 1 ? 'Back' : 'Previous Step'}</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-5 md:p-6 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2 px-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold transition-all text-xs ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                  step > s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s ? <CheckCircle2 size={14} /> : s}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-4 text-center px-2">
          <div className="flex justify-center mb-2 text-primary">
            {step === 1 && <Building2 size={26} />}
            {step === 2 && <User size={26} />}
            {step === 3 && <FileText size={26} />}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
            {step === 1 && 'Company Info'}
            {step === 2 && 'Contact Details'}
            {step === 3 && 'Verification'}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            {step === 1 && 'Tell us about your organization'}
            {step === 2 && 'How can we reach you?'}
            {step === 3 && 'Final details to verify your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) {
            if (!formData.companyAddress.trim()) {
              setError('Please enter the Company Registered Address.');
              return;
            }
            if (!documentBase64) {
              setError('Please upload a Company Verification Document.');
              return;
            }
            if (formData.gstin && !validateGSTIN(formData.gstin)) {
              setError('Please enter a valid GSTIN (e.g. 22AAAAA0000A1Z5).');
              return;
            }
            if (formData.tan && !validateTAN(formData.tan)) {
              setError('Please enter a valid TAN (e.g. ABCD12345E).');
              return;
            }
            setError('');
            nextStep();
          } else if (step === 2) {
            if (!validateWorkEmail(formData.workEmail)) {
              setError('Please use your work email address. Free email providers (except Gmail) are not accepted.');
              return;
            }
            if (!kycBase64) {
              setError('Please upload Aadhaar/PAN Copy.');
              return;
            }
            if (formData.panNumber && !validatePAN(formData.panNumber)) {
              setError('Please enter a valid 10-character PAN Card Number (e.g. ABCDE1234F).');
              return;
            }
            if (formData.aadhaarNumber && !validateAadhaar(formData.aadhaarNumber)) {
              setError('Please enter a valid 12-digit Aadhaar Card Number.');
              return;
            }
            setError('');
            nextStep();
          } else {
            handleSubmit(e);
          }
        }} className="space-y-4">

          {/* SECTION 1 — Company Info */}
          {step === 1 && (
            <section className="animate-slide-in space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Company Website
                  </label>
                  <input
                    required name="companyWebsite" type="url"
                    value={formData.companyWebsite} onChange={handleChange}
                    placeholder="https://acme.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" />
                    Industry
                  </label>
                  <CustomSelect
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    options={INDUSTRIES}
                    placeholder="Select Industry"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Company Size
                  </label>
                  <CustomSelect
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    options={COMPANY_SIZES}
                    placeholder="Select Size"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Building2 size={16} className="text-primary" />
                    Company Registered Address
                  </label>
                  <textarea
                    required name="companyAddress" rows={2}
                    value={formData.companyAddress} onChange={handleChange}
                    placeholder="Full physical office address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    GSTIN (Optional)
                  </label>
                  <input
                    name="gstin" type="text"
                    value={formData.gstin} onChange={handleChange}
                    placeholder="15-digit GSTIN"
                    maxLength={15}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    TAN (Optional)
                  </label>
                  <input
                    name="tan" type="text"
                    value={formData.tan} onChange={handleChange}
                    placeholder="10-digit TAN"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 uppercase"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    Company Verification Document
                  </label>
                  <p className="text-xs text-slate-500">Upload a PDF or Image of your Certificate of Incorporation or GST Registration.</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="doc-upload"
                      required
                    />
                    <label
                      htmlFor="doc-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-primary/5 transition-all cursor-pointer text-slate-600"
                    >
                      <Upload size={18} className="text-primary" />
                      <span className="font-semibold text-sm">{documentFile ? documentFile.name : 'Upload PDF/Image'}</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    Company Logo (Optional)
                  </label>
                  <p className="text-xs text-slate-500">Upload a PNG or JPG file for your corporate branding.</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (!file.type.startsWith('image/')) {
                            setError('Please upload an image file for company logo.');
                            return;
                          }
                          if (file.size > 2 * 1024 * 1024) {
                            setError('Logo file size must be less than 2MB.');
                            return;
                          }
                          setLogoFile(file);
                          setError('');
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-primary/5 transition-all cursor-pointer text-slate-600"
                    >
                      <Upload size={18} className="text-primary" />
                      <span className="font-semibold text-sm">{logoFile ? logoFile.name : 'Upload Image'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2 — Contact Info */}
          {step === 2 && (
            <section className="animate-slide-in space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    Full Name
                  </label>
                  <input
                    required name="fullName" type="text"
                    value={formData.fullName} onChange={handleChange}
                    placeholder="John Smith"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm"
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
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-primary" />
                    Phone Number (Optional)
                  </label>
                  <input
                    name="phoneNumber" type="tel"
                    value={formData.phoneNumber} onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" />
                    Your Role
                  </label>
                  <input
                    required name="roleInCompany" type="text"
                    value={formData.roleInCompany} onChange={handleChange}
                    placeholder="e.g. Hiring Manager"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm"
                  />
                </div>

                
                {/* Personal KYC Verification */}
                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-3 mt-1">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Personal KYC Verification</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    PAN Card Number
                  </label>
                  <input
                    required name="panNumber" type="text"
                    value={formData.panNumber} onChange={handleChange}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Aadhaar Card Number
                  </label>
                  <input
                    required name="aadhaarNumber" type="text"
                    value={formData.aadhaarNumber} onChange={handleChange}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    Aadhaar/PAN Document Upload
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleKycFileChange}
                      className="hidden"
                      id="kyc-upload"
                      required
                    />
                    <label
                      htmlFor="kyc-upload"
                      className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-primary/5 transition-all cursor-pointer text-slate-600"
                    >
                      <Upload size={16} className="text-primary" />
                      <span className="font-semibold text-sm">{kycFile ? kycFile.name : 'Upload Aadhaar/PAN Copy (PDF/Image)'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3 — Verification & Notes */}
          {step === 3 && (
            <section className="animate-slide-in space-y-4">
              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6 mb-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Emergency Contact (Friend/Family)</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    Contact Name (Optional)
                  </label>
                  <input
                    name="emergencyName" type="text"
                    value={formData.emergencyName} onChange={handleChange}
                    placeholder="Emergency Contact Name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-primary" />
                    Contact Phone (Optional)
                  </label>
                  <input
                    name="emergencyPhone" type="tel"
                    value={formData.emergencyPhone} onChange={handleChange}
                    placeholder="Contact Phone Number"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    Contact Address (Optional)
                  </label>
                  <input
                    name="emergencyAddress" type="text"
                    value={formData.emergencyAddress} onChange={handleChange}
                    placeholder="Full Address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" />
                    Roles to Hire
                  </label>
                  <input
                    required name="rolesToHire" type="text"
                    value={formData.rolesToHire} onChange={handleChange}
                    placeholder="e.g. React Developer, UI Designer"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Hiring Needs (Volume)
                  </label>
                  <CustomSelect
                    name="numRoles"
                    value={formData.numRoles}
                    onChange={handleChange}
                    options={NUM_ROLES_OPTIONS}
                    placeholder="Select Volume"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={16} className="text-primary" />
                    Hiring Timeline
                  </label>
                  <CustomSelect
                    name="hiringTimeline"
                    value={formData.hiringTimeline}
                    onChange={handleChange}
                    options={HIRING_TIMELINES}
                    placeholder="Select Timeline"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes" rows={4}
                  value={formData.additionalNotes} onChange={handleChange}
                  placeholder="Anything else you'd like us to know?"
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

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {step < 3 ? 'Next Step' : 'Request Platform Access'}
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

export default RecruiterRegisterForm;
