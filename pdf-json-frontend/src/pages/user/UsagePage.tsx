import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Zap, Scan, Layers, Clock, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../services/api.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const UsagePage: React.FC = () => {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await api.get('/usage');
        if (res.data.success) {
          setUsageData(res.data.usage);
        }
      } catch (err) {
        console.error('Failed to load usage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-xs">{t('common.loading', 'Loading usage ledger...')}</div>;
  }

  const quota = usageData?.pageQuota || 10;
  const used = usageData?.pagesUsed || 0;
  const ocrUsed = usageData?.ocrPagesUsed || 0;
  const ocrQuota = usageData?.ocrQuota || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-brand-400" />
          <span>{t('billing.title', 'Usage Accounting & Quota Ledger')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('billing.subtitle', 'Real-time tracking of page reservations, OCR consumption, and ledger history.')}
        </p>
      </div>

      {/* Quota Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('dashboard.monthlyPages', 'Standard Pages')}</span>
            <Zap className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">{used} <span className="text-xs text-slate-500 font-normal">/ {quota}</span></div>
          <p className="text-[11px] text-slate-400 mt-2">
            {t('userNav.remaining', 'Remaining')}: <strong className="text-emerald-400">{Math.max(0, quota - used)} {t('userNav.pages', 'pages')}</strong>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>{t('upload.ocrScanned', 'OCR Pages Used')}</span>
            <Scan className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{ocrUsed} <span className="text-xs text-slate-500 font-normal">/ {ocrQuota}</span></div>
          <p className="text-[11px] text-slate-400 mt-2">{t('upload.ocrScannedDesc', 'Hybrid OCR pipeline for scans')}</p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">{t('pricing.activePlan', 'Active Plan')}</div>
            <div className="text-xl font-bold text-white">{usageData?.activePlan?.name || 'Free'} {t('userNav.plan', 'Plan')}</div>
          </div>
          <Link
            to="/app/billing"
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold text-center transition flex items-center justify-center space-x-1"
          >
            <span>{t('userNav.upgrade', 'Upgrade Capacity')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">{t('dashboard.recentSubtitle', 'Daily Extraction Volume (Past 7 Days)')}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData?.dailyBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="pages" fill="#0e8ce9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
