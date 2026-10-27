import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, Trash2, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const resolvedConfirmLabel = confirmLabel || t('common.save', 'Confirm');
  const resolvedCancelLabel = cancelLabel || t('common.cancel', 'Cancel');

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-500 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 border border-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 border border-amber-500';
      default:
        return 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 border border-brand-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={loading ? undefined : onClose}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl p-6 overflow-hidden z-10 transition-all transform animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          {getIcon()}
          <div className="flex-1 pr-2">
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              {title}
            </h3>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 transition disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>{t('dashboard.processing', 'Processing...')}</span>
              </>
            ) : (
              <span>{resolvedConfirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
