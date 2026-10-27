import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ShieldCheck, CreditCard, Sparkles, X, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';
import { api } from '../../services/api.js';

interface PlanItem {
  id?: string;
  name: string;
  slug: string;
  price: number;
  quota: number;
  ocrQuota?: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const STATIC_PLANS: PlanItem[] = [
  {
    name: 'Free',
    slug: 'free',
    price: 0,
    quota: 10,
    description: 'Ideal for testing, small scripts, and hobby projects.',
    features: [
      '10 pages per month',
      'Basic text extraction',
      'JSON live preview & Monaco editor',
      'Direct JSON download',
      'Community support',
    ],
    popular: false,
  },
  {
    name: 'Starter',
    slug: 'starter',
    price: 299,
    quota: 500,
    description: 'For freelancers and early-stage document processing workflows.',
    features: [
      '500 pages per month',
      '50 OCR scanned pages',
      'Full document history & editing',
      'JSON Schema validation',
      'Batch upload (up to 10 files)',
      'Email support (24h response)',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 799,
    quota: 3000,
    description: 'The standard choice for growing businesses and operational pipelines.',
    features: [
      '3,000 pages per month',
      '500 OCR scanned pages',
      'Custom extraction templates & schemas',
      'REST API access & personal keys',
      'ZIP & combined batch export',
      'Priority email & ticket support',
    ],
    popular: true,
  },
  {
    name: 'Business',
    slug: 'business',
    price: 1999,
    quota: 10000,
    description: 'For high-throughput automated accounting and SaaS applications.',
    features: [
      '10,000 pages per month',
      '2,500 OCR scanned pages',
      'Unlimited custom templates',
      'Real-time webhooks & event logs',
      'High-concurrency queues',
      'Dedicated account manager',
    ],
    popular: false,
  },
];

export const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Razorpay Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Unauthenticated Quick Checkout Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { user, login, register, refreshUser } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  const loadData = async () => {
    try {
      const plansRes = await api.get('/billing/plans').catch(() => null);
      if (plansRes?.data?.success && plansRes.data.plans?.length > 0) {
        setDbPlans(plansRes.data.plans);
      }
      if (user) {
        const subRes = await api.get('/billing/subscription').catch(() => null);
        if (subRes?.data?.success) {
          setCurrentSubscription(subRes.data.subscription);
          setIsExpired(subRes.data.isExpired);
        }
      }
    } catch {
      // Ignore background load error
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getDbPlanId = (slug: string) => {
    const found = dbPlans.find((p) => p.slug?.toLowerCase() === slug.toLowerCase());
    return found?.id;
  };

  const handleBuyClick = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setPaymentSuccess(false);

    if (!user) {
      // User is not logged in: show seamless inline auth modal
      setAuthModalOpen(true);
      return;
    }

    if (plan.price === 0) {
      toast.info('You already have access to the Free plan tier.');
      return;
    }

    // User is logged in: open Razorpay checkout modal
    setPaymentModalOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        await register(authEmail, authPassword);
      } else {
        await login(authEmail, authPassword, 'user');
      }
      setAuthModalOpen(false);
      setPaymentModalOpen(true);
      toast.success(`Signed in successfully as ${authEmail}`);
      loadData();
    } catch (err: any) {
      setAuthError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const executeRazorpayPayment = async () => {
    if (!selectedPlan) return;
    setPaymentProcessing(true);

    try {
      const planId = getDbPlanId(selectedPlan.slug);
      // Create checkout session on backend
      const checkoutRes = await api.post('/billing/checkout', {
        planId: planId || selectedPlan.slug,
      });

      const { orderId, amount, currency, key } = checkoutRes.data;

      // Attempt native Razorpay popup if SDK is loaded
      if (typeof (window as any).Razorpay !== 'undefined' && key && !key.includes('rzp_test_public_key')) {
        const rzp = new (window as any).Razorpay({
          key,
          amount,
          currency: currency || 'INR',
          name: 'DocuParse JSON',
          description: `${selectedPlan.name} Subscription`,
          order_id: orderId,
          handler: async (response: any) => {
            await finalizePayment(response.razorpay_order_id || orderId, response.razorpay_payment_id);
          },
          prefill: {
            name: user?.name || user?.email?.split('@')[0],
            email: user?.email,
          },
          theme: {
            color: '#3b82f6',
          },
          modal: {
            ondismiss: () => {
              setPaymentProcessing(false);
            },
          },
        });
        rzp.open();
        return;
      }

      // Fallback: Verify payment directly via backend simulated gateway
      await finalizePayment(orderId, `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to initialize payment');
      setPaymentProcessing(false);
    }
  };

  const finalizePayment = async (orderId: string, paymentId: string) => {
    try {
      const planId = getDbPlanId(selectedPlan!.slug);
      const res = await api.post('/billing/verify', {
        planId: planId || selectedPlan!.slug,
        orderId,
        paymentId,
      });

      if (res.data.success) {
        setPaymentSuccess(true);
        toast.success(`Successfully activated the ${selectedPlan!.name} plan with Razorpay!`);
        await refreshUser();
        await loadData();
        setTimeout(() => {
          setPaymentModalOpen(false);
          setPaymentSuccess(false);
        }, 1800);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Payment verification failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Predictable Plans for{' '}
          <span className="gradient-text">{t('pricing.highlight', 'Any Document Scale')}</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          {t('pricing.subtitle', 'Transparent page quotas and features. Buy directly with instant Razorpay checkout.')}
        </p>

        {/* Billing cycle toggle */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition ${
              billingPeriod === 'monthly'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('pricing.monthly', 'Monthly Billing')}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              billingPeriod === 'yearly'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{t('pricing.annual', 'Annual Billing')}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              {t('pricing.save20', 'Save 20%')}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {STATIC_PLANS.map((p) => {
          const displayPrice =
            billingPeriod === 'yearly' && p.price > 0
              ? Math.round(p.price * 0.8)
              : p.price;

          const isCurrentPlan = currentSubscription?.plan?.slug?.toLowerCase() === p.slug.toLowerCase();
          const planExpired = isCurrentPlan && isExpired;

          return (
            <div
              key={p.slug}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                isCurrentPlan && !planExpired
                  ? 'glass-card border-emerald-500 shadow-glow ring-1 ring-emerald-500/30'
                  : p.popular
                  ? 'glass-card border-brand-500 shadow-glow'
                  : 'glass-card border-slate-800'
              }`}
            >
              {isCurrentPlan && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[11px] font-bold shadow-md uppercase tracking-wider ${planExpired ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                  {planExpired ? t('pricing.currentExpired', 'Current (Expired)') : t('pricing.currentPlan', 'Current Active Plan')}
                </div>
              )}

              {!isCurrentPlan && p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-[11px] font-bold shadow-md uppercase tracking-wider">
                  {t('pricing.mostPopular', 'Most Popular')}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{t(`plan.${p.slug}.name`, p.name)}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{t(`plan.${p.slug}.desc`, p.description)}</p>

                <div className="mt-4 pb-4 border-b border-slate-800">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-white">₹{displayPrice}</span>
                    <span className="text-xs text-slate-400">{t('pricing.perMonth', '/ month')}</span>
                  </div>
                  <p className="text-xs text-brand-400 font-semibold mt-1">
                    {p.quota.toLocaleString()} {t('pricing.pagesIncluded', 'pages included')}
                  </p>
                </div>

                {/* Features list */}
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{t(`plan.${p.slug}.f${idx}`, feat)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                {isCurrentPlan && !planExpired ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center space-x-1.5 cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t('pricing.activePlan', 'Active Plan')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuyClick(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      p.price === 0
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : p.popular
                        ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {p.price === 0
                        ? t('pricing.useFree', 'Use Free Plan')
                        : planExpired
                        ? t('pricing.renewRazorpay', 'Renew with Razorpay')
                        : t('pricing.buyRazorpay', 'Buy with Razorpay')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Custom Tier Banner */}
      <div className="glass-card rounded-2xl p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
            {t('pricing.enterpriseBadge', 'Custom Enterprise')}
          </span>
          <h3 className="text-2xl font-bold text-white mt-2">
            {t('pricing.enterpriseTitle', 'Need 50,000+ Pages or Custom Document Models?')}
          </h3>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            {t('pricing.enterpriseDesc', 'We offer dedicated high-throughput workers, VPC peering, customized schema extraction fine-tuning, and SLA guarantees for enterprise volumes.')}
          </p>
        </div>
        <Link
          to="/enterprise"
          className="whitespace-nowrap px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-500/30"
        >
          {t('pricing.contactSales', 'Contact Enterprise Sales')}
        </Link>
      </div>

      {/* Razorpay Interactive Checkout Modal */}
      {paymentModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl border border-slate-700 bg-slate-900 max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => {
                if (!paymentProcessing) setPaymentModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Payment Verified!</h3>
                <p className="text-xs text-slate-300">
                  Your <strong>{selectedPlan.name}</strong> subscription has been activated with Razorpay.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 text-brand-400 mb-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-wider font-bold">Secure Razorpay Gateway</span>
                </div>
                <h3 className="text-xl font-bold text-white">Confirm Subscription</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You are subscribing to the <strong className="text-white">{selectedPlan.name} Plan</strong>.
                </p>

                <div className="mt-5 p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Plan:</span>
                    <span className="font-semibold text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Monthly Page Quota:</span>
                    <span className="font-semibold text-brand-400">{selectedPlan.quota.toLocaleString()} pages</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Billing Cycle:</span>
                    <span className="font-semibold text-white capitalize">{billingPeriod}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm">
                    <span className="font-bold text-white">Total Payable:</span>
                    <span className="font-extrabold text-lg text-emerald-400">
                      ₹{billingPeriod === 'yearly' ? Math.round(selectedPlan.price * 0.8) : selectedPlan.price}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit SSL Encrypted · Supported: UPI, Cards & NetBanking</span>
                </div>

                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={executeRazorpayPayment}
                    disabled={paymentProcessing}
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing with Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{billingPeriod === 'yearly' ? Math.round(selectedPlan.price * 0.8) : selectedPlan.price} via Razorpay</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPaymentModalOpen(false)}
                    disabled={paymentProcessing}
                    className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unauthenticated User Auth Modal */}
      {authModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl border border-slate-700 bg-slate-900 max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-bold">
                {selectedPlan.name} Plan (₹{selectedPlan.price}/mo)
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {authMode === 'register' ? 'Create Account & Checkout' : 'Sign In to Complete Purchase'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your details to proceed to Razorpay checkout.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                className="text-xs text-brand-400 hover:underline"
              >
                {authMode === 'register'
                  ? 'Already have an account? Sign In instead'
                  : "Don't have an account? Sign Up free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
