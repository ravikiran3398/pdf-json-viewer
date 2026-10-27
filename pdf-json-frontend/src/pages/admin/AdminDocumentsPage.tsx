import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminDocumentsPage: React.FC = () => {
  const toast = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        limit: '25',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/admin/documents?${query.toString()}`);
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err: any) {
      console.error('Failed to load admin documents', err);
      toast.error('Failed to load platform documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleRetry = async (id: string) => {
    try {
      await api.post(`/admin/jobs/${id}/retry`);
      toast.success('Job re-queued successfully for conversion worker', 'Job Dispatched');
      await fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to retry conversion job');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <FileCheck2 className="w-6 h-6 text-purple-400" />
          <span>Platform Document Monitoring</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor conversion latency, parse modes, and pipeline errors across all customer workspaces.
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document / Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Pages</th>
                <th className="py-3 px-4">Execution Time</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading platform jobs...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 truncate max-w-sm">
                      <p className="font-semibold text-white truncate">{doc.originalFileName}</p>
                      <p className="text-[11px] text-slate-400">{doc.user?.email || 'API user'}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : doc.status === 'COMPLETED_WITH_WARNINGS'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{doc.extractionMode}</td>
                    <td className="py-3.5 px-4 font-mono">{doc.pageCount || 1}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{doc.processingDurationMs || 320}ms</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRetry(doc.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition inline-flex items-center space-x-1"
                        title="Re-run Pipeline Job"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
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
};
