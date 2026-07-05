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
  Users,
  Phone,
  ChevronDown,
  ArrowRight,
  FileText,
  Upload,
  Briefcase,
  X,
  Search,
  Plus,
  LayoutGrid,
  Shield,
  Clock,
  MapPin
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

const STEPS = [
  { label: 'Company', icon: Building2 },
  { label: 'Contact', icon: User },
  { label: 'Hiring', icon: Briefcase },
];

/* ── Reusable field wrapper ── */
const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

/* ── Reusable input base class ── */
const inputCls = "w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300";

/* ── Section divider ── */
const SectionHeading = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 pt-2 pb-0.5">
    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <Icon size={13} className="text-blue-600" />
    </div>
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
    <div className="flex-1 h-px bg-slate-100 ml-1" />
  </div>
);

/* ── File Upload Zone ── */
const FileZone = ({
  id, label, hint, accept, file, onChange, required
}: {
  id: string; label: string; hint: string; accept: string;
  file: File | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <p className="text-[11px] text-slate-400 -mt-0.5">{hint}</p>
    <input type="file" accept={accept} onChange={onChange} className="hidden" id={id} required={required} />
    <label
      htmlFor={id}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
        file
          ? 'border-green-300 bg-green-50 text-green-700'
          : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 text-slate-500'
      }`}
    >
      {file ? (
        <>
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-700 truncate">{file.name}</p>
            <p className="text-[11px] text-green-500">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
            <Upload size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">Upload file</p>
            <p className="text-[11px] text-slate-400">{accept.replace('image/*', 'images').replace('application/pdf', 'PDF')}</p>
          </div>
        </>
      )}
    </label>
  </div>
);

/* ── Country Phone Picker ── */
const PhonePicker = ({
  label, selectedCountry, onCountrySelect, value, onChange,
  dropdownRef, isOpen, onToggle, searchQuery, onSearchChange, id
}: {
  label: string;
  selectedCountry: Country;
  onCountrySelect: (c: Country) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  id: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <div ref={dropdownRef} className="relative">
      <div className="flex rounded-xl border border-slate-200 bg-white overflow-visible hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-2.5 border-r border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-l-xl transition-colors shrink-0"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-xs text-slate-600">{selectedCountry.dialCode}</span>
          <ChevronDown size={11} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <input
          id={id}
          type="tel"
          value={value}
          onChange={onChange}
          placeholder="Phone number"
          className="flex-1 min-w-0 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent rounded-r-xl"
        />
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] p-2 space-y-1.5">
          <input
            type="text"
            placeholder="Search country..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-400"
            onClick={e => e.stopPropagation()}
          />
          <div className="max-h-44 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
            {ALL_COUNTRIES.filter(c =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.dialCode.includes(searchQuery) ||
              c.code.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(c => (
              <div
                key={c.code}
                onClick={() => onCountrySelect(c)}
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
);

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

  const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[3]); // India default
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const [selectedEmergencyCountry, setSelectedEmergencyCountry] = useState<Country>(ALL_COUNTRIES[3]);
  const [isEmergencyCountryDropdownOpen, setIsEmergencyCountryDropdownOpen] = useState(false);
  const [emergencyCountrySearchQuery, setEmergencyCountrySearchQuery] = useState('');

  const [selectedDomain, setSelectedDomain] = useState('');
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);
  const [rolesSearchQuery, setRolesSearchQuery] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const emergencyCountryDropdownRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (emergencyCountryDropdownRef.current && !emergencyCountryDropdownRef.current.contains(event.target as Node)) {
        setIsEmergencyCountryDropdownOpen(false);
      }
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target as Node)) {
        setIsRolesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
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

  const handleEmergencyPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.trim().startsWith('00')) value = '+' + value.trim().substring(2);
    const cleanNumber = value.trim();
    if (cleanNumber.startsWith('+')) {
      const matched = countriesSorted.find(c => cleanNumber.startsWith(c.dialCode));
      if (matched) {
        setSelectedEmergencyCountry(matched);
        value = cleanNumber.substring(matched.dialCode.length).trim();
      }
    }
    setFormData(prev => ({ ...prev, emergencyPhone: value }));
  };

  const handleDomainChange = (e: any) => {
    setSelectedDomain(e.target.value);
    setRolesSearchQuery('');
    setCustomRoleInput('');
  };

  const handleRoleToggle = (role: string) => {
    const nextRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(nextRoles);
    setFormData(prev => ({ ...prev, rolesToHire: nextRoles.join(', ') }));
  };

  const handleAddCustomRole = () => {
    const roleToAdd = customRoleInput.trim();
    if (roleToAdd && !selectedRoles.includes(roleToAdd)) {
      const nextRoles = [...selectedRoles, roleToAdd];
      setSelectedRoles(nextRoles);
      setFormData(prev => ({ ...prev, rolesToHire: nextRoles.join(', ') }));
      setCustomRoleInput('');
      setRolesSearchQuery('');
    }
  };

  const handleRoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRole(); }
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) { setError('Please upload a PDF or Image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB.'); return; }
    setDocumentFile(file); setError('');
    setDocumentBase64(await readFileAsBase64(file));
  };

  const handleKycFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) { setError('Please upload a PDF or Image for KYC.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('KYC file size must be less than 5MB.'); return; }
    setKycFile(file); setError('');
    setKycBase64(await readFileAsBase64(file));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) { setError('Please upload an image for logo.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Logo file size must be less than 2MB.'); return; }
    setLogoFile(file); setError('');
    setLogoBase64(await readFileAsBase64(file));
  };

  const validateGSTIN = (gst: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.toUpperCase());
  const validateTAN = (tan: string) => /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/i.test(tan.toUpperCase());
  const validateWorkEmail = (email: string) => !FREE_EMAIL_PROVIDERS.includes((email.split('@')[1] || '').toLowerCase());
  const validatePAN = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
  const validateAadhaar = (aadhaar: string) => /^[2-9]{1}[0-9]{11}$/.test(aadhaar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');

    if (!documentBase64) { setError('Please upload a Company Verification Document.'); setIsLoading(false); return; }
    if (formData.gstin && !validateGSTIN(formData.gstin)) { setError('Please enter a valid GSTIN.'); setIsLoading(false); return; }
    if (formData.tan && !validateTAN(formData.tan)) { setError('Please enter a valid TAN.'); setIsLoading(false); return; }
    if (!validateWorkEmail(formData.workEmail)) { setError('Please use your work email address.'); setIsLoading(false); return; }
    if (!kycBase64) { setError('Please upload Aadhaar/PAN Copy.'); setIsLoading(false); return; }
    if (formData.panNumber && !validatePAN(formData.panNumber)) { setError('Please enter a valid PAN Card Number.'); setIsLoading(false); return; }
    if (formData.aadhaarNumber && !validateAadhaar(formData.aadhaarNumber)) { setError('Please enter a valid 12-digit Aadhaar Number.'); setIsLoading(false); return; }

    try {
      const { error: apiError } = await invokeFunction('recruiter-request', {
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
          phone_number: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
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
          emergency_contact_phone: formData.emergencyPhone ? `${selectedEmergencyCountry.dialCode} ${formData.emergencyPhone}` : '',
          emergency_contact_address: formData.emergencyAddress,
          kyc_document_base64: kycBase64,
          kyc_document_name: kycFile?.name,
          company_logo_base64: logoBase64,
          company_logo_name: logoFile?.name
        }
      });
      if (apiError) throw new Error(apiError.message || 'Failed to submit request');
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Received!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Thank you for your interest. Our team will review your company details and verify your account.
            <br /><br />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              You&apos;ll receive an email once approved.
            </span>
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const stepValidations: Record<number, () => string | null> = {
    1: () => {
      if (!formData.companyAddress.trim()) return 'Please enter the Company Registered Address.';
      if (!documentBase64) return 'Please upload a Company Verification Document.';
      if (formData.gstin && !validateGSTIN(formData.gstin)) return 'Please enter a valid GSTIN (e.g. 22AAAAA0000A1Z5).';
      if (formData.tan && !validateTAN(formData.tan)) return 'Please enter a valid TAN (e.g. ABCD12345E).';
      return null;
    },
    2: () => {
      if (!validateWorkEmail(formData.workEmail)) return 'Please use your work email address.';
      if (!kycBase64) return 'Please upload Aadhaar/PAN Copy.';
      if (formData.panNumber && !validatePAN(formData.panNumber)) return 'Please enter a valid PAN Card Number.';
      if (formData.aadhaarNumber && !validateAadhaar(formData.aadhaarNumber)) return 'Please enter a valid 12-digit Aadhaar Number.';
      return null;
    },
  };

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
              {STEPS.map((s, i) => {
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
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${step > n ? 'bg-green-400' : isActive ? 'bg-blue-200' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step title */}
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {step === 1 && 'Company Information'}
                {step === 2 && 'Contact & KYC Details'}
                {step === 3 && 'Hiring Preferences'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 1 && 'Tell us about your organization'}
                {step === 2 && 'Your personal details and identity verification'}
                {step === 3 && 'Define your hiring needs and emergency contact'}
              </p>
            </div>
          </div>

          {/* ── Scrollable Form Body ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4"
            style={{ minHeight: 0 }}
          >
            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 text-xs font-medium">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form
              id="recruiter-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) {
                  const err = stepValidations[step]?.();
                  if (err) { setError(err); return; }
                  setError('');
                  nextStep();
                } else {
                  handleSubmit(e);
                }
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
                          placeholder="e.g. Acme Technologies" className={`${inputCls} pl-9`} />
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
                        options={INDUSTRIES} placeholder="Select Industry" required
                        className={inputCls} />
                    </Field>
                    <Field label="Company Size *">
                      <CustomSelect name="companySize" value={formData.companySize} onChange={handleChange}
                        options={COMPANY_SIZES} placeholder="Select Size" required
                        className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Registered Address *">
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                      <textarea required name="companyAddress" rows={2} value={formData.companyAddress} onChange={handleChange}
                        placeholder="Full registered office address"
                        className={`${inputCls} pl-9 resize-none`} />
                    </div>
                  </Field>

                  <SectionHeading icon={FileText} title="Tax Identifiers (Optional)" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="GSTIN">
                      <input name="gstin" type="text" value={formData.gstin} onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5" maxLength={15}
                        className={`${inputCls} uppercase tracking-wider`} />
                    </Field>
                    <Field label="TAN">
                      <input name="tan" type="text" value={formData.tan} onChange={handleChange}
                        placeholder="ABCD12345E" maxLength={10}
                        className={`${inputCls} uppercase tracking-wider`} />
                    </Field>
                  </div>

                  <SectionHeading icon={Upload} title="Documents" />
                  <FileZone
                    id="doc-upload" label="Verification Document *"
                    hint="Certificate of Incorporation or GST Registration (PDF/Image, max 5MB)"
                    accept=".pdf,image/*" file={documentFile} onChange={handleFileChange} required
                  />
                  <FileZone
                    id="logo-upload" label="Company Logo (Optional)"
                    hint="PNG or JPG for branding — max 2MB"
                    accept="image/*" file={logoFile} onChange={handleLogoChange}
                  />
                </div>
              )}

              {/* ═══════ STEP 2 — Contact & KYC ═══════ */}
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
                    <PhonePicker
                      label="Phone Number (Optional)"
                      id="phone-main"
                      selectedCountry={selectedCountry}
                      onCountrySelect={(c) => { setSelectedCountry(c); setIsCountryDropdownOpen(false); setCountrySearchQuery(''); }}
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      dropdownRef={countryDropdownRef}
                      isOpen={isCountryDropdownOpen}
                      onToggle={() => setIsCountryDropdownOpen(o => !o)}
                      searchQuery={countrySearchQuery}
                      onSearchChange={setCountrySearchQuery}
                    />
                  </div>

                  <SectionHeading icon={Shield} title="Personal KYC Verification" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="PAN Card Number *">
                      <input required name="panNumber" type="text" value={formData.panNumber} onChange={handleChange}
                        placeholder="ABCDE1234F" maxLength={10}
                        className={`${inputCls} uppercase tracking-widest font-mono`} />
                    </Field>
                    <Field label="Aadhaar Card Number *">
                      <input required name="aadhaarNumber" type="text" value={formData.aadhaarNumber} onChange={handleChange}
                        placeholder="12-digit Aadhaar" maxLength={12} pattern="[0-9]*" inputMode="numeric"
                        className={`${inputCls} font-mono tracking-wider`} />
                    </Field>
                  </div>
                  <FileZone
                    id="kyc-upload" label="Aadhaar / PAN Document *"
                    hint="Upload a clear scan or photo (PDF/Image, max 5MB)"
                    accept=".pdf,image/*" file={kycFile} onChange={handleKycFileChange} required
                  />
                </div>
              )}

              {/* ═══════ STEP 3 — Hiring & Emergency ═══════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <SectionHeading icon={Users} title="Emergency Contact (Optional)" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Contact Name">
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input name="emergencyName" type="text" value={formData.emergencyName} onChange={handleChange}
                          placeholder="Emergency contact name" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                    <PhonePicker
                      label="Contact Phone"
                      id="phone-emergency"
                      selectedCountry={selectedEmergencyCountry}
                      onCountrySelect={(c) => { setSelectedEmergencyCountry(c); setIsEmergencyCountryDropdownOpen(false); setEmergencyCountrySearchQuery(''); }}
                      value={formData.emergencyPhone}
                      onChange={handleEmergencyPhoneChange}
                      dropdownRef={emergencyCountryDropdownRef}
                      isOpen={isEmergencyCountryDropdownOpen}
                      onToggle={() => setIsEmergencyCountryDropdownOpen(o => !o)}
                      searchQuery={emergencyCountrySearchQuery}
                      onSearchChange={setEmergencyCountrySearchQuery}
                    />
                    <Field label="Contact Address" className="sm:col-span-2">
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input name="emergencyAddress" type="text" value={formData.emergencyAddress} onChange={handleChange}
                          placeholder="Full address" className={`${inputCls} pl-9`} />
                      </div>
                    </Field>
                  </div>

                  <SectionHeading icon={Briefcase} title="Hiring Preferences" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Hiring Domain *">
                      <CustomSelect name="hiringDomain" value={selectedDomain} onChange={handleDomainChange}
                        options={DOMAIN_OPTIONS} placeholder="Select Domain" required className={inputCls} />
                    </Field>
                    <div ref={rolesDropdownRef} className="relative">
                      <Field label="Roles to Hire *">
                        <div className="flex gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text" value={rolesSearchQuery}
                              onChange={e => { setRolesSearchQuery(e.target.value); setCustomRoleInput(e.target.value); setIsRolesDropdownOpen(true); }}
                              onFocus={() => { if (selectedDomain) setIsRolesDropdownOpen(true); }}
                              onKeyDown={handleRoleInputKeyDown}
                              disabled={!selectedDomain}
                              placeholder={!selectedDomain ? 'Select domain first' : selectedDomain === 'Custom / Other' ? 'Type custom role...' : `Search ${selectedDomain}...`}
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
                                  const isSel = selectedRoles.includes(role);
                                  return (
                                    <div key={role} onClick={() => handleRoleToggle(role)}
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
                              <div className="py-3 text-center text-xs text-slate-400">No matches. Press Add to use custom role.</div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Roles Pills */}
                  {selectedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      {selectedRoles.map(role => (
                        <span key={role} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-semibold shadow-sm">
                          {role}
                          <button type="button" onClick={() => handleRoleToggle(role)}
                            className="hover:text-red-500 transition-colors focus:outline-none">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Hiring Volume">
                      <CustomSelect name="numRoles" value={formData.numRoles} onChange={handleChange}
                        options={NUM_ROLES_OPTIONS} placeholder="Select Volume" required className={inputCls} />
                    </Field>
                    <Field label="Hiring Timeline">
                      <CustomSelect name="hiringTimeline" value={formData.hiringTimeline} onChange={handleChange}
                        options={HIRING_TIMELINES} placeholder="Select Timeline" required className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Additional Notes">
                    <div className="relative">
                      <MessageSquare size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
                      <textarea name="additionalNotes" rows={3} value={formData.additionalNotes} onChange={handleChange}
                        placeholder="Anything else you'd like us to know?"
                        className={`${inputCls} pl-9 resize-none`} />
                    </div>
                  </Field>

                  {/* Terms */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        By clicking submit, I agree to the{' '}
                        <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>
                        , and allow TalentMesh to process my details.
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
              form="recruiter-form"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step < 3 ? 'Continue to Next Step' : 'Submit Application'}</span>
                  {step < 3
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

export default RecruiterRegisterForm;
