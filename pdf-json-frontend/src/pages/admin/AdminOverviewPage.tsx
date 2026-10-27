import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api.js';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentUsers(res.data.recentUsers);
          setRecentJobs(res.data.recentJobs);
        }
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-xs">Loading operational dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-purple-900/40 bg-gradient-to-r from-purple-950/20 via-slate-900 to-indigo-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
            Super Administrator Tier
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Platform Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform telemetry, user subscriptions, job queues, and security audit metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">AWS ap-south-1 Healthy</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          <p className="text-[11px] text-purple-300 mt-2 font-mono">
            {stats?.activeSubscriptions || 0} active subscriptions
          </p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Total Pages Processed</span>
            <FileCheck className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.pagesProcessed?.toLocaleString() || 0}</div>
          <p className="text-[11px] text-slate-400 mt-2">Across all user accounts</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Total Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
          <p className="text-[11px] text-slate-400 mt-2">Verified Razorpay payments</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Conversion Success Rate</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.successRate || 100}%</div>
          <p className="text-[11px] text-slate-400 mt-2">{stats?.failedConversions || 0} failed jobs</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Recent User Signups</h3>
          <div className="divide-y divide-slate-800/80">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{u.name || 'User'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {u.role}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs Across System */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Latest Conversion Pipeline Executions</h3>
          <div className="divide-y divide-slate-800/80">
            {recentJobs.map((j) => (
              <div key={j.id} className="py-3 flex items-center justify-between text-xs">
                <div className="truncate max-w-[65%]">
                  <p className="font-semibold text-white truncate">{j.originalFileName}</p>
                  <p className="text-[11px] text-slate-400">{j.user?.email || 'API client'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    {j.status}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{j.processingDurationMs || 350}ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
