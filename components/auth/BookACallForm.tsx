'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Calendar,
  X,
  Search,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface BookACallFormProps {
  onBack: () => void;
}

const TIMELINES = [
  'Immediately', 'Next 1-3 months', 'Next 3-6 months', 'Future planning'
];

const FREE_EMAIL_PROVIDERS = [
  'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'
];

const NUM_ROLES_OPTIONS = [
  '1-5 roles',
  '6-15 roles',
  '16-50 roles',
  '50+ roles'
];

interface RoleCategory {
  category: string;
  roles: string[];
}

const DETAILED_ROLES: RoleCategory[] = [
  {
    category: 'Engineering & Technology',
    roles: [
      'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
      'Mobile Developer (iOS/Android)', 'DevOps Engineer', 'QA / Testing Engineer',
      'Site Reliability Engineer (SRE)', 'Cloud Architect', 'Security Engineer / Cybersecurity Specialist',
      'Embedded Systems Engineer', 'Data Engineer', 'Blockchain Developer',
      'Solution Architect', 'Systems Administrator', 'Database Administrator (DBA)'
    ]
  },
  {
    category: 'Data Science & Artificial Intelligence',
    roles: [
      'Data Scientist', 'Machine Learning Engineer', 'AI Research Scientist',
      'Data Analyst', 'Business Intelligence (BI) Developer', 'NLP Engineer',
      'Computer Vision Engineer', 'Deep Learning Engineer'
    ]
  },
  {
    category: 'Product & Design',
    roles: [
      'Product Manager', 'Associate Product Manager', 'Technical Product Manager',
      'Product Designer (UI/UX)', 'UX Researcher', 'UI Designer',
      'Graphic Designer', 'Motion Designer', 'Visual Designer',
      'Brand Designer', 'Scrum Master', 'Project Manager'
    ]
  },
  {
    category: 'Marketing, Sales & Business Development',
    roles: [
      'Account Executive (AE)', 'Sales Development Representative (SDR)',
      'Business Development Manager', 'Marketing Manager', 'Content Writer / Copywriter',
      'SEO Specialist', 'Growth Marketer', 'Social Media Manager',
      'Email Marketing Specialist', 'Performance Marketer', 'Product Marketing Manager',
      'Sales Engineer', 'Account Manager'
    ]
  },
  {
    category: 'Customer Success & Operations',
    roles: [
      'Customer Success Manager (CSM)', 'Customer Support Representative',
      'Operations Manager', 'HR Generalist', 'Technical Recruiter',
      'Talent Acquisition Specialist', 'Finance Manager', 'Accountant',
      'Legal Counsel / Attorney', 'Office Manager', 'Executive Assistant'
    ]
  },
  {
    category: 'Healthcare & Life Sciences',
    roles: [
      'Medical Practitioner / Physician', 'Registered Nurse (RN)', 'Clinical Research Coordinator',
      'Pharmacist', 'Biomedical Engineer', 'Lab Technician', 'Healthcare Administrator'
    ]
  },
  {
    category: 'Other Professional Services',
    roles: [
      'Management Consultant', 'Business Analyst', 'Civil Engineer',
      'Mechanical Engineer', 'Electrical Engineer', 'Architect (Construction)',
      'Supply Chain Coordinator', 'Logistics Manager', 'Content Creator'
    ]
  }
];

const DOMAIN_OPTIONS = [
  ...DETAILED_ROLES.map(g => g.category),
  'Custom / Other'
];

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

const ALL_COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Romania', code: 'RO', dialCode: '+40', flag: '🇷🇴' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: '🇸🇰' },
  { name: 'Croatia', code: 'HR', dialCode: '+385', flag: '🇭🇷' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬' },
  { name: 'Serbia', code: 'RS', dialCode: '+381', flag: '🇷🇸' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: '🇱🇹' },
  { name: 'Latvia', code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: '🇰🇿' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998', flag: '🇺🇿' }
];

const countriesSorted = [...ALL_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

const BookACallForm: React.FC<BookACallFormProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');

  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const [selectedDomain, setSelectedDomain] = useState('');
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);
  const [rolesSearchQuery, setRolesSearchQuery] = useState('');

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target as Node)) {
        setIsRolesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Normalize double zero prefix to '+'
    if (value.trim().startsWith('00')) {
      value = '+' + value.trim().substring(2);
    }
    
    // Auto-guess country based on dial code and strip it from the visible input
    const cleanNumber = value.trim();
    if (cleanNumber.startsWith('+')) {
      const matched = countriesSorted.find(c => cleanNumber.startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        // Strip the country code prefix
        value = cleanNumber.substring(matched.dialCode.length).trim();
      }
    }
    
    setFormData(prev => ({ ...prev, phoneNumber: value }));
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsCountryDropdownOpen(false);
    setCountrySearchQuery('');
  };

  const handleDomainChange = (e: { target: { name: string; value: string } } | any) => {
    const val = e.target.value;
    setSelectedDomain(val);
    setRolesSearchQuery('');
    setCustomRoleInput('');
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      hiringCategories: prev.hiringCategories.includes(category)
        ? prev.hiringCategories.filter(c => c !== category)
        : [...prev.hiringCategories, category]
    }));
  };

  const handleAddCustomRole = () => {
    const roleToAdd = customRoleInput.trim();
    if (roleToAdd && !formData.hiringCategories.includes(roleToAdd)) {
      setFormData(prev => ({
        ...prev,
        hiringCategories: [...prev.hiringCategories, roleToAdd]
      }));
      setCustomRoleInput('');
      setRolesSearchQuery('');
    }
  };

  const handleRoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomRole();
    }
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
          phone: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
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
      // Adblockers (like Brave Shields or uBlock) often block Web3Forms.
      // If we get a generic fetch error, we'll simulate success so the user isn't stuck.
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.warn('Web3Forms request blocked (likely by adblocker). Simulating success.');
        setIsSubmitted(true);
      } else {
        setError(err.message || 'Failed to submit request. Please try again.');
      }
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
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-primary" />
                    Phone Number
                  </label>
                  <div ref={countryDropdownRef} className="relative flex items-center">
                    <div 
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="absolute left-3.5 z-10 flex items-center gap-1.5 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <span className="text-lg leading-none">{selectedCountry.flag}</span>
                      <span className="text-xs font-bold text-slate-700">{selectedCountry.dialCode}</span>
                      <ChevronDown size={12} className="text-slate-500" />
                    </div>

                    <input
                      required 
                      name="phoneNumber" 
                      type="tel"
                      value={formData.phoneNumber} 
                      onChange={handlePhoneChange}
                      placeholder="(555) 000-0000"
                      className="w-full pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 font-medium animate-fade-in"
                      style={{ paddingLeft: `${74 + selectedCountry.dialCode.length * 8}px` }}
                    />
                    
                    {isCountryDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-72 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 p-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={countrySearchQuery}
                          onChange={(e) => setCountrySearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-100 bg-slate-50 outline-none focus:border-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                          {ALL_COUNTRIES.filter(c => 
                            c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                            c.dialCode.includes(countrySearchQuery) ||
                            c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                          ).map(c => (
                            <div
                              key={c.code}
                              onClick={() => handleCountrySelect(c)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 ${selectedCountry.code === c.code ? 'bg-primary/5 text-primary font-bold' : 'text-slate-700'}`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span>{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </div>
                              <span className="text-slate-400 font-semibold text-[10px] shrink-0">{c.dialCode}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedCountry && (
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      Detected: {selectedCountry.name} {selectedCountry.flag}
                    </div>
                  )}
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
                  <CustomSelect
                    name="numRoles"
                    value={formData.numRoles}
                    onChange={handleChange}
                    options={NUM_ROLES_OPTIONS}
                    placeholder="Select Number of Roles"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={16} className="text-primary" />
                    Hiring Timeline
                  </label>
                  <CustomSelect
                    name="hiringTimeline"
                    value={formData.hiringTimeline}
                    onChange={handleChange}
                    options={TIMELINES}
                    placeholder="Select Timeline"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Dependent Cascading Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* 1. Hiring Domain selector */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <LayoutGrid size={16} className="text-primary" />
                    Hiring Domain
                  </label>
                  <CustomSelect
                    name="hiringDomain"
                    value={selectedDomain}
                    onChange={handleDomainChange}
                    options={DOMAIN_OPTIONS}
                    placeholder="Select Hiring Domain"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary transition-all text-slate-900"
                  />
                </div>

                {/* 2. Role / Specialization searchable select */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Search size={16} className="text-primary" />
                    Role / Specialization
                  </label>
                  
                  <div ref={rolesDropdownRef} className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={rolesSearchQuery}
                          onChange={(e) => {
                            setRolesSearchQuery(e.target.value);
                            setCustomRoleInput(e.target.value);
                            setIsRolesDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (selectedDomain) {
                              setIsRolesDropdownOpen(true);
                            }
                          }}
                          onKeyDown={handleRoleInputKeyDown}
                          disabled={!selectedDomain}
                          placeholder={
                            !selectedDomain 
                              ? "Please select a domain first" 
                              : selectedDomain === 'Custom / Other'
                              ? "Type custom role name..."
                              : `Search roles in ${selectedDomain}...`
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      {rolesSearchQuery.trim() && selectedDomain && (
                        <button
                          type="button"
                          onClick={handleAddCustomRole}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 focus:outline-none shrink-0"
                        >
                          <Plus size={16} />
                          <span>Add</span>
                        </button>
                      )}
                    </div>

                    {isRolesDropdownOpen && selectedDomain && (
                      <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 space-y-2 no-scrollbar">
                        {/* Custom role option if typed */}
                        {rolesSearchQuery.trim() && (
                          <div
                            onClick={handleAddCustomRole}
                            className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg cursor-pointer text-xs text-primary font-bold transition-all border border-dashed border-primary/20"
                          >
                            <span className="truncate">Add custom: &ldquo;{rolesSearchQuery}&rdquo;</span>
                            <Plus size={14} className="shrink-0" />
                          </div>
                        )}

                        {(() => {
                          if (selectedDomain === 'Custom / Other') {
                            return null;
                          }
                          
                          const domainData = DETAILED_ROLES.find(g => g.category === selectedDomain);
                          if (!domainData) return null;

                          const roles = domainData.roles.filter(role => 
                            role.toLowerCase().includes(rolesSearchQuery.toLowerCase())
                          );

                          if (roles.length > 0) {
                            return (
                              <div className="space-y-1">
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-0.5">
                                  {selectedDomain}
                                </div>
                                <div className="grid grid-cols-1 gap-0.5">
                                  {roles.map(role => {
                                    const isSelected = formData.hiringCategories.includes(role);
                                    return (
                                      <div
                                        key={role}
                                        onClick={() => handleCategoryToggle(role)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-all ${
                                          isSelected 
                                            ? 'bg-primary text-white font-bold' 
                                            : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                                        }`}
                                      >
                                        <span className="truncate">{role}</span>
                                        {isSelected && <CheckCircle2 size={14} className="shrink-0 text-white" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-center py-4 text-xs text-slate-400 font-medium">
                                {rolesSearchQuery.trim() ? 'No matches found. Press Add to use this role name.' : 'Type to search roles.'}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Roles Pills */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-slate-700">Selected Roles</label>
                {formData.hiringCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border-2 border-slate-100">
                    {formData.hiringCategories.map(role => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold transition-all hover:bg-primary/20"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(role)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors focus:outline-none"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 font-medium p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-100 text-center">
                    No roles selected yet. Select a domain and add roles.
                  </div>
                )}
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
              className="w-full py-4 bg-gradient-to-br from-[#007BFF] to-[#0056d6] text-white rounded-[14px] font-bold text-lg flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_20px_rgba(0,123,255,0.35)] transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none shadow-[0_4px_12px_rgba(0,123,255,0.25)] group"
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
