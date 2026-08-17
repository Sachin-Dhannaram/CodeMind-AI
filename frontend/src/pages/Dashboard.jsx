import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  FolderGit2, 
  FileCode2, 
  Layers, 
  MessageSquare, 
  ArrowRight, 
  Plus, 
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../api/client';

export default function Dashboard() {
  const { repositories, setRepositories, fetchRepositories, setActiveRepo } = useApp();
  const navigate = useNavigate();

  const totalFiles = repositories.reduce((acc, r) => acc + (r.total_files || 0), 0);
  const totalChunks = repositories.reduce((acc, r) => acc + (r.total_chunks || 0), 0);
  const indexedCount = repositories.filter(r => r.indexed).length;

  const handleDelete = async (repoId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this repository index?")) {
      try {
        setRepositories(prev => prev.filter(r => r.id !== repoId));
        await api.delete(`/repository/${repoId}`);
        await fetchRepositories();
      } catch (err) {
        alert("Failed to delete repository.");
        await fetchRepositories();
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Codebase Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your indexed repositories and analyze software architecture using vector search.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-glow-cyan/5"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" /> Import Repository
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2.5 bg-[#0d1117] hover:bg-[#161b22] text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#00f0ff]" /> AI Chat Window
          </button>
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0d1117]/60 glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indexed Repositories</p>
            <p className="text-2xl font-extrabold text-white mt-1">{indexedCount} <span className="text-sm font-semibold text-slate-500">/ {repositories.length}</span></p>
          </div>
          <div className="p-3 bg-[#090d13] rounded-xl border border-slate-800 text-[#00f0ff]">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0d1117]/60 glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Source Files</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalFiles.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-[#090d13] rounded-xl border border-slate-800 text-emerald-400">
            <FileCode2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0d1117]/60 glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vector Code Chunks</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalChunks.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-[#090d13] rounded-xl border border-slate-800 text-violet-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Repositories section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono">Your Repositories</h2>
          <span className="text-xs text-slate-500 font-mono">{repositories.length} Total</span>
        </div>

        {repositories.length === 0 ? (
          <div className="bg-[#0d1117]/40 p-12 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
            <FolderGit2 className="w-10 h-10 text-slate-700 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No repositories imported</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Upload a ZIP archive or clone a GitHub repo to begin semantic vector retrieval.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-[#161b22] hover:bg-[#1f2937] text-slate-200 border border-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Import Repository
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                onClick={() => {
                  setActiveRepo(repo);
                  navigate('/chat');
                }}
                className="bg-[#0d1117]/60 glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:shadow-glow-cyan/5 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#090d13] border border-slate-800 flex items-center justify-center text-[#00f0ff] shrink-0">
                        <FolderGit2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-200 text-sm group-hover:text-[#00f0ff] transition-colors truncate">
                          {repo.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono capitalize">{repo.source_type} repository</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(repo.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 border-0 bg-transparent"
                      title="Delete Repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#05080c] rounded-xl border border-slate-900 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] font-bold uppercase font-mono">Files</span>
                      <p className="font-semibold text-slate-300 mt-0.5">{repo.total_files || 0}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] font-bold uppercase font-mono">Chunks</span>
                      <p className="font-semibold text-slate-300 mt-0.5">{repo.total_chunks || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                  <div>
                    {repo.indexed ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-500 font-semibold font-mono">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> {repo.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center text-[#00f0ff] font-semibold group-hover:translate-x-1 transition-transform">
                    Open Chat <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
