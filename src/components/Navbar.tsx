import React from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  FileCode, 
  Network, 
  GitPullRequest, 
  PlayCircle, 
  FileText, 
  Cpu, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { RepositoryData, DiagnosticFinding } from '../types';

interface NavbarProps {
  repo: RepositoryData | null;
  activeTab: 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report';
  setActiveTab: (tab: 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report') => void;
  activeFinding: DiagnosticFinding | null;
  localAiConnected: boolean;
  onOpenLocalAiModal: () => void;
  onExportReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  repo,
  activeTab,
  setActiveTab,
  activeFinding,
  localAiConnected,
  onOpenLocalAiModal,
  onExportReport
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-base shadow-inner">
            🕵️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 tracking-tight text-sm">CodeSherlock</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ZERO-COST v1.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-none">
              Gemini 3.8 Flash AI Debugger
            </p>
          </div>
        </div>

        {repo && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-800 text-xs">
            <span className="text-zinc-400">Project:</span>
            <span className="font-medium text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 max-w-[180px] truncate">
              {repo.name}
            </span>
            <span className="text-[11px] text-zinc-400">
              ({repo.files.length} files • {repo.totalLoc} LOC)
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/80">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Investigation</span>
        </button>

        <button
          onClick={() => setActiveTab('source')}
          disabled={!repo}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'source'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Source</span>
        </button>

        <button
          onClick={() => setActiveTab('dependencies')}
          disabled={!repo}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'dependencies'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Dependencies</span>
        </button>

        <button
          onClick={() => setActiveTab('patch')}
          disabled={!repo}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed relative ${
            activeTab === 'patch'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Patch</span>
          {activeFinding?.candidatePatch && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          disabled={!repo}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'tests'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Test Runner</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          disabled={!repo}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            activeTab === 'report'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLocalAiModal}
          title="Google Gemini 3.8 Flash (Free Tier) with native repository AST reasoning."
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border font-mono transition-colors bg-white/10 text-white border-white/20"
        >
          <Cpu className="w-3 h-3 text-white" />
          <span>AI: Gemini 3.8 Flash (Free)</span>
        </button>

        {repo && (
          <button
            onClick={onExportReport}
            className="flex items-center gap-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-medium transition-colors"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>
    </header>
  );
};
