import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Bot,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

interface Conversation {
  userId: string;
  userEmail: string;
  userName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  totalMessages: number;
}

interface ChatMsg {
  id: string;
  sender: 'USER' | 'ADMIN' | 'BOT';
  message: string;
  createdAt: string;
  userName?: string | null;
}

export const AdminSupportPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'CHAT' | 'TICKETS'>('CHAT');

  // Live Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Fetch Live Chat conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/admin/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        if (!selectedUser && res.data.conversations.length > 0) {
          setSelectedUser(res.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chat conversations', err);
    }
  };

  // Fetch messages for selected user
  const fetchUserMessages = async (userId: string) => {
    try {
      const res = await api.get(`/chat/admin/messages/${userId}`);
      if (res.data.success) {
        setChatMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load user messages', err);
    }
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const res = await api.get('/admin/support/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
        if (selectedTicket) {
          const updated = res.data.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load support tickets', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserMessages(selectedUser.userId);
      const interval = setInterval(() => {
        fetchUserMessages(selectedUser.userId);
        fetchConversations();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adminReplyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await api.post('/chat/admin/reply', {
        userId: selectedUser.userId,
        message: adminReplyText.trim(),
      });
      if (res.data.success) {
        setChatMessages(res.data.messages);
        setAdminReplyText('');
        toast.success(`Reply sent to ${selectedUser.userEmail}`, 'Support Chat Sent');
        await fetchConversations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send admin reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleTicketUpdate = async (status?: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/admin/support/tickets/${selectedTicket.id}`, {
        status: status || selectedTicket.status,
        replyMessage: ticketReply || undefined,
      });

      if (res.data.success) {
        toast.success(status ? `Ticket marked as ${status}` : 'Reply posted to ticket', 'Ticket Updated');
        setTicketReply('');
        await fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Headphones className="w-6 h-6 text-purple-400" />
            <span>Customer Care & Live Support Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time customer care chatbot messages and incident tickets across all users.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'CHAT'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat ({conversations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
              activeTab === 'TICKETS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tickets ({tickets.length})</span>
          </button>
        </div>
      </div>

      {/* LIVE CHAT VIEW */}
      {activeTab === 'CHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[620px]">
          {/* Conversation List */}
          <div className="lg:col-span-4 glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Active Chat Threads</h3>
                <p className="text-[11px] text-slate-400">Users chatting via Dashboard Bot</p>
              </div>
              <button
                onClick={fetchConversations}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No chat conversations recorded yet. Users can chat from the floating chatbot on their dashboard.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.userId}
                    onClick={() => setSelectedUser(c)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between space-x-2 ${
                      selectedUser?.userId === c.userId
                        ? 'bg-purple-950/40 border-l-4 border-purple-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-xs text-white truncate">{c.userEmail}</span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-500 text-white font-bold">
                            {c.unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation Thread & Admin Reply Area */}
          <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
            {selectedUser ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-slate-800 bg-purple-950/20 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{selectedUser.userEmail}</h4>
                      <p className="text-[10px] text-slate-400">Total messages: {chatMessages.length}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Session
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-950/40">
                  {chatMessages.map((m) => {
                    const isUser = m.sender === 'USER';
                    const isAdmin = m.sender === 'ADMIN';

                    return (
                      <div
                        key={m.id}
                        className={`flex items-start space-x-2 ${
                          isAdmin ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-purple-600 text-white'
                              : isUser
                              ? 'bg-brand-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isAdmin ? <Headphones className="w-3.5 h-3.5" /> : isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>

                        <div className="max-w-[75%] space-y-1">
                          <div className={`flex items-center space-x-1.5 text-[10px] text-slate-400 px-1 ${
                            isAdmin ? 'justify-end' : ''
                          }`}>
                            <span>{isAdmin ? 'Admin (You)' : isUser ? selectedUser.userEmail : 'System Bot'}</span>
                            <span>·</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl leading-relaxed ${
                              isAdmin
                                ? 'bg-purple-600 text-white rounded-tr-none'
                                : isUser
                                ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                                : 'bg-slate-900/60 border border-slate-800/60 text-slate-300 rounded-tl-none'
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

                {/* Admin Reply Input */}
                <form onSubmit={handleSendAdminReply} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedUser.userEmail} as Support...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim() || sendingReply}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a user thread on the left to start live support chat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TICKETS VIEW */}
      {activeTab === 'TICKETS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">All Platform Inquiries</h3>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
              {ticketsLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No customer support tickets found.</div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer transition ${
                      selectedTicket?.id === t.id
                        ? 'bg-purple-950/30 border-l-2 border-purple-500'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-slate-400">{t.user?.email}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{t.subject}</h4>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800 p-6">
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedTicket.id.slice(0, 8)}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-xs text-slate-300 leading-relaxed">
                  {selectedTicket.messages?.[0]?.content || 'Ticket details.'}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <textarea
                    rows={3}
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Type official reply to developer..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleTicketUpdate('RESOLVED')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Resolve & Close Ticket
                    </button>
                    <button
                      onClick={() => handleTicketUpdate()}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs">
                Select an inquiry on the left to review or reply.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
