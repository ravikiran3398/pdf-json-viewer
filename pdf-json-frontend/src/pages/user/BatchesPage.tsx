import React, { useState, useEffect } from 'react';
import { Files, Plus, Download, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { ProcessingBatch } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const BatchesPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBatchName, setNewBatchName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batches');
      if (res.data.success) {
        setBatches(res.data.batches);
      }
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName) return;
    setCreating(true);

    try {
      const res = await api.post('/batches', { name: newBatchName, totalDocuments: 5 });
      if (res.data.success) {
        toast.success(`Batch "${newBatchName}" created successfully`, 'Batch Created');
        setNewBatchName('');
        await fetchBatches();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Files className="w-6 h-6 text-brand-400" />
          <span>{t('batches.title', 'Batch Processing & Multi-File Ingestion')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('batches.subtitle', 'Group multiple PDF documents into batches with combined status tracking and consolidated JSON exports.')}
        </p>
      </div>

      {/* Create New Batch Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3">{t('batches.create', 'Initialize Processing Batch')}</h3>
        <form onSubmit={handleCreateBatch} className="flex gap-3">
          <input
            type="text"
            value={newBatchName}
            onChange={(e) => setNewBatchName(e.target.value)}
            placeholder={t('batches.namePlaceholder', 'Enter batch name (e.g. October Vendor Invoices Batch #1)...')}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-brand-500 outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newBatchName}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{t('batches.submit', 'Create Batch')}</span>
          </button>
        </form>
      </div>

      {/* Batches List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">{t('batches.title', 'Active & Completed Batches')}</h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">{t('common.loading', 'Loading batches...')}</div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Files className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p>{t('batches.empty', 'No batches created yet. Create a batch above to group conversions.')}</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{batch.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {batch.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {batch.completedCount} / {batch.totalDocuments} {t('dashboard.docName', 'documents')} · {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`/api/v1/batches/${batch.id}/export`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('batches.exportZip', 'Export Combined JSON')}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
