import React, { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, ShieldCheck, Terminal } from 'lucide-react';
import { api } from '../../services/api.js';
import { ApiKeyItem } from '../../types/index.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const ApiKeysPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [label, setLabel] = useState('');
  const [newKeyResult, setNewKeyResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api-keys');
      if (res.data.success) {
        setKeys(res.data.keys);
      }
    } catch (err) {
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    try {
      const res = await api.post('/api-keys', { label });
      if (res.data.success) {
        setNewKeyResult(res.data.apiKey);
        setLabel('');
        toast.success(`Generated API key: "${res.data.apiKey.label || 'API Key'}"`, 'Key Generated');
        await fetchKeys();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate API key');
    }
  };

  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const confirmRevoke = async () => {
    if (!revokeTargetId) return;
    setRevoking(true);
    try {
      await api.delete(`/api-keys/${revokeTargetId}`);
      toast.success('API key successfully revoked', 'Key Revoked');
      await fetchKeys();
      setRevokeTargetId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to revoke API key');
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info('API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <KeyRound className="w-6 h-6 text-brand-400" />
            <span>{t('apiKeys.title', 'REST API Keys')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('apiKeys.subtitle', 'Create and revoke secret API keys to automate PDF conversions via cURL, Python, or Node.js.')}
          </p>
        </div>

        <button
          onClick={() => {
            setNewKeyResult(null);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('apiKeys.generate', 'Generate New Key')}</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">{t('apiKeys.activeKeys', 'Active Access Keys')}</h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">{t('common.loading', 'Loading keys...')}</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <KeyRound className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p>{t('apiKeys.empty', 'No API keys generated yet. Click above to create one.')}</p>
            </div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/40 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{k.label}</span>
                    {k.isRevoked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        {t('settings.revoke', 'Revoked')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t('dashboard.planActive', 'Active')}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-slate-400 text-[11px] mt-1">{k.keyPrefix}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {!k.isRevoked && (
                    <button
                      onClick={() => setRevokeTargetId(k.id)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition"
                    >
                      {t('apiKeys.revoke', 'Revoke')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{t('apiKeys.generate', 'Generate Secret API Key')}</h3>

            {newKeyResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {t('apiKeys.newKeyAlert', 'Copy this key now. For security purposes, this secret key will never be displayed again.')}
                  </span>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-brand-300">
                  <span className="truncate flex-1">{newKeyResult.plainKey}</span>
                  <button
                    onClick={() => copyToClipboard(newKeyResult.plainKey)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs"
                >
                  {t('common.save', 'Done')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('apiKeys.labelPlaceholder', 'Key Label')}</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Node.js Ingestion Worker"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                  >
                    {t('apiKeys.create', 'Generate Key')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modern Revoke Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(revokeTargetId)}
        title={t('apiKeys.revoke', 'Revoke Developer API Key')}
        message="Are you sure you want to permanently revoke this API key? Any applications, scripts, or backend services currently using this secret key will immediately fail with 401 Unauthorized."
        confirmLabel={t('apiKeys.revoke', 'Revoke Key Permanently')}
        cancelLabel={t('common.cancel', 'Keep Key')}
        variant="danger"
        loading={revoking}
        onConfirm={confirmRevoke}
        onClose={() => setRevokeTargetId(null)}
      />
    </div>
  );
};
