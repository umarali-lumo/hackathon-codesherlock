import React, { useState } from 'react';
import { GitPullRequest, Copy, Download, Trash2, Check, AlertCircle, FileCode, PlayCircle } from 'lucide-react';
import { CandidatePatch, DiagnosticFinding } from '../types';

interface PatchViewerProps {
  finding: DiagnosticFinding | null;
  onApplyPatchToSandbox: (patch: CandidatePatch) => void;
  onDiscardPatch: () => void;
  onNavigateToTests: () => void;
  isAppliedToSandbox: boolean;
}

export const PatchViewer: React.FC<PatchViewerProps> = ({
  finding,
  onApplyPatchToSandbox,
  onDiscardPatch,
  onNavigateToTests,
  isAppliedToSandbox
}) => {
  const [copied, setCopied] = useState(false);

  if (!finding?.candidatePatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 font-mono text-xs">
        <GitPullRequest className="w-8 h-8 mb-2 stroke-1 text-neutral-600" />
        <p className="font-medium text-neutral-300">No Candidate Patch Selected</p>
        <p className="text-[11px] text-neutral-500 mt-1 max-w-sm text-center">
          Investigate a stack trace or select a diagnostic finding in the chat to generate and inspect a unified diff patch.
        </p>
      </div>
    );
  }

  const patch = finding.candidatePatch;
  const diffLines = patch.unifiedDiff.split('\n');

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(patch.unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPatch = () => {
    const blob = new Blob([patch.unifiedDiff], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesherlock-fix-${patch.targetFile.replace(/[\/\\]/g, '_')}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-200 overflow-y-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header Card */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15 font-medium">
                CANDIDATE PATCH
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium ${
                isAppliedToSandbox
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#181818] text-neutral-400 border border-white/[0.08]'
              }`}>
                {isAppliedToSandbox ? 'STAGED IN SANDBOX' : 'UNVERIFIED (Awaiting Test Run)'}
              </span>
            </div>
            <h2 className="text-base font-semibold text-white mt-2">{finding.title}</h2>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              Target file: <strong className="text-white">{patch.targetFile}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyPatch}
              className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] text-white px-3.5 py-1.5 rounded-full border border-white/[0.08] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Diff'}</span>
            </button>

            <button
              onClick={handleDownloadPatch}
              className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] text-white px-3.5 py-1.5 rounded-full border border-white/[0.08] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .patch</span>
            </button>

            <button
              onClick={() => onApplyPatchToSandbox(patch)}
              className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full font-semibold transition-colors ${
                isAppliedToSandbox
                  ? 'bg-neutral-300 text-black'
                  : 'bg-white hover:bg-neutral-200 text-black'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{isAppliedToSandbox ? 'Staged in Sandbox' : 'Stage for Test Run'}</span>
            </button>

            <button
              onClick={onDiscardPatch}
              title="Discard this candidate patch"
              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#1a1a1a] rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-[#0c0c0c] p-3.5 rounded-xl border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
          <strong className="text-white">Patch Rationale: </strong>
          {patch.description}
        </div>

        {/* Notice of source integrity */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <AlertCircle className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span>
            Source integrity enforced: The original repository files remain untouched. Staging applies only to a temporary sandbox copy for test verification.
          </span>
        </div>
      </div>

      {/* Unified Diff Box */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="h-10 px-4 bg-[#0a0a0a] border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>Unified Diff Preview</span>
          <span className="text-[10px] text-neutral-500">Standard Git patch format</span>
        </div>

        <div className="p-4 font-mono text-xs overflow-x-auto bg-[#050505] leading-5">
          {diffLines.map((line, idx) => {
            const isAdded = line.startsWith('+') && !line.startsWith('+++');
            const isRemoved = line.startsWith('-') && !line.startsWith('---');
            const isHunkHeader = line.startsWith('@@');

            return (
              <div
                key={idx}
                className={`flex px-2 py-0.5 rounded-sm ${
                  isAdded
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : isRemoved
                    ? 'bg-red-950/40 text-red-300'
                    : isHunkHeader
                    ? 'text-neutral-400 bg-white/[0.04] font-semibold'
                    : 'text-neutral-400'
                }`}
              >
                <span className="select-none pr-3 w-6 text-right text-neutral-600">
                  {isAdded ? '+' : isRemoved ? '-' : ' '}
                </span>
                <span className="whitespace-pre flex-1">{line.slice(1) || line}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Prompt */}
      <div className="bg-[#111111] border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between">
        <div className="text-xs text-neutral-400">
          Verify whether this patch fixes the test failures without introducing regressions.
        </div>
        <button
          onClick={onNavigateToTests}
          className="flex items-center gap-1.5 text-xs bg-white text-black hover:bg-neutral-200 px-4 py-1.5 rounded-full font-semibold transition-colors"
        >
          <span>Run Test Suite</span>
          <PlayCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
