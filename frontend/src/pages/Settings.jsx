import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Key, Sliders, Database, Save, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

export default function Settings() {
  const { settings, setSettings, fetchSettings } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [topK, setTopK] = useState(settings.top_k || 5);
  const [chunkSize, setChunkSize] = useState(settings.chunk_size || 500);
  const [temperature, setTemperature] = useState(settings.temperature || 0.2);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        top_k: parseInt(topK),
        chunk_size: parseInt(chunkSize),
        temperature: parseFloat(temperature)
      };
      if (apiKey.trim()) {
        payload.gemini_api_key = apiKey.trim();
      }
      const res = await api.post('/settings', payload);
      setSettings(res.data);
      await fetchSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to update settings.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400">Configure AI hyper-parameters, Gemini API credentials, and vector search parameters.</p>
      </div>

      <form onSubmit={handleSave} className="bg-[#0d1117]/60 glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
          </div>
        )}

        {/* API Key */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#00f0ff]" /> Gemini API Key
          </label>
          <input
            type="password"
            placeholder={settings.gemini_api_key ? `Current: ${settings.gemini_api_key}` : "Enter Gemini API Key (AIzaSy...)"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-[#06090e] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#00f0ff] font-mono"
          />
          <p className="text-[11px] text-slate-500">Overrides environment variables. Kept securely in backend RAM.</p>
        </div>

        {/* Vector parameters */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Top-K Retrieval
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              className="w-full bg-[#06090e] border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-[#00f0ff]"
            />
            <p className="text-[11px] text-slate-500">Number of code chunks passed to LLM.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" /> Chunk Size (lines window)
            </label>
            <input
              type="number"
              value={chunkSize}
              onChange={(e) => setChunkSize(e.target.value)}
              className="w-full bg-[#06090e] border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-[#00f0ff]"
            />
            <p className="text-[11px] text-slate-500">Optimal target lines for code splitting.</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-black font-bold text-sm shadow-glow-cyan hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
        >
          <Save className="w-4 h-4 text-black stroke-[3]" /> Save Configuration
        </button>
      </form>
    </div>
  );
}
