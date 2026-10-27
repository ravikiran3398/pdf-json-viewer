import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  FileCheck2,
  ListTodo,
  Layers,
  CreditCard,
  TrendingUp,
  Headphones,
  Building2,
  Sliders,
  History,
  ArrowLeft,
  Menu,
  X,
  Activity,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { LanguageSelector } from '../components/LanguageSelector.js';
import { useTranslation } from '../context/LanguageContext.js';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check admin role permissions
  if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app" replace />;
  }

  const adminNav = [
    { name: t('admin.overview', 'Admin Overview'), href: '/admin', icon: Activity },
    { name: t('admin.users', 'User Management'), href: '/admin/users', icon: Users },
    { name: t('admin.documents', 'Document Monitoring'), href: '/admin/documents', icon: FileCheck2 },
    { name: t('admin.jobs', 'Queue & Jobs'), href: '/admin/jobs', icon: ListTodo },
    { name: t('admin.plans', 'Plan Management'), href: '/admin/plans', icon: Layers },
    { name: t('admin.payments', 'Payments & Refunds'), href: '/admin/payments', icon: CreditCard },
    { name: t('admin.usage', 'Platform Analytics'), href: '/admin/usage', icon: TrendingUp },
    { name: t('admin.supportQueue', 'Support Desk'), href: '/admin/support', icon: Headphones },
    { name: t('admin.enquiries', 'Enterprise Leads'), href: '/admin/enquiries', icon: Building2 },
    { name: t('admin.settings', 'System Settings'), href: '/admin/settings', icon: Sliders },
    { name: t('admin.audit', 'Security Audit Logs'), href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex transition-colors duration-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Pinned fixed bottom */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full bg-slate-900 border-r border-purple-900/30 flex flex-col flex-shrink-0 transition-transform duration-300 lg:static lg:h-full lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex-shrink-0 px-6 border-b border-purple-900/30 flex items-center justify-between bg-purple-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block leading-tight">Admin Console</span>
              <span className="text-[10px] text-purple-400 font-mono">Privileged Tier</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Back to User Dashboard button */}
        <div className="flex-shrink-0 p-3 border-b border-slate-800">
          <Link
            to="/app"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-brand-400" />
            <span>Return to User App</span>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 min-h-0 px-3 py-3 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin profile footer - Pinned to Fixed Bottom */}
        <div className="flex-shrink-0 mt-auto p-4 border-t border-purple-900/30 bg-purple-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate max-w-[75%]">
              <p className="text-xs font-semibold text-purple-200 truncate">{user?.name || 'Administrator'}</p>
              <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300 font-mono mt-0.5">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
        <header className="relative z-30 h-16 flex-shrink-0 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-semibold text-slate-200">
                {t('admin.status', 'System Status: 100% Operational')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-slate-400 flex-shrink-0">
            <span className="hidden sm:inline-block font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700 whitespace-nowrap">
              PostgreSQL 16 · AWS S3 Active
            </span>
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Admin Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
