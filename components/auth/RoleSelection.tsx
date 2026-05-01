'use client';

import React, { useState } from 'react';
import { UserRound, Building2, ArrowRight, TrendingUp, Briefcase, Users, Globe, ArrowLeft, CalendarDays } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: 'candidate' | 'recruiter', variant?: 'call' | 'application') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  const [showRecruiterOptions, setShowRecruiterOptions] = useState(false);

  if (showRecruiterOptions) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => setShowRecruiterOptions(false)}
          className="flex items-center gap-2 text-slate-500 font-semibold hover:text-slate-900 transition-colors mb-8 self-start group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to main selection</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            How would you like to <span className="text-gradient">Hire</span>?
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-md mx-auto">
            Select the solution that fits your company size and needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Book a Call Card */}
          <button
            onClick={() => onSelect('recruiter', 'call')}
            className="group relative flex flex-col items-start text-left p-6 md:p-7 rounded-3xl bg-white border-2 border-slate-100 hover:border-slate-900 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <CalendarDays size={100} />
            </div>
            
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <CalendarDays size={24} />
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Book a Discovery Call</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
              New to TalentMesh? Schedule a 15-min call to see how our AI-powered sourcing can transform your hiring.
            </p>
            
            <div className="flex items-center gap-2 font-bold text-slate-900 group-hover:gap-4 transition-all">
              <span>Schedule Call</span>
              <ArrowRight size={20} />
            </div>
          </button>

          {/* Apply for Access Card */}
          <button
            onClick={() => onSelect('recruiter', 'application')}
            className="group relative flex flex-col items-start text-left p-6 md:p-7 rounded-3xl bg-white border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase size={100} />
            </div>
            
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Briefcase size={24} />
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Apply for Access</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
              Ready to start hiring? Submit your details to request an invitation to our exclusive recruiter ecosystem.
            </p>
            
            <div className="flex items-center gap-2 font-bold text-blue-600 group-hover:gap-4 transition-all">
              <span>Start Application</span>
              <ArrowRight size={20} />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Join <span className="text-gradient">TalentMesh</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Choose the path that best describes your current journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Candidate Card */}
        <button
          onClick={() => onSelect('candidate')}
          className="group relative flex flex-col items-start text-left p-6 md:p-7 rounded-3xl bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={100} />
          </div>
          
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform duration-300">
            <UserRound size={24} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">I&apos;m a Candidate</h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
            Create your profile and get matched with top opportunities tailored to your skills and career goals.
          </p>
          
          <div className="flex items-center gap-2 font-bold text-blue-600 group-hover:gap-4 transition-all">
            <span>Create My Profile</span>
            <ArrowRight size={20} />
          </div>
        </button>
 
        {/* Recruiter Card */}
        <button
          onClick={() => setShowRecruiterOptions(true)}
          className="group relative flex flex-col items-start text-left p-6 md:p-7 rounded-3xl bg-white border-2 border-slate-100 hover:border-slate-900 hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Briefcase size={100} />
          </div>
          
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 mb-5 group-hover:scale-110 transition-transform duration-300">
            <Building2 size={24} />
          </div>
          
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">I&apos;m Hiring</h2>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
            Tell us your hiring needs and get access to curated talent. We help you find the perfect fit faster.
          </p>
          
          <div className="flex items-center gap-2 font-bold text-slate-900 group-hover:gap-4 transition-all">
            <span>Choose Hiring Path</span>
            <ArrowRight size={20} />
          </div>
        </button>
      </div>

      <div className="mt-12 text-center text-slate-400 text-sm">
        Already have an account? <a href="/login" className="text-blue-600 font-semibold hover:underline">Log in</a>
      </div>
    </div>
  );
};

export default RoleSelection;
