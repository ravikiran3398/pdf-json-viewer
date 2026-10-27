import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileCode, Mail, Lock, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ThemeToggle } from '../../components/ThemeToggle.js';
import { LanguageSelector } from '../../components/LanguageSelector.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, 'user');
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, restrict login page access with clear contextual screen
  if (user) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-6 right-6 z-50 flex items-center space-x-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
              DocuParse <span className="text-brand-400">JSON</span>
            </span>
          </Link>
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <div className="glass-card rounded-2xl py-8 px-6 sm:px-8 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white text-center">
            {isAdmin ? (
              <>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 mb-2">
                  Administrator Session Active
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
                  You are currently logged in with administrator privileges as <strong className="text-purple-400 font-mono">{user.email}</strong>. The user login portal is restricted to client accounts.
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
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <FileCode className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900 mb-2">
                  Active User Session Detected
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
                  You are already logged in to your workspace as <strong className="text-brand-400 font-mono">{user.email}</strong>.
                </p>
                <div className="space-y-3">
                  <Link
                    to="/app"
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2"
                  >
                    <span>Go to User Workspace</span>
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

      {/* Background glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <FileCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
            DocuParse <span className="text-brand-400">JSON</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900">
          Sign In to Your Workspace
        </h2>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
          Or{' '}
          <Link to="/register" className="text-brand-500 hover:text-brand-400 font-semibold hover:underline">
            create a new account with 10 free pages
          </Link>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-500 hover:text-brand-400 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-white dark:text-white light:text-slate-900 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-700 dark:border-slate-700 light:border-slate-300 rounded bg-slate-800 dark:bg-slate-800 light:bg-white cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-400 font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
