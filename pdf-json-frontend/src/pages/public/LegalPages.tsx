import React from 'react';

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
    <p className="text-xs text-slate-400">Last updated: October 27, 2026</p>

    <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">1. Information We Collect & Document Privacy</h2>
        <p>
          DocuParse processes PDF documents uploaded directly by you or imported via authorized Google Drive integrations. We collect account credentials (email address, encrypted password hashes, and company name), billing records via Razorpay, and technical usage telemetry.
        </p>
        <p>
          <strong>Customer PDF Content Guarantee:</strong> We do NOT use customer PDF files or extracted JSON payloads to train public or foundational artificial intelligence models. Document contents are processed ephemerally or stored in customer-isolated private AWS S3 buckets.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">2. Data Retention & Deletion</h2>
        <p>
          You may delete any document, extraction version, or entire workspace account at any time via the User Dashboard. Upon deletion, documents and cached extraction artifacts are permanently purged from AWS S3 and PostgreSQL within 24 hours.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">3. Security Standards</h2>
        <p>
          All data in transit is encrypted using TLS 1.3. All data at rest in AWS S3 and RDS PostgreSQL is encrypted using AES-256 with KMS key management.
        </p>
      </section>
    </div>
  </div>
);

export const TermsOfServicePage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service</h1>
    <p className="text-xs text-slate-400">Last updated: October 27, 2026</p>

    <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">1. Service Description & Acceptable Use</h2>
        <p>
          DocuParse provides developer APIs and web dashboards to extract, transform, and validate data from PDF documents into structured JSON. You agree not to use the service for processing unlawful, malicious, or infringing materials.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">2. Quotas & Subscriptions</h2>
        <p>
          Usage is billed on a monthly cycle according to your selected plan. Quotas refresh at the beginning of each billing interval. Unused pages do not roll over to subsequent months unless explicitly provided in an Enterprise agreement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-white">3. Limitation of Liability & Document Accuracy</h2>
        <p>
          PDF conversion is best-effort and subject to document quality, scanning resolution, and layout complexity. Users must validate critical financial figures using our schema validation and verification tools prior to financial disbursement.
        </p>
      </section>
    </div>
  </div>
);

export const CookieNoticePage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Cookie & Tracking Notice</h1>
    <p className="text-xs text-slate-400">Last updated: October 27, 2026</p>

    <div className="glass-card rounded-2xl p-8 border border-slate-800 space-y-6 text-sm text-slate-300 leading-relaxed">
      <p>
        DocuParse uses strictly essential session tokens to authenticate user requests and maintain secure state across dashboard views.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-xs">
        <li><strong>Auth Session Tokens:</strong> Secure JWT stored in localStorage for authenticated API calls.</li>
        <li><strong>Preferences:</strong> Theme (dark/light) and preferred code editor layout state.</li>
        <li><strong>No Third-Party Ad Trackers:</strong> We do not sell user data or embed third-party advertising tracking cookies.</li>
      </ul>
    </div>
  </div>
);
