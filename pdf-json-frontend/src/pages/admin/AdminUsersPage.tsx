import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Ban, CheckCircle, Gift, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { api } from '../../services/api.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bonusModalUser, setBonusModalUser] = useState<any | null>(null);
  const [bonusAmount, setBonusAmount] = useState('100');

  // Plan Assignment State (for outside website purchases)
  const [planModalUser, setPlanModalUser] = useState<any | null>(null);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('starter');
  const [selectedSubStatus, setSelectedSubStatus] = useState('ACTIVE');
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });
      const res = await api.get(`/admin/users?${query.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleToggleStatus = (targetUser: any) => {
    const isDeactivating = targetUser.isActive;
    setConfirmModal({
      isOpen: true,
      title: isDeactivating ? 'Deactivate User Account' : 'Reactivate User Account',
      message: isDeactivating
        ? `Are you sure you want to deactivate ${targetUser.email}? They will immediately lose access to conversion tools and APIs.`
        : `Are you sure you want to reactivate access for ${targetUser.email}?`,
      confirmLabel: isDeactivating ? 'Deactivate Account' : 'Reactivate Account',
      variant: isDeactivating ? 'danger' : 'info',
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/users/${targetUser.id}`, { isActive: !targetUser.isActive });
          toast.success(
            isDeactivating
              ? `Account deactivated for ${targetUser.email}`
              : `Account reactivated for ${targetUser.email}`
          );
          await fetchUsers();
          setConfirmModal(null);
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Failed to update user status');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleChangeRole = (targetUser: any, newRole: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Change User Access Role',
      message: `Are you sure you want to change the platform role for ${targetUser.email} to ${newRole}?`,
      confirmLabel: 'Update Role',
      variant: newRole === 'SUPER_ADMIN' ? 'warning' : 'info',
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/users/${targetUser.id}`, { role: newRole });
          toast.success(`Role for ${targetUser.email} changed to ${newRole}`);
          await fetchUsers();
          setConfirmModal(null);
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Failed to update user role');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleGrantBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalUser) return;
    try {
      await api.patch(`/admin/users/${bonusModalUser.id}`, {
        bonusQuota: parseInt(bonusAmount, 10),
      });
      toast.success(`Granted ${bonusAmount} bonus pages to ${bonusModalUser.email}`);
      setBonusModalUser(null);
    } catch (err: any) {
      toast.error('Failed to grant bonus quota');
    }
  };

  const handleSavePlanAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalUser) return;
    setUpdatingPlan(true);
    try {
      await api.patch(`/admin/users/${planModalUser.id}`, {
        planSlug: selectedPlanSlug,
        subscriptionStatus: selectedSubStatus,
      });
      toast.success(
        `Assigned ${selectedPlanSlug.toUpperCase()} (${selectedSubStatus}) to ${planModalUser.email}`,
        'Subscription Updated'
      );
      setPlanModalUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user subscription');
    } finally {
      setUpdatingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, inspect permissions, ban/activate accounts, and adjust usage quotas.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchUsers();
          }}
          className="relative flex-1 w-full sm:w-auto"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by email or name..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-purple-500"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{u.name || 'Anonymous'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">{u.activePlan}</td>
                    <td className="py-3.5 px-4 font-mono text-brand-400">{u.documentCount} docs</td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setPlanModalUser(u);
                            setSelectedPlanSlug(u.activePlan?.toLowerCase() || 'starter');
                            setSelectedSubStatus('ACTIVE');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white transition"
                          title="Assign Plan (Outside Purchase / Renewal)"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBonusModalUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                          title="Grant Bonus Quota"
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition ${
                            u.isActive
                              ? 'bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                          title={u.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Assignment Modal (For Outside Website Purchases) */}
      {planModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              <span>Assign Subscription Plan</span>
            </h3>
            <p className="text-xs text-slate-400">
              Assign or renew a subscription tier for <strong>{planModalUser.email}</strong>. Use when a customer purchases outside the website.
            </p>

            <form onSubmit={handleSavePlanAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Subscription Tier
                </label>
                <select
                  value={selectedPlanSlug}
                  onChange={(e) => setSelectedPlanSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-brand-500 font-medium"
                >
                  <option value="free">Free Tier (10 pages/mo)</option>
                  <option value="starter">Starter Plan (500 pages/mo · ₹299)</option>
                  <option value="pro">Pro Plan (3,000 pages/mo · ₹799)</option>
                  <option value="business">Business Plan (10,000 pages/mo · ₹1999)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Subscription Status
                </label>
                <select
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-brand-500 font-medium"
                >
                  <option value="ACTIVE">Active (Valid for 30 Days)</option>
                  <option value="EXPIRED">Expired (Conversions Locked)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {updatingPlan ? 'Saving...' : 'Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Quota Modal */}
      {bonusModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">Grant Bonus Quota</h3>
            <p className="text-xs text-slate-400">
              Grant additional page capacity credit directly to {bonusModalUser.email}.
            </p>

            <form onSubmit={handleGrantBonus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bonus Pages Amount</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBonusModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Credit Pages
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmModal?.isOpen)}
        title={confirmModal?.title || 'Confirm Action'}
        message={confirmModal?.message || ''}
        confirmLabel={confirmModal?.confirmLabel || 'Confirm'}
        variant={confirmModal?.variant || 'info'}
        loading={actionLoading}
        onConfirm={confirmModal?.action || (() => {})}
        onClose={() => setConfirmModal(null)}
      />
    </div>
  );
};
