import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Folder, 
  FolderOpen, 
  FileCode, 
  Trash2, 
  History, 
  Search, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { RepositoryData, SourceFile } from '../types';

interface SidebarProps {
  repo: RepositoryData | null;
  selectedFile: SourceFile | null;
  onSelectFile: (file: SourceFile) => void;
  onNewInvestigation: () => void;
  onUploadZip: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemoProject: () => void;
  onClearProject: () => void;
  historyList: { id: string; query: string; timestamp: number }[];
  onSelectHistory: (item: { id: string; query: string }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repo,
  selectedFile,
  onSelectFile,
  onNewInvestigation,
  onUploadZip,
  onLoadDemoProject,
  onClearProject,
  historyList,
  onSelectHistory
}) => {
  const [fileFilter, setFileFilter] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'ecommerce_service': true,
    'src': true,
    'root': true
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const filteredFiles = repo?.files.filter(f => 
    f.path.toLowerCase().includes(fileFilter.toLowerCase())
  ) || [];

  return (
    <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full text-zinc-300 select-none text-xs">
      {/* Top Action buttons */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <button
          onClick={onNewInvestigation}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-2 px-3 rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Investigation</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-md py-1.5 px-2 cursor-pointer transition-colors text-center font-medium">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upload ZIP</span>
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={onUploadZip}
            />
          </label>

          <button
            onClick={onLoadDemoProject}
            title="Load the bundled multi-file Python bug project with tests and cross-file contract defect"
            className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400/90 border border-amber-500/30 rounded-md py-1.5 px-2 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo</span>
          </button>
        </div>
      </div>

      {/* Repo Stats & Overview */}
      {repo ? (
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-200 truncate">{repo.name}</span>
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear current project"
              className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80">
            <div>
              <span className="text-zinc-400">Files: </span>
              <span className="text-zinc-200 font-bold">{repo.files.length}</span>
            </div>
            <div>
              <span className="text-zinc-400">LOC: </span>
              <span className="text-zinc-200 font-bold">{repo.totalLoc}</span>
            </div>
            <div>
              <span className="text-zinc-400">Funcs: </span>
              <span className="text-amber-400 font-bold">{repo.totalFunctions}</span>
            </div>
            <div>
              <span className="text-zinc-400">Tests: </span>
              <span className="text-emerald-400 font-bold">{repo.testFiles.length}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center border-b border-zinc-800/60">
          <p className="text-zinc-500 text-[11px]">No repository loaded</p>
          <p className="text-zinc-600 text-[10px] mt-1">Upload a ZIP or load the demo project to start debugging.</p>
        </div>
      )}

      {/* Repository File Tree */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
          <span>Repository Files</span>
          {repo && <span className="font-mono">{filteredFiles.length}</span>}
        </div>

        {repo && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter files..."
                value={fileFilter}
                onChange={e => setFileFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {repo ? (
            filteredFiles.length > 0 ? (
              filteredFiles.map(file => {
                const isSelected = selectedFile?.path === file.path;
                const analysis = repo.analyses[file.path];
                const funcCount = analysis?.functions.length || 0;

                return (
                  <button
                    key={file.path}
                    onClick={() => onSelectFile(file)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${
                        file.language === 'python' ? 'text-blue-400' : 'text-zinc-400'
                      }`} />
                      <span className="truncate font-mono text-[11px]">{file.path}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {file.isTest && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded font-mono">
                          TEST
                        </span>
                      )}
                      {funcCount > 0 && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {funcCount}f
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-zinc-600 text-xs">No matching files</div>
            )
          ) : (
            <div className="p-4 text-center text-zinc-600 text-xs">
              Repository tree will appear here after upload
            </div>
          )}
        </div>
      </div>

      {/* Session Investigation History */}
      {historyList.length > 0 && (
        <div className="border-t border-zinc-800 p-2 max-h-36 overflow-y-auto">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <History className="w-3 h-3" />
            <span>Investigation History</span>
          </div>
          <div className="space-y-0.5">
            {historyList.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item)}
                className="w-full text-left px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 truncate font-mono text-[11px]"
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear Project */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-zinc-100 text-sm">Clear Repository Data?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will remove the current project files, in-memory dependency graphs, test findings, and candidate patches from the active workspace.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearProject();
                }}
                className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded font-medium transition-colors"
              >
                Clear Project
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
