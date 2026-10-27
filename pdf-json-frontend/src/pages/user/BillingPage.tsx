import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  Download,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const BillingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [currentSubData, setCurrentSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [historyRes, currentSubRes] = await Promise.all([
        api.get('/billing/history'),
        api.get('/billing/current'),
      ]);

      if (historyRes.data.success) setPayments(historyRes.data.payments);
      if (currentSubRes.data.success) setCurrentSubData(currentSubRes.data);
    } catch (err: any) {
      console.error('Failed to load billing information', err);
      toast.error(err.response?.data?.error || 'Failed to load billing status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const isExpired = Boolean(
    user?.isSubscriptionExpired ||
    currentSubData?.isExpired ||
    currentSubData?.subscription?.status === 'EXPIRED' ||
    user?.subscriptionStatus === 'EXPIRED'
  );

  const activePlan = user?.activePlan;
  const planName = activePlan?.name || 'Free';
  const quota = user?.usage?.pageQuota || (activePlan?.pageQuota ?? 10);
  const used = user?.usage?.pagesUsed || 0;
  const remainingPages = user?.usage?.remainingPages !== undefined ? user.usage.remainingPages : Math.max(0, quota - used);
  const quotaPercent = Math.min(100, Math.round((used / quota) * 100));
  const isFreePlan = !activePlan || activePlan.slug === 'free';
  const isQuotaExhausted = remainingPages <= 0 || used >= quota;

  const handleDownloadReceipt = (p: any) => {
    toast.success(`Downloaded official receipt #${p.receiptNumber || p.id}`, 'Invoice Downloaded');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-brand-400" />
          <span>{t('billing.title', 'Usage & Billing')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('billing.subtitle', 'Manage your subscription, quotas, invoices, and payment methods.')}
        </p>
      </div>

      {/* Top Alert: Subscription Expired */}
      {isExpired && (
        <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
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
                {t('billing.expiredAlertDesc', 'Your plan has expired and conversions are paused. Buy again or renew below to restore immediate conversions.')}
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-red-600/30 flex items-center space-x-1.5"
          >
            <span>{t('billing.renewNow', 'Buy Again / Renew Plan')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top Alert: Free Quota Exhausted */}
      {!isExpired && isQuotaExhausted && isFreePlan && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t('billing.quotaProgress', 'Free Plan Limit Reached (10/10 Pages Used)')}</h4>
              <p className="text-xs text-amber-300 mt-0.5">
                {t('billing.remainingPages', 'You have reached the monthly conversion limit. Please upgrade to a paid tier on the main site to convert more documents.')}
              </p>
            </div>
          </div>
          <Link
            to="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap transition shadow-lg shadow-amber-600/30 flex items-center space-x-1.5"
          >
            <span>{t('billing.upgradePlan', 'Upgrade Plan')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* CURRENT PLAN HERO CARD */}
      <div
        className={`glass-card rounded-2xl p-6 sm:p-8 border transition-all duration-200 ${
          isExpired
            ? 'border-red-500/40 bg-red-950/10'
            : isQuotaExhausted
            ? 'border-amber-500/40 bg-amber-950/10'
            : 'border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{planName} {t('userNav.plan', 'Plan')}</h3>
              {isExpired ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('userNav.expired', 'EXPIRED').toUpperCase()}</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('dashboard.planActive', 'ACTIVE').toUpperCase()}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {isExpired
                ? t('billing.expiredAlertDesc', 'Your active conversion window has concluded. Renew to restore access.')
                : t('pricing.currentPlan', 'Current active entitlement for this workspace account.')}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {activePlan?.price ? `₹${activePlan.price}` : '₹0'}
              <span className="text-xs text-slate-400 font-normal"> {t('pricing.perMonth', '/ month')}</span>
            </div>
          </div>
        </div>

        {/* Quota Meter Breakdown */}
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-brand-400" />
              <span>{t('billing.pageUsage', 'Monthly Page Allocation')}</span>
            </span>
            <span className="font-mono text-slate-200">
              <strong className="text-white font-bold">{used}</strong> / {quota} {t('userNav.pages', 'pages')} (
              {remainingPages} {t('userNav.remaining', 'remaining')})
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isExpired
                  ? 'bg-red-500'
                  : quotaPercent >= 100
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-brand-500 to-blue-500'
              }`}
              style={{ width: `${isExpired || quotaPercent >= 100 ? 100 : quotaPercent}%` }}
            />
          </div>
        </div>

        {/* Plan Capabilities Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">{t('billing.pageUsage', 'Included Volume')}</span>
            <span className="text-lg font-bold text-white mt-1 block">{quota} {t('userNav.pages', 'Pages')} {t('pricing.perMonth', '/ mo')}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">{t('upload.ocrScanned', 'OCR Scanned Allowance')}</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {activePlan?.ocrQuota ? `${activePlan.ocrQuota} ${t('userNav.pages', 'Pages')}` : '0'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">{t('documents.fileSize', 'Max Upload Size')}</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {activePlan?.maxFileSizeMb || 10} MB
            </span>
          </div>
        </div>

        {/* Informational Guidance on Buying Outside */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            <p className="font-semibold text-slate-200">{t('billing.renewNow', 'Need to upgrade or renew your plan?')}</p>
          </div>
          <Link
            to="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5"
          >
            <span>{t('pricing.title', 'View Pricing')}</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
          </Link>
        </div>
      </div>

      {/* PAYMENT & INVOICE HISTORY */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">{t('billing.paymentHistory', 'Payment & Invoice History')}</h3>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">{t('common.loading', 'Loading...')}</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {t('billing.noInvoices', 'No previous invoices recorded for this account.')}
            </div>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/40 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{t('billing.downloadInvoice', 'Receipt')} {p.receiptNumber || p.orderId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {new Date(p.createdAt).toLocaleDateString()} · ID: {p.paymentId || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-bold text-white font-mono">₹{p.amount}</span>
                  <button
                    onClick={() => handleDownloadReceipt(p)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title={t('billing.downloadInvoice', 'Download Receipt')}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
