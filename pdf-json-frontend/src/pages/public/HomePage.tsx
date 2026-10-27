import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Database,
  Zap,
  Check,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';

export const HomePage: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const { t } = useTranslation();

  const faqs = [
    {
      q: 'How does DocuParse extract data from complex PDFs without hallucinating?',
      a: 'Unlike generic LLMs that guess missing details, DocuParse uses coordinate-aware PDF parsing (via pdfjs-dist), heuristic tabular grid alignment, and optional OCR engines. Every number, date, and line item is extracted faithfully, preserving exact values and validating them against strict Ajv schemas.',
    },
    {
      q: 'Can it process scanned or photographed documents?',
      a: 'Yes! When scanned or image-based pages are detected, DocuParse automatically routes pages through our OCR engine (Tesseract and AWS Textract hybrid pipeline), returning character confidence scores and layout markers.',
    },
    {
      q: 'Where are my uploaded PDFs and results stored?',
      a: 'Your original PDFs and generated JSON outputs are stored in isolated private AWS S3 buckets with encryption at rest (SSE-S3/KMS) and strict IAM least-privilege policies. Files are never public and can only be accessed with short-lived presigned URLs.',
    },
    {
      q: 'Can I define custom JSON Schemas for my organization?',
      a: 'Absolutely. Pro and Business users can create custom templates with JSON Schema (draft-07 / 2020) validation rules to enforce required fields, regex patterns, numerical limits, and enum types.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 lg:pt-32 overflow-hidden">
        {/* Glow background decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('hero.badge', 'Next-Generation PDF-to-JSON Engine')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            {t('hero.title', 'Convert Any PDF into High-Fidelity')}{' '}
            <span className="gradient-text">{t('hero.highlight', 'Structured JSON')}</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle', 'Extract tabular invoices, financial statements, receipts, and multi-page forms with coordinate precision, OCR fallback, and instant schema enforcement.')}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base transition shadow-xl shadow-brand-500/30 flex items-center justify-center space-x-2"
            >
              <span>{t('hero.ctaConvert', 'Start Converting Free')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/docs"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-base transition border border-slate-700 flex items-center justify-center space-x-2"
            >
              <span>{t('hero.ctaDocs', 'Explore REST API')}</span>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8 border-t border-slate-800/60 text-slate-400">
            <div>
              <p className="text-2xl font-bold text-white">99.4%</p>
              <p className="text-xs">{t('hero.statAccuracy', 'Extraction Precision')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt; 400ms</p>
              <p className="text-xs">{t('hero.statLatency', 'Average Parse Time')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs">{t('hero.statCompliance', 'Schema Enforced')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">AWS S3</p>
              <p className="text-xs">Private Vault Storage</p>
            </div>
          </div>
        </div>

        {/* Clean PDF-to-JSON Pipeline Architecture */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative bg-slate-900/60">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold mb-3">
                <Cpu className="w-3.5 h-3.5" />
                <span>Deterministic Extraction Pipeline</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">How Your Document Becomes Validated JSON</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Every uploaded PDF traverses a coordinate-aware parsing pipeline with zero mock guesswork.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 hover:border-brand-500/40 transition">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-sm mb-4">
                  01
                </div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <span>Ingestion & Spatial Mapping</span>
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Extracts raw text layer with 2D coordinates (X, Y, font metrics, line height). Automatically triggers OCR fallback when scanned pages are detected.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                  Input: Native PDF · Scans · Receipts
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 hover:border-brand-500/40 transition">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm mb-4">
                  02
                </div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Tabular & Entity Extraction</span>
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Reconstructs multi-row tabular grids, itemized lines, totals, tax amounts, and key-value fields while preserving original numeric data types.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                  Engine: Vector Spatial Alignment
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80 hover:border-brand-500/40 transition">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                  03
                </div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Schema Validation & Export</span>
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Validates output against JSON Schema (draft-07) with confidence scores. Edit in-browser, export to JSON/CSV, or stream via REST Webhooks.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                  Output: Validated JSON · REST API
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Isolated private S3 storage with AWS KMS encryption</span>
              </div>
              <Link
                to="/register"
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
              >
                <span>Upload PDF to Convert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white">Engineered for Accuracy & Scalability</h2>
          <p className="mt-4 text-base text-slate-400">
            A comprehensive pipeline that handles unstructured document complexity with enterprise guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card glass-card-hover rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Schema Enforcement</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Validate outputs against customizable Ajv JSON schemas. Catch missing tax calculations, invalid invoice numbers, and formatting errors before ingestion.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hybrid OCR & Text Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant sub-second text extraction for standard digital PDFs, plus automatic OCR fallback for scanned receipts and camera photos.
            </p>
          </div>

          <div className="glass-card glass-card-hover rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Private S3 Vault</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Documents are stored in private AWS S3 buckets. Role-based access ensures User A can never inspect or download User B’s confidential documents.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-800 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white">Simple, Usage-Based Pricing</h2>
            <p className="mt-3 text-slate-300">
              Start with 10 free pages each month. Upgrade as your automated document ingestion scales.
            </p>

            <div className="mt-8 flex justify-center space-x-6 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Free Tier (10 pages/mo)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Starter (₹299/mo)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Pro (₹799/mo)</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/pricing"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition"
              >
                <span>View Full Plan Comparison</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-slate-400">Everything you need to know about our extraction engine</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-card rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex justify-between items-center text-slate-200 font-semibold hover:text-white transition"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? <ChevronUp className="w-5 h-5 text-brand-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {expandedFaq === idx && (
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
