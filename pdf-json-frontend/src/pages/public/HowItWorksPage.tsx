import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Cpu, CheckSquare, Download, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload or Import PDF',
      description:
        'Upload your PDF files via local drag-and-drop or import directly from Google Drive via OAuth. The engine runs initial file signature validation and quota checks.',
      icon: UploadCloud,
    },
    {
      step: '02',
      title: 'Analyze & Extract Data',
      description:
        'Our pipeline reads text coordinates, page dimensions, and table borders. If pages contain scanned raster images, our OCR worker steps in automatically.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Validate Schema & Edit',
      description:
        'The extracted JSON is matched against standard or custom JSON Schemas. Inspect the original PDF side-by-side with our interactive Monaco code editor.',
      icon: CheckSquare,
    },
    {
      step: '04',
      title: 'Export & Automate',
      description:
        'Download formatted JSON, export batch archives, or ingest data directly into your backend via REST API webhooks.',
      icon: Download,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          How <span className="gradient-text">DocuParse JSON</span> Works
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          From unstructured PDF to strictly validated JSON in 4 predictable, transparent steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((s, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-800 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black text-brand-500/40 font-mono">{s.step}</span>
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-brand-400 font-medium flex items-center space-x-1">
              <span>Step {s.step} Details</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Decision Matrix Box */}
      <div className="glass-card rounded-2xl p-8 border border-slate-800">
        <h3 className="text-xl font-bold text-white mb-4">Why Native Text Extraction + OCR Matters</h3>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Arbitrary LLM prompts hallucinate line item quantities and produce inconsistent schemas. DocuParse uses coordinate-level extraction with explicit fallback heuristics:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-semibold text-brand-300 mb-2">Digital Vector PDFs (Invoices, Receipts)</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Extracted directly via PDF text glyph matrices in under 400ms. Retains 100% precision with zero OCR degradation and minimal compute overhead.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="font-semibold text-purple-300 mb-2">Scanned Images & Paper Documents</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Routed to high-accuracy OCR pre-processors with image binarization, deskewing, and word confidence scores for human verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
