import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FolderTree, FileCode, Search, Code2, Folder, FolderOpen, Loader2 } from 'lucide-react';
import api from '../api/client';

// Helper to convert flat file array to nested tree structure
function buildFileTree(files) {
  const root = { name: 'root', isDirectory: true, children: {}, path: '' };
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = current.path ? `${current.path}/${part}` : part;
      
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: isLast ? null : {},
          line_count: isLast ? file.line_count : 0
        };
      }
      current = current.children[part];
    });
  });
  
  function convertToArray(node) {
    if (!node.isDirectory) return node;
    
    const childrenArray = Object.values(node.children).map(convertToArray);
    childrenArray.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    node.children = childrenArray;
    return node;
  }
  
  return convertToArray(root).children || [];
}

function passesSearch(node, query) {
  if (!query) return true;
  if (!node.isDirectory) {
    return node.path.toLowerCase().includes(query.toLowerCase());
  }
  return node.children.some(child => passesSearch(child, query));
}

// Recursive Tree Node Component
function TreeNode({ node, depth, selectedFile, onSelectFile, expandedFolders, onToggleFolder, searchQuery }) {
  const isSelected = selectedFile === node.path;
  const isExpanded = expandedFolders[node.path];
  
  if (node.isDirectory) {
    const hasVisibleChildren = node.children.some(child => passesSearch(child, searchQuery));
    if (searchQuery && !hasVisibleChildren) return null;
    
    return (
      <div className="space-y-0.5">
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#161b22]/50 transition-colors border-0 bg-transparent cursor-pointer font-semibold"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded 
            ? <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" /> 
            : <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
          }
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child, index) => (
              <TreeNode
                key={index}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    if (searchQuery && !node.path.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }
    
    return (
      <button
        onClick={() => onSelectFile(node.path)}
        className={`w-full text-left px-2 py-1 text-xs flex items-center justify-between transition-all duration-150 border-0 cursor-pointer ${
          isSelected
            ? 'bg-cyan-500/10 text-[#00f0ff] border-l-2 border-[#00f0ff] font-semibold'
            : 'text-slate-300 hover:bg-[#161b22]/40 bg-transparent'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        <span className="text-[9px] text-slate-500 flex-shrink-0 ml-2 font-mono">{node.line_count}L</span>
      </button>
    );
  }
}

export default function Explorer() {
  const { activeRepo, chatHistory } = useApp();
  const location = useLocation();
  
  const [flatFiles, setFlatFiles] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});

  const queryParams = new URLSearchParams(location.search);
  const autoFile = queryParams.get('file');

  const loadFile = (path) => {
    setSelectedFile(path);
    setLoadingFile(true);
    api.get(`/repository/${activeRepo.id}/file`, { params: { filepath: path } })
      .then(res => setFileContent(res.data.content))
      .catch(err => setFileContent("// Error loading file contents"))
      .finally(() => setLoadingFile(false));
  };

  const handleToggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Convert files to tree on load
  useEffect(() => {
    if (activeRepo) {
      api.get(`/repository/${activeRepo.id}/tree`)
        .then(res => {
          setFlatFiles(res.data);
          const tree = buildFileTree(res.data);
          setTreeData(tree);
          
          if (autoFile && res.data.some(f => f.path === autoFile)) {
            loadFile(autoFile);
          } else if (res.data.length > 0) {
            loadFile(res.data[0].path);
          }
        })
        .catch(err => console.error(err));
    }
  }, [activeRepo, autoFile]);

  // Auto-expand parent folders of selected file
  useEffect(() => {
    if (selectedFile) {
      const parts = selectedFile.split('/');
      const newExp = { ...expandedFolders };
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        newExp[current] = true;
      }
      setExpandedFolders(newExp);
    }
  }, [selectedFile]);

  // Auto-expand all folders on search query to expose matches
  useEffect(() => {
    if (search.trim()) {
      const newExp = {};
      flatFiles.forEach(f => {
        if (f.path.toLowerCase().includes(search.toLowerCase())) {
          const parts = f.path.split('/');
          let current = '';
          for (let i = 0; i < parts.length - 1; i++) {
            current = current ? `${current}/${parts[i]}` : parts[i];
            newExp[current] = true;
          }
        }
      });
      setExpandedFolders(prev => ({ ...prev, ...newExp }));
    }
  }, [search, flatFiles]);

  // Extract highlight ranges from last AI chat message
  const highlightRanges = [];
  const lastMsg = chatHistory[chatHistory.length - 1];
  if (lastMsg && lastMsg.sender === 'ai' && lastMsg.chunks) {
    lastMsg.chunks.forEach(chunk => {
      const chunkFile = chunk.metadata.file_name || chunk.metadata.file_path;
      if (chunkFile === selectedFile) {
        highlightRanges.push({
          start: parseInt(chunk.metadata.start_line || 1),
          end: parseInt(chunk.metadata.end_line || 1)
        });
      }
    });
  }

  const isLineHighlighted = (lineNum) => {
    return highlightRanges.some(r => lineNum >= r.start && lineNum <= r.end);
  };

  // Scroll to first highlighted line
  useEffect(() => {
    if (fileContent && highlightRanges.length > 0) {
      const firstStart = Math.min(...highlightRanges.map(r => r.start));
      const timer = setTimeout(() => {
        const element = document.getElementById(`line-${firstStart}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [fileContent, selectedFile]);

  if (!activeRepo) {
    return (
      <div className="text-center py-16 space-y-4">
        <FolderTree className="w-12 h-12 text-slate-600 mx-auto" />
        <p className="text-sm text-slate-400">Please select an active repository to explore source code.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] grid grid-cols-12 gap-6">
      {/* VS Code Tree Sidebar */}
      <div className="col-span-4 bg-[#0d1117]/60 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-3 bg-[#090d13]">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4.5 h-4.5 text-[#00f0ff]" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Folders Explorer</h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#06090e] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {treeData.map((node, index) => (
            <TreeNode
              key={index}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onSelectFile={loadFile}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
              searchQuery={search}
            />
          ))}
        </div>
      </div>

      {/* VS Code Code Panel */}
      <div className="col-span-8 bg-[#0d1117]/60 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 bg-[#090d13] border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-[#00f0ff] flex items-center gap-2">
            <Code2 className="w-4.5 h-4.5" /> {selectedFile || "Select a file"}
          </span>
          {highlightRanges.length > 0 && (
            <span className="text-[10px] bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold font-mono">
              Retrieved Context Highlighted
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-[#05080c] p-4 font-mono text-xs text-slate-300">
          {loadingFile ? (
            <div className="h-full flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#00f0ff]" />
              <span>Reading source code...</span>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {fileContent.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const highlighted = isLineHighlighted(lineNum);
                  return (
                    <tr 
                      key={idx} 
                      id={`line-${lineNum}`}
                      className={`transition-colors ${
                        highlighted 
                          ? 'bg-cyan-500/10 border-l-2 border-[#00f0ff]' 
                          : 'hover:bg-[#161b22]/30'
                      }`}
                    >
                      <td className={`w-12 select-none text-right pr-4 text-[10px] font-bold border-r border-slate-900 ${
                        highlighted ? 'text-[#00f0ff]' : 'text-slate-600'
                      }`}>
                        {lineNum}
                      </td>
                      <td className={`whitespace-pre pl-4 font-mono ${
                        highlighted ? 'text-[#00f0ff]' : 'text-slate-300'
                      }`}>
                        {line}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
