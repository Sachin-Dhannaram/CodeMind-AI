import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cpu, CheckCircle2, Loader2, MessageSquare, ArrowRight, Layers, FileCode, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../api/client';

export default function Indexing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRepo, setActiveRepo, fetchRepositories } = useApp();
  const targetRepo = location.state?.repo || activeRepo;

  const [repoInfo, setRepoInfo] = useState(targetRepo);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const steps = [
    { name: 'Repository Cloned', desc: 'Workspace setup complete.' },
    { name: 'Reading files', desc: 'Loading raw codebase paths.' },
    { name: 'Parsing files', desc: 'Ignoring binary & build artifacts.' },
    { name: 'Chunking', desc: 'Parsing classes & functions cleanly.' },
    { name: 'Generating embeddings', desc: 'Vectorizing code blocks via BAAI/bge-small.' },
    { name: 'Saving to ChromaDB', desc: 'Storing vectors to local database.' },
    { name: 'Completed', desc: 'Ready for AI architecture queries.' }
  ];

  const getActiveStep = () => {
    const status = repoInfo?.status || '';
    if (status.includes('Failed')) return -1;
    if (status.includes('Completed') || repoInfo?.indexed) return 6;
    if (status.includes('Saving to ChromaDB')) return 5;
    if (status.includes('Generating embeddings')) return 4;
    if (status.includes('Chunking')) return 3;
    if (status.includes('Parsing files')) return 2;
    if (status.includes('Reading files')) return 1;
    if (status.includes('Initiating')) return 0;
    return 0;
  };

  const activeStep = getActiveStep();

  const startIndexing = async () => {
    if (!targetRepo?.id) return;
    setIndexing(true);
    setError(null);
    try {
      const res = await api.post('/index', { repo_id: targetRepo.id });
      setRepoInfo(res.data);
      setActiveRepo(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error initiating automated indexing.");
      setIndexing(false);
    }
  };

  useEffect(() => {
    if (targetRepo && !targetRepo.indexed && !indexing) {
      startIndexing();
    }
  }, []);

  // Polling loop for status updates
  useEffect(() => {
    let intervalId = null;
    const isFailed = repoInfo?.status?.startsWith('Failed:');
    
    if (targetRepo && (!repoInfo?.indexed) && !isFailed) {
      setIndexing(true);
      intervalId = setInterval(async () => {
        try {
          const res = await api.get('/repositories');
          const match = res.data.find(r => r.id === targetRepo.id);
          if (match) {
            setRepoInfo(match);
            setActiveRepo(match);
            if (match.indexed || match.status?.startsWith('Failed:')) {
              setIndexing(false);
              clearInterval(intervalId);
              fetchRepositories();
            }
          }
        } catch (err) {
          console.error("Error polling indexing status:", err);
        }
      }, 800);
    } else {
      setIndexing(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [repoInfo]);

  // Elapsed duration timer
  useEffect(() => {
    let timer = null;
    const isFailed = repoInfo?.status?.startsWith('Failed:');
    
    if (indexing && repoInfo?.indexing_started_at) {
      // Calculate seconds since backend started indexing
      const start = new Date(repoInfo.indexing_started_at.replace(/-/g, '/')).getTime();
      timer = setInterval(() => {
        const diff = (Date.now() - start) / 1000;
        setElapsed(Math.max(0, diff));
      }, 100);
    } else if (repoInfo?.time_taken) {
      setElapsed(repoInfo.time_taken);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [indexing, repoInfo]);

  if (!targetRepo) {
    return (
      <div className="text-center py-16 space-y-4">
        <Cpu className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
        <p className="text-sm text-slate-400">No active repository selected for indexing.</p>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 text-[#00f0ff] border border-cyan-500/30 text-xs font-semibold cursor-pointer"
        >
          Go to Import Page
        </button>
      </div>
    );
  }

  const isFailed = repoInfo?.status?.startsWith('Failed:');
  const failureReason = isFailed ? repoInfo.status.replace('Failed:', '').trim() : '';

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center mx-auto shadow-glow-cyan">
          <Cpu className={`w-6 h-6 text-black font-bold ${indexing ? 'animate-spin' : ''}`} />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Indexing Repository</h1>
        <p className="text-xs text-slate-400 font-mono">{repoInfo.name} ({repoInfo.id})</p>
      </div>

      {/* Progress Cards */}
      <div className="bg-[#0d1117]/60 glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">STATUS</span>
            <p className={`text-sm font-bold ${isFailed ? 'text-red-400' : 'text-[#00f0ff]'}`}>
              {isFailed ? 'Failed' : repoInfo.indexed ? 'Completed' : 'Processing...'}
            </p>
          </div>
          <div className="flex gap-4 text-xs font-mono font-semibold">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{elapsed.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>{repoInfo.total_files || 0} files</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>{repoInfo.total_chunks || 0} chunks</span>
            </div>
          </div>
        </div>

        {/* Graceful Failure Alerts */}
        {isFailed && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Indexing Failed Gracefully</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed bg-black/40 p-2.5 rounded-lg border border-red-500/20">
              {failureReason}
            </p>
            <button
              onClick={startIndexing}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-black hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer border-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-black" /> Retry Indexing
            </button>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const isDone = repoInfo?.indexed || (idx < activeStep && activeStep !== -1) || (repoInfo?.status === 'Completed');
            const isActive = indexing && idx === activeStep;
            
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : isActive
                      ? 'bg-cyan-500/20 text-[#00f0ff] border border-cyan-500/30 animate-pulse'
                      : 'bg-[#06090e] text-slate-600 border border-slate-800'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : idx + 1}
                  </div>
                  <div>
                    <span className={`text-sm block ${isDone ? 'text-slate-200 font-semibold' : 'text-slate-500'}`}>
                      {step.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">{step.desc}</span>
                  </div>
                </div>
                {isActive && (
                  <Loader2 className="w-4 h-4 text-[#00f0ff] animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Active file tracker banner */}
        {indexing && repoInfo?.current_file && (
          <div className="p-3 bg-[#06090e] rounded-xl border border-slate-800 space-y-1 font-mono text-[10px]">
            <span className="text-slate-500 uppercase tracking-widest font-bold">Currently Processing:</span>
            <p className="text-slate-300 truncate">{repoInfo.current_file}</p>
          </div>
        )}

        {repoInfo.indexed && (
          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/chat')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-black font-bold text-sm shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <MessageSquare className="w-4 h-4 text-black" />
              <span>Open AI Chat Window</span>
              <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
