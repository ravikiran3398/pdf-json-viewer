import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminEnquiriesPage: React.FC = () => {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/enquiries');
      if (res.data.success) {
        setEnquiries(res.data.enquiries);
      }
    } catch (err: any) {
      console.error('Failed to load inquiries', err);
      toast.error('Failed to load enterprise inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/enquiries/${id}`, { status });
      toast.success(`Enquiry marked as ${status}`, 'Status Updated');
      await fetchEnquiries();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update enquiry status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-purple-400" />
          <span>Enterprise Leads & Enquiries</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Prospective enterprise customers requesting dedicated VPCs, high-throughput workers, and custom contracts.
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading enterprise leads...</div>
          ) : enquiries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No enterprise inquiries received yet.</div>
          ) : (
            enquiries.map((e) => (
              <div key={e.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition text-xs">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{e.companyName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                      {e.status}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Contact: <strong className="text-white">{e.contactName}</strong> ({e.email} {e.phone ? `· ${e.phone}` : ''})
                  </p>
                  <p className="text-slate-400 font-mono text-[11px]">Volume: {e.estimatedVolume}</p>
                  <p className="text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] mt-2">
                    "{e.requirements}"
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  <select
                    value={e.status}
                    onChange={(evt) => handleUpdateStatus(e.id, evt.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs outline-none font-semibold"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
