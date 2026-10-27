import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminSettingsPage: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<any>({
    maxUploadSizeMb: '50',
    maxPagesPerDoc: '100',
    ocrEngine: 'Tesseract/AWS Textract Hybrid',
    maintenanceMode: 'false',
    defaultRetentionDays: '90',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/admin/settings', settings);
      setSaved(true);
      toast.success('System configuration parameters saved', 'Settings Updated');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-purple-400" />
          <span>System & Storage Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure global file limits, retention days, and maintenance toggles.</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Platform settings updated successfully</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Max Upload File Size (MB)</label>
          <input
            type="number"
            value={settings.maxUploadSizeMb}
            onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Max Pages Per PDF Document</label>
          <input
            type="number"
            value={settings.maxPagesPerDoc}
            onChange={(e) => setSettings({ ...settings, maxPagesPerDoc: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Default S3 Document Retention Period (Days)</label>
          <input
            type="number"
            value={settings.defaultRetentionDays}
            onChange={(e) => setSettings({ ...settings, defaultRetentionDays: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">OCR Backend Engine</label>
          <select
            value={settings.ocrEngine}
            onChange={(e) => setSettings({ ...settings, ocrEngine: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
          >
            <option>Tesseract/AWS Textract Hybrid</option>
            <option>AWS Textract Only</option>
            <option>Tesseract.js Only</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-md shadow-purple-500/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </form>
    </div>
  );
};
