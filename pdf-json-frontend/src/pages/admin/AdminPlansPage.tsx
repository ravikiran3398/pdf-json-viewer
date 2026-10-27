import React, { useState, useEffect } from 'react';
import { Layers, Edit3, Check, Save } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminPlansPage: React.FC = () => {
  const toast = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/plans');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err: any) {
      console.error('Failed to load plans', err);
      toast.error('Failed to load plans configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await api.patch(`/admin/plans/${editingPlan.id}`, {
        price: parseInt(editingPlan.price, 10),
        pageQuota: parseInt(editingPlan.pageQuota, 10),
        ocrQuota: parseInt(editingPlan.ocrQuota, 10),
        maxFileSizeMb: parseInt(editingPlan.maxFileSizeMb, 10),
      });

      if (res.data.success) {
        toast.success(`Parameters for ${editingPlan.name} plan updated successfully`, 'Plan Saved');
        setEditingPlan(null);
        await fetchPlans();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update plan');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Layers className="w-6 h-6 text-purple-400" />
          <span>Subscription Plan Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure pricing tiers, monthly page quotas, and maximum file sizes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <span className="text-xs font-mono text-purple-400">₹{p.price}/mo</span>
              </div>
              <p className="text-xs text-brand-400 font-semibold mb-4">{p.pageQuota} pages included</p>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p>OCR Allowance: <strong className="text-white">{p.ocrQuota} pages</strong></p>
                <p>Max Upload Size: <strong className="text-white">{p.maxFileSizeMb} MB</strong></p>
                <p>Status: <strong className="text-emerald-400">{p.isActive ? 'Active' : 'Disabled'}</strong></p>
              </div>
            </div>

            <button
              onClick={() => setEditingPlan(p)}
              className="mt-6 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Plan Parameters</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Edit {editingPlan.name} Plan</h3>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Price (INR)</label>
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Page Quota</label>
                <input
                  type="number"
                  value={editingPlan.pageQuota}
                  onChange={(e) => setEditingPlan({ ...editingPlan, pageQuota: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">OCR Quota</label>
                <input
                  type="number"
                  value={editingPlan.ocrQuota}
                  onChange={(e) => setEditingPlan({ ...editingPlan, ocrQuota: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max File Size (MB)</label>
                <input
                  type="number"
                  value={editingPlan.maxFileSizeMb}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxFileSizeMb: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
