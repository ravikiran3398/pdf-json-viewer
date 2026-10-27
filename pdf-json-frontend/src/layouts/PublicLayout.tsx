import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileCode, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { LanguageSelector } from '../components/LanguageSelector.js';
import { useTranslation } from '../context/LanguageContext.js';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { label: t('nav.features', 'Features'), path: '/features' },
    { label: t('nav.howItWorks', 'How It Works'), path: '/how-it-works' },
    { label: t('nav.pricing', 'Pricing'), path: '/pricing' },
    { label: t('nav.docs', 'Docs'), path: '/docs' },
    { label: t('nav.help', 'Help'), path: '/help' },
    { label: t('nav.enterprise', 'Enterprise'), path: '/enterprise' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 selection:bg-brand-500 selection:text-white">

      {/* Main Public Navigation */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center">
                DocuParse <span className="text-brand-400 ml-1">JSON</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">{t('nav.tagline', 'Enterprise PDF AI')}</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 xl:space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap flex-shrink-0 transition ${
                    isActive
                      ? 'text-brand-400 bg-brand-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth CTA, Language Selector & Theme Toggle */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            <LanguageSelector />
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '/admin' : '/app'}
                  className="px-3.5 py-2 text-xs lg:text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition shadow-lg shadow-brand-500/25 flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0"
                >
                  <span>{user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? t('nav.adminConsole', 'Admin Console') : t('nav.dashboard', 'Go to Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex-shrink-0"
                >
                  {t('nav.signIn', 'Sign In')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs lg:text-sm font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white transition shadow-lg shadow-brand-500/25 flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0"
                >
                  <span>{t('nav.getStarted', 'Get Started Free')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSelector compact />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-card border-b border-slate-800 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200"
              >
                {t('nav.signIn', 'Sign In')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white"
              >
                {t('nav.getStarted', 'Get Started Free')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">DocuParse JSON</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
                Developer-first, production-grade PDF to structured JSON SaaS platform. Built for automated invoice processing, receipts, forms and tabular datasets with schema enforcement.
              </p>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>All systems operational · AWS ap-south-1</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition">Pricing Plans</Link></li>
                <li><Link to="/enterprise" className="hover:text-white transition">Enterprise SLA</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Developers</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/docs" className="hover:text-white transition">Documentation</Link></li>
                <li><Link to="/docs#api-reference" className="hover:text-white transition">REST API Reference</Link></li>
                <li><Link to="/docs#schemas" className="hover:text-white transition">JSON Schemas</Link></li>
                <li><Link to="/help" className="hover:text-white transition">Help & FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Legal & Privacy</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition">Cookie Notice</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
            <p>© 2026 DocuParse JSON Inc. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <span>Encrypted at Rest with AWS S3</span>
              <span>PostgreSQL JSONB</span>
              <span>SOC2 Type II Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
