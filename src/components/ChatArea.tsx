import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Terminal, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  GitPullRequest, 
  ExternalLink,
  Info,
  Bug,
  HelpCircle,
  Copy,
  Check,
  User,
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ShieldCheck,
  Lightbulb,
  CornerDownRight,
  RefreshCw
} from 'lucide-react';
import { ChatMessage, DiagnosticFinding, RepositoryData, StackTraceFrame } from '../types';
import { SAMPLE_STACK_TRACE } from '../utils/demoRepository';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  repo: RepositoryData | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectFinding: (finding: DiagnosticFinding) => void;
  onNavigateToSource: (filePath: string, line: number) => void;
  onUploadZip?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemoProject?: () => void;
  onTriggerPatch: (finding: DiagnosticFinding) => void;
  onOpenTab?: (tab: 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report') => void;
  onRunTests?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  repo,
  messages,
  isLoading,
  onSendMessage,
  onSelectFinding,
  onNavigateToSource,
  onUploadZip,
  onLoadDemoProject,
  onTriggerPatch,
  onOpenTab,
  onRunTests
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedHypotheses, setExpandedHypotheses] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handlePasteDemoStackTrace = () => {
    setInputText(SAMPLE_STACK_TRACE);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const toggleHypothesis = (id: string) => {
    setExpandedHypotheses(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-200 min-w-0">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index * 0.04, 0.2) }}
              className={`flex items-start gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 pt-0.5">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/20 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
                    <User className="w-4 h-4 text-neutral-200" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-950 via-neutral-900 to-purple-950 border border-white/25 flex items-center justify-center text-white shadow-sm ring-1 ring-white/15 relative">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                  </div>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`flex-1 max-w-3xl rounded-2xl p-4 md:p-5 transition-all text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#181818] text-white border border-white/20 rounded-tr-sm font-mono shadow-sm'
                    : 'bg-[#0e0e0e] text-neutral-200 border border-white/[0.09] rounded-tl-sm shadow-md'
                }`}
              >
                {/* Header Bar */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-white flex items-center gap-1.5">
                      {isUser ? (
                        <>
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span>You (Developer)</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-white" />
                          <span>CodeSherlock AI</span>
                        </>
                      )}
                    </span>

                    {!isUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium flex items-center gap-1 bg-white/10 text-white border border-white/15">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Google Gemini 3.8 Flash (Free Tier)</span>
                      </span>
                    )}

                    {msg.evidenceCount !== undefined && msg.evidenceCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.08] hidden sm:inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-neutral-400" />
                        <span>{msg.evidenceCount} repo evidence items</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        title="Copy message text"
                        className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Message Body — Rendered using clean MarkdownRenderer */}
                <div className="text-neutral-200">
                  <MarkdownRenderer
                    content={msg.text}
                    onNavigateToSource={onNavigateToSource}
                  />
                </div>

                {/* Step Progress Ticker (Step 1-4) */}
                {msg.stepProgress && msg.stepProgress.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2 font-mono text-[11px] bg-[#070707] p-3 rounded-xl border border-white/[0.04]">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Evidence Pipeline Execution</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {msg.stepProgress.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-neutral-300 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">
                            <strong className="text-white">[{step.step}/{step.total}]</strong> {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stack Trace Breakdown Card */}
                {msg.stackTrace && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-white">
                      <span className="flex items-center gap-1.5 font-mono text-red-300">
                        <Bug className="w-3.5 h-3.5 text-red-400" />
                        <span className="font-semibold">{msg.stackTrace.exceptionType}</span>: {msg.stackTrace.exceptionMessage}
                      </span>
                      <span className="text-[10px] bg-white/[0.08] text-white border border-white/10 px-2 py-0.5 rounded-full font-mono">
                        {msg.stackTrace.frames.length} FRAMES
                      </span>
                    </div>

                    <div className="space-y-1 bg-[#070707] p-3 rounded-xl border border-white/[0.06] font-mono text-[11px]">
                      {msg.stackTrace.frames.map((frame, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start justify-between p-1.5 rounded-lg transition-colors ${
                            frame.existsInRepo
                              ? 'bg-[#141414] hover:bg-[#1c1c1c] text-neutral-200'
                              : 'text-neutral-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-neutral-500">{idx + 1}.</span>
                            <span className="truncate text-white font-medium">{frame.file}</span>
                            <span className="text-neutral-400">:line {frame.line}</span>
                            <span className="text-neutral-500">({frame.functionName})</span>
                          </div>

                          {frame.existsInRepo ? (
                            <button
                              onClick={() => onNavigateToSource(frame.matchedRepoFile || frame.file, frame.line)}
                              className="text-white hover:underline flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full border border-white/15 flex-shrink-0 ml-2 font-mono transition-transform active:scale-95"
                            >
                              <span>Inspect Source</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-600 italic">external/runtime</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Root Cause Verdict Card */}
                {msg.mostPlausibleRootCause && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent border border-white/20 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Primary Root Cause Verdict</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Synthesized by Gemini 3.8 Flash
                      </span>
                    </div>
                    <p className="text-neutral-200 text-xs leading-relaxed font-sans pl-6">
                      {msg.mostPlausibleRootCause}
                    </p>
                  </div>
                )}

                {/* Diagnostic Findings / Ranked Hypotheses */}
                {msg.findings && msg.findings.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-3">
                    <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <Layers className="w-3.5 h-3.5 text-white" />
                        <span>Ranked Root Cause Hypotheses ({msg.findings.length})</span>
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Verified against AST</span>
                      </span>
                    </div>

                    {msg.findings.map((finding, fIndex) => {
                      const isExpanded = expandedHypotheses[finding.id] !== false;

                      return (
                        <div
                          key={finding.id}
                          className="bg-[#121212] rounded-xl border border-white/[0.08] overflow-hidden hover:border-white/20 transition-all shadow-sm"
                        >
                          {/* Card Header */}
                          <div 
                            onClick={() => toggleHypothesis(finding.id)}
                            className="p-3.5 flex items-center justify-between gap-2 cursor-pointer bg-[#161616] hover:bg-[#1a1a1a] transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-black shadow-xs">
                                #{finding.rank || fIndex + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                                finding.severity === 'CRITICAL' 
                                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}>
                                {finding.severity}
                              </span>
                              <span className="text-neutral-400 text-[10px] font-mono">
                                Confidence: <strong className="text-white">{finding.confidence}</strong>
                              </span>
                              {finding.verifiedInRepo && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Verified in Repo</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToSource(finding.file, finding.line);
                                }}
                                className="font-mono text-[11px] text-white hover:underline flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10"
                              >
                                <span>{finding.file}:{finding.line}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                              </button>

                              <button className="text-neutral-400 hover:text-white p-0.5">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Card Content */}
                          {isExpanded && (
                            <div className="p-4 space-y-3 border-t border-white/[0.06] text-xs">
                              <div className="font-semibold text-white text-xs">
                                {finding.title}
                              </div>

                              <p className="text-neutral-300 text-[11px] leading-relaxed">
                                {finding.hypothesis}
                              </p>

                              {/* Evidence Support */}
                              {finding.evidenceSupport && (
                                <div className="text-[11px] text-neutral-300 bg-[#0a0a0a] p-2.5 rounded-lg border border-white/[0.06] flex items-start gap-2">
                                  <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-white font-medium">Evidence Grounding: </span>
                                    <span>{finding.evidenceSupport}</span>
                                  </div>
                                </div>
                              )}

                              {/* Source Code Context Box */}
                              <div className="bg-[#060606] p-3 rounded-lg font-mono text-[11px] text-neutral-300 overflow-x-auto border border-white/[0.06]">
                                <pre className="leading-relaxed">{finding.codeContext}</pre>
                              </div>

                              {/* Explanation */}
                              <div className="text-[11px] text-neutral-300 bg-[#0f0f0f] p-2.5 rounded-lg border border-white/[0.06]">
                                <strong className="text-white">Explanation: </strong>
                                {finding.explanation}
                              </div>

                              {/* Actions Bar */}
                              <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                                <span className="text-[10px] text-neutral-400 italic truncate max-w-sm">
                                  Next step: {finding.recommendedNextStep}
                                </span>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {finding.candidatePatch && (
                                    <button
                                      onClick={() => {
                                        onSelectFinding(finding);
                                        onTriggerPatch(finding);
                                      }}
                                      className="flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm active:scale-95"
                                    >
                                      <GitPullRequest className="w-3 h-3" />
                                      <span>Inspect AI Patch</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onNavigateToSource(finding.file, finding.line)}
                                    className="flex items-center gap-1.5 bg-[#1f1f1f] hover:bg-[#282828] text-white px-3 py-1 rounded-full text-xs transition-colors border border-white/10 active:scale-95"
                                  >
                                    <FileCode className="w-3 h-3" />
                                    <span>View Source</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Targeted Debugging Steps */}
                {msg.targetedDebuggingSteps && msg.targetedDebuggingSteps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase flex items-center gap-1.5 text-white">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                      <span>Targeted Debugging Action Plan</span>
                    </div>
                    <div className="space-y-1.5 bg-[#090909] p-3 rounded-xl border border-white/[0.06] text-[11px] text-neutral-300">
                      {msg.targetedDebuggingSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-white/10 text-white font-mono text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/15">
                            {sIdx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Information & Uncertainties */}
                {msg.missingInformation && (
                  <div className="mt-3 text-[11px] text-neutral-400 bg-[#090909] p-3 rounded-xl border border-white/[0.06] flex items-start gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Uncertainty & Preconditions: </span>
                      <span>{msg.missingInformation}</span>
                    </div>
                  </div>
                )}

                {/* AI-Suggested Regression Unit Tests */}
                {msg.suggestedTests && msg.suggestedTests.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2.5">
                    <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI Regression Test Suggestions (Gemini 3.8 Flash)</span>
                      </span>
                      {onRunTests && (
                        <button
                          onClick={onRunTests}
                          className="flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/15 transition-all font-mono"
                        >
                          <Play className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Run Tests in Sandbox</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {msg.suggestedTests.map((test, tIdx) => (
                        <div key={tIdx} className="bg-[#101010] p-3 rounded-xl border border-white/[0.08] space-y-1.5">
                          <div className="text-xs font-mono font-medium text-white flex items-center justify-between">
                            <span>def {test.testName}():</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
                              python unittest
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            {test.description}
                          </p>
                          <pre className="p-2.5 bg-[#060606] rounded-lg font-mono text-[10px] text-neutral-300 overflow-x-auto border border-white/[0.04]">
                            {test.testCode}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Follow-up Action Chips */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-1.5">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      <span>Suggested Follow-Ups:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedPrompts.map((prompt, pIdx) => {
                        return (
                          <button
                            key={pIdx}
                            onClick={() => {
                              if (prompt === 'Inspect Proposed Patch' && onOpenTab) {
                                onOpenTab('patch');
                              } else if (prompt === 'Run Sandboxed Test Verification' && onRunTests) {
                                onRunTests();
                              } else if (prompt === 'Export Investigation Audit Report' && onOpenTab) {
                                onOpenTab('report');
                              } else {
                                onSendMessage(prompt);
                              }
                            }}
                            className="text-[10px] bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.1] px-3 py-1 rounded-full transition-all font-mono flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 shadow-xs"
                          >
                            <span>{prompt}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-neutral-400" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading / Investigating State with Micro-Animation */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 w-full"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-950 via-neutral-900 to-purple-950 border border-white/25 flex items-center justify-center text-white shadow-sm flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <div className="bg-[#0e0e0e] border border-white/[0.1] rounded-2xl rounded-tl-sm p-4 text-xs space-y-2.5 text-neutral-300 font-mono shadow-md max-w-xl">
              <div className="flex items-center gap-2 text-white">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="font-semibold text-[11px] uppercase tracking-wider text-white">
                  Google Gemini 3.8 Flash (Free Tier) Investigating...
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-neutral-400 pl-4 border-l border-white/10">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>1. Parsing repository AST and resolving cross-file call paths</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>2. Assembling compact evidence package with line numbers</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <span>3. Multi-file reasoning & hypothesis synthesis via Gemini</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <span>4. Validating line locations & candidate patch against repository</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Bar */}
      {repo && (
        <div className="px-4 py-2 border-t border-white/[0.08] bg-[#070707] flex items-center gap-2 overflow-x-auto text-[11px] select-none">
          <span className="text-neutral-500 flex items-center gap-1 font-mono flex-shrink-0 text-[10px]">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Prompts:
          </span>

          <button
            onClick={handlePasteDemoStackTrace}
            className="flex-shrink-0 bg-[#141414] hover:bg-[#1f1f1f] text-white border border-white/15 px-3 py-1 rounded-full font-mono transition-transform hover:scale-[1.02] active:scale-95"
          >
            Paste Demo Stack Trace
          </button>

          <button
            onClick={() => onSendMessage('Trace all cross-file callers and callees of apply_discount in pricing_engine.py')}
            className="flex-shrink-0 bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.08] px-3 py-1 rounded-full font-mono transition-transform hover:scale-[1.02] active:scale-95"
          >
            Trace callers of apply_discount
          </button>

          <button
            onClick={() => onSendMessage('Check repository for unhandled KeyError or dictionary subscript patterns')}
            className="flex-shrink-0 bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.08] px-3 py-1 rounded-full font-mono transition-transform hover:scale-[1.02] active:scale-95"
          >
            Scan for KeyError subscripts
          </button>

          <button
            onClick={() => onSendMessage('What happens when an order has no discount tier specified?')}
            className="flex-shrink-0 bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.08] px-3 py-1 rounded-full font-mono transition-transform hover:scale-[1.02] active:scale-95"
          >
            Test edge case: missing tier
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#000000]">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            rows={2}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              repo
                ? "Paste a Python stack trace or describe a bug across files (e.g. 'KeyError: rate in pricing_engine.py')..."
                : "Upload a repository ZIP or click 'Try Demo Repo' to begin..."
            }
            className="w-full bg-[#111111] border border-white/[0.1] rounded-xl pl-3.5 pr-28 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none font-mono shadow-inner"
          />

          <div className="absolute right-2.5 bottom-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center gap-1.5 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black font-semibold px-4 py-1.5 rounded-full text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <span>Investigate</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 px-1 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Google Gemini 3.8 Flash (Free Tier) · Zero billing guarantee
          </span>
          <span>Shift+Enter for multi-line inputs</span>
        </div>
      </div>
    </div>
  );
};
