import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, AlertTriangle, CheckCircle, RefreshCw, Save, Code, Braces } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';

interface JsonEditorProps {
  initialValue: Record<string, any>;
  onSave?: (newValue: Record<string, any>) => void;
  isSaving?: boolean;
  warnings?: string[] | null;
  schemaValid?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  initialValue,
  onSave,
  isSaving = false,
  warnings,
  schemaValid = true,
}) => {
  const { t } = useTranslation();
  const [jsonString, setJsonString] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      setJsonString(JSON.stringify(initialValue, null, 2));
      setParseError(null);
      setIsDirty(false);
    } catch (e: any) {
      setParseError('Failed to serialize initial JSON');
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonString(val);
    setIsDirty(true);

    try {
      JSON.parse(val);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonString);
      setJsonString(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonString);
      if (onSave) {
        onSave(parsed);
        setIsDirty(false);
      }
    } catch (err: any) {
      setParseError('Cannot save invalid JSON');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
            <Braces className="w-4 h-4 text-emerald-400" />
            <span>{t('editor.title', 'Extracted JSON')}</span>
          </div>

          {/* Validation Status Badge */}
          {parseError ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t('editor.syntaxError', 'Syntax Error')}
            </span>
          ) : schemaValid ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('editor.schemaValid', 'Schema Valid')}
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {t('editor.warnings', 'Warnings Detected')}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFormat}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1"
            title="Format / Prettify JSON"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{t('editor.format', 'Format')}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('editor.copied', 'Copied!') : t('editor.copy', 'Copy')}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1"
            title="Download JSON File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('editor.download', 'Download')}</span>
          </button>

          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving || !!parseError || !isDirty}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition flex items-center space-x-1 disabled:opacity-40 disabled:hover:bg-brand-600 shadow-sm shadow-brand-500/30"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? t('editor.saving', 'Saving...') : t('editor.saveVersion', 'Save New Version')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Warnings & Validation notice bar */}
      {(warnings && warnings.length > 0) || parseError ? (
        <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 text-xs text-amber-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            {parseError && <p className="font-semibold text-red-300">JSON Parse Error: {parseError}</p>}
            {warnings?.map((w, idx) => (
              <p key={idx}>{w}</p>
            ))}
          </div>
        </div>
      ) : null}

      {/* Textarea Code Editor */}
      <div className="flex-1 relative flex">
        {/* Line numbers column */}
        <div className="w-12 py-3 bg-slate-950/80 text-slate-600 select-none text-right pr-3 font-mono text-xs leading-relaxed border-r border-slate-800/80">
          {jsonString.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text editor */}
        <textarea
          value={jsonString}
          onChange={handleChange}
          spellCheck={false}
          className="flex-1 p-3 bg-slate-950/50 text-slate-100 font-mono text-xs leading-relaxed outline-none resize-none overflow-auto border-0 focus:ring-0 selection:bg-brand-500/40"
        />
      </div>

      {/* Editor Footer */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center">
        <span>{jsonString.split('\n').length} {t('editor.lines', 'lines')} · {jsonString.length} {t('editor.bytes', 'bytes')}</span>
        <span>{isDirty ? `● ${t('editor.unsaved', 'Unsaved changes')}` : t('editor.allSaved', 'All changes saved')}</span>
      </div>
    </div>
  );
};
