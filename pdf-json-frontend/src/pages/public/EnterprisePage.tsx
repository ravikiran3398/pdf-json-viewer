import React, { useState } from 'react';
import { Building2, Shield, Cpu, Users, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';

export const EnterprisePage: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    estimatedVolume: '25,000 - 100,000 pages/mo',
    requirements: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/enquiry/enterprise', formData);
      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit enterprise inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
          Enterprise Solutions
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
          High-Volume Document AI for{' '}
          <span className="gradient-text">Global Enterprises</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Dedicated VPC deployments, custom template fine-tuning, HIPAA/SOC2 compliance architecture, and guaranteed SLA response times.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Value Prop Columns */}
        <div className="lg:col-span-5 space-y-8">
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Dedicated AWS Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deploy your own isolated S3 buckets, dedicated SQS workers, and private RDS PostgreSQL clusters with zero multi-tenant data bleed.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Custom Document AI Schemas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our engineers train bespoke heuristic and OCR extraction rules for proprietary vendor invoices, customs manifests, and tax declaration filings.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">24/7 Dedicated Engineering SLA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct Slack/Teams channel with our senior systems architects, 99.99% uptime guarantee, and custom contract billing terms.
            </p>
          </div>
        </div>

        {/* Enterprise Inquiry Form */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-8 border border-purple-500/30">
          {submitted ? (
            <div className="text-center py-16 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
              <h3 className="text-2xl font-bold text-white">Enterprise Enquiry Received</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Thank you. Our enterprise solutions lead will contact you via email and phone to discuss your technical architecture and volumes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-xl font-bold text-white mb-1">Request Enterprise Evaluation</h3>
              <p className="text-xs text-slate-400 mb-4">Fill out the details below to receive a custom proposal within 24 hours.</p>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Financial Corp"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="John Smith"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@acmefin.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Monthly Document Volume</label>
                <select
                  value={formData.estimatedVolume}
                  onChange={(e) => setFormData({ ...formData, estimatedVolume: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition"
                >
                  <option>10,000 - 25,000 pages/mo</option>
                  <option>25,000 - 100,000 pages/mo</option>
                  <option>100,000 - 500,000 pages/mo</option>
                  <option>500,000+ pages/mo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Technical Requirements & Pipeline Context</label>
                <textarea
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Tell us about your document formats, current challenges, hosting requirements..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-purple-500 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Submitting...' : 'Submit Enterprise Enquiry'}</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
