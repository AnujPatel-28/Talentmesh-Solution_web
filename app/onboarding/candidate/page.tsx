"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, X } from 'lucide-react';

import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import { ResumeUploader } from '@/components/resume/ResumeUploader';
import { useAuth } from '@/lib/auth/AuthContext';
import { insforge, invokeFunction } from '@/lib/insforge';
import { getCandidateAccessState } from '@/lib/auth/candidate-access';
import type { CandidateSettingsBundle } from '@/lib/candidate-profile';
import { getDefaultCandidateProfile, normalizeCandidateProfile } from '@/lib/candidate-profile';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { FormSkeleton } from '@/components/ui/LoadingSkeletons';

import styles from '../onboarding.module.css';

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

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: [string, string, string, string] = ['Basic Info', 'Professional', 'Preferences', 'Documents'];
const STEP_TITLES = [
    'Basic Information',
    'Professional Profile',
    'Job Preferences',
    'Documents & Links'
];
const STEP_SUBTITLES = [
    'Your name, phone and current location',
    'Headline, skills and experience',
    'Salary range, locations and work mode',
    'Resume and online presence (optional)'
];
const JOB_TYPES = ['Remote', 'Hybrid', 'Onsite'];

const INDIAN_CITIES = [
  'Agra, Uttar Pradesh',
  'Ahmedabad, Gujarat',
  'Ajmer, Rajasthan',
  'Allahabad (Prayagraj), Uttar Pradesh',
  'Amritsar, Punjab',
  'Anantnag, Jammu & Kashmir',
  'Asansol, West Bengal',
  'Aurangabad (Chhatrapati Sambhajinagar), Maharashtra',
  'Belagavi, Karnataka',
  'Bengaluru, Karnataka',
  'Bhagalpur, Bihar',
  'Bhilai, Chhattisgarh',
  'Bhopal, Madhya Pradesh',
  'Bhubaneswar, Odisha',
  'Bilaspur, Chhattisgarh',
  'Bokaro Steel City, Jharkhand',
  'Chandigarh',
  'Chennai, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Cuttack, Odisha',
  'Dehradun, Uttarakhand',
  'Delhi, NCT',
  'Dhanbad, Jharkhand',
  'Dharamshala, Himachal Pradesh',
  'Dibrugarh, Assam',
  'Durg, Chhattisgarh',
  'Durgapur, West Bengal',
  'Faridabad, Haryana',
  'Gandhinagar, Gujarat',
  'Gaya, Bihar',
  'Ghaziabad, Uttar Pradesh',
  'Guntur, Andhra Pradesh',
  'Gurgaon, Haryana',
  'Guwahati, Assam',
  'Gwalior, Madhya Pradesh',
  'Haldwani, Uttarakhand',
  'Haridwar, Uttarakhand',
  'Hubballi-Dharwad, Karnataka',
  'Hyderabad, Telangana',
  'Indore, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Jaipur, Rajasthan',
  'Jalandhar, Punjab',
  'Jammu, Jammu & Kashmir',
  'Jamnagar, Gujarat',
  'Jamshedpur, Jharkhand',
  'Jodhpur, Rajasthan',
  'Kanpur, Uttar Pradesh',
  'Karimnagar, Telangana',
  'Karnal, Haryana',
  'Kochi, Kerala',
  'Kolkata, West Bengal',
  'Kota, Rajasthan',
  'Kozhikode, Kerala',
  'Kurnool, Andhra Pradesh',
  'Lucknow, Uttar Pradesh',
  'Ludhiana, Punjab',
  'Madgaon, Goa',
  'Madurai, Tamil Nadu',
  'Mandi, Himachal Pradesh',
  'Mangaluru, Karnataka',
  'Meerut, Uttar Pradesh',
  'Mormugao, Goa',
  'Mumbai, Maharashtra',
  'Muzaffarpur, Bihar',
  'Mysore, Karnataka',
  'Nagpur, Maharashtra',
  'Nashik, Maharashtra',
  'New Delhi, NCT',
  'Noida, Uttar Pradesh',
  'Panaji, Goa',
  'Panipat, Haryana',
  'Patiala, Punjab',
  'Patna, Bihar',
  'Pune, Maharashtra',
  'Puri, Odisha',
  'Raipur, Chhattisgarh',
  'Rajkot, Gujarat',
  'Rajnandgaon, Chhattisgarh',
  'Ranchi, Jharkhand',
  'Rourkela, Odisha',
  'Salem, Tamil Nadu',
  'Shimla, Himachal Pradesh',
  'Siliguri, West Bengal',
  'Sonipat, Haryana',
  'Srinagar, Jammu & Kashmir',
  'Surat, Gujarat',
  'Thane, Maharashtra',
  'Thiruvananthapuram, Kerala',
  'Thrissur, Kerala',
  'Tinsukia, Assam',
  'Tirupati, Andhra Pradesh',
  'Tiruppur, Tamil Nadu',
  'Tiruchirappalli, Tamil Nadu',
  'Udhampur, Jammu & Kashmir',
  'Ujjain, Madhya Pradesh',
  'Udaipur, Rajasthan',
  'Vadodara, Gujarat',
  'Varanasi, Uttar Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Visakhapatnam, Andhra Pradesh',
  'Warangal, Telangana'
];

const DOMAIN_SKILLS: Record<string, string[]> = {
  'Engineering & Technology': [
    // Frontend
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'SolidJS',
    'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Sass', 'Webpack', 'Vite', 'Redux', 'Zustand', 'React Query',
    // Backend
    'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
    'C#', '.NET Core', 'Go (Golang)', 'Rust', 'PHP', 'Laravel', 'Ruby on Rails', 'Elixir',
    // Databases & Caching
    'SQL', 'PostgreSQL', 'MySQL', 'Microsoft SQL Server', 'Oracle DB', 'MongoDB', 'Redis', 'Cassandra',
    'DynamoDB', 'Elasticsearch', 'Firebase', 'Prisma ORM', 'Sequelize',
    // Mobile Development
    'React Native', 'Flutter', 'Swift', 'SwiftUI', 'Kotlin', 'Jetpack Compose', 'Objective-C', 'Android SDK',
    // DevOps & Cloud
    'Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes',
    'Terraform', 'Ansible', 'CI/CD Pipelines', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Linux Systems', 'Bash Scripting', 'Nginx',
    // Architecture & APIs
    'RESTful APIs', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices Architecture', 'Serverless computing', 'System Design',
    // Testing
    'Jest', 'Cypress', 'Selenium', 'Playwright', 'JUnit',
    // Cybersecurity
    'Penetration Testing', 'OWASP Top 10', 'Cryptography', 'IAM (Identity & Access Management)', 'Network Security', 'SIEM',
    // Systems & Embedded
    'C', 'C++', 'Assembly', 'RTOS', 'Firmware Development', 'Microcontrollers', 'VHDL / Verilog',
    // Version Control & Project Tools
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Agile Methodologies', 'Scrum Framework',
    // Blockchain & Web3
    'Blockchain Technology', 'Solidity', 'Smart Contracts', 'Web3.js'
  ],
  'Data Science & Artificial Intelligence': [
    // Programming Languages
    'Python', 'R Programming', 'SQL', 'Julia', 'MATLAB', 'SAS',
    // Scientific Libraries
    'NumPy', 'Pandas', 'SciPy', 'Scikit-learn', 'Statsmodels',
    // Machine Learning & Deep Learning
    'Machine Learning', 'Deep Learning', 'Neural Networks', 'Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning',
    'TensorFlow', 'PyTorch', 'Keras', 'JAX', 'Hugging Face', 'XGBoost', 'LightGBM',
    // NLP
    'Natural Language Processing (NLP)', 'BERT', 'GPT models', 'NLTK', 'spaCy', 'Sentiment Analysis', 'Text Mining',
    // Computer Vision
    'Computer Vision', 'OpenCV', 'Object Detection', 'Image Segmentation', 'YOLO', 'Generative AI', 'Stable Diffusion',
    // LLMs & GenAI
    'Large Language Models (LLMs)', 'Prompt Engineering', 'RAG (Retrieval-Augmented Generation)', 'Vector Databases (Pinecone/Milvus)',
    // Data Engineering
    'Data Engineering', 'ETL Pipelines', 'Apache Spark', 'PySpark', 'Apache Hadoop', 'Apache Kafka', 'Apache Airflow', 'dbt (data build tool)',
    // Data Warehousing
    'Snowflake', 'Google BigQuery', 'Amazon Redshift', 'Data Lakehouse',
    // Data Visualization & BI
    'Tableau', 'Power BI', 'Matplotlib', 'Seaborn', 'Plotly', 'Looker', 'Advanced Excel', 'Quantitative Analysis',
    // MLOps
    'MLOps', 'MLflow', 'Kubeflow', 'DVC (Data Version Control)', 'Model Deployment', 'A/B Testing'
  ],
  'Product & Design': [
    // UI/UX Design Tools
    'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Axure RP', 'Framer', 'Marvel App',
    // Graphic & Visual Arts
    'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe Premiere Pro', 'Adobe After Effects', 'Canva', 'Motion Graphics', 'Typography', 'Color Theory',
    // UX Research & Strategy
    'User Research', 'User Interviews', 'Usability Testing', 'User Personas', 'User Journey Mapping', 'Information Architecture', 'Wireframing', 'Rapid Prototyping', 'Interaction Design', 'Heuristic Evaluation',
    // Product Management
    'Product Strategy', 'Product Roadmap Development', 'Product Lifecycle Management (PLM)', 'Competitive Analysis', 'Market Analysis', 'Feature Prioritization', 'PRDs (Product Requirement Documents)', 'Product Analytics', 'Amplitude', 'Mixpanel',
    // Process & Tools
    'Agile Product Management', 'Scrum Framework', 'Kanban', 'Jira Software', 'Confluence', 'Trello', 'Asana', 'Monday.com', 'Design Thinking'
  ],
  'Marketing, Sales & Business Development': [
    // Digital Marketing & SEO
    'SEO (Search Engine Optimization)', 'SEM (Search Engine Marketing)', 'Google Analytics 4 (GA4)', 'Google Search Console', 'Google Tag Manager', 'Hotjar',
    // Paid Advertising
    'Google Ads', 'Meta Ads Manager', 'LinkedIn Ads', 'Twitter Ads', 'Programmatic Advertising',
    // Content & Social
    'Content Marketing', 'Content Strategy', 'Copywriting', 'Blogging', 'Social Media Marketing', 'Social Media Management', 'Hootsuite', 'Buffer',
    // Email & Inbound
    'Email Marketing', 'Mailchimp', 'ActiveCampaign', 'HubSpot Marketing Hub', 'Inbound Marketing', 'Conversion Rate Optimization (CRO)', 'A/B Testing (Marketing)',
    // Performance & Analytics
    'Growth Marketing', 'Customer Acquisition Cost (CAC) Optimization', 'LTV (Lifetime Value) Marketing',
    // B2B Sales & BD
    'Lead Generation', 'Cold Calling', 'Cold Email Outreach', 'B2B Sales', 'Enterprise Sales', 'Account-Based Marketing (ABM)', 'Sales Pitching', 'Negotiation', 'Closing Deals',
    // CRM & Sales Tools
    'Salesforce CRM', 'HubSpot Sales Hub', 'Pipedrive CRM', 'Sales Pipeline Management', 'Key Account Management',
    // Branding & PR
    'Brand Management', 'Public Relations (PR)', 'Media Relations', 'Event Management', 'Influencer Marketing', 'Crisis Communication'
  ],
  'Customer Success & Operations': [
    // Customer Support & Success
    'Customer Success Management (CSM)', 'Customer Onboarding', 'Zendesk', 'Intercom', 'Salesforce Service Cloud', 'Freshdesk', 'Customer Support Operations', 'NPS (Net Promoter Score) Improvement', 'CSAT Optimization', 'Escalation Management', 'Help Desk Support', 'Live Chat Support',
    // HR & Talent
    'Human Resources (HR)', 'Technical Recruiting', 'Candidate Sourcing', 'Talent Acquisition', 'Candidate Experience', 'Applicant Tracking Systems (ATS)', 'Greenhouse ATS', 'Lever ATS', 'Employee Onboarding', 'Performance Management', 'Employee Relations', 'Labor Compliance',
    // Finance & Accounting
    'Financial Analysis', 'Financial Modeling', 'Bookkeeping', 'Accounting Principles', 'QuickBooks', 'Xero', 'Accounts Payable', 'Accounts Receivable', 'Tax Compliance', 'Auditing', 'Budgeting & Forecasting', 'Corporate Finance',
    // Operations
    'Operations Management', 'Process Optimization', 'Lean Six Sigma', 'Supply Chain Management', 'Logistics Operations', 'Project Coordination', 'Vendor Management', 'Executive Assistant Support', 'Office Administration', 'Facilities Management'
  ],
  'Healthcare & Life Sciences': [
    // Clinical & Practice
    'Patient Care', 'Clinical Diagnostics', 'General Medicine', 'Surgery Assistance', 'Nursing Care', 'EHR/EMR Systems', 'Patient Assessment', 'CPR & First Aid', 'Telehealth Systems', 'Medical Terminology',
    // Pharmaceuticals
    'Pharmacology', 'Drug Development', 'Pharmacovigilance', 'Regulatory Affairs (Pharma)', 'Medical Information Services', 'Clinical Trials Management', 'Good Clinical Practice (GCP)',
    // Biotech & Lab
    'Biotechnology', 'Bioinformatics', 'Genomics', 'PCR Techniques', 'Cell Culture', 'Lab Safety Protocols', 'Microbiology', 'Immunology',
    // Administration & Coding
    'Medical Coding (ICD-10/CPT)', 'Medical Device Engineering', 'Biomedical Engineering', 'Healthcare Administration', 'Patient Scheduling', 'HIPAA Compliance', 'Quality Assurance in Healthcare'
  ],
  'Other Professional Services': [
    // Consulting & Business Analysis
    'Management Consulting', 'Business Analysis', 'Requirements Gathering', 'Change Management', 'Strategy Consulting', 'SWOT Analysis', 'Executive Coaching', 'Workshop Facilitation',
    // Traditional Engineering
    'Civil Engineering', 'Structural Design', 'AutoCAD', 'Autodesk Revit', 'SolidWorks', 'Mechanical Engineering', 'Thermodynamics', 'Electrical Engineering', 'Circuit Design', 'MATLAB (Engineering)', 'LabVIEW', 'Construction Project Management', 'GIS (Geographic Information Systems)',
    // Writing & Creative
    'Technical Writing', 'Creative Writing', 'Translation Services', 'Proofreading & Editing', 'Audio Transcription', 'Professional Photography', 'Videography', 'Video Editing', 'Sound Design', 'Voice Acting', 'Content Creation',
    // Supply Chain & Logistics
    'Inventory Control', 'Procurement & Purchasing', 'Logistics Planning', 'Warehouse Operations', 'Import/Export Compliance'
  ]
};

const ALL_POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'SQL',
  'AWS', 'Docker', 'Git', 'Figma', 'UI/UX Design', 'Product Management', 'Project Management',
  'Business Development', 'Sales Strategy', 'Customer Support', 'Communication Skills', 'Problem Solving',
  'Machine Learning', 'Data Analysis', 'SEO', 'Content Strategy', 'Financial Modeling', 'Recruiting'
];

const INDIAN_DEGREES = [
  'B.Tech / B.E. (Bachelor of Technology / Engineering)',
  'BCA (Bachelor of Computer Applications)',
  'B.Sc (Bachelor of Science)',
  'B.Com (Bachelor of Commerce)',
  'BBA (Bachelor of Business Administration)',
  'B.A. (Bachelor of Arts)',
  'M.Tech / M.E. (Master of Technology / Engineering)',
  'MCA (Master of Computer Applications)',
  'MBA (Master of Business Administration)',
  'M.Sc (Master of Science)',
  'M.Com (Master of Commerce)',
  'M.A. (Master of Arts)',
  'Ph.D / Doctorate',
  'Diploma Degree',
  'Higher Secondary (12th)',
  'Other Degree'
];

const EXPERIENCE_OPTIONS = [
  { label: 'Fresher (No Experience)', value: '0' },
  { label: '1 Year', value: '1' },
  { label: '2 Years', value: '2' },
  { label: '3 Years', value: '3' },
  { label: '4 Years', value: '4' },
  { label: '5 Years', value: '5' },
  { label: '6 Years', value: '6' },
  { label: '7 Years', value: '7' },
  { label: '8 Years', value: '8' },
  { label: '9 Years', value: '9' },
  { label: '10+ Years', value: '10' },
  { label: 'Custom (Specify years in decimals)', value: 'custom' }
];

const FIELDS_OF_STUDY = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace & Aeronautical Engineering',
  'Biotechnology / Biomedical Engineering',
  'Data Science & Artificial Intelligence',
  'Computer Applications (BCA / MCA)',
  'Business Administration (BBA / MBA)',
  'Finance & Accounting',
  'Marketing & Sales',
  'Human Resource Management',
  'Operations & Supply Chain Management',
  'Economics',
  'Commerce (B.Com / M.Com)',
  'Mathematics & Statistics',
  'Physics',
  'Chemistry',
  'Biology & Life Sciences',
  'MBBS / Medicine',
  'Pharmacy (B.Pharm / M.Pharm)',
  'Nursing',
  'Law (LLB / LLM)',
  'Psychology & Cognitive Science',
  'Sociology & Social Work',
  'Political Science & International Relations',
  'History',
  'English Literature & Linguistics',
  'Journalism & Mass Communication',
  'Graphic Design & Animation',
  'UI/UX & Product Design',
  'Fine Arts & Visual Arts',
  'Architecture',
  'Other Field of Study'
];

const STATE_UNIVERSITIES_COLLEGES: Record<string, string[]> = {
  'Karnataka': [
    'Indian Institute of Science (IISc), Bengaluru',
    'Visvesvaraya Technological University (VTU), Belagavi',
    'Bangalore University, Bengaluru',
    'Manipal Academy of Higher Education, Manipal',
    'National Institute of Technology Karnataka (NITK), Surathkal',
    'Christ University, Bengaluru',
    'PES University, Bengaluru',
    'M. S. Ramaiah Institute of Technology, Bengaluru',
    'R.V. College of Engineering (RVCE), Bengaluru',
    'B.M.S. College of Engineering, Bengaluru',
    'IIIT Bangalore, Bengaluru',
    'Alliance University, Bengaluru',
    'University of Mysore, Mysuru',
    'Karnatak University, Dharwad',
    'St. Joseph\'s University, Bengaluru',
    'Reva University, Bengaluru'
  ],
  'Maharashtra': [
    'Indian Institute of Technology (IIT) Bombay, Mumbai',
    'University of Mumbai, Mumbai',
    'Savitribai Phule Pune University, Pune',
    'COEP Technological University, Pune',
    'Veermata Jijabai Technological Institute (VJTI), Mumbai',
    'SNDT Women\'s University, Mumbai',
    'Narsee Monjee Institute of Management Studies (NMIMS), Mumbai',
    'Symbiosis International University, Pune',
    'Visvesvaraya National Institute of Technology (VNIT), Nagpur',
    'BITS Pilani (Kalyan Campus), Kalyan',
    'MIT World Peace University, Pune',
    'DY Patil Vidyapeeth, Pune',
    'ICT Mumbai, Mumbai',
    'Ferguson College, Pune',
    'Symbiosis Institute of Technology, Pune'
  ],
  'Tamil Nadu': [
    'Indian Institute of Technology (IIT) Madras, Chennai',
    'Anna University, Chennai',
    'Vellore Institute of Technology (VIT), Vellore',
    'SRM Institute of Science and Technology, Chennai',
    'Amrita Vishwa Vidyapeetham, Coimbatore',
    'National Institute of Technology (NIT) Trichy, Tiruchirappalli',
    'University of Madras, Chennai',
    'PSG College of Technology, Coimbatore',
    'Sathyabama Institute of Science and Technology, Chennai',
    'SSN College of Engineering, Chennai',
    'SASTRA Deemed University, Thanjavur',
    'Coimbatore Institute of Technology, Coimbatore',
    'Loyola College, Chennai',
    'Madras Christian College, Chennai'
  ],
  'Delhi': [
    'Indian Institute of Technology (IIT) Delhi, New Delhi',
    'University of Delhi, Delhi',
    'Jawaharlal Nehru University (JNU), New Delhi',
    'Delhi Technological University (DTU), Delhi',
    'Netaji Subhas University of Technology (NSUT), Delhi',
    'Jamia Millia Islamia, New Delhi',
    'Guru Gobind Singh Indraprastha University (GGSIPU), Delhi',
    'Indraprastha Institute of Information Technology (IIIT) Delhi, New Delhi',
    'Indira Gandhi Delhi Technical University for Women (IGDTUW), Delhi',
    'Amity University Delhi NCR, Noida/Delhi',
    'St. Stephen\'s College, Delhi',
    'LSR (Lady Shri Ram College for Women), Delhi'
  ],
  'Telangana': [
    'Indian Institute of Technology (IIT) Hyderabad, Hyderabad',
    'International Institute of Information Technology (IIIT) Hyderabad, Hyderabad',
    'BITS Pilani (Hyderabad Campus), Hyderabad',
    'Osmania University, Hyderabad',
    'Jawaharlal Nehru Technological University (JNTUH), Hyderabad',
    'University of Hyderabad, Hyderabad',
    'National Institute of Technology (NIT) Warangal, Warangal',
    'Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad',
    'VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad',
    'Vasavi College of Engineering, Hyderabad'
  ],
  'Andhra Pradesh': [
    'Andhra University, Visakhapatnam',
    'Sri Venkateswara University, Tirupati',
    'Jawaharlal Nehru Technological University (JNTUK), Kakinada',
    'K L University, Guntur',
    'National Institute of Technology (NIT) Andhra Pradesh, Tadepalligudem',
    'IIIT Sri City, Chittoor',
    'Gitam University, Visakhapatnam',
    'JNTU Anantapur, Ananthamu'
  ],
  'West Bengal': [
    'Indian Institute of Technology (IIT) Kharagpur, Kharagpur',
    'Jadavpur University, Kolkata',
    'University of Calcutta, Kolkata',
    'Indian Statistical Institute (ISI), Kolkata',
    'Indian Institute of Engineering Science and Technology (IIEST), Shibpur',
    'National Institute of Technology (NIT) Durgapur, Durgapur',
    'Maulana Abul Kalam Azad University of Technology (MAKAUT), Kolkata',
    'Presidency University, Kolkata',
    'St. Xavier\'s College, Kolkata',
    'Heritage Institute of Technology, Kolkata',
    'Techno India University, Kolkata'
  ],
  'Uttar Pradesh': [
    'Indian Institute of Technology (IIT) Kanpur, Kanpur',
    'Banaras Hindu University (BHU), Varanasi',
    'Indian Institute of Technology (IIT BHU) Varanasi, Varanasi',
    'Aligarh Muslim University (AMU), Aligarh',
    'Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow',
    'Motilal Nehru National Institute of Technology (MNNIT), Allahabad',
    'Amity University Uttar Pradesh, Noida',
    'Sharda University, Greater Noida',
    'Shiv Nadar University, Dadri',
    'Harcourt Butler Technical University (HBTU), Kanpur',
    'Madan Mohan Malaviya University of Technology, Gorakhpur',
    'Jaypee Institute of Information Technology (JIIT), Noida'
  ],
  'Gujarat': [
    'Indian Institute of Technology (IIT) Gandhinagar, Gandhinagar',
    'Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat',
    'Gujarat Technological University (GTU), Ahmedabad',
    'Nirma University, Ahmedabad',
    'Dhirubhai Ambani Institute of Information and Communication Technology (DA-IICT), Gandhinagar',
    'Maharaja Sayajirao University of Baroda (MSU), Vadodara',
    'Pandit Deendayal Energy University (PDEU), Gandhinagar',
    'Ahmedabad University, Ahmedabad',
    'L.D. College of Engineering, Ahmedabad',
    'Hemchandracharya North Gujarat University (HNGU), Patan',
    'Saurashtra University, Rajkot',
    'Veer Narmad South Gujarat University (VNSGU), Surat',
    'Krantiguru Shyamji Krishna Verma Kachchh University, Bhuj',
    'Gujarat University, Ahmedabad',
    'S.P. University (Sardar Patel University), Vallabh Vidyanagar',
    'Bhavnagar University, Bhavnagar',
    'Junagadh Agricultural University, Junagadh',
    'Anand Agricultural University, Anand',
    'CEPT University, Ahmedabad',
    'GLS University, Ahmedabad',
    'Marwadi University, Rajkot',
    'Silver Oak University, Ahmedabad',
    'Parul University, Vadodara',
    'RK University, Rajkot'
  ],
  'Kerala': [
    'National Institute of Technology (NIT) Calicut, Calicut',
    'APJ Abdul Kalam Technological University (KTU), Thiruvananthapuram',
    'Cochin University of Science and Technology (CUSAT), Kochi',
    'University of Kerala, Thiruvananthapuram',
    'Mahatma Gandhi University, Kottayam',
    'Indian Institute of Space Science and Technology (IIST), Thiruvananthapuram',
    'Indian Institute of Management (IIM) Kozhikode, Kozhikode',
    'Government Engineering College (GEC), Thrissur',
    'College of Engineering Trivandrum (CET), Thiruvananthapuram'
  ],
  'Rajasthan': [
    'Malaviya National Institute of Technology (MNIT), Jaipur',
    'Birla Institute of Technology and Science (BITS), Pilani',
    'Indian Institute of Technology (IIT) Jodhpur, Jodhpur',
    'University of Rajasthan, Jaipur',
    'Rajasthan Technical University (RTU), Kota',
    'LNM Institute of Information Technology (LNMIIT), Jaipur',
    'Manipal University, Jaipur',
    'Mody University, Lakshmangarh'
  ],
  'Punjab': [
    'Indian Institute of Technology (IIT) Ropar, Ropar',
    'Panjab University, Chandigarh',
    'Thapar Institute of Engineering and Technology, Patiala',
    'I. K. Gujral Punjab Technical University (PTU), Jalandhar',
    'Guru Nanak Dev University (GNDU), Amritsar',
    'Punjab Agricultural University, Ludhiana',
    'Lovely Professional University (LPU), Phagwara'
  ],
  'Haryana': [
    'National Institute of Technology (NIT) Kurukshetra, Kurukshetra',
    'Kurukshetra University, Kurukshetra',
    'JC Bose University of Science and Technology (YMCA), Faridabad',
    'Deenbandhu Chhotu Ram University of Science and Technology, Murthal',
    'Maharshi Dayanand University (MDU), Rohtak',
    'Ashoka University, Sonepat',
    'O.P. Jindal Global University, Sonipat'
  ],
  'Madhya Pradesh': [
    'Indian Institute of Technology (IIT) Indore, Indore',
    'Maulana Azad National Institute of Technology (MANIT), Bhopal',
    'Devi Ahilya Vishwavidyalaya (DAVV), Indore',
    'Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV), Bhopal',
    'Shri Govindram Seksaria Institute of Technology and Science (SGSITS), Indore',
    'Jabalpur Engineering College, Jabalpur',
    'PDPM IIITDM Jabalpur, Jabalpur',
    'Amity University Madhya Pradesh, Gwalior'
  ],
  'Bihar': [
    'Indian Institute of Technology (IIT) Patna, Patna',
    'National Institute of Technology (NIT) Patna, Patna',
    'Patna University, Patna',
    'Aryabhatta Knowledge University, Patna',
    'Chanakya National Law University, Patna',
    'Nalanda University, Rajgir',
    'Muzaffarpur Institute of Technology, Muzaffarpur'
  ],
  'Odisha': [
    'Indian Institute of Technology (IIT) Bhubaneswar, Bhubaneswar',
    'National Institute of Technology (NIT) Rourkela, Rourkela',
    'Biju Patnaik University of Technology (BPUT), Rourkela',
    'Utkal University, Bhubaneswar',
    'Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar',
    'Siksha \'O\' Anusandhan (SOA) University, Bhubaneswar',
    'Veer Surendra Sai University of Technology (VSSUT), Burla'
  ],
  'Uttarakhand': [
    'Indian Institute of Technology (IIT) Roorkee, Roorkee',
    'Govind Ballabh Pant University of Agriculture and Technology, Pantnagar',
    'Uttarakhand Technical University, Dehradun',
    'Graphic Era University, Dehradun',
    'University of Petroleum and Energy Studies (UPES), Dehradun',
    'National Institute of Technology (NIT) Uttarakhand, Srinagar'
  ],
  'Assam': [
    'Indian Institute of Technology (IIT) Guwahati, Guwahati',
    'Tezpur University, Tezpur',
    'Gauhati University, Guwahati',
    'National Institute of Technology (NIT) Silchar, Silchar',
    'Assam Engineering College, Guwahati'
  ],
  'Chhattisgarh': [
    'National Institute of Technology (NIT) Raipur, Raipur',
    'Chhattisgarh Swami Vivekanand Technical University (CSVTU), Bhilai',
    'Indian Institute of Technology (IIT) Bhilai, Bhilai',
    'Guru Ghasidas Vishwavidyalaya, Bilaspur',
    'Kalinga University, Raipur'
  ],
  'Jharkhand': [
    'Indian Institute of Technology (IIT ISM) Dhanbad, Dhanbad',
    'National Institute of Technology (NIT) Jamshedpur, Jamshedpur',
    'Birla Institute of Technology (BIT) Mesra, Ranchi',
    'Ranchi University, Ranchi',
    'Birsa Institute of Technology (BIT) Sindri, Dhanbad'
  ],
  'Himachal Pradesh': [
    'Indian Institute of Technology (IIT) Mandi, Mandi',
    'National Institute of Technology (NIT) Hamirpur, Hamirpur',
    'Himachal Pradesh University, Shimla',
    'Jaypee University of Information Technology, Waknaghat'
  ],
  'Jammu & Kashmir': [
    'Indian Institute of Technology (IIT) Jammu, Jammu',
    'National Institute of Technology (NIT) Srinagar, Srinagar',
    'University of Jammu, Jammu',
    'University of Kashmir, Srinagar',
    'Shri Mata Vaishno Devi University (SMVDU), Katra'
  ],
  'Goa': [
    'Birla Institute of Technology and Science (BITS) Pilani (Goa Campus), Zuarinagar',
    'Goa University, Taleigao Plateau',
    'Goa College of Engineering, Farmagudi',
    'Indian Institute of Technology (IIT) Goa, Farmagudi'
  ]
};

const NATIONAL_UNIVERSITIES: string[] = [
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Madras',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Technology (IIT) Kharagpur',
  'Indian Institute of Technology (IIT) Roorkee',
  'Indian Institute of Technology (IIT) Guwahati',
  'Indian Institute of Technology (IIT) Hyderabad',
  'Birla Institute of Technology and Science (BITS) Pilani',
  'Indian Institute of Science (IISc), Bengaluru',
  'National Institute of Technology (NIT) Trichy',
  'National Institute of Technology (NIT) Karnataka',
  'National Institute of Technology (NIT) Calicut',
  'National Institute of Technology (NIT) Warangal',
  'Delhi Technological University (DTU)',
  'Vellore Institute of Technology (VIT), Vellore',
  'SRM Institute of Science and Technology, Chennai',
  'Anna University, Chennai',
  'Jadavpur University, Kolkata',
  'University of Delhi, Delhi',
  'Banaras Hindu University (BHU), Varanasi',
  'Jawaharlal Nehru University (JNU), New Delhi',
  'Symbiosis International University, Pune',
  'Manipal Academy of Higher Education, Manipal',
  'Other Institution'
];

const getUniversitiesForLocation = (locationStr: string): string[] => {
  // Collect ALL universities across every state (deduplicated)
  const allStateUniversities = Array.from(
    new Set(Object.values(STATE_UNIVERSITIES_COLLEGES).flat())
  );
  const everything = Array.from(
    new Set([...allStateUniversities, ...NATIONAL_UNIVERSITIES])
  );

  if (!locationStr) {
    // No location set — show everything, nationals first
    return Array.from(new Set([...NATIONAL_UNIVERSITIES, ...allStateUniversities]));
  }

  // Find if a known state name appears inside the location string
  const matchedState = Object.keys(STATE_UNIVERSITIES_COLLEGES).find(state =>
    locationStr.toLowerCase().includes(state.toLowerCase())
  );

  if (matchedState) {
    // State-specific universities first, then everything else
    const stateList = STATE_UNIVERSITIES_COLLEGES[matchedState];
    const rest = everything.filter(u => !stateList.includes(u));
    return [...stateList, ...rest];
  }

  // Unknown location — still show all
  return everything;
};


const getEducationString = (edu: any): string => {
    if (typeof edu === 'string') return edu;
    if (Array.isArray(edu) && edu.length > 0) {
        const first = edu[0];
        if (first && first.degree) {
            const degreeWithField = first.field_of_study ? `${first.degree} in ${first.field_of_study}` : first.degree;
            return first.institution ? `${degreeWithField} at ${first.institution}` : degreeWithField;
        }
    }
    return '';
};

const EMPTY_STATE: CandidateSettingsBundle = {
    profile: {
        id: '',
        email: '',
        name: '',
        phone: '',
        location: '',
        role: null,
        completed_onboarding: false,
    },
    candidateProfile: getDefaultCandidateProfile(),
};

function getFirstIncompleteStep(data: CandidateSettingsBundle): Step {
    if (!data.profile.name || !data.profile.phone || !data.profile.location) {
        return 1;
    }

    if (!data.candidateProfile.headline || data.candidateProfile.skills.length === 0 || !getEducationString(data.candidateProfile.education).trim()) {
        return 2;
    }

    return 3;
}

export default function CandidateOnboardingPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, refreshUser, updateUser } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<CandidateSettingsBundle>(EMPTY_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);

    const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState('');

    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [isPrefLocationDropdownOpen, setIsPrefLocationDropdownOpen] = useState(false);

    const [selectedDomain, setSelectedDomain] = useState('');
    const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);
    const [rolesSearchQuery, setRolesSearchQuery] = useState('');
    const [customRoleInput, setCustomRoleInput] = useState('');

    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const rolesDropdownRef = useRef<HTMLDivElement>(null);
    const locationDropdownRef = useRef<HTMLDivElement>(null);
    const prefLocationDropdownRef = useRef<HTMLDivElement>(null);
    const skillsDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
                setIsCountryDropdownOpen(false);
            }
            if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target as Node)) {
                setIsRolesDropdownOpen(false);
            }
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
                setIsLocationDropdownOpen(false);
            }
            if (prefLocationDropdownRef.current && !prefLocationDropdownRef.current.contains(event.target as Node)) {
                setIsPrefLocationDropdownOpen(false);
            }
            if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target as Node)) {
                setIsSkillsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const parsePhoneAndHeadline = (phoneRaw: string, headlineRaw: string) => {
        // Parse phone
        let initialPhone = phoneRaw || '';
        let initialCountry = ALL_COUNTRIES[0];
        if (initialPhone.trim().startsWith('00')) {
            initialPhone = '+' + initialPhone.trim().substring(2);
        }
        if (initialPhone.trim().startsWith('+')) {
            const matched = countriesSorted.find(c => initialPhone.trim().startsWith(c.dialCode));
            if (matched) {
                initialCountry = matched;
                initialPhone = initialPhone.trim().substring(matched.dialCode.length).trim();
            }
        }
        setSelectedCountry(initialCountry);

        // Parse headline
        let initialDomain = '';
        let initialRoleQuery = '';
        const headline = headlineRaw || '';
        if (headline) {
            const foundDomain = DETAILED_ROLES.find(d => d.roles.includes(headline));
            if (foundDomain) {
                initialDomain = foundDomain.category;
                initialRoleQuery = headline;
            } else {
                initialDomain = 'Custom / Other';
                initialRoleQuery = headline;
            }
        }
        setSelectedDomain(initialDomain);
        setRolesSearchQuery(initialRoleQuery);

        return { phone: initialPhone };
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (value.trim().startsWith('00')) {
            value = '+' + value.trim().substring(2);
        }
        const cleanNumber = value.trim();
        if (cleanNumber.startsWith('+')) {
            const matched = countriesSorted.find(c => cleanNumber.startsWith(c.dialCode));
            if (matched) {
                setSelectedCountry(matched);
                value = cleanNumber.substring(matched.dialCode.length).trim();
            }
        }
        updateProfile('phone', value);
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

    const handleRoleSelect = (role: string) => {
        updateCandidate('headline', role);
        setRolesSearchQuery(role);
        setIsRolesDropdownOpen(false);
    };

    const handleAddCustomRole = () => {
        const roleToAdd = customRoleInput.trim();
        if (roleToAdd) {
            updateCandidate('headline', roleToAdd);
            setRolesSearchQuery(roleToAdd);
            setIsRolesDropdownOpen(false);
        }
    };

    const handleRoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomRole();
        }
    };

    useEffect(() => {
        if (authLoading || !user) return;

        // 🔥 IMPORTANT: Only fetch if candidate to avoid 401s for admins/recruiters
        if (user.role !== 'candidate') return;

        const fetchProfile = async () => {
            try {
                // ── DB-authoritative gate: redirect immediately if already onboarded ──
                const accessState = await getCandidateAccessState(user.id);
                console.log('[Onboarding] accessState:', accessState);
                if (accessState.completedOnboarding) {
                    console.log('[Onboarding] Completed onboarding, redirecting...');
                    router.replace(`/dashboard/candidate/${user.id}`);
                    return;
                }

                console.log('[Onboarding] Querying profiles for id:', user.id);
                // Fetch directly via client SDK to avoid 10-second Edge Function cold start!
                const { data: profileData, error: profileError } = await insforge.database
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                console.log('[Onboarding] profileData:', profileData, 'profileError:', profileError);

                if (profileError && profileError.code !== 'PGRST116') {
                    throw new Error(profileError.message);
                }

                console.log('[Onboarding] Querying candidate_profiles...');
                const { data: candidateData, error: candidateError } = await insforge.database
                    .from('candidate_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                console.log('[Onboarding] candidateData:', candidateData, 'candidateError:', candidateError);

                // If RLS prevents direct access, candidateError.code will be 42501
                if (candidateError && candidateError.code !== 'PGRST116') {
                    console.warn('Direct candidate query failed, falling back to edge function...', candidateError);
                    
                    const { data: fallbackData, error: fbError } = await invokeFunction('candidate-profile', { method: 'GET' });
                    if (fbError) throw new Error(fbError.message);
                    
                    const parsed = parsePhoneAndHeadline(
                        (fallbackData as any)?.profile?.phone || '',
                        (fallbackData as any)?.candidateProfile?.headline || ''
                    );

                    const normalizedFallback: CandidateSettingsBundle = {
                        profile: {
                            id: (fallbackData as any)?.profile?.id || '',
                            email: (fallbackData as any)?.profile?.email || '',
                            name: (fallbackData as any)?.profile?.name || '',
                            phone: parsed.phone,
                            location: (fallbackData as any)?.profile?.location || '',
                            role: (fallbackData as any)?.profile?.role || null,
                            completed_onboarding: (fallbackData as any)?.profile?.completed_onboarding || false,
                        },
                        candidateProfile: normalizeCandidateProfile((fallbackData as any)?.candidateProfile || EMPTY_STATE.candidateProfile),
                    };
                    setForm(normalizedFallback);
                    setStep(getFirstIncompleteStep(normalizedFallback));
                    return;
                }

                console.log('[Onboarding] Parsing phone and headline...');
                const parsed = parsePhoneAndHeadline(profileData?.phone || '', candidateData?.headline || '');

                console.log('[Onboarding] Combining profile settings bundle...');
                const combinedProfile: CandidateSettingsBundle = {
                    profile: {
                        id: profileData?.id || '',
                        email: profileData?.email || '',
                        name: profileData?.name || '',
                        phone: parsed.phone,
                        location: profileData?.location || '',
                        role: profileData?.role || null,
                        completed_onboarding: profileData?.completed_onboarding || false,
                    },
                    candidateProfile: normalizeCandidateProfile(candidateData || EMPTY_STATE.candidateProfile),
                };

                console.log('[Onboarding] Setting form and step...', combinedProfile);
                setForm(combinedProfile);
                setStep(getFirstIncompleteStep(combinedProfile));
                console.log('[Onboarding] Profile load complete!');
            } catch (err) {
                console.error('[Onboarding] Error inside fetchProfile:', err);
                const message = err instanceof Error ? err.message : 'Failed to load onboarding data';
                setError(message);
            } finally {
                console.log('[Onboarding] Setting isLoading to false');
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user, authLoading, router]);

    const getSkillsForDomain = () => {
        if (selectedDomain && DOMAIN_SKILLS[selectedDomain]) {
            return DOMAIN_SKILLS[selectedDomain];
        }
        return ALL_POPULAR_SKILLS;
    };

    const canContinue = useMemo(() => {
        if (step === 1) {
            return Boolean(form.profile.name?.trim() && form.profile.phone?.trim() && form.profile.location?.trim());
        }

        if (step === 2) {
            return Boolean(
                (form.candidateProfile.headline?.trim() || '') &&
                (form.candidateProfile.skills?.length || 0) > 0 &&
                getEducationString(form.candidateProfile.education).trim()
            );
        }

        return Boolean(
            form.candidateProfile.salary_min !== null &&
            form.candidateProfile.salary_max !== null &&
            form.candidateProfile.preferred_locations.length > 0 &&
            form.candidateProfile.job_types && form.candidateProfile.job_types.length > 0
        );
    }, [form, step]);

    // Step 4 (Documents) is always completable — resume is optional
    const isLastStepReady = step === 4 || canContinue;

    const updateProfile = (field: 'name' | 'phone' | 'location', value: string) => {
        setForm((prev) => ({
            ...prev,
            profile: {
                ...prev.profile,
                [field]: value,
            },
        }));
    };

    const updateCandidate = (field: keyof CandidateSettingsBundle['candidateProfile'], value: unknown) => {
        setForm((prev) => ({
            ...prev,
            candidateProfile: {
                ...prev.candidateProfile,
                [field]: value,
            },
        }));
    };

    const currentEducation = form.candidateProfile.education[0] || { degree: '', institution: '', field_of_study: '' };

    const updateEducationField = (field: 'degree' | 'institution' | 'field_of_study', val: string) => {
        const updatedEntry = {
            ...currentEducation,
            [field]: val,
            id: currentEducation.id || 'edu-primary'
        };
        updateCandidate('education', [updatedEntry]);
    };

    const addSkill = (event: React.FormEvent) => {
        event.preventDefault();
        const nextSkill = skillInput.trim();
        if (!nextSkill || form.candidateProfile.skills.includes(nextSkill)) {
            return;
        }

        updateCandidate('skills', [...form.candidateProfile.skills, nextSkill]);
        setSkillInput('');
        setIsSkillsDropdownOpen(false);
    };

    const removeSkill = (skill: string) => {
        updateCandidate('skills', form.candidateProfile.skills.filter((item) => item !== skill));
    };

    const addLocation = (event: React.FormEvent) => {
        event.preventDefault();
        const nextLocation = locationInput.trim();
        if (!nextLocation || form.candidateProfile.preferred_locations.includes(nextLocation)) {
            return;
        }

        updateCandidate('preferred_locations', [...form.candidateProfile.preferred_locations, nextLocation]);
        setLocationInput('');
        setIsPrefLocationDropdownOpen(false);
    };

    const removeLocation = (location: string) => {
        updateCandidate(
            'preferred_locations',
            form.candidateProfile.preferred_locations.filter((item) => item !== location),
        );
    };

    const [resume, setResume] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleContinue = async () => {
        if (!user) {
            setError('Your session has expired. Please log in again.');
            return;
        }

        if (step < 4) {
            setStep((prev) => (prev + 1) as Step);
            return;
        }

        setIsSaving(true);
        setError('');
        setUploadProgress(0);

        try {
            let finalResumeUrl = form.candidateProfile.resume_url;

            // 1. Upload resume if selected
            if (resume) {
                setUploadProgress(20);
                const path = `${user.id}/${Date.now()}_${resume.name}`;
                const { data: uploadData, error: uploadError } = await insforge.storage
                    .from('resumes')
                    .upload(path, resume);

                if (uploadError) {
                    const msg = (uploadError as any)?.message || String(uploadError);
                    throw new Error(
                        msg.includes('404') || msg.toLowerCase().includes('bucket')
                            ? 'The resume storage bucket is not set up. Please contact support.'
                            : 'Resume upload failed: ' + msg
                    );
                }
                finalResumeUrl = (uploadData as any)?.url || null;
                setUploadProgress(40);


                if (finalResumeUrl) {
                    // Mark any existing resumes as non-default
                    await insforge.database
                        .from('candidate_resumes')
                        .update({ is_default: false })
                        .eq('candidate_id', user.id);

                    const baseName = resume.name.substring(0, resume.name.lastIndexOf('.')) || resume.name;
                    await insforge.database
                        .from('candidate_resumes')
                        .insert([{
                            candidate_id: user.id,
                            label: baseName,
                            file_url: finalResumeUrl,
                            file_name: resume.name,
                            file_size_bytes: resume.size,
                            is_default: true
                        }]);
                }
                setUploadProgress(60);
            }

            // 2. Prepare payload
            const normalizedCP = normalizeCandidateProfile({
                ...form.candidateProfile,
                resume_url: finalResumeUrl,
            });

            const payload = {
                profile: {
                    name: form.profile.name,
                    phone: form.profile.phone ? `${selectedCountry.dialCode} ${form.profile.phone}` : '',
                    location: form.profile.location,
                    bio: form.profile.bio,
                },
                candidateProfile: normalizedCP
            };

            // 3. Save to API via Edge Function
            const { error: saveError } = await invokeFunction('candidate-profile', {
                method: 'PUT',
                body: payload
            });

            if (saveError) throw new Error(saveError.message);

            // Settle saving state BEFORE redirecting client-side
            setIsSaving(false);
            
            // Update auth state so the name and onboarding state syncs instantly
            if (user) {
                updateUser({
                    ...user,
                    name: payload.profile.name,
                    onboarding_completed: true
                });
            }
            
            // Navigate using client-side router.replace() to keep SPA behavior and prevent full reload.
            // Do not call refreshUser() here as it triggers isLoading=true which re-renders the page and aborts the redirect.
            router.replace(`/dashboard/candidate/${user.id}?onboarding_success=true`);
            return;
        } catch (err: any) {
            setError(err.message || 'An error occurred during save');
            setUploadProgress(0);
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className={styles.card}>
            {/* ── Fixed Header ── */}
            <div className={styles.cardHeader}>
                <OnboardingStepper currentStep={step} steps={STEP_LABELS} />
                <div className={styles.header}>
                    <h1 className={styles.title}>{STEP_TITLES[step - 1]}</h1>
                    <p className={styles.subtitle}>{STEP_SUBTITLES[step - 1]}</p>
                </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className={styles.cardBody}>
            {error && (
                <div className={styles.errorBanner}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {step === 1 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Name</label>
                        <input className={styles.optionalInput} value={form.profile.name} onChange={(event) => updateProfile('name', event.target.value)} placeholder="Your full name" />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Phone</label>
                        <div ref={countryDropdownRef} className="relative flex items-center w-full">
                            <div 
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="absolute left-2.5 z-10 flex items-center gap-1 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded border border-slate-200 transition-colors"
                            >
                                <span className="text-base leading-none">{selectedCountry.flag}</span>
                                <span className="text-[11px] font-bold text-slate-700">{selectedCountry.dialCode}</span>
                                <ChevronDown size={10} className="text-slate-500" />
                            </div>

                            <input 
                                type="tel"
                                className={styles.optionalInput} 
                                value={form.profile.phone} 
                                onChange={handlePhoneChange} 
                                placeholder="(555) 000-0000" 
                                style={{ paddingLeft: `${64 + selectedCountry.dialCode.length * 7}px` }}
                            />

                            {isCountryDropdownOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Search country..."
                                        value={countrySearchQuery}
                                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:border-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar col-span-1">
                                        {ALL_COUNTRIES.filter(c => 
                                            c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                            c.dialCode.includes(countrySearchQuery) ||
                                            c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                                        ).map(c => (
                                            <div
                                                key={c.code}
                                                onClick={() => handleCountrySelect(c)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 ${selectedCountry.code === c.code ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
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
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">
                                Detected: {selectedCountry.name} {selectedCountry.flag}
                            </div>
                        )}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Location</label>
                        <div ref={locationDropdownRef} className="relative w-full">
                            <input 
                                className={styles.optionalInput} 
                                value={form.profile.location} 
                                onChange={(event) => {
                                    updateProfile('location', event.target.value);
                                    setLocationSearchQuery(event.target.value);
                                    setIsLocationDropdownOpen(true);
                                }}
                                onFocus={() => {
                                    setLocationSearchQuery(form.profile.location);
                                    setIsLocationDropdownOpen(true);
                                }}
                                placeholder="Search city in India (e.g. Bengaluru, Mumbai)..." 
                            />
                            {isLocationDropdownOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
                                    {locationSearchQuery.trim() && !INDIAN_CITIES.some(c => c.toLowerCase() === locationSearchQuery.toLowerCase().trim()) && (
                                        <div
                                            onClick={() => {
                                                updateProfile('location', locationSearchQuery.trim());
                                                setIsLocationDropdownOpen(false);
                                            }}
                                            className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold border border-dashed border-blue-200 transition-colors"
                                        >
                                            <span>Use custom: &ldquo;{locationSearchQuery}&rdquo;</span>
                                            <span>+</span>
                                        </div>
                                    )}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                                    ).map(city => (
                                        <div
                                            key={city}
                                            onClick={() => {
                                                updateProfile('location', city);
                                                setIsLocationDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 transition-colors ${form.profile.location === city ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                                        >
                                            <span>{city}</span>
                                            {form.profile.location === city && <span className="text-blue-600">✓</span>}
                                        </div>
                                    ))}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                                    ).length === 0 && !locationSearchQuery.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">Type to search Indian cities...</div>
                                    )}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                                    ).length === 0 && locationSearchQuery.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">No matching Indian cities found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Professional Domain</label>
                        <CustomSelect
                            className={styles.optionalInput}
                            value={selectedDomain}
                            onChange={handleDomainChange}
                            options={DOMAIN_OPTIONS}
                            placeholder="Select Professional Domain"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Headline / Specialization</label>
                        <div ref={rolesDropdownRef} className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
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
                                                ? "Type custom headline..."
                                                : `Search roles in ${selectedDomain}...`
                                        }
                                        className={`${styles.optionalInput} disabled:opacity-60 disabled:cursor-not-allowed`}
                                    />
                                </div>
                                {rolesSearchQuery.trim() && selectedDomain && (
                                    <button
                                        type="button"
                                        onClick={handleAddCustomRole}
                                        className={styles.addBtn}
                                    >
                                        Set
                                    </button>
                                )}
                            </div>

                            {isRolesDropdownOpen && selectedDomain && (
                                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 space-y-2 no-scrollbar">
                                    {rolesSearchQuery.trim() && (
                                        <div
                                            onClick={handleAddCustomRole}
                                            className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold transition-all border border-dashed border-blue-200"
                                        >
                                            <span className="truncate">Set custom: &ldquo;{rolesSearchQuery}&rdquo;</span>
                                            <span className="text-xs shrink-0">+</span>
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
                                                            const isSelected = form.candidateProfile.headline === role;
                                                            return (
                                                                <div
                                                                    key={role}
                                                                    onClick={() => handleRoleSelect(role)}
                                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-all ${
                                                                        isSelected 
                                                                            ? 'bg-blue-600 text-white font-bold' 
                                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                                                                    }`}
                                                                >
                                                                    <span className="truncate">{role}</span>
                                                                    {isSelected && <span className="text-white">✓</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="text-xs text-slate-400 p-2 text-center">
                                                    No matching roles found. Click &apos;Set&apos; or press Enter to use &ldquo;{rolesSearchQuery}&rdquo; as custom.
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            )}
                        </div>
                        {form.candidateProfile.headline && (
                            <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                                <span>Current Headline:</span>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md font-bold text-[11px] inline-block">
                                    {form.candidateProfile.headline}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Skills</label>
                        <div className={styles.tagWrap}>
                            {form.candidateProfile.skills.map((skill) => (
                                <span key={skill} className={`${styles.tag} ${styles.tagSelected}`}>
                                    {skill}
                                    <button type="button" className={styles.removeTag} onClick={() => removeSkill(skill)}>x</button>
                                </span>
                            ))}
                        </div>
                        <div ref={skillsDropdownRef} className="relative w-full">
                            <form onSubmit={addSkill} className={styles.customField}>
                                <input 
                                    className={styles.optionalInput} 
                                    value={skillInput} 
                                    onChange={(event) => {
                                        setSkillInput(event.target.value);
                                        setIsSkillsDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsSkillsDropdownOpen(true);
                                    }}
                                    placeholder="Search and add skills..." 
                                />
                                <button type="submit" className={styles.addBtn} disabled={!skillInput.trim()}>Add</button>
                            </form>
                            {isSkillsDropdownOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
                                    {skillInput.trim() && !form.candidateProfile.skills.includes(skillInput.trim()) && (
                                        <div
                                            onClick={() => {
                                                const next = skillInput.trim();
                                                if (next && !form.candidateProfile.skills.includes(next)) {
                                                    updateCandidate('skills', [...form.candidateProfile.skills, next]);
                                                }
                                                setSkillInput('');
                                                setIsSkillsDropdownOpen(false);
                                            }}
                                            className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold border border-dashed border-blue-200 transition-colors"
                                        >
                                            <span>Add custom: &ldquo;{skillInput}&rdquo;</span>
                                            <span>+</span>
                                        </div>
                                    )}
                                    {getSkillsForDomain().filter(skill => 
                                        skill.toLowerCase().includes(skillInput.toLowerCase())
                                    ).map(skill => {
                                        const isAlreadySelected = form.candidateProfile.skills.includes(skill);
                                        return (
                                            <div
                                                key={skill}
                                                onClick={() => {
                                                    if (!isAlreadySelected) {
                                                        updateCandidate('skills', [...form.candidateProfile.skills, skill]);
                                                    } else {
                                                        updateCandidate('skills', form.candidateProfile.skills.filter(item => item !== skill));
                                                    }
                                                    setSkillInput('');
                                                    setIsSkillsDropdownOpen(false);
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 transition-colors ${isAlreadySelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                                            >
                                                <span>{skill}</span>
                                                {isAlreadySelected && <span className="text-blue-600">✓</span>}
                                            </div>
                                        );
                                    })}
                                    {getSkillsForDomain().filter(skill => 
                                        skill.toLowerCase().includes(skillInput.toLowerCase())
                                    ).length === 0 && !skillInput.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">Type to search skills...</div>
                                    )}
                                    {getSkillsForDomain().filter(skill => 
                                        skill.toLowerCase().includes(skillInput.toLowerCase())
                                    ).length === 0 && skillInput.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">No matching skills found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Experience (Years)</label>
                        <CustomSelect
                            className={styles.optionalInput}
                            value={
                                form.candidateProfile.experience_years === null || form.candidateProfile.experience_years === undefined
                                    ? ''
                                    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(form.candidateProfile.experience_years as number)
                                    ? String(form.candidateProfile.experience_years)
                                    : 'custom'
                            }
                            onChange={(e: any) => {
                                const val = e.target.value;
                                if (val === 'custom') {
                                    updateCandidate('experience_years', 1.5);
                                } else {
                                    updateCandidate('experience_years', val === '' ? null : Number(val));
                                }
                            }}
                            options={EXPERIENCE_OPTIONS}
                            placeholder="Select experience level"
                        />
                    </div>
                    {(form.candidateProfile.experience_years !== null && form.candidateProfile.experience_years !== undefined &&
                      ![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(form.candidateProfile.experience_years as number)) && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Specify Custom Experience (Years in decimals)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                className={styles.optionalInput}
                                value={String(form.candidateProfile.experience_years)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    updateCandidate('experience_years', val === '' ? null : Number(val));
                                }}
                                placeholder="e.g. 1.5"
                            />
                        </div>
                    )}
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Highest Education Degree</label>
                        <CustomSelect
                            className={styles.optionalInput}
                            value={currentEducation.degree || ''}
                            onChange={(e) => updateEducationField('degree', e.target.value)}
                            options={INDIAN_DEGREES}
                            placeholder="Select highest degree"
                        />
                    </div>
                    {currentEducation.degree && (
                        <>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Specialization / Field of Study</label>
                                <CustomSelect
                                    className={styles.optionalInput}
                                    value={
                                        FIELDS_OF_STUDY.includes(currentEducation.field_of_study || '') || !currentEducation.field_of_study
                                            ? currentEducation.field_of_study || ''
                                            : 'Other Field of Study'
                                    }
                                    onChange={(e: any) => {
                                        const val = e.target.value;
                                        updateEducationField('field_of_study', val === 'Other Field of Study' ? '' : val);
                                    }}
                                    options={FIELDS_OF_STUDY}
                                    placeholder="Select specialization"
                                />
                            </div>
                            {(currentEducation.field_of_study === 'Other Field of Study' || 
                              (currentEducation.field_of_study && !FIELDS_OF_STUDY.includes(currentEducation.field_of_study))) && (
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Specify Specialization / Field of Study</label>
                                    <input
                                        type="text"
                                        className={styles.optionalInput}
                                        value={currentEducation.field_of_study === 'Other Field of Study' ? '' : currentEducation.field_of_study}
                                        onChange={(e) => updateEducationField('field_of_study', e.target.value)}
                                        placeholder="e.g. Artificial Intelligence, Mechatronics"
                                    />
                                </div>
                            )}

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>College / University / School</label>
                                <CustomSelect
                                    className={styles.optionalInput}
                                    value={
                                        getUniversitiesForLocation(form.profile.location).includes(currentEducation.institution || '') || !currentEducation.institution
                                            ? currentEducation.institution || ''
                                            : 'Other Institution'
                                    }
                                    onChange={(e: any) => {
                                        const val = e.target.value;
                                        updateEducationField('institution', val === 'Other Institution' ? '' : val);
                                    }}
                                    options={getUniversitiesForLocation(form.profile.location)}
                                    placeholder="Select college / university"
                                />
                            </div>
                            {(currentEducation.institution === 'Other Institution' || 
                              (currentEducation.institution && !getUniversitiesForLocation(form.profile.location).includes(currentEducation.institution))) && (
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Specify Custom College / University / School</label>
                                    <input
                                        type="text"
                                        className={styles.optionalInput}
                                        value={currentEducation.institution === 'Other Institution' ? '' : currentEducation.institution}
                                        onChange={(e) => updateEducationField('institution', e.target.value)}
                                        placeholder="e.g. Sharda University, LPU"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className={styles.section}>
                    {form.candidateProfile.resume_url && (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.75rem 0.85rem', fontSize: '0.78rem', color: '#1d4ed8' }}>
                            Resume detected on your profile. If headline or skills were empty, we auto-filled lightweight suggestions from it.
                        </div>
                    )}
                    <div className={styles.salaryGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Salary Min (₹ per year)</label>
                            <CustomSelect
                                className={styles.optionalInput}
                                value={form.candidateProfile.salary_min !== null && form.candidateProfile.salary_min !== undefined ? String(form.candidateProfile.salary_min) : ''}
                                onChange={(e: any) => updateCandidate('salary_min', e.target.value === '' ? null : Number(e.target.value))}
                                options={[
                                    { label: '₹1,00,000',     value: '100000'  },
                                    { label: '₹1,50,000',     value: '150000'  },
                                    { label: '₹2,00,000',     value: '200000'  },
                                    { label: '₹2,50,000',     value: '250000'  },
                                    { label: '₹3,00,000',     value: '300000'  },
                                    { label: '₹3,50,000',     value: '350000'  },
                                    { label: '₹4,00,000',     value: '400000'  },
                                    { label: '₹5,00,000',     value: '500000'  },
                                    { label: '₹6,00,000',     value: '600000'  },
                                    { label: '₹7,00,000',     value: '700000'  },
                                    { label: '₹8,00,000',     value: '800000'  },
                                    { label: '₹10,00,000',    value: '1000000' },
                                    { label: '₹12,00,000',    value: '1200000' },
                                    { label: '₹15,00,000',    value: '1500000' },
                                    { label: '₹20,00,000',    value: '2000000' },
                                    { label: '₹25,00,000',    value: '2500000' },
                                    { label: '₹30,00,000',    value: '3000000' },
                                    { label: '₹50,00,000',    value: '5000000' },
                                    { label: '₹1,00,00,000+', value: '10000000'},
                                ]}
                                placeholder="Select minimum"
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Salary Max (₹ per year)</label>
                            <CustomSelect
                                className={styles.optionalInput}
                                value={form.candidateProfile.salary_max !== null && form.candidateProfile.salary_max !== undefined ? String(form.candidateProfile.salary_max) : ''}
                                onChange={(e: any) => updateCandidate('salary_max', e.target.value === '' ? null : Number(e.target.value))}
                                options={[
                                    { label: '₹1,50,000',     value: '150000'  },
                                    { label: '₹2,00,000',     value: '200000'  },
                                    { label: '₹2,50,000',     value: '250000'  },
                                    { label: '₹3,00,000',     value: '300000'  },
                                    { label: '₹3,50,000',     value: '350000'  },
                                    { label: '₹4,00,000',     value: '400000'  },
                                    { label: '₹5,00,000',     value: '500000'  },
                                    { label: '₹6,00,000',     value: '600000'  },
                                    { label: '₹7,00,000',     value: '700000'  },
                                    { label: '₹8,00,000',     value: '800000'  },
                                    { label: '₹10,00,000',    value: '1000000' },
                                    { label: '₹12,00,000',    value: '1200000' },
                                    { label: '₹15,00,000',    value: '1500000' },
                                    { label: '₹20,00,000',    value: '2000000' },
                                    { label: '₹25,00,000',    value: '2500000' },
                                    { label: '₹30,00,000',    value: '3000000' },
                                    { label: '₹50,00,000',    value: '5000000' },
                                    { label: '₹75,00,000',    value: '7500000' },
                                    { label: '₹1,00,00,000',  value: '10000000'},
                                    { label: '₹1.5 Cr+',      value: '15000000'},
                                ]}
                                placeholder="Select maximum"
                            />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Preferred Locations</label>
                        <div className={styles.tagWrap}>
                            {form.candidateProfile.preferred_locations.map((location) => (
                                <span key={location} className={`${styles.tag} ${styles.tagSelected}`}>
                                    {location}
                                    <button type="button" className={styles.removeTag} onClick={() => removeLocation(location)}>x</button>
                                </span>
                            ))}
                        </div>
                        <div ref={prefLocationDropdownRef} className="relative w-full">
                            <form onSubmit={addLocation} className={styles.customField}>
                                <input 
                                    className={styles.optionalInput} 
                                    value={locationInput} 
                                    onChange={(event) => {
                                        setLocationInput(event.target.value);
                                        setIsPrefLocationDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsPrefLocationDropdownOpen(true);
                                    }}
                                    placeholder="Search and add preferred cities..." 
                                />
                                <button type="submit" className={styles.addBtn} disabled={!locationInput.trim()}>Add</button>
                            </form>
                            {isPrefLocationDropdownOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
                                    {locationInput.trim() && !form.candidateProfile.preferred_locations.includes(locationInput.trim()) && (
                                        <div
                                            onClick={() => {
                                                const next = locationInput.trim();
                                                if (next && !form.candidateProfile.preferred_locations.includes(next)) {
                                                    updateCandidate('preferred_locations', [...form.candidateProfile.preferred_locations, next]);
                                                }
                                                setLocationInput('');
                                                setIsPrefLocationDropdownOpen(false);
                                            }}
                                            className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold border border-dashed border-blue-200 transition-colors"
                                        >
                                            <span>Add custom: &ldquo;{locationInput}&rdquo;</span>
                                            <span>+</span>
                                        </div>
                                    )}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationInput.toLowerCase())
                                    ).map(city => {
                                        const isAlreadySelected = form.candidateProfile.preferred_locations.includes(city);
                                        return (
                                            <div
                                                key={city}
                                                onClick={() => {
                                                    if (!isAlreadySelected) {
                                                        updateCandidate('preferred_locations', [...form.candidateProfile.preferred_locations, city]);
                                                    } else {
                                                        updateCandidate('preferred_locations', form.candidateProfile.preferred_locations.filter(item => item !== city));
                                                    }
                                                    setLocationInput('');
                                                    setIsPrefLocationDropdownOpen(false);
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 transition-colors ${isAlreadySelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                                            >
                                                <span>{city}</span>
                                                {isAlreadySelected && <span className="text-blue-600">✓</span>}
                                            </div>
                                        );
                                    })}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationInput.toLowerCase())
                                    ).length === 0 && !locationInput.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">Type to search Indian cities...</div>
                                    )}
                                    {INDIAN_CITIES.filter(city => 
                                        city.toLowerCase().includes(locationInput.toLowerCase())
                                    ).length === 0 && locationInput.trim() && (
                                        <div className="text-center py-3 text-xs text-slate-400">No matching Indian cities found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Job Type</label>
                        <CustomSelect 
                            className={styles.optionalInput} 
                            value={form.candidateProfile.job_types?.[0] || ''} 
                            onChange={(event) => updateCandidate('job_types', [event.target.value])}
                            options={JOB_TYPES}
                            placeholder="Select job type"
                        />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className={styles.section}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Resume (PDF only)</label>
                        <ResumeUploader
                            onUpload={(f) => setResume(f)}
                            onClear={() => {
                                setResume(null);
                                updateCandidate('resume_url', '');
                            }}
                            existingUrl={form.candidateProfile.resume_url ?? undefined}
                        />
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Online Presence</h3>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>LinkedIn URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://linkedin.com/in/username"
                                value={form.candidateProfile.linkedin_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, linkedin_url: e.target.value }
                                })}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>GitHub URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://github.com/username"
                                value={form.candidateProfile.github_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, github_url: e.target.value }
                                })}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Portfolio URL</label>
                            <input
                                type="url"
                                className={styles.optionalInput}
                                placeholder="https://yourportfolio.com"
                                value={form.candidateProfile.portfolio_url || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    candidateProfile: { ...form.candidateProfile, portfolio_url: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                </div>
            )}
            </motion.div>
            </AnimatePresence>
            </div>{/* end cardBody */}

            {/* ── Fixed Footer ── */}
            <div className={styles.cardFooter}>
                <div className={styles.actions}>
                    <button className={styles.backBtn} onClick={() => setStep((prev) => (prev - 1) as Step)} disabled={step === 1 || isSaving} type="button">
                        ← Back
                    </button>
                    <button className={styles.nextBtn} onClick={handleContinue} disabled={!isLastStepReady || isSaving} type="button">
                        {isSaving ? (
                            <><div className={styles.spinner} /><span>Saving...</span></>
                        ) : step === 4 ? (
                            'Finish Setup ✓'
                        ) : (
                            'Continue →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
