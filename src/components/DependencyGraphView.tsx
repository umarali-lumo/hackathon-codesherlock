import React, { useState, useMemo } from 'react';
import { Network, ArrowRight, CornerDownRight, FileCode, CheckCircle2, HelpCircle } from 'lucide-react';
import { RepositoryData, SymbolInfo } from '../types';
import { buildCrossFileDependencies } from '../utils/pythonParser';

interface DependencyGraphViewProps {
  repo: RepositoryData;
  onNavigateToSource: (file: string, line: number) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
  repo,
  onNavigateToSource
}) => {
  const { definedSymbols, callEdges } = useMemo(
    () => buildCrossFileDependencies(repo.analyses),
    [repo.analyses]
  );

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(() => 
    definedSymbols.has('apply_discount') ? 'apply_discount' : Array.from(definedSymbols.keys())[0] || null
  );

  // Filter edges for selected symbol
  const callers = useMemo(
    () => selectedSymbol ? callEdges.filter(e => e.calleeFunction === selectedSymbol) : [],
    [selectedSymbol, callEdges]
  );

  const callees = useMemo(
    () => selectedSymbol ? callEdges.filter(e => e.callerFunction === selectedSymbol) : [],
    [selectedSymbol, callEdges]
  );

  const crossFileEdges = useMemo(
    () => callEdges.filter(e => e.isCrossFile),
    [callEdges]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-200 overflow-y-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Overview stats header */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Network className="w-4 h-4 text-neutral-400" />
            <span>Cross-File Relationship & Call Graph</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic AST call edges extracted across repository modules.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-[#181818] px-3.5 py-1.5 rounded-full border border-white/[0.08]">
            <span className="text-neutral-500">Total Symbols: </span>
            <span className="text-white font-medium">{definedSymbols.size}</span>
          </div>
          <div className="bg-[#181818] px-3.5 py-1.5 rounded-full border border-white/[0.08]">
            <span className="text-neutral-500">Cross-File Calls: </span>
            <span className="text-white font-medium">{crossFileEdges.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Symbol Selector */}
        <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-5 flex flex-col">
          <div className="font-semibold text-xs text-neutral-400 uppercase tracking-wider mb-3">
            Indexed Functions & Classes
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 max-h-[480px]">
            {Array.from(definedSymbols.entries()).map(([name, item]) => {
              const isSelected = selectedSymbol === name;
              const hasCrossFile = callEdges.some(e => (e.calleeFunction === name || e.callerFunction === name) && e.isCrossFile);

              return (
                <button
                  key={name}
                  onClick={() => setSelectedSymbol(name)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-mono transition-colors ${
                    isSelected
                      ? 'bg-white/10 text-white font-medium border border-white/20'
                      : 'hover:bg-white/[0.03] text-neutral-400'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-medium text-white">{name}()</span>
                    <div className="text-[10px] text-neutral-500 truncate">{item.file}</div>
                  </div>

                  {hasCrossFile && (
                    <span className="text-[9px] bg-white/[0.06] text-neutral-300 border border-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Cross-File
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Caller and Callee Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSymbol ? (
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="font-mono text-base font-semibold text-white">
                    def {selectedSymbol}()
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Defined in {definedSymbols.get(selectedSymbol)?.file} : L{definedSymbols.get(selectedSymbol)?.symbol.lineStart}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const item = definedSymbols.get(selectedSymbol);
                    if (item) onNavigateToSource(item.file, item.symbol.lineStart);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/[0.08] px-3.5 py-1.5 rounded-full transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>View Definition</span>
                </button>
              </div>

              {/* Callers (Who calls this function) */}
              <div>
                <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>Callers (Who invokes this function) — {callers.length}</span>
                </div>

                {callers.length > 0 ? (
                  <div className="space-y-2">
                    {callers.map((edge, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between ${
                          edge.isCrossFile
                            ? 'bg-[#181818] border-white/20 text-white'
                            : 'bg-[#0a0a0a] border-white/[0.06] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-neutral-500 font-medium">L{edge.line}:</span>
                          <span className="text-white">{edge.callerFile}</span>
                          <span className="text-neutral-500">({edge.callerFunction || 'module-scope'})</span>
                          <ArrowRight className="w-3 h-3 text-neutral-500" />
                          <span className="text-white font-medium">{edge.calleeFunction}()</span>
                        </div>

                        <button
                          onClick={() => onNavigateToSource(edge.callerFile, edge.line)}
                          className="text-[11px] bg-white text-black hover:bg-neutral-200 px-3 py-1 rounded-full font-medium transition-colors flex-shrink-0"
                        >
                          Go to Line {edge.line}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/[0.06] text-xs text-neutral-500 italic">
                    No static callers found inside the repository. This function may be an entrypoint or test case.
                  </div>
                )}
              </div>

              {/* Callees (What this function calls) */}
              <div>
                <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                  <span>Callees (Functions invoked by this function) — {callees.length}</span>
                </div>

                {callees.length > 0 ? (
                  <div className="space-y-2">
                    {callees.map((edge, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border bg-[#0a0a0a] border-white/[0.06] font-mono text-xs flex items-center justify-between text-neutral-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-neutral-500 font-medium">L{edge.line}:</span>
                          <span className="text-white">Calls {edge.calleeFunction}()</span>
                          <span className="text-neutral-500">defined in {edge.calleeFile}</span>
                        </div>

                        <button
                          onClick={() => onNavigateToSource(edge.calleeFile, edge.line)}
                          className="text-[11px] bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/[0.08] px-3 py-1 rounded-full transition-colors flex-shrink-0"
                        >
                          Inspect Callee
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/[0.06] text-xs text-neutral-500 italic">
                    No custom repository functions called inside this block.
                  </div>
                )}
              </div>

              {/* Static Analysis Notice */}
              <div className="pt-2 text-[11px] text-neutral-500 flex items-start gap-1.5 border-t border-white/[0.08]">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span>
                  Static AST analysis resolves deterministic direct and imported calls. Dynamic calls (e.g. `getattr()`, `*args/**kwargs` unpacks) are tracked with documented boundaries.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500 text-xs font-mono">
              Select a symbol to view caller and callee cross-file dependencies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
