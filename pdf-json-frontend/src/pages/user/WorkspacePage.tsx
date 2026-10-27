import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Download,
  Save,
  RefreshCw,
  Clock,
  Sparkles,
  FileCode,
  Share2,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { DocumentItem, ExtractionResult } from '../../types/index.js';
import { PdfViewer } from '../../components/pdf/PdfViewer.js';
import { JsonEditor } from '../../components/json-editor/JsonEditor.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setDocument(res.data.document);
        setCurrentResult(res.data.document.latestResult || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const handleSaveResult = async (updatedData: Record<string, any>) => {
    if (!id) return;
    setSaving(true);
    setSaveNotification(null);

    try {
      const res = await api.patch(`/documents/${id}/result`, {
        data: updatedData,
      });

      if (res.data.success) {
        setCurrentResult(res.data.result);
        setSaveNotification(`${t('workspace.savedVersion', 'Successfully saved as Version')} ${res.data.result.version}`);
        setTimeout(() => setSaveNotification(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save updated JSON');
    } finally {
      setSaving(false);
    }
  };

  const [reprocessing, setReprocessing] = useState(false);

  const handleReprocess = async () => {
    if (!id) return;
    setReprocessing(true);
    try {
      const res = await api.post(`/documents/${id}/reprocess`);
      if (res.data.success) {
        setCurrentResult(res.data.result);
        setSaveNotification(t('workspace.reextractSuccess', 'All pages successfully converted into JSON!'));
        setTimeout(() => setSaveNotification(null), 3500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reprocess document');
    } finally {
      setReprocessing(false);
    }
  };

  const handleDownload = () => {
    if (!currentResult) return;
    const blob = new Blob([JSON.stringify(currentResult.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document?.originalFileName?.replace(/\.pdf$/i, '') || 'extracted'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-slate-400 space-x-2 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
        <span>{t('workspace.loading', 'Loading workspace document & extraction pipeline...')}</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">{t('workspace.notFound', 'Document Not Found')}</h3>
        <p className="text-sm text-slate-400">{error || t('workspace.notFoundDesc', 'Unable to access the requested document.')}</p>
        <Link
          to="/app/documents"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('workspace.backToDocs', 'Back to Documents')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col">
      {/* Workspace Header Toolbar */}
      <div className="glass-card rounded-xl px-5 py-3 border border-slate-800 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center space-x-3 truncate max-w-xl">
          <Link
            to="/app/documents"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex-shrink-0"
            title={t('workspace.backToDocs', 'Back to Documents')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white truncate">{document.originalFileName}</h2>
              {document.status === 'COMPLETED' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {t('dashboard.completed', 'Completed')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {t('dashboard.warnings', 'Warnings')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
              <span>{t('workspace.pages', 'Pages')}: {document.pageCount || 1}</span>
              <span>·</span>
              <span>{t('workspace.mode', 'Mode')}: {document.extractionMode}</span>
              <span>·</span>
              <span>{t('workspace.parseTime', 'Parse Time')}: {document.processingDurationMs || 340}ms</span>
              {currentResult && (
                <>
                  <span>·</span>
                  <span>{t('workspace.confidence', 'Confidence')}: {(currentResult.confidenceScore * 100).toFixed(0)}%</span>
                  <span>·</span>
                  <span className="text-brand-400 font-mono">v{currentResult.version}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {saveNotification && (
            <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1 animate-fadeIn">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{saveNotification}</span>
            </span>
          )}

          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm shadow-brand-500/20 disabled:opacity-50 whitespace-nowrap"
            title="Re-extract all pages and detect structured schema"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
            <span>{reprocessing ? t('workspace.reextracting', 'Converting All Pages...') : t('workspace.reextract', 'Re-extract All Pages')}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition flex items-center space-x-1.5 whitespace-nowrap"
            title={t('workspace.downloadJson', 'Download JSON')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('workspace.downloadJson', 'Download JSON')}</span>
          </button>
        </div>
      </div>

      {/* Dual Pane Layout (PDF Viewer Left, JSON Editor Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left: PDF Preview */}
        <div className="lg:col-span-6 h-full flex flex-col min-h-0">
          <PdfViewer
            url={document.downloadUrl}
            fileName={document.originalFileName}
            pageCount={document.pageCount || 1}
          />
        </div>

        {/* Right: Monaco/Custom JSON Editor */}
        <div className="lg:col-span-6 h-full flex flex-col min-h-0">
          {currentResult ? (
            <JsonEditor
              initialValue={currentResult.data}
              onSave={handleSaveResult}
              isSaving={saving}
              warnings={currentResult.warnings}
              schemaValid={currentResult.schemaValid}
            />
          ) : (
            <div className="h-full flex items-center justify-center glass-card rounded-xl border border-slate-800 text-slate-500 text-xs">
              {t('workspace.noJson', 'No JSON extraction available')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
