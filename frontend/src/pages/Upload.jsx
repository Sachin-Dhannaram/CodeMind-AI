import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Github, FileArchive, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../api/client';

export default function Upload() {
  const navigate = useNavigate();
  const { fetchRepositories, setActiveRepo } = useApp();
  const [tab, setTab] = useState('github'); // 'github' or 'zip'
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClone = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/clone', { url: githubUrl });
      await fetchRepositories();
      setActiveRepo(res.data);
      navigate('/indexing', { state: { repo: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to clone GitHub repository.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchRepositories();
      setActiveRepo(res.data);
      navigate('/indexing', { state: { repo: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload ZIP file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Import Repository</h1>
        <p className="text-xs text-slate-400">
          Connect your GitHub repository URL or upload a compressed source archive for instant automated vector indexing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-1">
        <button
          onClick={() => setTab('github')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-0 border-b-2 bg-transparent transition-all cursor-pointer ${
            tab === 'github'
              ? 'border-[#00f0ff] text-[#00f0ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Github className="w-4 h-4" /> Clone via GitHub URL
        </button>
        <button
          onClick={() => setTab('zip')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-0 border-b-2 bg-transparent transition-all cursor-pointer ${
            tab === 'zip'
              ? 'border-[#00f0ff] text-[#00f0ff]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileArchive className="w-4 h-4" /> Upload ZIP Archive
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {tab === 'github' ? (
        <form onSubmit={handleClone} className="bg-[#0d1117]/60 glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">GitHub Repository URL</label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://github.com/username/repository.git"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full bg-[#06090e] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">Supports public repositories across Java, Python, JS/TS, C++, Go, Rust, and Markdown.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-black font-bold text-sm shadow-glow-cyan hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer border-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cloning Repository...
              </>
            ) : (
              <>
                <span>Clone & Begin Indexing</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleFileUpload} className="bg-[#0d1117]/60 glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center hover:border-cyan-500/30 transition-colors relative bg-[#06090e]/40">
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#090d13] border border-slate-800 flex items-center justify-center mx-auto text-[#00f0ff]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {file ? file.name : "Click or drag & drop ZIP file here"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Maximum size: 100MB compressed archive</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-black font-bold text-sm shadow-glow-cyan hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer border-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Unpacking Archive...
              </>
            ) : (
              <>
                <span>Upload & Begin Indexing</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
