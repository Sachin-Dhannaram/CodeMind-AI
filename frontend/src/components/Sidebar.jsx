import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Cpu, 
  MessageSquare, 
  FolderTree, 
  Settings as SettingsIcon
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Import Repo', path: '/upload', icon: UploadCloud },
    { name: 'Indexing', path: '/indexing', icon: Cpu },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Repo Explorer', path: '/explorer', icon: FolderTree },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#090d13] border-r border-[#21262d] flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-2">
        <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          Workspace
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00f0ff]/15 to-[#8b5cf6]/5 text-[#00f0ff] border border-[#00f0ff]/20 shadow-glow-cyan/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161b22]/50'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* RAG status module */}
      <div className="p-3.5 rounded-2xl bg-[#0d1117]/80 border border-[#21262d] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RAG Engine</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Local indexing & parsing engine is connected.
        </p>
      </div>
    </aside>
  );
}
