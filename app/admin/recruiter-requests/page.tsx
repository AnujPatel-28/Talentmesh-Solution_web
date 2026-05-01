'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Mail, Phone, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';

interface AccessRequest {
  id: string;
  full_name: string;
  company_name: string;
  work_email: string;
  industry: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  request_type: string;
}

export default function AdminRecruiterRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error: fetchError } = await insforge.functions.invoke('admin-recruiter', {
        body: { action: 'list' }
      });
      if (fetchError) throw new Error(fetchError.message);
      setRequests(data?.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const { error: approveError } = await insforge.functions.invoke('admin-recruiter', {
        body: { action: 'approve', requestId: id }
      });
      if (approveError) throw new Error(approveError.message);
      
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading requests...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Recruiter Access Requests</h1>
            <p className="text-slate-500 mt-2">Manage and approve new recruiter signups</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
            {requests.filter(r => r.status === 'pending').length} Pending
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No requests found</td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{request.company_name}</span>
                        <span className="text-xs text-slate-400">{request.industry}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{request.full_name}</span>
                        <span className="text-xs text-slate-500">{request.work_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        request.request_type === 'discovery_call' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {request.request_type === 'discovery_call' ? 'Call' : 'Access'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                        {request.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                        {request.status === 'rejected' && <XCircle size={16} className="text-red-500" />}
                        <span className={`text-sm font-semibold capitalize ${
                          request.status === 'pending' ? 'text-amber-600' :
                          request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          {actionLoading === request.id ? '...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
