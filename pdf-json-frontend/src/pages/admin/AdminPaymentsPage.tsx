import React, { useState, useEffect } from 'react';
import { CreditCard, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';
import { ConfirmModal } from '../../components/common/ConfirmModal.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminPaymentsPage: React.FC = () => {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation modal state
  const [refundTarget, setRefundTarget] = useState<{ id: string; amount: number; userEmail?: string } | null>(null);
  const [refunding, setRefunding] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/payments');
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (err: any) {
      console.error('Failed to load admin payments', err);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const executeRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await api.post(`/admin/payments/${refundTarget.id}/refund`);
      toast.success(
        `Successfully processed refund of ₹${refundTarget.amount} for ${refundTarget.userEmail || 'customer'}.`,
        'Refund Issued'
      );
      setRefundTarget(null);
      await fetchPayments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <span>Payment & Revenue Reconciliation</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Review Razorpay transaction receipts, orders, and refund requests.</p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction / User</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider Order ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No payment records found. Database is clean.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{p.receiptNumber || 'Payment Receipt'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.user?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{p.amount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{p.orderId || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-purple-400">{p.paymentId || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'SUCCESS' && (
                        <button
                          onClick={() => setRefundTarget({ id: p.id, amount: p.amount, userEmail: p.user?.email })}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition flex items-center space-x-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern High-End Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(refundTarget)}
        title="Confirm Payment Refund"
        message={
          refundTarget
            ? `Are you sure you want to issue a full refund of ₹${refundTarget.amount} to ${refundTarget.userEmail || 'this customer'}? The transaction status will be updated to REFUNDED.`
            : ''
        }
        confirmLabel="Issue Full Refund"
        cancelLabel="Cancel"
        variant="danger"
        loading={refunding}
        onConfirm={executeRefund}
        onClose={() => setRefundTarget(null)}
      />
    </div>
  );
};
