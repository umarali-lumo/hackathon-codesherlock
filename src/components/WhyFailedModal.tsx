import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink, 
  FileCode, 
  Sparkles, 
  X, 
  Zap, 
  GitPullRequest,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { WhyFailedHereResult } from '../types';

interface WhyFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: WhyFailedHereResult | null;
  isLoading: boolean;
  onNavigateToSource: (file: string, line: number) => void;
  onRequestMinimalFix?: (file: string, line: number, desc: string) => void;
}

export const WhyFailedModal: React.FC<WhyFailedModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onNavigateToSource,
  onRequestMinimalFix
}) => {
  if (!isOpen) return null;

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
              <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>“Why did it fail here?”</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white border border-white/15">
                    Gemini 3.8 Flash
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Tracing upstream callers across repository files to locate the true bug origin
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
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <p className="text-white font-medium">Tracing Backward Through Call Hierarchy...</p>
                <p className="text-[11px] text-neutral-500 max-w-md">
                  Analyzing call sites and data flow across modules to find where the bad state originated.
                </p>
              </div>
            ) : result ? (
              <>
                {/* Comparison Card: Crash Site vs Origin Site */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Crash Site (Symptom) */}
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Symptom / Crash Site</span>
                      </span>
                      <button
                        onClick={() => {
                          onNavigateToSource(result.crashSite.file, result.crashSite.line);
                          onClose();
                        }}
                        className="text-[10px] text-white hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{result.crashSite.file}:{result.crashSite.line}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="font-mono text-[11px] p-2 bg-black/60 rounded border border-white/5 text-red-200 overflow-x-auto">
                      <code>{result.crashSite.codeSnippet || 'Line of crash'}</code>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {result.crashSite.observedBehavior}
                    </p>
                  </div>

                  {/* Origin Site (Root Cause) */}
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>True Origin Site (Bug Source)</span>
                      </span>
                      <button
                        onClick={() => {
                          onNavigateToSource(result.originSite.file, result.originSite.line);
                          onClose();
                        }}
                        className="text-[10px] text-white hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{result.originSite.file}:{result.originSite.line}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="font-mono text-[11px] p-2 bg-black/60 rounded border border-white/5 text-indigo-200 overflow-x-auto">
                      <code>{result.originSite.codeSnippet || 'Origin definition'}</code>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {result.originSite.rootCauseDescription}
                    </p>
                  </div>
                </div>

                {/* Propagation Chain */}
                {result.propagationPath && result.propagationPath.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cross-File Propagation Path</span>
                    </div>

                    <div className="space-y-2 bg-[#080808] p-3.5 rounded-xl border border-white/[0.08]">
                      {result.propagationPath.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/15">
                            {step.step || idx + 1}
                          </span>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  onNavigateToSource(step.file, step.line);
                                  onClose();
                                }}
                                className="font-mono text-white hover:underline font-medium text-[11px] flex items-center gap-1"
                              >
                                <span>{step.file}:{step.line}</span>
                                <span className="text-neutral-500">in {step.functionName}()</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                              </button>
                            </div>
                            <p className="text-neutral-400 text-[11px]">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Root Cause Explanation */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Architectural Diagnosis</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    {result.explanation}
                  </p>
                </div>

                {/* Suggested Action Bar */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/15 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Recommended Fix:</span>
                    <p className="text-[11px] text-neutral-200">{result.suggestedAction}</p>
                  </div>

                  {onRequestMinimalFix && (
                    <button
                      onClick={() => {
                        onRequestMinimalFix(
                          result.crashSite.file,
                          result.crashSite.line,
                          result.explanation
                        );
                        onClose();
                      }}
                      className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
                    >
                      <GitPullRequest className="w-3 h-3" />
                      <span>Propose Minimal Fix (1-Line)</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-neutral-500">
                Click "Why did it fail here?" on any line or error to trace back to its origin.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
