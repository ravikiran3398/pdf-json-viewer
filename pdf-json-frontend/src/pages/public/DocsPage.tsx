import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, Braces, BookOpen } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://api.docuparse.io/api/v1/documents/upload \\
  -H "Authorization: Bearer pk_live_your_api_key_here" \\
  -F "file=@invoice_sample.pdf" \\
  -F "extractionMode=AUTO"`;

  const nodeExample = `import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const form = new FormData();
form.append('file', fs.createReadStream('./invoice.pdf'));
form.append('extractionMode', 'AUTO');

const response = await axios.post('https://api.docuparse.io/api/v1/documents/upload', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer pk_live_your_api_key_here'
  }
});

console.log('Extracted Data:', response.data.result.data);`;

  const responseExample = `{
  "success": true,
  "message": "PDF processed successfully",
  "document": {
    "id": "doc_8f12a9c4-b819",
    "originalFileName": "invoice.pdf",
    "pageCount": 2,
    "status": "COMPLETED",
    "processingDurationMs": 348
  },
  "result": {
    "version": 1,
    "confidenceScore": 0.98,
    "schemaValid": true,
    "data": {
      "documentType": "INVOICE",
      "invoiceNumber": "INV-2026-081",
      "invoiceDate": "2026-10-27",
      "currency": "INR",
      "financialSummary": {
        "subtotal": 12500,
        "taxAmount": 2250,
        "totalAmount": 14750
      }
    }
  }
}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          API & Schema{' '}
          <span className="gradient-text">Documentation</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Complete REST API reference, JSON Schema validation specs, and authentication guides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of contents sidebar */}
        <div className="lg:col-span-1 space-y-2 text-sm">
          <div className="glass-card rounded-xl p-4 border border-slate-800 sticky top-24">
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-xs">API Reference</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#authentication" className="hover:text-brand-400 transition block">Authentication</a></li>
              <li><a href="#endpoints" className="hover:text-brand-400 transition block">Upload Endpoint</a></li>
              <li><a href="#schemas" className="hover:text-brand-400 transition block">JSON Schemas</a></li>
              <li><a href="#webhooks" className="hover:text-brand-400 transition block">Webhooks & Events</a></li>
              <li><a href="#rate-limits" className="hover:text-brand-400 transition block">Rate Limits & Quotas</a></li>
            </ul>
          </div>
        </div>

        {/* Documentation Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* Authentication */}
          <section id="authentication" className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-brand-400" />
              <span>Authentication</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              All requests to the DocuParse API must include an API Key or Bearer Token in the HTTP Authorization header:
            </p>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs text-brand-300">
              Authorization: Bearer pk_live_your_api_key_here
            </div>
          </section>

          {/* Upload Endpoint */}
          <section id="endpoints" className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded bg-brand-600 text-white font-mono font-bold text-xs">POST</span>
              <span className="font-mono text-slate-200 text-sm">/api/v1/documents/upload</span>
            </div>
            <p className="text-sm text-slate-300">
              Upload a multipart/form-data PDF file. The engine validates magic bytes, reserves usage quota, executes coordinate extraction and returns structured JSON immediately.
            </p>

            {/* Code Tabs */}
            <div className="space-y-4">
              {/* cURL */}
              <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-300">cURL Example</span>
                  <button
                    onClick={() => handleCopy(curlExample, 'curl')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    {copiedSection === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  {curlExample}
                </pre>
              </div>

              {/* Node.js */}
              <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-300">Node.js (Axios)</span>
                  <button
                    onClick={() => handleCopy(nodeExample, 'node')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    {copiedSection === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'node' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  {nodeExample}
                </pre>
              </div>

              {/* JSON Response Contract */}
              <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-300">Response (200 OK)</span>
                  <button
                    onClick={() => handleCopy(responseExample, 'resp')}
                    className="text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    {copiedSection === 'resp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-emerald-400/90 overflow-x-auto leading-relaxed max-h-72">
                  {responseExample}
                </pre>
              </div>
            </div>
          </section>

          {/* JSON Schemas */}
          <section id="schemas" className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Braces className="w-6 h-6 text-brand-400" />
              <span>Standard Extraction Schemas</span>
            </h2>
            <p className="text-sm text-slate-300">
              DocuParse includes verified schemas for Invoices, Receipts, and Bank Statements. All schemas are compiled with Ajv (JSON Schema draft-07 compatible).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
