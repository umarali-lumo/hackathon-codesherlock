import React, { useState } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  ShieldCheck, 
  FileCheck,
  Split
} from 'lucide-react';
import { RepositoryData, TestRunResult, CandidatePatch } from '../types';

interface TestRunnerViewProps {
  repo: RepositoryData;
  stagedPatch: CandidatePatch | null;
  onRunTests: (withPatch: boolean) => Promise<TestRunResult | null>;
  baselineResult: TestRunResult | null;
  patchedResult: TestRunResult | null;
  isRunning: boolean;
}

export const TestRunnerView: React.FC<TestRunnerViewProps> = ({
  repo,
  stagedPatch,
  onRunTests,
  baselineResult,
  patchedResult,
  isRunning
}) => {
  const [activeView, setActiveView] = useState<'compare' | 'baseline' | 'patched'>('compare');

  const testFiles = repo.files.filter(f => f.isTest);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-200 overflow-y-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Test Discovery Header */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15 font-medium">
                PYTHON UNITTEST RUNNER
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {testFiles.length} test {testFiles.length === 1 ? 'suite' : 'suites'} discovered
              </span>
            </div>
            <h2 className="text-base font-semibold text-white mt-2">
              Sandbox Test Execution & Patch Verification
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Runs in an isolated temporary sandbox via native <code className="text-white font-mono bg-[#181818] px-1 py-0.5 rounded">python3 -m unittest</code> with execution timeouts and traversal protections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunTests(false)}
              disabled={isRunning || testFiles.length === 0}
              className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] disabled:opacity-40 text-white border border-white/[0.08] px-4 py-2 rounded-full font-medium transition-colors"
            >
              {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5 text-neutral-300" />}
              <span>Run Baseline</span>
            </button>

            {stagedPatch && (
              <button
                onClick={() => onRunTests(true)}
                disabled={isRunning || testFiles.length === 0}
                className="flex items-center gap-1.5 text-xs bg-white hover:bg-neutral-200 disabled:opacity-40 text-black px-4 py-2 rounded-full font-semibold transition-colors"
              >
                {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                <span>Run with Candidate Patch</span>
              </button>
            )}
          </div>
        </div>

        {/* Discovered test files list */}
        <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-white/[0.06] space-y-1.5 text-xs font-mono">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">
            Discovered Test Suites:
          </div>
          {testFiles.length > 0 ? (
            testFiles.map(tf => (
              <div key={tf.path} className="flex items-center gap-2 text-neutral-300">
                <FileCheck className="w-3.5 h-3.5 text-white flex-shrink-0" />
                <span className="text-white font-medium">{tf.path}</span>
                <span className="text-neutral-500">({tf.loc} lines)</span>
              </div>
            ))
          ) : (
            <div className="text-neutral-500 italic">
              No test suites matching `test_*.py` or `tests/` found in the repository.
            </div>
          )}
        </div>
      </div>

      {/* Comparison View if both baseline and patched results exist */}
      {baselineResult && patchedResult && (
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Split className="w-4 h-4 text-neutral-400" />
              <span>Patch Impact & Regression Analysis</span>
            </h3>

            {patchedResult.failed === 0 && baselineResult.failed > 0 && (
              <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fix Verified: All Failures Resolved</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline column */}
            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 font-semibold">1. Baseline (Unpatched)</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  baselineResult.failed > 0
                    ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                    : 'bg-white/10 text-white'
                }`}>
                  {baselineResult.failed > 0 ? `${baselineResult.failed} FAILED` : 'PASSED'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Total</div>
                  <div className="font-bold text-white">{baselineResult.total}</div>
                </div>
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Passed</div>
                  <div className="font-bold text-white">{baselineResult.passed}</div>
                </div>
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Failed/Err</div>
                  <div className="font-bold text-red-400">{baselineResult.failed + baselineResult.errors}</div>
                </div>
              </div>
            </div>

            {/* Patched column */}
            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 font-semibold">2. Candidate Patch Staged</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  patchedResult.failed === 0
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-950/40 text-red-300 border border-red-500/30'
                }`}>
                  {patchedResult.failed === 0 ? 'ALL PASSED' : `${patchedResult.failed} FAILED`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Total</div>
                  <div className="font-bold text-white">{patchedResult.total}</div>
                </div>
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Passed</div>
                  <div className="font-bold text-white">{patchedResult.passed}</div>
                </div>
                <div className="bg-[#141414] p-2.5 rounded-lg">
                  <div className="text-[10px] text-neutral-500">Failed/Err</div>
                  <div className="font-bold text-neutral-400">{patchedResult.failed + patchedResult.errors}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Output Log Terminal */}
      {(baselineResult || patchedResult) && (
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden space-y-0">
          <div className="h-10 px-4 bg-[#0a0a0a] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-white">Unittest Execution Log</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              {baselineResult && (
                <button
                  onClick={() => setActiveView('baseline')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    activeView === 'baseline' ? 'bg-white text-black font-medium' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Baseline Output
                </button>
              )}
              {patchedResult && (
                <button
                  onClick={() => setActiveView('patched')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    activeView === 'patched' ? 'bg-white text-black font-medium' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Patched Output
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-[#050505] font-mono text-xs text-neutral-300 overflow-x-auto max-h-72 leading-relaxed">
            <pre className="whitespace-pre-wrap">
              {activeView === 'patched' && patchedResult
                ? patchedResult.rawOutput
                : baselineResult?.rawOutput || 'No output recorded.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
