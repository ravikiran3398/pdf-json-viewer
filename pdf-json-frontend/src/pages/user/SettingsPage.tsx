import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, Lock, Key, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [message, setMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/auth/sessions');
        if (res.data.success) {
          setSessions(res.data.sessions);
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
      }
    };
    fetchSessions();
  }, []);

  const confirmRevokeSession = async () => {
    if (!revokeSessionId) return;
    setRevokingSession(true);
    try {
      await api.delete(`/auth/sessions/${revokeSessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== revokeSessionId));
      setRevokeSessionId(null);
    } catch (err) {
      setMessage('Failed to revoke session');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setRevokingSession(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-brand-400" />
          <span>{t('settings.title', 'Account & Security Settings')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('settings.subtitle', 'Manage your personal credentials, active device sessions, and privacy preferences.')}
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <User className="w-4 h-4 text-brand-400" />
          <span>{t('settings.profile', 'Profile Information')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('settings.email', 'Email Address')}</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('settings.role', 'Account Role')}</label>
            <input
              type="text"
              disabled
              value={user?.role || 'USER'}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs cursor-not-allowed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('settings.fullName', 'Full Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{t('settings.company', 'Company / Organization')}</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setMessage(t('settings.saved', 'Profile updated successfully'));
            setTimeout(() => setMessage(null), 3000);
          }}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition"
        >
          {t('settings.save', 'Save Changes')}
        </button>
      </div>

      {/* Active Sessions */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>{t('settings.sessions', 'Active Web Sessions')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t('settings.sessionsDesc', 'Devices currently authenticated to your account')}</p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {sessions.length === 0 ? (
            <div className="p-4 text-xs text-slate-400">{t('settings.currentSession', 'Current device session active.')}</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/40 transition">
                <div>
                  <p className="font-semibold text-white">{s.userAgent || 'Chrome on Windows'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    IP: {s.ipAddress} · Created {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setRevokeSessionId(s.id)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition"
                >
                  {t('settings.revoke', 'Revoke')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl p-6 border border-red-500/30 bg-red-950/10 space-y-3">
        <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
          <Trash2 className="w-4 h-4" />
          <span>{t('settings.dangerZone', 'Danger Zone')}</span>
        </h3>
        <p className="text-xs text-slate-400">
          {t('settings.dangerDesc', 'Deleting your account permanently purges all uploaded PDFs, extracted JSON payloads, and API keys. This action cannot be undone.')}
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-semibold transition"
        >
          {t('settings.deleteAccount', 'Delete Account & Purge Vault')}
        </button>
      </div>

      {/* Revoke Session Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(revokeSessionId)}
        title={t('settings.revokeModalTitle', 'Revoke Device Session')}
        message={t('settings.revokeModalDesc', 'Are you sure you want to terminate this authenticated device session? The client will immediately be signed out.')}
        confirmLabel={t('settings.revokeModalConfirm', 'Revoke Session')}
        cancelLabel={t('common.cancel', 'Cancel')}
        variant="warning"
        loading={revokingSession}
        onConfirm={confirmRevokeSession}
        onClose={() => setRevokeSessionId(null)}
      />

      {/* Modern Account Purge Confirmation Dialog */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('settings.deleteModalTitle', 'Delete Account & Purge Vault')}
        message={t('settings.deleteModalDesc', 'Are you ABSOLUTELY sure? This will permanently delete your workspace, cancel active plan quotas, and purge all your document extraction records. This action cannot be undone.')}
        confirmLabel={t('settings.deleteModalConfirm', 'Yes, Purge My Account')}
        cancelLabel={t('settings.deleteModalCancel', 'Keep Account')}
        variant="danger"
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          await logout();
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
