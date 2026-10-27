import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  HardDrive,
  FileSpreadsheet,
  BarChart2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';
import { DocumentItem } from '../../types/index.js';

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const res = await api.get('/documents?limit=5');
        if (res.data.success) {
          setDocuments(res.data.documents);
        }
      } catch (err) {
        console.error('Failed to fetch recent documents', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentDocs();
  }, []);

  const isExpired = Boolean(user?.isSubscriptionExpired || user?.subscriptionStatus === 'EXPIRED');
  const quota = user?.usage?.pageQuota || (user?.activePlan?.pageQuota ?? 10);
  const used = user?.usage?.pagesUsed || 0;
  const remaining = Math.max(0, quota - used);
  const quotaPercent = Math.min(100, Math.round((used / quota) * 100));
  const isFreePlan = !user?.activePlan || user.activePlan.slug === 'free';
  const isQuotaExhausted = remaining <= 0 || used >= quota;

  return (
    <div className="space-y-8">
      {/* Top Banner: Expired Subscription */}
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
                  Conversions Locked
                </span>
              </h4>
              <p className="text-xs text-red-300 mt-0.5">
                Your plan has expired and conversions are paused. Buy again or renew below to restore immediate conversions.
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-red-600/30 flex items-center space-x-1.5"
          >
            <span>Buy Again / Renew</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top Banner: Free Plan Exhausted */}
      {!isExpired && isQuotaExhausted && isFreePlan && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Free Plan Limit Reached (10/10 Pages Used)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  Limit Done
                </span>
              </h4>
              <p className="text-xs text-amber-300 mt-0.5">
                You have reached your 10 free pages this month. Upgrade your plan to convert more documents.
              </p>
            </div>
          </div>
          <Link
            to="/app/billing"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-amber-600/30 flex items-center space-x-1.5"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isExpired ? 'bg-red-500/20 text-red-300' : 'bg-brand-500/20 text-brand-300'
          }`}>
            {user?.activePlan?.name || t('plan.free.name', 'Free')} {t('userNav.plan', 'Plan')} {isExpired ? t('userNav.expired', 'Expired') : t('dashboard.planActive', 'Active')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {t('dashboard.welcome', 'Welcome back')}, {user?.name || 'User'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {t('dashboard.subtitle', 'Convert, validate, and export structured JSON from PDF invoices, receipts, and tabular forms.')}
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Link
            to="/app/upload"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/30 flex items-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('dashboard.uploadNew', 'Upload New PDF')}</span>
          </Link>
          <Link
            to="/app/drive"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center space-x-1.5"
          >
            <HardDrive className="w-4 h-4 text-brand-400" />
            <span>{t('dashboard.googleDrive', 'Google Drive')}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('dashboard.monthlyPages', 'Monthly Pages Used')}</span>
            <BarChart2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{used}</span>
            <span className="text-xs text-slate-500">/ {quota} {t('userNav.pages', 'pages')}</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('dashboard.remainingQuota', 'Remaining Quota')}</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{remaining}</div>
          <p className="text-[11px] text-slate-500 mt-2">{t('dashboard.pagesThisCycle', 'Pages available this cycle')}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('dashboard.totalDocs', 'Total Documents')}</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{documents.length > 0 ? documents.length : 0}</div>
          <p className="text-[11px] text-slate-500 mt-2">{t('dashboard.activeInVault', 'Active in vault')}</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('dashboard.avgTime', 'Average Parse Time')}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">420 ms</div>
          <p className="text-[11px] text-emerald-400 mt-2">{t('dashboard.subsecond', 'Sub-second execution')}</p>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">{t('dashboard.recentConversions', 'Recent Conversions')}</h3>
            <p className="text-xs text-slate-400">{t('dashboard.recentSubtitle', 'Your latest PDF extraction jobs')}</p>
          </div>
          <Link
            to="/app/documents"
            className="text-xs text-brand-400 hover:underline flex items-center space-x-1 font-semibold"
          >
            <span>{t('dashboard.viewAll', 'View All Documents')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('dashboard.docName', 'Document')}</th>
                <th className="py-3 px-4">{t('dashboard.status', 'Status')}</th>
                <th className="py-3 px-4">{t('dashboard.mode', 'Mode')}</th>
                <th className="py-3 px-4">{t('dashboard.pagesCol', 'Pages')}</th>
                <th className="py-3 px-4">{t('dashboard.processedDate', 'Processed Date')}</th>
                <th className="py-3 px-4 text-right">{t('dashboard.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t('common.loading', 'Loading conversions...')}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    <p className="text-sm font-medium">{t('dashboard.noDocs', 'No documents converted yet')}</p>
                    <Link
                      to="/app/upload"
                      className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold"
                    >
                      {t('dashboard.convertFirst', 'Convert Your First PDF')}
                    </Link>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 flex items-center space-x-2.5 truncate max-w-xs">
                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <span className="font-medium text-slate-200 truncate">{doc.originalFileName}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>{t('dashboard.completed', 'Completed')}</span>
                        </span>
                      ) : doc.status === 'COMPLETED_WITH_WARNINGS' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{t('dashboard.warnings', 'Warnings')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Clock className="w-3 h-3" />
                          <span>{t('dashboard.processing', 'Processing')}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {doc.extractionMode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">{doc.pageCount || 1}</td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 font-medium text-xs transition"
                      >
                        {t('dashboard.openWorkspace', 'Open Workspace')}
                      </Link>
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
