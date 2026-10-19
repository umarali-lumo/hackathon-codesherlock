import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileCode, 
  Search, 
  AlertCircle, 
  Copy, 
  Check, 
  Compass, 
  Share2, 
  GitPullRequest, 
  Zap, 
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
  Terminal,
  Bookmark,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SourceFile, FileAnalysis } from '../types';
import { detectFileLanguage, tokenizeCodeLine } from '../utils/multiLanguageParser';

interface SourceViewerProps {
  file: SourceFile | null;
  analysis?: FileAnalysis;
  targetLine?: number | null;
  onWhyFailedHere?: (file: string, line: number, codeSnippet: string) => void;
  onTraceVariable?: (varName: string, file: string, line: number) => void;
  onRequestMinimalFix?: (file: string, line: number, bugDesc: string) => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  file,
  analysis,
  targetLine,
  onWhyFailedHere,
  onTraceVariable,
  onRequestMinimalFix
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(targetLine || null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [minimalFixMode, setMinimalFixMode] = useState<boolean>(true);
  const [showOutline, setShowOutline] = useState<boolean>(false);
  const [pinnedLine, setPinnedLine] = useState<number | null>(null);

  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetLine) {
      setActiveLine(targetLine);
      setPinnedLine(targetLine);
      lineRefs.current[targetLine]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [targetLine, file]);

  // Keyboard shortcut listener (/ or Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'f') || (e.metaKey && e.key === 'f')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchTerm('');
        setShowOutline(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lines = useMemo(() => file ? file.content.split('\n') : [], [file]);
  const langMeta = useMemo(() => file ? detectFileLanguage(file.path) : { id: 'plaintext', name: 'Plain Text', color: '#888', extensions: [] }, [file]);

  // Matching line indices for search
  const matchedLineNumbers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const matches: number[] = [];
    lines.forEach((l, idx) => {
      if (l.toLowerCase().includes(term)) {
        matches.push(idx + 1);
      }
    });
    return matches;
  }, [lines, searchTerm]);

  const handleNextMatch = () => {
    if (matchedLineNumbers.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchedLineNumbers.length;
    setCurrentMatchIndex(nextIdx);
    const target = matchedLineNumbers[nextIdx];
    setActiveLine(target);
    lineRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrevMatch = () => {
    if (matchedLineNumbers.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchedLineNumbers.length) % matchedLineNumbers.length;
    setCurrentMatchIndex(prevIdx);
    const target = matchedLineNumbers[prevIdx];
    setActiveLine(target);
    lineRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#000000] text-neutral-500 font-mono text-xs select-none">
        <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center mb-3 text-neutral-400">
          <FileCode className="w-5 h-5 stroke-1" />
        </div>
        <p className="text-neutral-300 font-medium">No File Selected</p>
        <p className="text-neutral-600 text-[11px] mt-1">Select any file from the sidebar to inspect syntax and execute code traces</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSymbolClick = (tokenText: string, lineNum: number) => {
    const clean = tokenText.replace(/[^a-zA-Z0-9_]/g, '');
    if (clean && clean.length > 1) {
      setSelectedSymbol(clean);
      if (onTraceVariable) {
        onTraceVariable(clean, file.path, lineNum);
      }
    }
  };

  const totalSymbols = (analysis?.functions.length || 0) + (analysis?.classes.length || 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-100 min-w-0 font-sans select-none antialiased">
      {/* 1. Jet-Black IDE Top Header Bar */}
      <div className="h-12 px-4 border-b border-white/[0.08] bg-[#0a0a0a] flex items-center justify-between text-xs gap-3 z-10">
        {/* Left: Language & Path */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.08] text-[11px] font-mono">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: langMeta.color }}
            />
            <span className="text-neutral-300 font-medium">{langMeta.name}</span>
          </div>

          <span className="font-mono font-medium text-white truncate max-w-[240px] sm:max-w-xs">{file.path}</span>
          <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">
            ({lines.length} lines · {(file.size / 1024).toFixed(1)} KB)
          </span>

          {totalSymbols > 0 && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                showOutline
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-[#141414] text-neutral-400 border-white/[0.08] hover:text-white hover:bg-[#1a1a1a]'
              }`}
              title="Toggle symbols outline"
            >
              <Code2 className="w-3 h-3" />
              <span>Outline ({totalSymbols})</span>
            </button>
          )}
        </div>

        {/* Center/Right: In-Editor Code Intelligence Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live In-File Search */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-2.5 text-neutral-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Find in file (/)..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentMatchIndex(0);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                }
              }}
              className="bg-[#141414] border border-white/[0.08] focus:border-white/30 rounded-full pl-7 pr-7 py-1 text-[11px] text-white placeholder-neutral-500 focus:outline-none w-32 sm:w-44 transition-all font-mono"
            />
            {matchedLineNumbers.length > 0 && (
              <div className="absolute right-2 flex items-center gap-0.5 text-[9px] font-mono text-neutral-400">
                <span>{currentMatchIndex + 1}/{matchedLineNumbers.length}</span>
                <button onClick={handlePrevMatch} className="hover:text-white p-0.5"><ChevronUp className="w-2.5 h-2.5" /></button>
                <button onClick={handleNextMatch} className="hover:text-white p-0.5"><ChevronDown className="w-2.5 h-2.5" /></button>
              </div>
            )}
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 text-neutral-500 hover:text-white p-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Micro-Feature 1: Why did it fail here? */}
          {onWhyFailedHere && (
            <button
              onClick={() => {
                const targetL = activeLine || targetLine || 23;
                const snippet = lines[targetL - 1] || '';
                onWhyFailedHere(file.path, targetL, snippet);
              }}
              title="Trace why code failed at current line back to its caller origin in other files"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-[11px] transition-all hover:scale-[1.02] active:scale-95"
            >
              <Compass className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Why failed here?</span>
            </button>
          )}

          {/* Micro-Feature 2: Trace Variable */}
          {onTraceVariable && (
            <div className="flex items-center gap-1 bg-[#141414] rounded-full border border-white/[0.08] px-2 py-0.5">
              <Share2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Trace symbol..."
                value={selectedSymbol}
                onChange={e => setSelectedSymbol(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && selectedSymbol.trim()) {
                    onTraceVariable(selectedSymbol.trim(), file.path, activeLine || 1);
                  }
                }}
                className="bg-transparent text-[11px] font-mono text-white placeholder-neutral-500 focus:outline-none w-20 sm:w-28"
              />
            </div>
          )}

          {/* Micro-Feature 3: Minimal Fix Mode Switch */}
          <button
            onClick={() => {
              const newState = !minimalFixMode;
              setMinimalFixMode(newState);
              if (newState && onRequestMinimalFix) {
                const targetL = activeLine || targetLine || 23;
                onRequestMinimalFix(file.path, targetL, `Generate minimal patch for line ${targetL}`);
              }
            }}
            title="When active, AI proposes 1-line surgical patch without rewriting files"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] border transition-all ${
              minimalFixMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-[#141414] text-neutral-400 border-white/[0.08] hover:text-white'
            }`}
          >
            <GitPullRequest className="w-3 h-3 text-emerald-400" />
            <span className="hidden lg:inline">Minimal Fix: {minimalFixMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Copy File Content */}
          <button
            onClick={handleCopy}
            title="Copy file code to clipboard"
            className="p-1.5 rounded-full hover:bg-[#1a1a1a] text-neutral-400 hover:text-white border border-transparent hover:border-white/[0.08] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Discovered Symbols Outline Drawer (collapsible) */}
      {showOutline && analysis && totalSymbols > 0 && (
        <div className="px-4 py-2 bg-[#0c0c0c] border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <span className="text-neutral-500 flex-shrink-0 font-medium">JUMP TO:</span>
          {analysis.classes.map(cls => (
            <button
              key={cls.name}
              onClick={() => {
                setActiveLine(cls.lineStart);
                lineRefs.current[cls.lineStart]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="bg-[#141414] hover:bg-[#1e1e1e] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/20 px-2.5 py-0.5 rounded-full flex-shrink-0 transition-colors"
            >
              class <strong className="text-white">{cls.name}</strong> <span className="text-neutral-500">(L{cls.lineStart})</span>
            </button>
          ))}
          {analysis.functions.map(fn => (
            <button
              key={fn.name}
              onClick={() => {
                setActiveLine(fn.lineStart);
                lineRefs.current[fn.lineStart]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="bg-[#141414] hover:bg-[#1e1e1e] text-cyan-300 hover:text-cyan-200 border border-white/[0.08] hover:border-white/20 px-2.5 py-0.5 rounded-full flex-shrink-0 transition-colors"
            >
              fn <strong className="text-white">{fn.name}()</strong> <span className="text-neutral-500">(L{fn.lineStart})</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Syntax Error Notification Banner */}
      {analysis?.syntaxError && (
        <div className="m-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-white">Syntax Diagnostics at Line {analysis.syntaxError.line}</div>
            <p className="text-[11px] text-red-300">{analysis.syntaxError.msg}</p>
          </div>
        </div>
      )}

      {/* 4. Jet-Black Multi-Language Code Viewport */}
      <div className="flex-1 overflow-auto font-mono text-xs p-3 bg-[#000000] leading-6 select-text">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isTarget = activeLine === lineNum;
          const isPinned = pinnedLine === lineNum;
          const matchesSearch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
          const isCurrentMatch = matchesSearch && matchedLineNumbers[currentMatchIndex] === lineNum;
          const isErrorLine = file.path.includes('pricing') && lineNum === 23;

          // Multi-Language Tokenizer
          const tokens = tokenizeCodeLine(line, langMeta.id);

          return (
            <div
              key={lineNum}
              ref={el => { lineRefs.current[lineNum] = el; }}
              onClick={() => {
                setActiveLine(lineNum);
                setPinnedLine(lineNum);
              }}
              className={`group flex items-start leading-6 transition-colors rounded -mx-1 px-1 relative ${
                isTarget
                  ? 'bg-white/[0.06] text-white border-l-2 border-white'
                  : isErrorLine
                  ? 'bg-red-950/25 text-red-100 border-l-2 border-red-500'
                  : isCurrentMatch
                  ? 'bg-yellow-500/25 text-white border-l-2 border-yellow-400'
                  : matchesSearch
                  ? 'bg-yellow-500/10 text-neutral-200'
                  : 'hover:bg-white/[0.03] text-neutral-300'
              }`}
            >
              {/* Line Gutter with number, failure pin, and breakpoint indicator */}
              <div 
                className="w-12 select-none text-right pr-4 text-[11px] flex-shrink-0 flex items-center justify-end gap-1 cursor-pointer"
                title={`Line ${lineNum} (Click to pin & inspect)`}
              >
                {isErrorLine ? (
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                ) : isPinned ? (
                  <Bookmark className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 fill-cyan-400/30" />
                ) : null}

                <span className={`tabular-nums ${
                  isTarget ? 'text-white font-bold' : isErrorLine ? 'text-red-400 font-bold' : 'text-neutral-600 group-hover:text-neutral-400'
                }`}>
                  {lineNum}
                </span>
              </div>

              {/* Code content with multi-language Syntax Token Highlighting */}
              <div className="whitespace-pre flex-1 min-w-0 pr-4 font-mono">
                {tokens.map((token, tIdx) => {
                  let tokenClass = 'text-neutral-300';

                  if (token.type === 'keyword') tokenClass = 'text-rose-400 font-medium';
                  else if (token.type === 'string') tokenClass = 'text-emerald-300';
                  else if (token.type === 'comment') tokenClass = 'text-neutral-500 italic';
                  else if (token.type === 'number') tokenClass = 'text-cyan-300';
                  else if (token.type === 'function') tokenClass = 'text-blue-300 font-medium';
                  else if (token.type === 'type') tokenClass = 'text-amber-300';
                  else if (token.type === 'operator') tokenClass = 'text-neutral-400';

                  return (
                    <span
                      key={tIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (token.type === 'variable' || token.type === 'function') {
                          handleSymbolClick(token.text, lineNum);
                        }
                      }}
                      className={`${tokenClass} hover:underline cursor-pointer transition-colors`}
                      title={token.type === 'variable' || token.type === 'function' ? `Trace "${token.text}" across files` : undefined}
                    >
                      {token.text}
                    </span>
                  );
                })}
              </div>

              {/* In-Editor Hover / Active Floating HUD */}
              {(isTarget || isErrorLine) && (
                <div className="hidden group-hover:flex absolute right-4 top-1 items-center gap-1.5 bg-[#141414] border border-white/[0.12] rounded-full px-2.5 py-0.5 shadow-xl text-[10px] font-mono z-10 backdrop-blur-md">
                  {onWhyFailedHere && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhyFailedHere(file.path, lineNum, line);
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-red-500/10 transition-colors"
                      title="Run cross-file traceback to origin"
                    >
                      <Compass className="w-2.5 h-2.5" />
                      <span>Why failed?</span>
                    </button>
                  )}

                  {onRequestMinimalFix && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestMinimalFix(file.path, lineNum, `Defect at ${file.path}:${lineNum}`);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-emerald-500/10 transition-colors"
                      title="Propose 1-line surgical patch"
                    >
                      <GitPullRequest className="w-2.5 h-2.5" />
                      <span>Minimal Fix</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${file.path}:${lineNum}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-neutral-400 hover:text-white px-1.5 py-0.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Copy line permalink"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
