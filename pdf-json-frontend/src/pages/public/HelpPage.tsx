import React, { useState } from 'react';
import { Search, HelpCircle, FileText, ChevronRight, MessageSquare, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const articles = [
    {
      title: 'How to handle scanned or photographic PDFs',
      category: 'Processing & OCR',
      snippet: 'Configure extractionMode: "OCR_SCANNED" to route image-heavy pages through our Tesseract & AWS Textract hybrid pipeline.',
    },
    {
      title: 'Configuring Ajv Schema validation for line items',
      category: 'Templates & Schemas',
      snippet: 'Set required fields in your custom JSON schema. Our validator checks array lengths, numerical ranges, and regex matches.',
    },
    {
      title: 'Importing files from Google Drive with OAuth 2.0',
      category: 'Integrations',
      snippet: 'Authorize your Google Workspace account with read-only scopes. Files are streamed securely into your private S3 bucket without public exposure.',
    },
    {
      title: 'Understanding Page Quotas & Ledger Accounting',
      category: 'Billing',
      snippet: 'Every page parsed deducts 1 page from your monthly quota. Failed jobs release their reservations automatically.',
    },
    {
      title: 'Webhook delivery signatures and HMAC verification',
      category: 'API & Webhooks',
      snippet: 'Verify the X-DocuParse-Signature header on incoming webhook events using your unique webhook secret.',
    },
  ];

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.snippet.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Help & <span className="gradient-text">Knowledge Base</span>
        </h1>
        <p className="mt-3 text-base text-slate-300">
          Find answers, troubleshooting tips, and best practices for converting PDFs into JSON.
        </p>

        {/* Search Input */}
        <div className="mt-6 relative max-w-lg mx-auto">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documentation, OCR tips, error codes..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:border-brand-500 outline-none transition shadow-inner"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div key={idx} className="glass-card glass-card-hover rounded-xl p-5 border border-slate-800">
            <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider">
              {item.category}
            </span>
            <h3 className="text-base font-bold text-white mt-1 mb-1.5">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">{item.snippet}</p>
            <div className="flex items-center space-x-1 text-xs text-brand-400 font-semibold hover:underline cursor-pointer">
              <span>Read article</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Still need help CTA */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Can't find what you're looking for?</h4>
          <p className="text-xs text-slate-400">Our engineering support team is available around the clock.</p>
        </div>
        <Link
          to="/contact"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
        >
          Submit Support Ticket
        </Link>
      </div>
    </div>
  );
};
