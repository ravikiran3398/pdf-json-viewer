import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Download,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  FileText,
  Edit3,
  CreditCard,
  MessageSquare,
  Trash2,
  CheckCircle,
  Clock,
  Laptop,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resource: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const UserActivityPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/activity');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load user activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AUTH_LOGIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-3 h-3" />
            <span>{t('activity.actionLogin', 'Sign In')}</span>
          </span>
        );
      case 'AUTH_LOGOUT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <LogOut className="w-3 h-3" />
            <span>{t('activity.actionLogout', 'Sign Out')}</span>
          </span>
        );
      case 'DOCUMENT_CONVERT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <FileText className="w-3 h-3" />
            <span>{t('activity.actionConvert', 'PDF Converted')}</span>
          </span>
        );
      case 'JSON_SCHEMA_EDIT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Edit3 className="w-3 h-3" />
            <span>{t('activity.actionEdit', 'JSON Modified')}</span>
          </span>
        );
      case 'DOCUMENT_EXPORT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Download className="w-3 h-3" />
            <span>{t('activity.actionExport', 'Exported')}</span>
          </span>
        );
      case 'DOCUMENT_DELETE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 className="w-3 h-3" />
            <span>{t('activity.actionDelete', 'Deleted')}</span>
          </span>
        );
      case 'BILLING_UPGRADE':
      case 'BILLING_RENEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CreditCard className="w-3 h-3" />
            <span>{t('activity.actionBilling', 'Plan Renew/Upgrade')}</span>
          </span>
        );
      case 'SUPPORT_CHAT_SENT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-3 h-3" />
            <span>{t('activity.actionChat', 'Chat Message')}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchIp = (log.ipAddress || '').toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchAction || matchIp || matchDetails;
    }
    return true;
  });

  const loginsCount = logs.filter((l) => l.action === 'AUTH_LOGIN').length;
  const conversionsCount = logs.filter((l) => l.action === 'DOCUMENT_CONVERT').length;
  const editsCount = logs.filter((l) => l.action === 'JSON_SCHEMA_EDIT').length;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `activity_log_${user?.email || 'user'}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <History className="w-6 h-6 text-brand-400" />
            <span>{t('activity.title', 'Activity & Security Audit Logs')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('activity.subtitle', 'Real-time chronological timeline tracking all logins, logouts, document conversions, JSON modifications, and billing events for your account.')}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
            title={t('activity.refresh', 'Refresh logs')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('activity.refresh', 'Refresh')}</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{t('activity.export', 'Export Audit Trail')}</span>
          </button>
        </div>
      </div>

      {/* Deep Analysis Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">{t('activity.totalEvents', 'Total Activity Events')}</span>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
          <p className="text-[11px] text-slate-500">{t('activity.totalEventsDesc', 'Recorded in immutable audit trail')}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">{t('activity.signins', 'Sign-in Sessions')}</span>
          <div className="text-2xl font-bold text-emerald-400">{loginsCount}</div>
          <p className="text-[11px] text-slate-500">{t('activity.signinsDesc', 'Authenticated login occurrences')}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">{t('activity.conversions', 'PDF Conversions')}</span>
          <div className="text-2xl font-bold text-brand-400">{conversionsCount}</div>
          <p className="text-[11px] text-slate-500">{t('activity.conversionsDesc', 'Processed into JSON')}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">{t('activity.revisions', 'JSON Schema Edits')}</span>
          <div className="text-2xl font-bold text-purple-400">{editsCount}</div>
          <p className="text-[11px] text-slate-500">{t('activity.revisionsDesc', 'Versions edited & saved')}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-brand-500 outline-none w-full sm:w-auto"
          >
            <option value="ALL">{t('activity.all', 'All Actions')}</option>
            <option value="AUTH_LOGIN">{t('activity.filterSignIns', 'Sign In (Login)')}</option>
            <option value="AUTH_LOGOUT">{t('activity.filterSignOuts', 'Sign Out (Logout)')}</option>
            <option value="DOCUMENT_CONVERT">{t('activity.filterConversions', 'Document Conversions')}</option>
            <option value="JSON_SCHEMA_EDIT">{t('activity.filterEdits', 'JSON Schema Edits')}</option>
            <option value="DOCUMENT_EXPORT">{t('activity.filterExports', 'JSON Exports')}</option>
            <option value="DOCUMENT_DELETE">{t('activity.filterDeletes', 'Document Deletions')}</option>
            <option value="BILLING_UPGRADE">{t('activity.filterBilling', 'Billing & Subscriptions')}</option>
            <option value="SUPPORT_CHAT_SENT">{t('chat.btn', 'Support Chat')}</option>
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('activity.searchPlaceholder', 'Search by IP, document name, or details...')}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">{t('activity.colAction', 'Action & Event')}</th>
                <th className="px-5 py-3.5">{t('activity.colResource', 'Resource & Details')}</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">{t('activity.colDevice', 'Client Device')}</th>
                <th className="px-5 py-3.5">{t('activity.colTimestamp', 'Timestamp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    {t('common.loading', 'Loading activity timeline...')}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    {t('activity.empty', 'No matching audit log activities found.')}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const detailsStr = log.details
                    ? Object.entries(log.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')
                    : log.resource;

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-200">
                        <span className="font-mono text-[11px] text-slate-300 truncate block">
                          {detailsStr}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-[11px] truncate max-w-[150px]">
                        <span className="flex items-center space-x-1.5" title={log.userAgent || 'Web Browser'}>
                          <Laptop className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{log.userAgent ? log.userAgent.slice(0, 25) + '...' : 'Browser'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
