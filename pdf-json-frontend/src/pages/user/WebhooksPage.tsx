import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Send, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { WebhookItem } from '../../types/index.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const WebhooksPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/webhooks');
      if (res.data.success) {
        setWebhooks(res.data.webhooks);
      }
    } catch (err) {
      console.error('Failed to load webhooks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      const res = await api.post('/webhooks', { url });
      if (res.data.success) {
        setShowModal(false);
        setUrl('');
        toast.success('Registered new webhook endpoint successfully', 'Webhook Active');
        await fetchWebhooks();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to register webhook');
    }
  };

  const handleTestPing = async (id: string) => {
    setPingStatus(null);
    try {
      const res = await api.post(`/webhooks/${id}/test`);
      if (res.data.success) {
        toast.success('Ping delivered successfully! Destination server responded 200 OK.', 'Ping OK');
        setPingStatus(`Ping delivered successfully! Status 200 OK.`);
        setTimeout(() => setPingStatus(null), 3500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ping delivery failed');
    }
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteWebhook = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/webhooks/${deleteTargetId}`);
      toast.success('Webhook endpoint deleted', 'Endpoint Removed');
      await fetchWebhooks();
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete webhook');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Webhook className="w-6 h-6 text-brand-400" />
            <span>{t('webhooks.title', 'Real-Time Webhooks')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('webhooks.subtitle', 'Receive automated HTTP POST notifications when document conversions complete.')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('webhooks.add', 'Add Webhook Endpoint')}</span>
        </button>
      </div>

      {pingStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{pingStatus}</span>
        </div>
      )}

      {/* Webhooks List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">{t('webhooks.title', 'Registered Endpoints')}</h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">{t('common.loading', 'Loading webhooks...')}</div>
          ) : webhooks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Webhook className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p>{t('webhooks.empty', 'No webhooks configured yet. Add an endpoint to receive live payloads.')}</p>
            </div>
          ) : (
            webhooks.map((wh) => (
              <div key={wh.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
                <div>
                  <span className="font-mono text-xs font-semibold text-white">{wh.url}</span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Secret: {wh.secret.slice(0, 10)}... · Events: {(wh.events as string[]).join(', ')}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestPing(wh.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5 text-brand-400" />
                    <span>Ping</span>
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(wh.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition"
                    title={t('common.delete', 'Delete Webhook')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{t('webhooks.add', 'Add Webhook Endpoint')}</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payload URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('webhooks.urlPlaceholder', 'https://api.yourdomain.com/webhooks/docuparse')}
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
                  {t('webhooks.add', 'Register Endpoint')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Webhook Deletion Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={t('common.delete', 'Delete Webhook Endpoint')}
        message="Are you sure you want to delete this webhook destination? Instant conversion event payloads will no longer be dispatched to this URL."
        confirmLabel={t('common.delete', 'Delete Endpoint')}
        cancelLabel={t('common.cancel', 'Keep Webhook')}
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteWebhook}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
