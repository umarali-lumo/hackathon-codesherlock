import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  GitCommit, 
  Share2, 
  Layers, 
  ShieldAlert
} from 'lucide-react';
import { VariableTraceResult } from '../types';

interface VariableTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VariableTraceResult | null;
  isLoading: boolean;
  onNavigateToSource: (file: string, line: number) => void;
}

export const VariableTraceModal: React.FC<VariableTraceModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onNavigateToSource
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
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Cross-File Variable & Function Trace:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {result?.variableName || 'Variable'}
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Tracking declaration, mutations, cross-module argument passing, and usage
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
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-blue-400 animate-spin" />
                <p className="text-white font-medium">Tracing Symbol Across Repository...</p>
                <p className="text-[11px] text-neutral-500 max-w-md">
                  Analyzing assignments, parameter transfers, function signatures, and call sites.
                </p>
              </div>
            ) : result ? (
              <>
                {/* Lifecycle Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/25">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">Initialized</span>
                    <p className="text-xs text-white font-medium mt-1 truncate">
                      {result.lifecycle.initialized?.file ? `${result.lifecycle.initialized.file}:${result.lifecycle.initialized.line}` : 'Dynamic parameter'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/25">
                    <span className="text-[10px] text-blue-400 font-semibold uppercase">Modifications</span>
                    <p className="text-lg text-white font-bold mt-0.5">
                      {result.lifecycle.modifiedCount}x
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25">
                    <span className="text-[10px] text-purple-400 font-semibold uppercase">Passed Across Files</span>
                    <p className="text-lg text-white font-bold mt-0.5">
                      {result.lifecycle.passedCount}x
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/25">
                    <span className="text-[10px] text-amber-400 font-semibold uppercase">Read & Dereferenced</span>
                    <p className="text-lg text-white font-bold mt-0.5">
                      {result.lifecycle.usedCount}x
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">Data Flow Summary:</span>
                  <p className="text-[11px] text-neutral-200 leading-relaxed font-sans">
                    {result.summary}
                  </p>
                </div>

                {/* Step Chain */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Trace Chain ({result.chain.length} events)</span>
                    <span className="text-[10px] font-mono text-neutral-500">Chronological Flow</span>
                  </div>

                  <div className="space-y-2.5 relative pl-4 border-l border-white/10 ml-2">
                    {result.chain.map((step, idx) => {
                      const typeColors: Record<string, string> = {
                        INITIALIZED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                        MODIFIED: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                        PASSED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                        USED: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                        FAILED: 'bg-red-500/20 text-red-300 border-red-500/40'
                      };

                      return (
                        <div
                          key={idx}
                          className="bg-[#121212] p-3.5 rounded-xl border border-white/[0.08] space-y-2 relative"
                        >
                          {/* Dot indicator */}
                          <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-[#1e1e1e] border-2 border-white/30" />

                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 font-mono text-[10px]">#{step.step || idx + 1}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${typeColors[step.type] || 'bg-white/10 text-white'}`}>
                                {step.type}
                              </span>
                              {step.functionName && (
                                <span className="text-[11px] font-mono text-neutral-400">
                                  in <strong className="text-white">{step.functionName}()</strong>
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                onNavigateToSource(step.file, step.line);
                                onClose();
                              }}
                              className="font-mono text-[10px] text-white hover:underline flex items-center gap-1 bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded border border-white/10 transition-colors"
                            >
                              <span>{step.file}:{step.line}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {step.codeSnippet && (
                            <div className="p-2 bg-[#060606] rounded border border-white/5 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                              <code>{step.codeSnippet}</code>
                            </div>
                          )}

                          <p className="text-[11px] text-neutral-300">
                            {step.explanation}
                          </p>

                          {step.variableState && (
                            <div className="text-[10px] font-mono text-neutral-400 bg-white/[0.02] px-2 py-1 rounded">
                              State: <span className="text-white">{step.variableState}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Potential Risk Callout */}
                {result.potentialRisk && (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/25 flex items-start gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Identified Risk: </span>
                      <span className="text-neutral-200">{result.potentialRisk}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-neutral-500">
                Select a variable or function symbol to track its full cross-file lifecycle.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
