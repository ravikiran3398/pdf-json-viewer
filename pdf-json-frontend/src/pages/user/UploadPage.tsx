import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  Settings,
  Sparkles,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  CreditCard,
  X,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { ExtractionMode } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const UploadPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('AUTO');
  const [templateSchema, setTemplateSchema] = useState('invoice');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    title: string;
    message: string;
    code: string;
    ctaText: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const isExpired = Boolean(user?.isSubscriptionExpired || user?.subscriptionStatus === 'EXPIRED');
  const quota = user?.usage?.pageQuota || (user?.activePlan?.pageQuota ?? 10);
  const used = user?.usage?.pagesUsed || 0;
  const remainingPages = user?.usage?.remainingPages !== undefined ? user.usage.remainingPages : Math.max(0, quota - used);
  const isFreePlan = !user?.activePlan || user.activePlan.slug === 'free';
  const isQuotaExhausted = remainingPages <= 0 || used >= quota;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file type: Only PDF documents (.pdf) are supported.');
      return;
    }

    if (isExpired) {
      setError('Your subscription has expired. Please buy again or renew to convert documents.');
      return;
    }

    if (isQuotaExhausted) {
      if (isFreePlan) {
        setError('Free plan limit reached (10/10 pages used). You must upgrade to convert more documents.');
      } else {
        setError(`Monthly page quota reached (${used}/${quota} pages used). Please upgrade or renew your plan.`);
      }
      return;
    }

    const maxMb = user?.activePlan?.maxFileSizeMb || 10;
    if (selectedFile.size > maxMb * 1024 * 1024) {
      setError(`File size (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB) exceeds your plan limit of ${maxMb}MB.`);
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadAndConvert = async () => {
    if (!file) return;

    if (isExpired) {
      setUpgradeModal({
        title: 'Subscription Expired',
        message: 'Your active subscription period has expired. Please buy again or renew to continue converting documents.',
        code: 'SUBSCRIPTION_EXPIRED',
        ctaText: 'Renew / Buy Again',
      });
      return;
    }

    if (isQuotaExhausted) {
      setUpgradeModal({
        title: isFreePlan ? 'Free Plan Limit Reached (10 Pages)' : 'Monthly Page Quota Exceeded',
        message: isFreePlan
          ? 'You have used all 10 free pages allocated for this month. Upgrade to Starter or Pro to convert unlimited documents.'
          : `You have reached your limit of ${quota} pages for this billing cycle. Upgrade your plan to continue conversions.`,
        code: 'QUOTA_EXCEEDED',
        ctaText: 'Upgrade Plan Now',
      });
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('extractionMode', extractionMode);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(`"${file.name}" converted into structured JSON!`, 'Extraction Complete');
        await refreshUser();
        navigate(`/app/documents/${res.data.document.id}`);
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      const errorMsg = err.response?.data?.error || 'Failed to upload and process PDF document';

      toast.error(errorMsg, 'Conversion Failed');

      if (code === 'QUOTA_EXCEEDED') {
        setUpgradeModal({
          title: isFreePlan ? 'Free Plan Limit Reached (10 Pages)' : 'Monthly Page Quota Exceeded',
          message: errorMsg,
          code: 'QUOTA_EXCEEDED',
          ctaText: 'Upgrade Plan',
        });
      } else if (code === 'SUBSCRIPTION_EXPIRED') {
        setUpgradeModal({
          title: 'Subscription Expired',
          message: errorMsg,
          code: 'SUBSCRIPTION_EXPIRED',
          ctaText: 'Renew / Buy Again',
        });
      } else if (code === 'OCR_NOT_ALLOWED' || code === 'OCR_QUOTA_EXCEEDED') {
        setUpgradeModal({
          title: 'OCR Feature Locked',
          message: errorMsg,
          code: code,
          ctaText: 'Upgrade to Enable OCR',
        });
      } else {
        setError(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{t('upload.title', 'Upload & Convert PDF')}</h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('upload.subtitle', 'Upload any text or scanned PDF to convert it into validated structured JSON.')}
        </p>
      </div>

      {/* Top Banner Alert: Subscription Expired */}
      {isExpired && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Subscription Expired</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 uppercase">
                  Inactive
                </span>
              </h4>
              <p className="text-xs text-red-300 mt-0.5">
                Your plan has expired and conversions are paused. Buy again or renew to resume instant PDF-to-JSON conversions.
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-red-600/30 flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Buy Again / Renew</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top Banner Alert: Free Plan Exhausted */}
      {!isExpired && isQuotaExhausted && isFreePlan && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Free Plan Limit Reached (10/10 Pages Used)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  Quota Done
                </span>
              </h4>
              <p className="text-xs text-amber-300 mt-0.5">
                You have used all 10 free pages this month. Upgrade to continue converting documents.
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-amber-600/30 flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Upgrade to Convert</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top Banner Alert: Paid Plan Quota Exhausted */}
      {!isExpired && isQuotaExhausted && !isFreePlan && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Monthly Page Quota Exhausted ({used}/{quota} Pages)
              </h4>
              <p className="text-xs text-amber-300 mt-0.5">
                You have utilized all {quota} pages for this billing period. Upgrade your plan or buy again to continue converting.
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
          >
            <span>Upgrade / Buy More Pages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Dropzone */}
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (isExpired || isQuotaExhausted) {
                navigate('/app/billing');
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 relative ${
              isExpired
                ? 'border-red-500/40 bg-red-950/10 hover:bg-red-950/20'
                : isQuotaExhausted
                ? 'border-amber-500/40 bg-amber-950/10 hover:bg-amber-950/20'
                : dragActive
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isExpired || isQuotaExhausted}
              className="hidden"
            />

            {isExpired ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">Subscription Expired</h4>
                <p className="text-xs text-red-300 max-w-sm mx-auto">
                  Conversions are locked. Click to visit billing and buy again or renew your subscription.
                </p>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-red-300 bg-red-950/60 rounded-lg border border-red-800/60">
                  Click here to Buy Again &rarr;
                </span>
              </div>
            ) : isQuotaExhausted ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {isFreePlan ? 'Free Plan Limit Reached (10/10 Pages)' : 'Monthly Quota Exhausted'}
                </h4>
                <p className="text-xs text-amber-300 max-w-sm mx-auto">
                  {isFreePlan
                    ? 'You have used all 10 free pages. Upgrade your plan to convert more documents.'
                    : `You have processed all ${quota} pages. Click to upgrade or buy again.`}
                </p>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-amber-300 bg-amber-950/60 rounded-lg border border-amber-800/60">
                  Click here to Upgrade Plan &rarr;
                </span>
              </div>
            ) : file ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white truncate max-w-sm mx-auto">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Ready for parsing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-red-400 hover:underline pt-2"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center border border-brand-500/20">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">
                    {t('upload.dropzone', 'Drag and drop your PDF here, or browse files')}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('upload.dropzoneSupport', 'Supports Invoices, Receipts, Bank Statements & Forms (Max 50MB)')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons: Conditional on Expiration & Quota */}
          {isExpired ? (
            <Link
              to="/app/billing"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Subscription Expired — Buy Again to Convert</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : isQuotaExhausted ? (
            <Link
              to="/app/billing"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm transition shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isFreePlan ? 'Free Limit Reached (10 Pages) — Upgrade to Convert' : 'Quota Exhausted — Upgrade or Buy Again'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={handleUploadAndConvert}
              disabled={!file || uploading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-brand-500/30 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              {uploading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Processing & Validating against Schema...</span>
                </>
              ) : (
                <>
                  <span>{t('upload.processBtn', 'Process & Open Workspace')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-slate-200 font-bold text-sm">
            <Settings className="w-4 h-4 text-brand-400" />
            <span>{t('upload.config', 'Extraction Configuration')}</span>
          </div>

          {/* Extraction Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">{t('upload.mode', 'Extraction Mode')}</label>
            <div className="space-y-2">
              {[
                { id: 'AUTO', name: t('upload.autoDetect', 'Auto Detect'), desc: t('upload.autoDetectDesc', 'Fast text with auto OCR fallback') },
                { id: 'FAST_TEXT', name: t('upload.fastText', 'Fast Vector Text'), desc: t('upload.fastTextDesc', 'Under 400ms for digital PDFs') },
                { id: 'OCR_SCANNED', name: t('upload.ocrScanned', 'OCR Engine'), desc: t('upload.ocrScannedDesc', 'For scanned or image PDFs (Pro/Business)') },
                { id: 'TABLE_FORM', name: t('upload.tableForm', 'Table & Form Focus'), desc: t('upload.tableFormDesc', 'Heuristic row/column alignment') },
              ].map((mode) => (
                <label
                  key={mode.id}
                  onClick={() => setExtractionMode(mode.id as ExtractionMode)}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                    extractionMode === mode.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={extractionMode === mode.id}
                    onChange={() => {}}
                    className="mt-0.5 text-brand-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{mode.name}</p>
                    <p className="text-[11px] text-slate-400">{mode.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Target Schema Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('upload.targetSchema', 'Target JSON Schema')}</label>
            <select
              value={templateSchema}
              onChange={(e) => setTemplateSchema(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-brand-500 outline-none"
            >
              <option value="invoice">Standard Commercial Invoice</option>
              <option value="receipt">POS & Retail Receipt</option>
              <option value="statement">Bank Statement & Ledger</option>
              <option value="generic">Generic Key-Value Extraction</option>
            </select>
          </div>

          {/* Quota Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Current Plan:</span>
              <span className="font-semibold text-white capitalize">{user?.activePlan?.name || 'Free'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Quota Used:</span>
              <span className={`font-mono font-bold ${isQuotaExhausted ? 'text-amber-400' : 'text-slate-200'}`}>
                {used} / {quota} pages
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Remaining:</span>
              <span className={`font-mono font-bold ${remainingPages <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {remainingPages} pages
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade / Expiration Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-brand-500/40 max-w-md w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setUpgradeModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                upgradeModal.code === 'SUBSCRIPTION_EXPIRED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{upgradeModal.title}</h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                  Code: {upgradeModal.code}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {upgradeModal.message}
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setUpgradeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <Link
                to="/app/billing"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/30 flex items-center space-x-1.5"
              >
                <span>{upgradeModal.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
