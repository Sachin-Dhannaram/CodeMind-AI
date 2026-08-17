import React from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, FolderGit2 } from 'lucide-react';

export default function Navbar() {
  const { activeRepo, repositories, setActiveRepo, user } = useApp();

  return (
    <header className="h-16 glass-nav sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-slate-800 flex items-center justify-center text-[#00f0ff] shadow-sm">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 font-sans">
            CodeMind <span className="text-[#00f0ff] text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 font-mono font-bold tracking-widest">AI</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Active Repo Selector */}
        <div className="flex items-center gap-2 bg-[#090d13] border border-slate-800 px-3 py-1.5 rounded-xl transition-all hover:border-slate-700">
          <FolderGit2 className="w-4 h-4 text-[#00f0ff]" />
          <select
            value={activeRepo?.id || ''}
            onChange={(e) => {
              const selected = repositories.find(r => r.id === e.target.value);
              if (selected) setActiveRepo(selected);
            }}
            className="bg-transparent text-xs font-semibold text-slate-300 outline-none cursor-pointer pr-1 border-0"
          >
            {repositories.length === 0 ? (
              <option value="" disabled className="bg-[#090d13] text-slate-500">No Repositories</option>
            ) : (
              repositories.map(r => (
                <option key={r.id} value={r.id} className="bg-[#090d13] text-slate-300">
                  {r.name} ({r.indexed ? 'Indexed' : 'Pending'})
                </option>
              ))
            )}
          </select>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090d13] border border-slate-800 text-xs font-medium text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{user.name}</span>
        </div>
      </div>
    </header>
  );
}
