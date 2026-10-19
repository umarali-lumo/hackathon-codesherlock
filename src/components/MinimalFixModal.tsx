import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  GitPullRequest, 
  Check, 
  Copy, 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Zap,
  ChevronRight
} from 'lucide-react';
import { MinimalFixProposal } from '../types';

interface MinimalFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: MinimalFixProposal | null;
  isLoading: boolean;
  onApplyAndTest?: (patch: MinimalFixProposal) => void;
}

export const MinimalFixModal: React.FC<MinimalFixModalProps> = ({
  isOpen,
  onClose,
  proposal,
  isLoading,
  onApplyAndTest
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiff = () => {
    if (!proposal) return;
    navigator.clipboard.writeText(proposal.unifiedDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-[#141414] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Minimal Fix Mode</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Surgical Patch
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Smallest plausible patch to eliminate defect without collateral rewrites or formatting churn
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-neutral-200">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 font-mono">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin" />
                <p className="text-white font-medium">Synthesizing Minimal Surgical Patch...</p>
                <p className="text-[11px] text-neutral-500 max-w-md">
                  Isolating the single line responsible and calculating the lowest-risk defensive replacement.
                </p>
              </div>
            ) : proposal ? (
              <>
                {/* Metrics bar */}
                <div className="grid grid-cols-3 gap-2.5 font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] text-neutral-400 uppercase">Target File</span>
                    <p className="text-xs text-white font-semibold mt-1 truncate">
                      {proposal.targetFile}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25">
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Lines Changed</span>
                    <p className="text-xs text-white font-bold mt-1">
                      {proposal.linesChangedCount} line(s) · Minimal Guarantee
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/25">
                    <span className="text-[10px] text-blue-400 uppercase font-semibold">Collateral Risk</span>
                    <p className="text-xs text-white font-bold mt-1">
                      {proposal.collateralRisk} Risk
                    </p>
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <span>Surgical Diff</span>
                    <button
                      onClick={handleCopyDiff}
                      className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy Diff'}</span>
                    </button>
                  </div>

                  <div className="bg-[#050505] p-3 rounded-xl border border-white/[0.08] font-mono text-[11px] overflow-x-auto leading-relaxed">
                    <div className="text-neutral-500 pb-1 border-b border-white/[0.04]">
                      --- a/{proposal.targetFile}
                      <br />
                      +++ b/{proposal.targetFile}
                    </div>

                    <div className="py-2 space-y-1">
                      <div className="text-red-400 bg-red-950/30 px-2 py-1 rounded">
                        - {proposal.originalSnippet}
                      </div>
                      <div className="text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                        + {proposal.patchedSnippet}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line-by-Line Reasoning */}
                {proposal.reasoningPerLine && proposal.reasoningPerLine.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Line-by-Line Architectural Reasoning
                    </div>

                    <div className="space-y-2">
                      {proposal.reasoningPerLine.map((lr, idx) => (
                        <div
                          key={idx}
                          className="bg-[#121212] p-3 rounded-xl border border-white/[0.08] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-neutral-400">
                              Line {lr.line || idx + 1}
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                              lr.type === 'ADDED' || lr.type === 'MODIFIED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {lr.type}
                            </span>
                          </div>

                          <div className="p-1.5 bg-[#080808] rounded font-mono text-[10px] text-white">
                            <code>{lr.code}</code>
                          </div>

                          <p className="text-[11px] text-neutral-300">
                            {lr.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Explanation */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1 text-[11px]">
                  <span className="font-semibold text-white">Why this fix is safe:</span>
                  <p className="text-neutral-300 leading-relaxed font-sans">
                    {proposal.riskExplanation}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Zero changes made to surrounding functions or contracts.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClose}
                      className="px-3.5 py-1.5 rounded-full border border-white/10 text-neutral-300 hover:text-white transition-colors"
                    >
                      Close
                    </button>

                    {onApplyAndTest && (
                      <button
                        onClick={() => {
                          onApplyAndTest(proposal);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-4 py-1.5 rounded-full font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        <span>Apply & Run Sandbox Tests</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-neutral-500">
                Request a Minimal Fix on any finding or code line to view the surgical 1-line patch.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
