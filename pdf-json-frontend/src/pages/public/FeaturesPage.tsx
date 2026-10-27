import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Scan,
  Braces,
  CheckCircle2,
  Table,
  Cpu,
  Shield,
  Zap,
  KeyRound,
  Webhook,
  ArrowRight,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: 'Precision Text Extraction',
      description:
        'Uses coordinate-aware pdfjs-dist rendering to parse text blocks, bounding boxes, and reading order rather than raw unorganized text blobs.',
    },
    {
      icon: Scan,
      title: 'Hybrid OCR for Scanned PDFs',
      description:
        'Automatically senses when a page is an image or scan. Dispatches the document to Tesseract/AWS Textract with character confidence scoring.',
    },
    {
      icon: Table,
      title: 'Table & Multi-Column Heuristics',
      description:
        'Dissects complex invoice line items, financial statements, and tabular grids into typed JSON arrays with quantity, unit price, and subtotal math verification.',
    },
    {
      icon: Braces,
      title: 'Monaco Code Editor',
      description:
        'Built-in VS Code-grade Monaco JSON editor right in your browser with real-time syntax checking, auto-formatting, and version diffing.',
    },
    {
      icon: CheckCircle2,
      title: 'Ajv Schema Validation',
      description:
        'Validate extraction payloads against custom or system JSON Schemas. Highlight missing tax IDs or miscalculated totals with error line references.',
    },
    {
      icon: Shield,
      title: 'Private S3 Vault Storage',
      description:
        'Zero public exposure. Original PDFs and JSON outputs are stored in isolated AWS S3 buckets with AES-256 encryption and time-limited signed URLs.',
    },
    {
      icon: KeyRound,
      title: 'Developer REST APIs',
      description:
        'Integrate PDF-to-JSON extraction directly into your backend with scoped API keys, webhooks, and predictable JSON payloads.',
    },
    {
      icon: Webhook,
      title: 'Real-Time Webhooks',
      description:
        'Subscribe to conversion.completed or conversion.failed events. Includes automated signature headers and delivery attempt logs.',
    },
    {
      icon: Zap,
      title: 'Batch Multi-Upload',
      description:
        'Upload dozens of vendor invoices simultaneously. Track individual processing jobs with consolidated zip or combined JSON export.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Enterprise Features Built for{' '}
          <span className="gradient-text">Developers & Teams</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Everything required to convert complex, heterogeneous PDF documents into pristine, structured data pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((item, idx) => (
          <div key={idx} className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to automate your document processing?</h2>
        <p className="text-slate-300 max-w-xl mx-auto mb-6 text-sm">
          Join hundreds of engineering teams using DocuParse to convert invoices, receipts, and forms with confidence.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 transition"
        >
          <span>Start Free Today</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
