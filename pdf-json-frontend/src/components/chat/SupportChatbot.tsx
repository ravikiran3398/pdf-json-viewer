import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  Bot,
  User,
  Sparkles,
  Minimize2,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

interface Message {
  id: string;
  sender: 'USER' | 'ADMIN' | 'BOT';
  message: string;
  createdAt: string;
  userName?: string | null;
}

export const SupportChatbot: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/chat/user/messages');
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load chat messages', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setInputMessage('');
    setSending(true);

    try {
      const res = await api.post('/chat/user/send', { message: text });
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const quickQuestions = [
    'How do I renew my expired plan?',
    'Free plan 10 pages limit reached, what now?',
    'How to enable OCR for scanned invoices?',
    'Need custom schema assistance',
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-2xl shadow-brand-500/40 flex items-center space-x-2.5 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="tracking-wide">{t('chat.btn', 'Support Chat')}</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="support-chat-window rounded-3xl w-96 max-w-[calc(100vw-2rem)] h-[540px] border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 shadow-2xl flex flex-col overflow-hidden bg-slate-900 dark:bg-slate-900 light:bg-white animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 light:from-slate-800 light:via-brand-900 light:to-slate-800 border-b border-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>Customer Support Care</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-slate-300">Live Agent & AI Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={fetchMessages}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50/80">
            {messages.map((m) => {
              const isUser = m.sender === 'USER';
              const isAdmin = m.sender === 'ADMIN';

              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                      isUser
                        ? 'bg-brand-600 text-white'
                        : isAdmin
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : isAdmin ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[75%] space-y-1`}>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 px-1">
                      <span>{isUser ? 'You' : isAdmin ? 'Support Team' : 'DocuParse Bot'}</span>
                      <span>·</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl leading-relaxed text-xs ${
                        isUser
                          ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                          : isAdmin
                          ? 'bg-purple-950/80 dark:bg-purple-950/80 light:bg-purple-700 text-purple-100 rounded-tl-none border border-purple-800/40 shadow-sm'
                          : 'bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Issue Chips */}
          <div className="px-3 py-2 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 overflow-x-auto whitespace-nowrap space-x-1.5 scrollbar-none flex">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={sending}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-[10px] text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-200 transition flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-white border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('chat.inputPlaceholder', 'Describe your issue or ask customer care...')}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-xs focus:border-brand-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition disabled:opacity-40 flex items-center justify-center shadow-md shadow-brand-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
