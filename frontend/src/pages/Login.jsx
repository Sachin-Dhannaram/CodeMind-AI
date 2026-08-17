import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, ShieldCheck, Key, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [email, setEmail] = useState('architect@codemind.ai');
  const [password, setPassword] = useState('••••••••••••');

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ loggedIn: true, name: 'Lead Architect', email });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0f17] via-[#0e1525] to-[#120a21]">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-dark-border shadow-2xl relative overflow-hidden">
        {/* Glow backdrop decorative */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-cyan via-brand-blue to-brand-purple flex items-center justify-center mx-auto shadow-glow-cyan">
            <Cpu className="w-7 h-7 text-black font-bold" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to CodeMind AI</h2>
          <p className="text-xs text-slate-400">Sign in to query and explain your intelligent codebases</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple text-black font-semibold text-sm shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            <span>Enter Developer Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-dark-border/50 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Protected by Enterprise Vector Security & Gemini Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
