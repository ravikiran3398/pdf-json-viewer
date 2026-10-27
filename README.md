# DocuParse JSON — Enterprise PDF-to-JSON SaaS Platform

A modern, production-grade PDF-to-JSON SaaS platform built with **React 18 + Tailwind CSS**, **Node.js + Express + TypeScript**, **Prisma ORM**, and **PostgreSQL 16**.

---

## 🌟 Architecture Overview

```text
pdf-json-viewer/
├── pdf-json-frontend/       # React + Vite + TypeScript + Tailwind CSS (Public, User & Admin)
│   ├── src/
│   │   ├── app/             # Router & provider setup
│   │   ├── components/      # PdfViewer, Monaco-style JsonEditor, navigation
│   │   ├── context/         # AuthContext (JWT session & quick demo switcher)
│   │   ├── layouts/         # PublicLayout, UserLayout, AdminLayout
│   │   ├── pages/           # Public, Auth, User Dashboard, Admin Console
│   │   └── services/        # Axios API client
├── pdf-json-backend/        # Node.js + Express + TypeScript + Prisma
│   ├── prisma/              # schema.prisma & seed.ts
│   ├── src/
│   │   ├── modules/         # auth, documents, drive, batches, templates, usage, billing, api-keys, webhooks, support, admin, enquiry
│   │   ├── services/        # pdfParser, extractor, schemaValidator, storage (S3/local)
│   │   └── middleware/      # authenticate, authorize, errorHandler
```

---

## 🔑 Default Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Default User** | `user@pdfjson.com` | `User@12345` | `/login` -> `/app/*` (User Dashboard) |
| **Super Administrator** | `ravikiran.mec666@gmail.com` | `Admin@12345` | `/admin/login` -> `/admin/*` (Admin Console) |

---

## ☁️ AWS Cloud Hosting & Production Guide
For step-by-step production hosting instructions on Amazon Web Services (RDS PostgreSQL, S3, ECS/EC2, CloudFront, Route 53, ACM SSL, CI/CD), read the complete guide:
👉 **[AWS Deployment Guide](file:///c:/Users/RavikiranP-980/Desktop/pdfviewer/pdf-json-viewer/AWS_DEPLOYMENT_GUIDE.md)**

---

## 🚀 Quick Start Guide

### 1. Database & Migrations
The backend connects to PostgreSQL (port 5432) using Prisma:
```bash
cd pdf-json-backend
npx prisma migrate deploy
npx tsx prisma/clean_db.ts
```

### 2. Start Backend Server
```bash
cd pdf-json-backend
npm run dev
# Running at http://localhost:5000
# Health check: http://localhost:5000/health
# API Base: http://localhost:5000/api/v1
```

### 3. Start Frontend App
```bash
cd pdf-json-frontend
npm run dev
# Running at http://localhost:5173
```

---

## 🌐 Global Multilingual Translation (5 Languages)

The platform includes a built-in, reactive internationalization (i18n) engine with top-header language switching across all pages (Public Website, User Dashboard, Admin Console, and Auth Portals):

| Language | Code | Native Name | Flag |
| :--- | :--- | :--- | :--- |
| **English** | `en` | English | 🇺🇸 |
| **Spanish** | `es` | Español | 🇪🇸 |
| **French** | `fr` | Français | 🇫🇷 |
| **German** | `de` | Deutsch | 🇩🇪 |
| **Hindi** | `hi` | हिन्दी | 🇮🇳 |

All static texts, navigation menus, features, hero sections, pricing tiers, and console statuses adapt dynamically with localStorage preference persistence.

---

## 📄 Key Modules Implemented

### 1. Public Website (`/`)
- **Homepage (`/`)**: Hero section with interactive live PDF-to-JSON extraction preview (Invoices, Receipts, Statements), before-and-after comparisons, pricing cards, and FAQs.
- **Features (`/features`)**: Deep dive into coordinate parsing, OCR engine, and Ajv schema validation.
- **How It Works (`/how-it-works`)**: 4-step ingestion and export workflow.
- **Pricing (`/pricing`)**: Free (₹0), Starter (₹299), Pro (₹799), Business (₹1,999) with annual/monthly toggles.
- **Docs (`/docs`)**: Interactive cURL, Node.js, and JSON Schema specifications.
- **Help Center (`/help`)**, **Contact (`/contact`)**, **Enterprise (`/enterprise`)**.
- **Legal**: `/privacy`, `/terms`, `/cookies`.

### 2. User Dashboard (`/app/*`)
- **Overview (`/app`)**: Total conversions, remaining page quota progress bar, recent conversions table.
- **Upload PDF (`/app/upload`)**: Drag-and-drop zone, mode selector (`AUTO`, `FAST_TEXT`, `OCR_SCANNED`, `TABLE_FORM`), client-side validation.
- **Google Drive Import (`/app/drive`)**: OAuth connect & Google Drive file browser integration.
- **Flagship Workspace (`/app/documents/:id`)**: Dual-pane workspace with PDF preview on left and Monaco-style JSON code editor on right, Ajv schema validation badge, formatting, download, and version saving.
- **Document History (`/app/documents`)**: Status filtering, search, pagination, delete, and download.
- **Batches (`/app/batches`)**: Consolidated batch tracking and combined JSON export.
- **Templates & Schemas (`/app/templates`)**: Interactive JSON schema compiler.
- **Usage & Quotas (`/app/usage`)**: Recharts daily consumption chart and OCR breakdown.
- **Billing (`/app/billing`)**: Plan switcher with Razorpay checkout modal simulation and payment receipts.
- **API Keys (`/app/api-keys`)** & **Webhooks (`/app/webhooks`)**: Key generation with copy dialog and live ping tests.
- **Support Tickets (`/app/support`)**: Helpdesk ticket submission and conversation thread.
- **Settings (`/app/settings`)**: Profile management, active device sessions, and account deletion.

### 3. Admin Console (`/admin/*`)
- **Admin Overview (`/admin`)**: System-wide KPIs (MRR, pages processed, error rate, system status).
- **User Management (`/admin/users`)**: Search, role changer (`USER`, `ADMIN`, `SUPER_ADMIN`), status toggle, bonus quota credits.
- **Document Monitoring (`/admin/documents`)**: Platform-wide job inspection and instant retry.
- **Queue & Worker Telemetry (`/admin/jobs`)**: Concurrency caps and worker metrics.
- **Plan Management (`/admin/plans`)**: Custom pricing, page quotas, and file limits.
- **Payments & Refunds (`/admin/payments`)**: Razorpay payment history and simulated refunds.
- **Platform Analytics (`/admin/usage`)**: Historical consumption and revenue charts.
- **Support Queue (`/admin/support`)**: Customer ticket desk with official replies and status resolution.
- **Enterprise Leads (`/admin/enquiries`)**: Inquiry status tracker.
- **System Settings (`/admin/settings`)**: Global file sizes, retention days, and maintenance mode.
- **Security Audit Logs (`/admin/audit-logs`)**: Immutable log of privileged platform actions.