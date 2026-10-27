import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Send, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api.js';
import { SupportTicketItem } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const SupportTicketsPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState('TECHNICAL');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
        if (selectedTicket) {
          const updated = res.data.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/support/tickets', {
        subject: newSubject,
        category: newCategory,
        message: newMessage,
      });

      if (res.data.success) {
        setShowModal(false);
        setNewSubject('');
        setNewMessage('');
        toast.success(`Support ticket "${newSubject}" created successfully`, 'Ticket Opened');
        await fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create support ticket');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;

    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText,
      });

      if (res.data.success) {
        setReplyText('');
        toast.success('Your reply was submitted to our support team', 'Reply Sent');
        await fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-brand-400" />
            <span>{t('support.title', 'Support Tickets & Helpdesk')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('support.subtitle', 'Submit diagnostic inquiries and communicate directly with platform engineers.')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('support.newTicket', 'New Support Ticket')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">{t('support.title', 'Your Tickets')}</h3>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">{t('common.loading', 'Loading tickets...')}</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">{t('support.empty', 'No active support tickets.')}</div>
            ) : (
              tickets.map((tItem) => (
                <div
                  key={tItem.id}
                  onClick={() => setSelectedTicket(tItem)}
                  className={`p-4 cursor-pointer transition ${
                    selectedTicket?.id === tItem.id
                      ? 'bg-brand-500/10 border-l-2 border-brand-500'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-slate-400">{tItem.ticketId.slice(0, 12)}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        tItem.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {tItem.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{tItem.subject}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {new Date(tItem.updatedAt).toLocaleDateString()} · {tItem.messages.length} messages
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800 p-6 flex flex-col justify-between min-h-[500px]">
          {selectedTicket ? (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <div>
                <div className="pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span>{t('support.category', 'Category')}: {selectedTicket.category}</span>
                    <span>·</span>
                    <span>{t('support.status', 'Status')}: {selectedTicket.status}</span>
                  </div>
                </div>

                {/* Messages List */}
                <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
                  {selectedTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs ${
                        m.sender === 'USER'
                          ? 'bg-slate-900 border border-slate-800 ml-4'
                          : 'bg-brand-950/40 border border-brand-800/40 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-white">{m.sender === 'USER' ? 'You' : 'DocuParse Support'}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply box */}
              <form onSubmit={handleReply} className="pt-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('support.replyPlaceholder', 'Type your response...')}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('chat.send', 'Send')}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-xs">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-700" />
              <span>{t('support.viewTicket', 'Select a support ticket to view conversation history')}</span>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{t('support.createTitle', 'Create Support Ticket')}</h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('support.subject', 'Subject')}</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={t('support.subjectPlaceholder', 'Brief summary of your inquiry...')}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('support.category', 'Category')}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                >
                  <option value="TECHNICAL">{t('support.catTechnical', 'Technical & Extraction')}</option>
                  <option value="BILLING">{t('support.catBilling', 'Billing & Plans')}</option>
                  <option value="API">{t('support.catAccount', 'REST API & Webhooks')}</option>
                  <option value="FEATURE_REQUEST">{t('support.catFeature', 'Feature Request')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('support.msgPlaceholder', 'Message')}</label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('support.msgPlaceholder', 'Describe the issue, include document IDs or error codes if applicable...')}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500 resize-none"
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
                  {t('support.submit', 'Submit Ticket')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
