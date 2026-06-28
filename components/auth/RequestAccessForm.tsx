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
  Globe,
  Briefcase,
  Users,
  Phone,
  LayoutGrid,
  CalendarDays,
  ChevronDown,
  ArrowRight,
  FileText,
  Upload,
  X,
  Search,
  Plus,
  MapPin
} from 'lucide-react';
import { invokeFunction } from '@/lib/insforge';
import { CustomSelect } from '@/components/ui/CustomSelect';

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

const STEP_CONFIG = [
  { label: 'Company', icon: Building2 },
  { label: 'Contact', icon: User },
  { label: 'Hiring', icon: Briefcase },
  { label: 'Notes', icon: MessageSquare },
];

const inputCls = "w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300";

const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const SectionHeading = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 pt-1 pb-0.5">
    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <Icon size={13} className="text-blue-600" />
    </div>
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
    <div className="flex-1 h-px bg-slate-100 ml-1" />
  </div>
);

const RequestAccessForm: React.FC<RequestAccessFormProps> = ({ onBack, variant = 'application' }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBase64, setDocumentBase64] = useState('');

  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[3]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const [selectedDomain, setSelectedDomain] = useState('');
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);
  const [rolesSearchQuery, setRolesSearchQuery] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.trim().startsWith('00')) value = '+' + value.trim().substring(2);
    const cleanNumber = value.trim();
    if (cleanNumber.startsWith('+')) {
      const matched = countriesSorted.find(c => cleanNumber.startsWith(c.dialCode));
      if (matched) {
        setSelectedCountry(matched);
        value = cleanNumber.substring(matched.dialCode.length).trim();
      }
    }
    setFormData(prev => ({ ...prev, phoneNumber: value }));
  };

  const handleDomainChange = (e: any) => {
    setSelectedDomain(e.target.value);
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
      setFormData(prev => ({ ...prev, hiringCategories: [...prev.hiringCategories, roleToAdd] }));
      setCustomRoleInput('');
      setRolesSearchQuery('');
    }
  };

  const handleRoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRole(); }
  };

  const validateWorkEmail = (email: string) =>
    !FREE_EMAIL_PROVIDERS.includes((email.split('@')[1] || '').toLowerCase());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') { setError('Please upload a PDF document.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB.'); return; }
    setDocumentFile(file); setError('');
    const reader = new FileReader();
    reader.onloadend = () => setDocumentBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');

    if (!validateWorkEmail(formData.workEmail)) {
      setError('Please use your work email address. Free email providers are not accepted.');
      setIsLoading(false); return;
    }

    try {
      if (variant === 'call') {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 'c755ba58-1a02-45d6-b021-3b66f62eb9fb',
            subject: `New Discovery Call Request from ${formData.companyName}`,
            from_name: 'TalentMesh Discovery',
            name: formData.fullName,
            email: formData.workEmail,
            company: formData.companyName,
            website: formData.companyWebsite,
            phone: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
            role: formData.roleInCompany,
            industry: formData.industry,
            companySize: formData.companySize,
            openRoles: formData.numRoles,
            timeline: formData.hiringTimeline,
            categories: formData.hiringCategories.join(', '),
            notes: formData.additionalNotes
          }),
        });
        if (!response.ok) throw new Error('Failed to submit request to Web3Forms');
      } else {
        const { error: apiError } = await invokeFunction('recruiter-request', {
          method: 'POST',
          body: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            company_website: formData.companyWebsite,
            industry: formData.industry,
            company_size: formData.companySize,
            work_email: formData.workEmail,
            phone_number: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
            role_in_company: formData.roleInCompany,
            num_roles: formData.numRoles,
            hiring_categories: formData.hiringCategories,
            hiring_timeline: formData.hiringTimeline,
            additional_notes: formData.additionalNotes,
            request_type: 'access_application',
            document_base64: documentBase64,
            document_name: documentFile?.name
          }
        });
        if (apiError) throw new Error(apiError.message || 'Failed to submit request');
      }
      setIsSubmitted(true);
    } catch (err: any) {
      if (variant === 'call' && (err.message === 'Failed to fetch' || err.name === 'TypeError')) {
        setIsSubmitted(true);
      } else {
        setError(err.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ──
  if (isSubmitted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {variant === 'call' ? 'Call Requested!' : 'Application Received!'}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {variant === 'call'
              ? 'Thank you! We\'ll reach out within 4 business hours to confirm your discovery call.'
              : 'Thank you for your interest! Our team will review your application shortly.'
            }
            <br /><br />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {variant === 'call' ? 'Check your email for the invite link.' : 'You\'ll receive access after verification.'}
            </span>
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Role Selection
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = ['Company Info', 'Contact Details', 'Hiring Needs', 'Final Notes'];
  const stepSubs = [
    'Tell us about your organization',
    'How can we reach you?',
    'What kind of talent are you looking for?',
    'Any specific preferences or requirements?'
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="w-full max-w-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>

        {/* Back button */}
        <button
          onClick={step === 1 ? onBack : prevStep}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 group w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {step === 1 ? 'Back' : 'Previous Step'}
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100/60 flex flex-col overflow-hidden min-h-0">

          {/* ── Fixed Header ── */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-4">
              {STEP_CONFIG.map((s, i) => {
                const n = i + 1;
                const isDone = step > n;
                const isActive = step === n;
                return (
                  <React.Fragment key={n}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isDone ? 'bg-green-500 text-white shadow-sm shadow-green-200'
                        : isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle2 size={15} /> : <s.icon size={14} />}
                      </div>
                      <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEP_CONFIG.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${step > n ? 'bg-green-400' : isActive ? 'bg-blue-200' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {stepTitles[step - 1]}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{stepSubs[step - 1]}</p>
            </div>
          </div>

          {/* ── Scrollable Form Body ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4"
            style={{ minHeight: 0 }}
          >
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 text-xs font-medium">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form
              id="request-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 2 && !validateWorkEmail(formData.workEmail)) {
                  setError('Please use your work email address. Free email providers are not accepted.');
                  return;
                }
                setError('');
                if (step < 4) nextStep();
                else handleSubmit(e);
              }}
              className="space-y-4"
            >

              {/* ═══════ STEP 1 — Company Info ═══════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Company Name *">
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required name="companyName" type="text" value={formData.companyName} onChange={handleChange}
                          placeholder="e.g. Acme Tech" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Company Website *">
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required name="companyWebsite" type="url" value={formData.companyWebsite} onChange={handleChange}
                          placeholder="https://acme.com" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Industry *">
                      <CustomSelect name="industry" value={formData.industry} onChange={handleChange}
                        options={INDUSTRIES} placeholder="Select Industry" required className={inputCls} />
                    </Field>
                    <Field label="Company Size *">
                      <CustomSelect name="companySize" value={formData.companySize} onChange={handleChange}
                        options={COMPANY_SIZES} placeholder="Select Size" required className={inputCls} />
                    </Field>
                  </div>
                </div>
              )}

              {/* ═══════ STEP 2 — Contact Details ═══════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name *">
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                          placeholder="John Smith" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Work Email *">
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required name="workEmail" type="email" value={formData.workEmail} onChange={handleChange}
                          placeholder="john@acme.com" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <Field label="Your Role *">
                      <div className="relative">
                        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required name="roleInCompany" type="text" value={formData.roleInCompany} onChange={handleChange}
                          placeholder="e.g. Hiring Manager" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    {/* Phone Picker */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone (Optional)</label>
                      <div ref={countryDropdownRef} className="relative">
                        <div className="flex rounded-xl border border-slate-200 bg-white overflow-visible hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(o => !o)}
                            className="flex items-center gap-1.5 px-3 py-2.5 border-r border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-l-xl transition-colors shrink-0"
                          >
                            <span className="text-base leading-none">{selectedCountry.flag}</span>
                            <span className="text-xs text-slate-600">{selectedCountry.dialCode}</span>
                            <ChevronDown size={11} className={`text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="Phone number"
                            className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-r-xl"
                          />
                        </div>
                        {isCountryDropdownOpen && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] p-2 space-y-1.5">
                            <input
                              type="text" placeholder="Search country..." value={countrySearchQuery}
                              onChange={e => setCountrySearchQuery(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-400"
                              onClick={e => e.stopPropagation()}
                            />
                            <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                              {ALL_COUNTRIES.filter(c =>
                                c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                c.dialCode.includes(countrySearchQuery) ||
                                c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                              ).map(c => (
                                <div key={c.code}
                                  onClick={() => { setSelectedCountry(c); setIsCountryDropdownOpen(false); setCountrySearchQuery(''); }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 transition-colors ${
                                    selectedCountry.code === c.code ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span>{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                  </div>
                                  <span className="text-slate-400 font-semibold text-[10px] shrink-0 ml-2">{c.dialCode}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ STEP 3 — Hiring Needs ═══════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Number of Open Roles *">
                      <CustomSelect name="numRoles" value={formData.numRoles} onChange={handleChange}
                        options={NUM_ROLES_OPTIONS} placeholder="Select Volume" required className={inputCls} />
                    </Field>
                    <Field label="Hiring Timeline *">
                      <CustomSelect name="hiringTimeline" value={formData.hiringTimeline} onChange={handleChange}
                        options={TIMELINES} placeholder="Select Timeline" required className={inputCls} />
                    </Field>
                  </div>

                  <SectionHeading icon={LayoutGrid} title="Roles You're Hiring For" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Hiring Domain *">
                      <CustomSelect name="hiringDomain" value={selectedDomain} onChange={handleDomainChange}
                        options={DOMAIN_OPTIONS} placeholder="Select Domain" required className={inputCls} />
                    </Field>
                    <div ref={rolesDropdownRef} className="relative">
                      <Field label="Role / Specialization">
                        <div className="flex gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text" value={rolesSearchQuery}
                              onChange={e => { setRolesSearchQuery(e.target.value); setCustomRoleInput(e.target.value); setIsRolesDropdownOpen(true); }}
                              onFocus={() => { if (selectedDomain) setIsRolesDropdownOpen(true); }}
                              onKeyDown={handleRoleInputKeyDown}
                              disabled={!selectedDomain}
                              placeholder={!selectedDomain ? 'Select domain first' : selectedDomain === 'Custom / Other' ? 'Type custom role...' : `Search roles...`}
                              className={`${inputCls} pl-9 disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                          </div>
                          {rolesSearchQuery.trim() && selectedDomain && (
                            <button type="button" onClick={handleAddCustomRole}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl text-xs transition-colors shrink-0">
                              <Plus size={13} /> Add
                            </button>
                          )}
                        </div>
                      </Field>
                      {isRolesDropdownOpen && selectedDomain && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                          {rolesSearchQuery.trim() && (
                            <div onClick={handleAddCustomRole}
                              className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold border border-dashed border-blue-200 transition-colors">
                              <span className="truncate">Add: &ldquo;{rolesSearchQuery}&rdquo;</span>
                              <Plus size={12} className="shrink-0" />
                            </div>
                          )}
                          {selectedDomain !== 'Custom / Other' && (() => {
                            const domainData = DETAILED_ROLES.find(g => g.category === selectedDomain);
                            const roles = domainData?.roles.filter(r => r.toLowerCase().includes(rolesSearchQuery.toLowerCase())) || [];
                            return roles.length > 0 ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">{selectedDomain}</div>
                                {roles.map(role => {
                                  const isSel = formData.hiringCategories.includes(role);
                                  return (
                                    <div key={role} onClick={() => handleCategoryToggle(role)}
                                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                        isSel ? 'bg-blue-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-50'
                                      }`}>
                                      <span className="truncate">{role}</span>
                                      {isSel && <CheckCircle2 size={12} className="shrink-0 ml-1" />}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-3 text-center text-xs text-slate-400">No matches. Press Add to use custom.</div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Roles */}
                  {formData.hiringCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      {formData.hiringCategories.map(role => (
                        <span key={role} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-semibold shadow-sm">
                          {role}
                          <button type="button" onClick={() => handleCategoryToggle(role)}
                            className="hover:text-red-500 transition-colors focus:outline-none">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════ STEP 4 — Additional Notes ═══════ */}
              {step === 4 && (
                <div className="space-y-4">
                  <Field label="Additional Notes">
                    <div className="relative">
                      <MessageSquare size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                      <textarea name="additionalNotes" rows={4} value={formData.additionalNotes} onChange={handleChange}
                        placeholder="Anything else you'd like us to know? Specific skills, requirements, etc."
                        className={`${inputCls} pl-9 resize-none`} />
                    </div>
                  </Field>

                  {variant === 'application' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Company Verification Document <span className="normal-case font-normal text-slate-400">(Optional)</span>
                      </label>
                      <p className="text-[11px] text-slate-400 -mt-0.5">Upload a PDF of your company registration to expedite approval.</p>
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="req-doc-upload" />
                      <label
                        htmlFor="req-doc-upload"
                        className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
                          documentFile
                            ? 'border-green-300 bg-green-50'
                            : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
                        }`}
                      >
                        {documentFile ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-green-700 truncate">{documentFile.name}</p>
                              <p className="text-[11px] text-green-500">{(documentFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                              <Upload size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">Upload PDF</p>
                              <p className="text-[11px] text-slate-400">PDF only · max 5MB</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        By clicking submit, I agree to the{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
                        , and allow TalentMesh to process my company details.
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Fixed Footer ── */}
          <div className="px-5 py-4 border-t border-slate-100 shrink-0 bg-white">
            <button
              type="submit"
              form="request-form"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {step < 4
                      ? 'Continue'
                      : variant === 'call' ? 'Schedule My Call' : 'Request Platform Access'
                    }
                  </span>
                  {step < 4
                    ? <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                    : <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAccessForm;
