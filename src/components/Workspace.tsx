import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  FileCode, 
  Network, 
  GitPullRequest, 
  PlayCircle, 
  FileText, 
  PanelLeftClose, 
  PanelLeft, 
  Cpu, 
  Download, 
  Trash2, 
  Search, 
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { 
  RepositoryData, 
  SourceFile, 
  ChatMessage, 
  DiagnosticFinding, 
  CandidatePatch, 
  TestRunResult 
} from '../types';

import { ChatArea } from './ChatArea';
import { SourceViewer } from './SourceViewer';
import { DependencyGraphView } from './DependencyGraphView';
import { PatchViewer } from './PatchViewer';
import { TestRunnerView } from './TestRunnerView';
import { ReportView } from './ReportView';
import { RepoDashboard } from './RepoDashboard';

interface WorkspaceProps {
  repo: RepositoryData;
  onBackToHome: () => void;
  selectedFile: SourceFile | null;
  onSelectFile: (file: SourceFile) => void;
  activeTab: 'dashboard' | 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report';
  setActiveTab: (tab: 'dashboard' | 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report') => void;
  targetLine: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  activeFinding: DiagnosticFinding | null;
  setActiveFinding: (f: DiagnosticFinding | null) => void;
  stagedPatch: CandidatePatch | null;
  setStagedPatch: (p: CandidatePatch | null) => void;
  onNavigateToSource: (file: string, line: number) => void;
  onRunTests: (withPatch: boolean) => Promise<TestRunResult | null>;
  baselineResult: TestRunResult | null;
  patchedResult: TestRunResult | null;
  isRunningTests: boolean;
  onClearProject: () => void;
  onOpenLocalAiModal: () => void;
  localAiConnected: boolean;
  onWhyFailedHere: (file: string, line: number, codeSnippet: string) => void;
  onTraceVariable: (varName: string, file: string, line: number) => void;
  onRequestMinimalFix: (file: string, line: number, bugDesc: string) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  repo,
  onBackToHome,
  selectedFile,
  onSelectFile,
  activeTab,
  setActiveTab,
  targetLine,
  messages,
  isLoading,
  onSendMessage,
  activeFinding,
  setActiveFinding,
  stagedPatch,
  setStagedPatch,
  onNavigateToSource,
  onRunTests,
  baselineResult,
  patchedResult,
  isRunningTests,
  onClearProject,
  onOpenLocalAiModal,
  localAiConnected,
  onWhyFailedHere,
  onTraceVariable,
  onRequestMinimalFix
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fileSearch, setFileSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredFiles = repo.files.filter(f => 
    f.path.toLowerCase().includes(fileSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-neutral-100 overflow-hidden font-sans select-none antialiased">
      {/* Top Navigation Bar in Visuvate Style */}
      <header className="h-14 border-b border-white/[0.08] bg-[#000000]/90 px-4 flex items-center justify-between z-20 backdrop-blur-md">
        {/* Left: Back to Home + Project Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            title="Return to Home Page"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-[#141414] hover:bg-[#1f1f1f] px-2.5 py-1.5 rounded-full border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse Files Sidebar' : 'Expand Files Sidebar'}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#181818] rounded-md transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08] text-xs">
            <span className="text-neutral-500 hidden md:inline">Project:</span>
            <span className="font-mono font-medium text-white max-w-[200px] truncate">
              {repo.name}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono hidden lg:inline">
              ({repo.files.length} files · {repo.totalLoc} LOC)
            </span>
          </div>
        </div>

        {/* Center: Clean Segmented Tab Navigation */}
        <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-full border border-white/[0.08] overflow-x-auto max-w-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Investigation</span>
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'source'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Source</span>
          </button>

          <button
            onClick={() => setActiveTab('dependencies')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'dependencies'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Call Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('patch')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all relative ${
              activeTab === 'patch'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'tests'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Test Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === 'report'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>

        {/* Right: Engine Indicator & Clear Project */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLocalAiModal}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-mono transition-colors ${
              localAiConnected
                ? 'bg-white/10 text-white border-white/30'
                : 'bg-[#111111] text-neutral-400 border-white/[0.08] hover:border-white/20'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span className="hidden sm:inline">{localAiConnected ? 'Local AI Connected' : 'Engine: Layer A (Zero-Cost)'}</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            title="Clear current project"
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#181818] rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Collapsible Left Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#0a0a0a] border-r border-white/[0.08] flex flex-col h-full text-xs text-neutral-300 select-none z-10 transition-all">
            <div className="p-3 border-b border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Repository Files</span>
                <span className="font-mono text-white">{filteredFiles.length}</span>
              </div>

              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                  className="w-full bg-[#111111] border border-white/[0.08] rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filteredFiles.map(file => {
                const isSelected = selectedFile?.path === file.path;
                const analysis = repo.analyses[file.path];
                const funcCount = analysis?.functions.length || 0;

                return (
                  <button
                    key={file.path}
                    onClick={() => {
                      onSelectFile(file);
                      setActiveTab('source');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors font-mono text-[11px] ${
                      isSelected
                        ? 'bg-white/10 text-white font-medium border border-white/20'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                      <span className="truncate">{file.path}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {file.isTest && (
                        <span className="text-[9px] bg-white/[0.08] text-neutral-300 border border-white/10 px-1 rounded">
                          TEST
                        </span>
                      )}
                      {funcCount > 0 && (
                        <span className="text-[10px] text-neutral-500">
                          {funcCount}f
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-hidden">
          {activeTab === 'dashboard' && (
            <RepoDashboard
              repo={repo}
              findings={activeFinding ? [activeFinding] : []}
              stagedPatch={stagedPatch}
              baselineResult={baselineResult}
              patchedResult={patchedResult}
              onOpenTab={(tab) => setActiveTab(tab)}
              onTriggerWhyFailed={() => {
                onWhyFailedHere(selectedFile?.path || 'ecommerce_service/pricing_engine.py', 23, "rate = coupon['rate']");
              }}
              onTriggerTraceVariable={(varName) => {
                onTraceVariable(varName, selectedFile?.path || 'ecommerce_service/pricing_engine.py', 23);
              }}
              onTriggerMinimalFix={() => {
                onRequestMinimalFix(selectedFile?.path || 'ecommerce_service/pricing_engine.py', 23, "KeyError: 'rate' subscript access without fallback");
              }}
            />
          )}

          {activeTab === 'chat' && (
            <ChatArea
              repo={repo}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              onSelectFinding={f => {
                setActiveFinding(f);
                if (f.candidatePatch) setStagedPatch(f.candidatePatch);
              }}
              onNavigateToSource={onNavigateToSource}
              onUploadZip={() => {}}
              onTriggerPatch={f => {
                setActiveFinding(f);
                if (f.candidatePatch) setStagedPatch(f.candidatePatch);
                setActiveTab('patch');
              }}
              onOpenTab={setActiveTab}
              onRunTests={() => onRunTests(Boolean(stagedPatch))}
            />
          )}

          {activeTab === 'source' && (
            <SourceViewer
              file={selectedFile}
              analysis={selectedFile ? repo.analyses[selectedFile.path] : undefined}
              targetLine={targetLine}
              onWhyFailedHere={onWhyFailedHere}
              onTraceVariable={onTraceVariable}
              onRequestMinimalFix={onRequestMinimalFix}
            />
          )}

          {activeTab === 'dependencies' && (
            <DependencyGraphView
              repo={repo}
              onNavigateToSource={onNavigateToSource}
            />
          )}

          {activeTab === 'patch' && (
            <PatchViewer
              finding={activeFinding}
              onApplyPatchToSandbox={patch => {
                setStagedPatch(patch);
                setActiveTab('tests');
              }}
              onDiscardPatch={() => setStagedPatch(null)}
              onNavigateToTests={() => setActiveTab('tests')}
              isAppliedToSandbox={Boolean(stagedPatch)}
            />
          )}

          {activeTab === 'tests' && (
            <TestRunnerView
              repo={repo}
              stagedPatch={stagedPatch}
              onRunTests={onRunTests}
              baselineResult={baselineResult}
              patchedResult={patchedResult}
              isRunning={isRunningTests}
            />
          )}

          {activeTab === 'report' && (
            <ReportView
              repo={repo}
              findings={activeFinding ? [activeFinding] : []}
              stagedPatch={stagedPatch}
              baselineResult={baselineResult}
              patchedResult={patchedResult}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal for Clear Project */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/[0.08] p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-white">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-white text-sm">Clear Repository Data?</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This will reset the active workspace and clear indexed symbols and test results.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-[#1a1a1a] hover:bg-[#222222] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearProject();
                }}
                className="px-3.5 py-1.5 text-xs text-black bg-white hover:bg-neutral-200 rounded-full font-medium transition-colors"
              >
                Clear Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
