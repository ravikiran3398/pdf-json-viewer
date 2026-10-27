import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, CheckCircle, Code, Trash2, Edit3, Braces } from 'lucide-react';
import { api } from '../../services/api.js';
import { ExtractionTemplate } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const TemplatesPage: React.FC = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(
      {
        type: 'object',
        required: ['invoiceNumber', 'totalAmount'],
        properties: {
          invoiceNumber: { type: 'string' },
          totalAmount: { type: 'number' },
          currency: { type: 'string' },
        },
      },
      null,
      2
    )
  );

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates');
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedSchema = JSON.parse(schemaText);
      const res = await api.post('/templates', { name, description, schema: parsedSchema });
      if (res.data.success) {
        setShowCreateModal(false);
        setName('');
        setDescription('');
        toast.success(`Custom JSON schema "${name}" created successfully`, 'Schema Saved');
        await fetchTemplates();
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid JSON schema format');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-400" />
            <span>{t('templates.title', 'Custom JSON Schemas & Templates')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('templates.subtitle', 'Define custom extraction rules and Ajv JSON schemas to match your downstream ERP/database schemas.')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('templates.new', 'New Schema Template')}</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{tpl.name}</span>
                {tpl.isSystem ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    System Built-in
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Custom User
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">{tpl.description || 'Standard JSON extraction schema'}</p>

              {/* Schema snippet */}
              <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-36">
                <pre>{JSON.stringify(tpl.schema, null, 2)}</pre>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Ajv Draft-07 Compliant</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">{t('templates.new', 'New Schema Template')}</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('templates.name', 'Template Name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. EU VAT Invoice"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('templates.desc', 'Description')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of expected fields and target document"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('templates.schema', 'JSON Schema Definition')}</label>
                <textarea
                  rows={8}
                  required
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  {t('templates.save', 'Save Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
