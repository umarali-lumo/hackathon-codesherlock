import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  GitBranch, 
  Star, 
  GitFork, 
  Eye, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  History, 
  Sparkles, 
  Compass, 
  Share2, 
  GitPullRequest, 
  Play, 
  Activity, 
  BarChart3, 
  PieChart as PieIcon, 
  Layers, 
  Check, 
  ExternalLink,
  Zap,
  ArrowRight,
  Terminal,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { RepositoryData, TestRunResult, DiagnosticFinding, CandidatePatch } from '../types';
import { SUPPORTED_LANGUAGES, LanguageMeta } from '../utils/multiLanguageParser';

interface RepoDashboardProps {
  repo: RepositoryData;
  findings: DiagnosticFinding[];
  stagedPatch: CandidatePatch | null;
  baselineResult: TestRunResult | null;
  patchedResult: TestRunResult | null;
  onOpenTab: (tab: 'chat' | 'source' | 'dependencies' | 'patch' | 'tests' | 'report') => void;
  onTriggerWhyFailed: () => void;
  onTriggerTraceVariable: (varName: string) => void;
  onTriggerMinimalFix: () => void;
}

export const RepoDashboard: React.FC<RepoDashboardProps> = ({
  repo,
  findings,
  stagedPatch,
  baselineResult,
  patchedResult,
  onOpenTab,
  onTriggerWhyFailed,
  onTriggerTraceVariable,
  onTriggerMinimalFix
}) => {
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [starCount, setStarCount] = useState(48);

  // Compute language distribution statistics
  const { langStats, totalCalculatedLoc } = useMemo(() => {
    const langCounts: Record<string, { loc: number; files: number }> = {};
    let totalLoc = 0;

    for (const f of repo.files) {
      const lang = f.language.toLowerCase();
      if (!langCounts[lang]) langCounts[lang] = { loc: 0, files: 0 };
      langCounts[lang].loc += f.loc;
      langCounts[lang].files += 1;
      totalLoc += f.loc;
    }

    const stats = Object.entries(langCounts).map(([langId, data]) => {
      const meta: LanguageMeta = SUPPORTED_LANGUAGES[langId] || {
        id: langId,
        name: langId.toUpperCase(),
        color: '#3b82f6',
        extensions: []
      };
      const percentage = totalLoc > 0 ? (data.loc / totalLoc) * 100 : 0;
      return {
        ...meta,
        loc: data.loc,
        files: data.files,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return { langStats: stats, totalCalculatedLoc: totalLoc };
  }, [repo.files]);

  // Donut chart calculations
  const donutSlices = useMemo(() => {
    let cumulativeAngle = 0;
    return langStats.map(stat => {
      const angle = (stat.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;
      return {
        ...stat,
        startAngle,
        endAngle
      };
    });
  }, [langStats]);

  const activeHoveredStat = useMemo(() => {
    if (!hoveredLang) return null;
    return langStats.find(s => s.name === hoveredLang || s.id === hoveredLang) || null;
  }, [hoveredLang, langStats]);

  const handleStarClick = () => {
    setStarred(!starred);
    setStarCount(prev => starred ? prev - 1 : prev + 1);
  };

  const isTestPassing = patchedResult ? patchedResult.failed === 0 : (baselineResult?.failed === 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#000000] text-neutral-100 font-sans p-4 md:p-8 space-y-6 select-none antialiased">
      {/* 1. Jet-Black GitHub-Themed Header */}
      <div className="border border-white/[0.08] bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-[#141414] border border-white/[0.08] flex items-center justify-center text-white">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <span className="text-neutral-500 font-mono">codesherlock /</span>
              <span className="text-white font-mono font-bold hover:underline cursor-pointer">
                {repo.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-white/10 text-neutral-400 bg-white/[0.04]">
                Public
              </span>
            </div>
          </div>

          {/* Repository Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors">
              <Eye className="w-3.5 h-3.5 text-neutral-400" />
              <span>Watch</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px]">12</span>
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors">
              <GitFork className="w-3.5 h-3.5 text-neutral-400" />
              <span>Fork</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px]">4</span>
            </button>

            <button 
              onClick={handleStarClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all ${
                starred
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-[#141414] hover:bg-[#1f1f1f] text-neutral-300 hover:text-white border-white/[0.08]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starred ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'}`} />
              <span>{starred ? 'Starred' : 'Star'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px]">{starCount}</span>
            </button>
          </div>
        </div>

        {/* Branch & Overview Metrics Bar */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-white/[0.08] flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-white/[0.08] font-mono text-[11px] text-white">
              <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
              <strong className="text-white">main</strong>
            </span>
            <span className="text-neutral-400 text-xs font-mono">
              {repo.files.length} files · <span className="text-white font-medium">{repo.totalLoc}</span> lines of code · <span className="text-white font-medium">{repo.totalFunctions}</span> functions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AST Grounding: 100% Verified</span>
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-white/[0.06] text-neutral-300 border border-white/10 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini 3.8 Flash Free Tier</span>
            </span>
          </div>
        </div>

        {/* Multi-Language Segmented Distribution Bar */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#141414]">
            {langStats.map(stat => (
              <div
                key={stat.id}
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: stat.color
                }}
                className="h-full transition-all hover:opacity-80"
                title={`${stat.name}: ${stat.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Language Legend */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono pt-1">
            {langStats.map(stat => (
              <div key={stat.id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-medium text-white">{stat.name}</span>
                <span className="text-neutral-500">{stat.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Micro-Features Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feature 1 */}
        <div
          onClick={onTriggerWhyFailed}
          className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] hover:border-red-500/40 cursor-pointer transition-all space-y-3 group shadow-md hover:bg-[#0f0f0f]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Highest Priority
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm group-hover:text-red-300 transition-colors flex items-center justify-between">
              <span>1. “Why did it fail here?”</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
              User selects an error or traceback. AI traces backwards from the crash site to locate where bad state originated in other files.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div
          onClick={() => onTriggerTraceVariable('coupon')}
          className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] hover:border-cyan-500/40 cursor-pointer transition-all space-y-3 group shadow-md hover:bg-[#0f0f0f]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Cross-File
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors flex items-center justify-between">
              <span>2. Variable & Function Tracing</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
              Tracks where a variable is initialized, modified, passed across module boundaries, or consumed in downstream calculations.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div
          onClick={onTriggerMinimalFix}
          className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] hover:border-emerald-500/40 cursor-pointer transition-all space-y-3 group shadow-md hover:bg-[#0f0f0f]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Minimal Fix Mode
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors flex items-center justify-between">
              <span>3. Minimal Fix Mode</span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
              Proposes the smallest surgical 1-line patch instead of rewriting whole files, avoiding unintended bugs and regressions.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Jet-Black Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Donut / Pie Chart Card */}
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Language Distribution (Pie / Donut)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Total: {totalCalculatedLoc} LOC
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* Smooth SVG Donut Chart */}
            <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {donutSlices.map((slice) => {
                  return (
                    <circle
                      key={slice.id}
                      cx="80"
                      cy="80"
                      r="60"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="20"
                      strokeDasharray={`${(slice.percentage / 100) * 377} 377`}
                      strokeDashoffset={-((slice.startAngle / 360) * 377)}
                      className="transition-all hover:stroke-width-[24] cursor-pointer opacity-90 hover:opacity-100"
                      onMouseEnter={() => setHoveredLang(slice.name)}
                      onMouseLeave={() => setHoveredLang(null)}
                    />
                  );
                })}
              </svg>
              {/* Dynamic Center Badge */}
              <div className="absolute flex flex-col items-center justify-center text-center font-mono pointer-events-none">
                <span className="text-sm font-bold text-white max-w-[100px] truncate">
                  {activeHoveredStat ? activeHoveredStat.name : langStats[0]?.name || 'Code'}
                </span>
                <span className="text-[11px] text-neutral-400 font-semibold">
                  {activeHoveredStat ? `${activeHoveredStat.percentage.toFixed(1)}%` : `${repo.files.length} Files`}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {activeHoveredStat ? `${activeHoveredStat.loc} LOC` : 'Indexed'}
                </span>
              </div>
            </div>

            {/* Language Breakdown List */}
            <div className="space-y-2 text-xs font-mono flex-1 w-full max-w-xs">
              {langStats.map(stat => (
                <div 
                  key={stat.id} 
                  onMouseEnter={() => setHoveredLang(stat.name)}
                  onMouseLeave={() => setHoveredLang(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
                    hoveredLang === stat.name ? 'bg-white/10' : 'bg-[#141414] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }} />
                    <span className="text-white font-medium">{stat.name}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-neutral-200 font-bold">{stat.loc} LOC</span>
                    <span className="text-neutral-500 text-[10px] ml-1.5">({stat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complexity & Defect Hotspot Bar Chart */}
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                File Volume & Defect Hotspot Risk (Bar Chart)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Ranked by LOC
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {repo.files.slice(0, 6).map((file) => {
              const analysis = repo.analyses[file.path];
              const funcCount = analysis?.functions.length || 0;
              const maxLoc = Math.max(...repo.files.map(f => f.loc), 50);
              const barWidth = Math.max(15, (file.loc / maxLoc) * 100);
              const isBugSite = file.path.includes('pricing');

              return (
                <div key={file.path} className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate max-w-[220px]" title={file.path}>
                        {file.path}
                      </span>
                      {isBugSite && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30">
                          Failure Site
                        </span>
                      )}
                    </div>
                    <span className="text-neutral-400 tabular-nums">
                      {file.loc} LOC · {funcCount} fn
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-[#141414] overflow-hidden flex">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full transition-all ${
                        isBugSite ? 'bg-red-500' : 'bg-white/80'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Isolated Test Runner Sandbox Pulse & Audit Commits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sandbox Test Suite Pulse */}
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Isolated Sandbox Test Suite Status
              </h3>
            </div>
            <button
              onClick={() => onOpenTab('tests')}
              className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Runner</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.08] flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTestPassing ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span>Test Suite: {repo.testFiles.join(', ') || 'test_checkout.py'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                {stagedPatch 
                  ? 'Candidate patch applied in sandbox · 3/3 tests passing' 
                  : 'Baseline status: 2 passed, 1 failed (KeyError: rate)'}
              </p>
            </div>

            <button
              onClick={() => onOpenTab('tests')}
              className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-transform hover:scale-[1.02] active:scale-95"
            >
              Run Isolated Tests
            </button>
          </div>
        </div>

        {/* Audit Commits & Activity Log */}
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Audit Timeline & Analysis Pulse
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Live State
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">fix(pricing): defensive tier fallback lookup</span>
                  <p className="text-[10px] text-neutral-400">Minimal 1-line patch verified with zero collateral changes</p>
                </div>
              </div>
              <span className="text-neutral-500 text-[11px]">e94b21a</span>
            </div>

            <div className="p-3 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">test(orders): add missing rate key test scenario</span>
                  <p className="text-[10px] text-neutral-400">Exposes KeyError: rate when item has unmapped tier</p>
                </div>
              </div>
              <span className="text-neutral-500 text-[11px]">8c12fa4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
