import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  ExternalLink,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { DocumentItem } from '../../types/index.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const DocumentsPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/documents?${query.toString()}`);
      if (res.data.success) {
        setDocuments(res.data.documents);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`Permanently deleted "${deleteTarget.name}"`, 'Document Removed');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{t('documents.title', 'Documents Vault')}</h2>
          <p className="text-xs text-slate-400 mt-1">{t('documents.subtitle', 'Search, inspect, edit, and export all converted PDF files')}</p>
        </div>

        <Link
          to="/app/upload"
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t('documents.upload', 'Upload PDF')}</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('documents.searchPlaceholder', 'Search documents by filename...')}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-brand-500 outline-none transition"
          />
        </form>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
          >
            <option value="">{t('documents.allStatuses', 'All Statuses')}</option>
            <option value="COMPLETED">{t('dashboard.completed', 'Completed')}</option>
            <option value="COMPLETED_WITH_WARNINGS">{t('dashboard.warnings', 'Warnings')}</option>
            <option value="PROCESSING">{t('dashboard.processing', 'Processing')}</option>
            <option value="FAILED">{t('dashboard.failed', 'Failed')}</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('dashboard.docName', 'Document Name')}</th>
                <th className="py-3 px-4">{t('dashboard.status', 'Status')}</th>
                <th className="py-3 px-4">{t('dashboard.mode', 'Mode')}</th>
                <th className="py-3 px-4">{t('documents.fileSize', 'File Size')}</th>
                <th className="py-3 px-4">{t('dashboard.pagesCol', 'Pages')}</th>
                <th className="py-3 px-4">{t('documents.createdDate', 'Created Date')}</th>
                <th className="py-3 px-4 text-right">{t('dashboard.action', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    <p className="text-sm font-medium">No documents found matching criteria</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 flex items-center space-x-2.5 truncate max-w-sm">
                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="font-medium text-slate-200 hover:text-brand-400 transition truncate"
                      >
                        {doc.originalFileName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : doc.status === 'COMPLETED_WITH_WARNINGS' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Warnings</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Processing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {doc.extractionMode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{doc.pageCount || 1}</td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/app/documents/${doc.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white transition"
                          title="Open PDF-to-JSON Workspace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget({ id: doc.id, name: doc.originalFileName })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Document & JSON"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.name}"? This will delete the PDF vault file and all associated JSON extraction versions.`
            : ''
        }
        confirmLabel="Delete Permanently"
        cancelLabel="Keep File"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
