import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  FileCode,
  LayoutDashboard,
  UploadCloud,
  FolderTree,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  History,
  HardDrive,
  Files,
  FileSpreadsheet,
  KeyRound,
  Webhook,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { LanguageSelector } from '../components/LanguageSelector.js';
import { useTranslation } from '../context/LanguageContext.js';
import { SupportChatbot } from '../components/chat/SupportChatbot.js';

export const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);

  // Core essential streamlined navigation
  const primaryNavigation = [
    { name: t('userNav.overview', 'Overview'), href: '/app', icon: LayoutDashboard },
    { name: t('userNav.convertPdf', 'Convert PDF'), href: '/app/upload', icon: UploadCloud },
    { name: t('userNav.documents', 'Documents & JSON'), href: '/app/documents', icon: FolderTree },
    { name: t('userNav.billing', 'Usage & Billing'), href: '/app/billing', icon: CreditCard },
    { name: t('userNav.activity', 'Activity & Audit'), href: '/app/activity', icon: History },
    { name: t('userNav.support', 'Customer Support'), href: '/app/support', icon: HelpCircle },
    { name: t('userNav.settings', 'Account Settings'), href: '/app/settings', icon: Settings },
  ];

  // Secondary advanced / developer tools (collapsible to keep UI uncluttered)
  const secondaryNavigation = [
    { name: t('userNav.googleDrive', 'Google Drive'), href: '/app/drive', icon: HardDrive },
    { name: t('userNav.batches', 'Batch Processing'), href: '/app/batches', icon: Files },
    { name: t('userNav.templates', 'Custom Schemas'), href: '/app/templates', icon: FileSpreadsheet },
    { name: t('userNav.apiKeys', 'API Keys'), href: '/app/api-keys', icon: KeyRound },
    { name: t('userNav.webhooks', 'Webhooks'), href: '/app/webhooks', icon: Webhook },
  ];

  const isExpired = Boolean(user?.isSubscriptionExpired || user?.subscriptionStatus === 'EXPIRED');
  const quota = user?.usage?.pageQuota || (user?.activePlan?.pageQuota ?? 10);
  const used = user?.usage?.pagesUsed || 0;
  const quotaPercent = Math.min(100, Math.round((used / quota) * 100));

  const isSecondaryActive = secondaryNavigation.some((item) => location.pathname === item.href);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed to screen height with internal scrollable nav and pinned bottom logout */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full bg-slate-900/95 border-r border-slate-800 flex flex-col flex-shrink-0 transition-transform duration-300 lg:static lg:h-full lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex-shrink-0 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <FileCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-white">
              DocuParse <span className="text-brand-400">JSON</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota Progress Pill */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span className="font-medium text-slate-300">{t('userNav.planQuota', 'Plan Quota')}</span>
            {isExpired ? (
              <span className="font-mono text-red-400 font-bold text-[10px] uppercase">{t('userNav.expired', 'Expired')}</span>
            ) : (
              <span className="font-mono text-brand-400 font-semibold">{used} / {quota} {t('userNav.pages', 'pages')}</span>
            )}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isExpired ? 'bg-red-500' : quotaPercent >= 100 ? 'bg-amber-400' : 'bg-brand-500'
              }`}
              style={{ width: `${isExpired || quotaPercent >= 100 ? 100 : quotaPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 capitalize">{user?.activePlan?.name || t('plan.free.name', 'Free')} {t('userNav.plan', 'Plan')}</span>
            <Link to="/app/billing" className={`text-[11px] font-semibold hover:underline ${isExpired ? 'text-red-400' : 'text-brand-400'}`}>
              {isExpired ? t('userNav.buyAgain', 'Buy Again') : t('userNav.upgrade', 'Upgrade')}
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-3 space-y-1 overflow-y-auto">
          {/* Primary Nav Items */}
          {primaryNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Collapsible Advanced Tools Section */}
          <div className="pt-2">
            <button
              onClick={() => setShowDeveloperTools(!showDeveloperTools)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
            >
              <span>{t('userNav.developer', 'Integrations & Developer')}</span>
              {showDeveloperTools || isSecondaryActive ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {(showDeveloperTools || isSecondaryActive) && (
              <div className="space-y-1 pl-2 pt-1">
                {secondaryNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Profile Card & Logout - Pinned to Fixed Bottom */}
        <div className="flex-shrink-0 mt-auto p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 flex-shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title={t('nav.signOut', 'Sign Out')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* Top Header bar */}
        <header className="relative z-30 h-16 flex-shrink-0 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-slate-200">
              {t('userNav.workspace', 'Workspace Dashboard')}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {/* Global Language Selector */}
            <LanguageSelector />

            {/* Dark & Light Theme Switcher */}
            <ThemeToggle />

            <Link
              to="/app/upload"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition flex items-center space-x-1.5 shadow-sm shadow-brand-500/20 whitespace-nowrap flex-shrink-0"
            >
              <UploadCloud className="w-4 h-4 flex-shrink-0" />
              <span>{t('userNav.convertPdf', 'Convert PDF')}</span>
            </Link>
          </div>
        </header>

        {/* Dynamic App Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Customer Care Live Chatbot */}
      <SupportChatbot />
    </div>
  );
};
