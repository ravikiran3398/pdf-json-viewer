import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HardDrive,
  CloudDownload,
  CheckCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Link2,
  Sparkles,
  CreditCard,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const DriveImportPage: React.FC = () => {
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlStatus, setUrlStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();

  const isExpired = Boolean(user?.isSubscriptionExpired || user?.subscriptionStatus === 'EXPIRED');
  const quota = user?.usage?.pageQuota || (user?.activePlan?.pageQuota ?? 10);
  const used = user?.usage?.pagesUsed || 0;
  const remainingPages = user?.usage?.remainingPages !== undefined ? user.usage.remainingPages : Math.max(0, quota - used);
  const isFreePlan = !user?.activePlan || user.activePlan.slug === 'free';
  const isQuotaExhausted = remainingPages <= 0 || used >= quota;

  useEffect(() => {
    const fetchDriveFiles = async () => {
      try {
        const res = await api.get('/drive/files');
        if (res.data.success) {
          setDriveFiles(res.data.files);
        }
      } catch (err: any) {
        setError('Failed to fetch files from Google Drive');
      } finally {
        setLoading(false);
      }
    };
    fetchDriveFiles();
  }, []);

  const handleImport = async (fileId: string, fileName: string) => {
    if (isExpired) {
      navigate('/app/billing');
      return;
    }
    if (isQuotaExhausted) {
      navigate('/app/billing');
      return;
    }

    setImportingId(fileId);
    setError(null);

    try {
      const res = await api.post('/drive/import', { fileId, fileName });
      if (res.data.success) {
        await refreshUser();
        navigate(`/app/documents/${res.data.document.id}`);
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      const errorMsg = err.response?.data?.error || 'Failed to import document from Google Drive';
      setError(errorMsg);
    } finally {
      setImportingId(null);
    }
  };

  const handleValidateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired || isQuotaExhausted) {
      navigate('/app/billing');
      return;
    }

    setUrlStatus(null);
    setError(null);

    try {
      const res = await api.post('/drive/validate-link', { url: urlInput });
      if (res.data.success) {
        setUrlStatus(`Validated file ID: ${res.data.fileId}. Importing directly...`);
        await handleImport(res.data.fileId, `Google_Drive_${res.data.fileId}.pdf`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid Google Drive link');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <HardDrive className="w-6 h-6 text-brand-400" />
          <span>{t('drive.title', 'Google Drive Integration')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('drive.subtitle', 'Select and ingest PDF files directly from Google Drive for automatic JSON schema extraction.')}
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
                <span>{t('billing.expiredAlert', 'Subscription Expired')}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 uppercase">
                  {t('userNav.expired', 'Expired')}
                </span>
              </h4>
              <p className="text-xs text-red-300 mt-0.5">
                {t('billing.expiredAlertDesc', 'Google Drive document conversions are paused because your subscription has expired. Buy again or renew to proceed.')}
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-red-600/30 flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('billing.renewNow', 'Buy Again / Renew Plan')}</span>
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
                <span>{t('billing.quotaProgress', 'Free Plan Limit Reached (10/10 Pages Used)')}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  {t('userNav.expired', 'Limit Done')}
                </span>
              </h4>
              <p className="text-xs text-amber-300 mt-0.5">
                {t('billing.remainingPages', 'Free plan permits up to 10 pages per month. You must upgrade to convert Google Drive documents.')}
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-amber-600/30 flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('billing.upgradePlan', 'Upgrade Plan to Convert')}</span>
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
                {t('billing.pageUsage', 'Monthly Page Quota Exhausted')} ({used}/{quota} {t('userNav.pages', 'Pages')})
              </h4>
              <p className="text-xs text-amber-300 mt-0.5">
                {t('billing.expiredAlertDesc', 'All pages for this billing period have been processed. Upgrade your plan or buy again to continue importing.')}
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
          >
            <span>{t('billing.renewNow', 'Upgrade / Buy More Pages')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          {(isExpired || isQuotaExhausted) && (
            <Link to="/app/billing" className="ml-auto underline font-bold text-brand-300 hover:text-white">
              {t('userNav.billing', 'Go to Billing')} &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Direct Link Validator Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Link2 className="w-4 h-4 text-brand-400" />
          <span>{t('drive.directLink', 'Import via Google Drive URL')}</span>
        </h3>
        <p className="text-xs text-slate-400">
          Enter an authorized file link (format: <code className="text-brand-300">https://drive.google.com/file/d/FILE_ID/view</code>)
        </p>

        <form onSubmit={handleValidateUrl} className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isExpired || isQuotaExhausted}
            placeholder={t('drive.urlPlaceholder', 'https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing')}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-brand-500 outline-none disabled:opacity-50"
          />
          {isExpired ? (
            <Link
              to="/app/billing"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition flex items-center space-x-1"
            >
              <span>{t('billing.renewNow', 'Renew Plan')}</span>
            </Link>
          ) : isQuotaExhausted ? (
            <Link
              to="/app/billing"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center space-x-1"
            >
              <span>{t('billing.upgradePlan', 'Upgrade')}</span>
            </Link>
          ) : (
            <button
              type="submit"
              disabled={!urlInput}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition disabled:opacity-50"
            >
              {t('drive.submitLink', 'Import File')}
            </button>
          )}
        </form>

        {urlStatus && <p className="text-xs text-emerald-400">{urlStatus}</p>}
      </div>

      {/* Available Authorized Drive Files */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">{t('drive.title', 'Authorized Google Drive Files')}</h3>
            <p className="text-xs text-slate-400">{t('drive.subtitle', 'Available PDF documents connected to your account')}</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>{t('drive.connected', 'Connected to Google Drive')}</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">{t('common.loading', 'Connecting to Google Drive API...')}</div>
          ) : (
            driveFiles.map((file) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition">
                <div className="flex items-center space-x-3 truncate max-w-[65%]">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB · Modified {new Date(file.modifiedTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isExpired ? (
                  <Link
                    to="/app/billing"
                    className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-800 font-semibold text-xs transition flex items-center space-x-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>{t('userNav.expired', 'Expired')}</span>
                  </Link>
                ) : isQuotaExhausted ? (
                  <Link
                    to="/app/billing"
                    className="px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 text-amber-200 border border-amber-800 font-semibold text-xs transition flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('billing.upgradePlan', 'Upgrade')}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleImport(file.id, file.name)}
                    disabled={importingId === file.id}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    {importingId === file.id ? (
                      <span>{t('drive.importing', 'Importing...')}</span>
                    ) : (
                      <>
                        <CloudDownload className="w-3.5 h-3.5" />
                        <span>{t('drive.importFile', 'Import & Convert')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
