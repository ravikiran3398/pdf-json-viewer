import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Scan, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../services/api.js';

export const AdminUsagePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await api.get('/admin/usage');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load platform analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-xs">Loading analytics charts...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          <span>Platform-Wide Usage & Revenue Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Aggregated consumption trends, monthly revenue growth, and OCR compute loads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Total System Pages</div>
          <div className="text-2xl font-bold text-white">{data?.stats?.totalPages || 0}</div>
          <p className="text-[11px] text-slate-500 mt-2">Combined vector and OCR pages</p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">OCR Engine Load</div>
          <div className="text-2xl font-bold text-purple-400">{data?.stats?.ocrPages || 0} pages</div>
          <p className="text-[11px] text-slate-500 mt-2">Scanned / photographic docs</p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Vector Text Speed</div>
          <div className="text-2xl font-bold text-emerald-400">{data?.stats?.textPages || 0} pages</div>
          <p className="text-[11px] text-slate-500 mt-2">Fast parsing under 400ms</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Monthly Pages Processed (Historical)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.monthlyData || []}>
              <defs>
                <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="pages" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPages)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
