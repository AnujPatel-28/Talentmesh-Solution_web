import React, { useState, useRef, useEffect } from 'react';
import styles from '../../../../shared-dashboard.module.css';
import SectionStatus from './SectionStatus';

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

interface SkillsSectionProps {
  skills?: string[] | null;
  isEditing: boolean;
  onUpdate: (skills: string[]) => void;
  headline?: string;
}

export default React.memo(function SkillsSection({
  skills = [],
  isEditing,
  onUpdate,
  headline = ''
}: SkillsSectionProps) {
  
  const skillList = skills || [];
  const isComplete = skillList.length >= 5;
  const tier = skillList.length <= 2 ? 'warning' : skillList.length >= 5 ? 'strong' : 'neutral';

  const [skillInput, setSkillInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine domain list based on candidate headline
  const detectedDomain = React.useMemo(() => {
    if (!headline) return '';
    const match = DETAILED_ROLES.find(d => d.roles.includes(headline));
    return match ? match.category : '';
  }, [headline]);

  const availableSkills = React.useMemo(() => {
    if (detectedDomain && DOMAIN_SKILLS[detectedDomain]) {
      return DOMAIN_SKILLS[detectedDomain];
    }
    return ALL_POPULAR_SKILLS;
  }, [detectedDomain]);

  const filteredSuggestions = React.useMemo(() => {
    const normalizedQuery = skillInput.toLowerCase().trim();
    return availableSkills.filter(s => 
      s.toLowerCase().includes(normalizedQuery)
    );
  }, [availableSkills, skillInput]);

  const addSkill = (name: string) => {
    const clean = name.trim();
    if (clean && !skillList.includes(clean) && skillList.length < 15) {
      onUpdate([...skillList, clean]);
    }
    setSkillInput('');
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.profileSection} id="skills">
      <SectionStatus 
        title={isEditing ? `Skills (${skillList.length}/15)` : "Skills"} 
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} 
        count={isEditing ? undefined : skillList.length}
        isComplete={isComplete} 
        required={true}
      />

      <div className={styles.skillsTagEditor}>
        {skillList.map(skill => (
          <span key={skill} className={styles.skillBadge} data-tier={tier}>
            {skill}
            {isEditing && (
              <button 
                type="button" 
                onClick={() => {
                  const updated = skillList.filter(s => s !== skill);
                  onUpdate(updated);
                }}
                className={styles.skillRemoveBtn}
                aria-label={`Remove ${skill}`}
              >×</button>
            )}
          </span>
        ))}
        
        {isEditing && (
          <div ref={dropdownRef} className="relative w-full mt-2">
            <div className={styles.skillInputWrapper}>
              <input
                className={`${styles.formInput} ${styles.skillInput}`}
                placeholder={skillList.length >= 15 ? "Skill limit reached" : "Search and add skills..."}
                disabled={skillList.length >= 15}
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (skillInput.trim()) {
                      addSkill(skillInput);
                    }
                  }
                }}
              />
              {skillList.length >= 15 && (
                <span className={styles.skillLimitText}>
                  You've added 15 skills — that's the maximum.
                </span>
              )}
            </div>

            {isDropdownOpen && skillList.length < 15 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
                {skillInput.trim() && !skillList.includes(skillInput.trim()) && (
                  <div
                    onClick={() => addSkill(skillInput)}
                    className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-xs text-blue-600 font-bold border border-dashed border-blue-200 transition-colors"
                  >
                    <span>Add custom: &ldquo;{skillInput}&rdquo;</span>
                    <span>+</span>
                  </div>
                )}
                {filteredSuggestions.map(s => {
                  const isAlreadySelected = skillList.includes(s);
                  return (
                    <div
                      key={s}
                      onClick={() => addSkill(s)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs hover:bg-slate-50 transition-colors ${isAlreadySelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700'}`}
                    >
                      <span>{s}</span>
                      {isAlreadySelected && <span className="text-blue-600">✓</span>}
                    </div>
                  );
                })}
                {filteredSuggestions.length === 0 && !skillInput.trim() && (
                  <div className="text-center py-3 text-xs text-slate-400">Type to search skills...</div>
                )}
                {filteredSuggestions.length === 0 && skillInput.trim() && (
                  <div className="text-center py-3 text-xs text-slate-400">No matching skills found. Press Enter to add.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!isEditing && skillList.length === 0 && (
        <p className={styles.emptySectionText}>
          No skills added yet. Click <strong>Edit Profile</strong> to add some skills.
        </p>
      )}
    </div>
  );
});
