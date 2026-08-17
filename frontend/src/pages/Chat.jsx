import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

// Custom component to render Code blocks with header bars & copy features
function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden my-4 bg-[#05080c] font-mono text-xs shadow-lg">
      <div className="bg-[#0c1017] px-4 py-2 flex justify-between items-center text-slate-400 border-b border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors bg-transparent border-0 cursor-pointer text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Chat() {
  const { activeRepo, chatHistory, setChatHistory, settings } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const [expandedChunksMsg, setExpandedChunksMsg] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRepo || loading) return;

    const userQuery = input.trim();
    setInput('');
    
    const userMsg = { sender: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const apiKeyToSend = (settings.gemini_api_key && !settings.gemini_api_key.includes('...')) 
        ? settings.gemini_api_key 
        : undefined;

      const historyList = chatHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        // Strip out error emoji markers if any to keep clean prompts
        content: msg.text.replace('❌ **Error:** ', '')
      }));

      const res = await api.post('/chat', {
        repo_id: activeRepo.id,
        question: userQuery,
        top_k: settings.top_k,
        api_key: apiKeyToSend,
        history: historyList
      });

      const aiMsg = {
        sender: 'ai',
        text: res.data.answer,
        chunks: res.data.retrieved_chunks,
        model: res.data.model_used,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err) {
      const errDetail = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to generate AI response.";
      const errorMsg = {
        sender: 'ai',
        text: `❌ **Error:** ${errDetail}`,
        chunks: [],
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceClick = (filePath) => {
    // Navigate to explorer page and select the file path
    navigate(`/explorer?file=${encodeURIComponent(filePath)}`);
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-[#0d1117]/60 glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Active Context Header */}
      <div className="p-4 bg-[#090d13] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-[#00f0ff] flex items-center justify-center border border-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Architect Assistant</h2>
            <p className="text-[11px] text-slate-400">
              Active Context: <span className="text-[#00f0ff] font-semibold">{activeRepo?.name || 'None selected'}</span>
            </p>
          </div>
        </div>

        {activeRepo && !activeRepo.indexed && (
          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-3.5 h-3.5" /> Repository Not Indexed
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#00f0ff] shadow-glow-cyan/5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-200">Ask Anything About Your Codebase</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask about backend architecture, state flows, method configurations, or check out system parameters.
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 text-black flex items-center justify-center font-extrabold text-xs flex-shrink-0 mt-1 shadow-glow-cyan">
                  AI
                </div>
              )}

              <div className={`max-w-3xl space-y-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border border-cyan-500/30 text-slate-100 rounded-tr-none'
                      : 'bg-[#10141b] border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-slate-200 space-y-3">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                            ) : (
                              <code className="bg-[#1b2230] px-1.5 py-0.5 rounded text-[#00f0ff] text-xs font-mono border border-slate-800" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Source references badges drawer */}
                {msg.chunks && msg.chunks.length > 0 && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                    <button
                      onClick={() => setExpandedChunksMsg(expandedChunksMsg === idx ? null : idx)}
                      className="w-full px-4 py-2 bg-[#090d13] flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
                        Retrieved {msg.chunks.length} Context Chunks
                      </span>
                      {expandedChunksMsg === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {expandedChunksMsg === idx && (
                      <div className="p-4 space-y-3 bg-[#0d1117]/30 max-h-80 overflow-y-auto">
                        {msg.chunks.map((chunk, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-xl bg-[#090d13]/70 border border-slate-800 space-y-2 font-mono">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <button
                                onClick={() => handleReferenceClick(chunk.metadata.file_name)}
                                className="text-[#00f0ff] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer font-bold font-mono text-left"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {chunk.metadata.file_name} 
                                <span className="ml-1 bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30 px-1.5 py-0.5 rounded text-[9px]">
                                  L{chunk.metadata.start_line}-{chunk.metadata.end_line}
                                </span>
                              </button>
                              <span className="text-emerald-400 text-[10px]">Score: {chunk.similarity_score}</span>
                            </div>
                            <pre className="p-3 rounded-lg bg-[#05080c] text-slate-300 text-[11px] overflow-x-auto leading-relaxed">
                              {chunk.code}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
                  <User className="w-4.5 h-4.5" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner & Custom Typing Animation */}
        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 text-black flex items-center justify-center font-extrabold text-xs flex-shrink-0 mt-1 shadow-glow-cyan">
              AI
            </div>
            <div className="p-4 rounded-2xl bg-[#10141b] border border-slate-800 text-slate-400 text-sm flex flex-col gap-2 min-w-[200px] shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Searching codebase...</span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] dot-pulse dot-pulse-1"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] dot-pulse dot-pulse-2"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] dot-pulse dot-pulse-3"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-[#090d13] border-t border-slate-800 flex gap-3">
        <input
          type="text"
          placeholder={activeRepo?.indexed ? "Ask a question about the code..." : "Select and index a repository first"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!activeRepo || !activeRepo.indexed || loading}
          className="flex-1 bg-[#06090e] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!activeRepo || !activeRepo.indexed || loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-black font-semibold text-sm shadow-glow-cyan hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
