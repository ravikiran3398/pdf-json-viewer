import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, ArrowRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { LanguageSelector } from '../../components/LanguageSelector.js';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, restrict admin login page access with clear contextual screen
  if (user) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-6 right-6 z-50 flex items-center space-x-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
          <div className="inline-flex items-center space-x-2.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
              DocuParse <span className="text-purple-400">Admin</span>
            </span>
          </div>
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <div className="glass-card rounded-2xl py-8 px-6 sm:px-8 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white text-center">
            {isAdmin ? (
              <>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 mb-2">
                  Administrator Session Active
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
                  You are currently authenticated as administrator <strong className="text-purple-400 font-mono">{user.email}</strong>.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/admin"
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2"
                  >
                    <span>Open Admin Console</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/60 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium text-xs transition"
                  >
                    Sign Out / Switch Account
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 mb-2">
                  Access Denied: Privileged Console
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
                  You are signed in as standard user <strong className="text-slate-200 font-mono">{user.email}</strong>. Standard client accounts are strictly prohibited from accessing administrative tools.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/app"
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2"
                  >
                    <span>Return to User Workspace</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800/60 text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium text-xs transition"
                  >
                    Sign Out / Switch to Administrator
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 relative overflow-hidden transition-colors duration-200">
      {/* Theme toggle & Language Selector in top right */}
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center space-x-2.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
            DocuParse <span className="text-purple-400">Admin</span>
          </span>
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-purple-900/30 dark:bg-purple-900/30 light:bg-purple-100 border border-purple-500/30 dark:border-purple-500/30 light:border-purple-200 text-[11px] font-mono text-purple-300 dark:text-purple-300 light:text-purple-700 font-semibold mb-3">
          PRIVILEGED CONSOLE
        </div>
        <h2 className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900">
          Administrator Sign In
        </h2>
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
          Authorized personnel only. All access attempts are cryptographically audited.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-card rounded-2xl py-8 px-6 sm:px-8 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center justify-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
              <span>Session Isolation & IP Audit Logging Active</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
