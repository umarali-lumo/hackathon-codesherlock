import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  FileCode, 
  Network, 
  GitPullRequest, 
  PlayCircle, 
  ArrowRight, 
  Plus, 
  Minus,
  Check, 
  ExternalLink,
  ChevronRight,
  Terminal,
  Zap,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onUploadZip: (file: File) => void;
  onLoadDemoProject: () => void;
  onOpenWorkspace: () => void;
  hasLoadedRepo: boolean;
  repoName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onUploadZip,
  onLoadDemoProject,
  onOpenWorkspace,
  hasLoadedRepo,
  repoName
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      onUploadZip(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadZip(file);
    }
    e.target.value = '';
  };

  const scrollToDropzone = () => {
    const el = document.getElementById('upload-zone');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  // Visuvate-style animated bars heights
  const barScales = [0.5, 0.9, 0.4, 0.7, 1.0, 0.6, 0.8, 0.4, 0.9, 0.6];

  const faqs = [
    {
      q: 'How does CodeSherlock use Generative AI for repository debugging?',
      a: 'CodeSherlock integrates Google Gemini 3.8 Flash (Free Tier) using the official @google/genai SDK. When you describe a bug or paste a traceback, CodeSherlock collects parser evidence (AST symbols, cross-file caller and callee paths, static notices, and test failures), constructs a compact context package, and prompts Gemini to reason across multiple files to identify root causes and generate candidate fixes.'
    },
    {
      q: 'Is CodeSherlock 100% free with zero billing risk?',
      a: 'Yes. CodeSherlock exclusively uses Google Gemini models eligible for the free tier (gemini-3.8-flash) and local computation. It never requires a credit card, paid API subscriptions, or external paid tools. If the free quota is reached, model calls pause with an honest notice and fallback to deterministic analysis.'
    },
    {
      q: 'Do I need an account, password, or login to use CodeSherlock?',
      a: 'No. There is no signup, login page, password, or authentication gate. CodeSherlock opens directly into the investigation workspace for immediate use.'
    },
    {
      q: 'How are AI hypotheses and line numbers verified against hallucination?',
      a: 'Before displaying results, CodeSherlock validates every referenced file path, function symbol, and line number against your actual uploaded project files. Fabricated files or out-of-bounds lines are corrected or filtered, ensuring all reasoning is verifiable in your real source code.'
    },
    {
      q: 'How are proposed candidate patches validated?',
      a: 'Patches are never applied blindly to your repository. CodeSherlock stages candidate fixes in an isolated temporary sandbox, executes your repository unittests (via python3 -m unittest), compares baseline failures against patched outcomes, and reports regression metrics before you export standard Git .patch diffs.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-neutral-800 selection:text-white font-sans antialiased">
      {/* Minimalist Navigation */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#000000] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Mark */}
          <a href="#" className="flex items-center gap-2 text-white font-semibold text-sm tracking-tight">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            <span>CodeSherlock</span>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-400">
            <a href="#approach" className="hover:text-white transition-colors">Approach</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#comparison" className="hover:text-white transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {hasLoadedRepo ? (
              <button
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-1.5 text-xs font-medium hover:bg-neutral-200 transition-colors"
              >
                <span>Resume Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onLoadDemoProject}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-transparent text-white px-3.5 py-1.5 text-xs font-medium hover:border-white/40 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-neutral-400" />
                <span>Try Demo Repo</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-16 pb-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Equalizer Indicator */}
        <div className="flex items-end justify-center gap-1 h-6 w-16 mb-8 opacity-80">
          {barScales.slice(0, 7).map((scale, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full vv-pulse-bar"
              style={{
                height: '100%',
                '--initial-scale': scale,
                animationDelay: `${i * 0.15}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Master Headline (Exact Visuvate Style: Bold, Clean, Swiss Neo-Grotesque) */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] text-white leading-[1.08] max-w-4xl">
          Crafted for Code.<br />
          Built to Debug.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-neutral-400 max-w-2xl font-normal leading-relaxed">
          Real Generative AI cross-file repository investigation powered by Google Gemini 3.8 Flash (Free Tier). Collects AST evidence, isolates verified root causes across multiple files, and tests candidate patches in a sandbox.
        </p>

        {/* Unboxed Metadata Line (Anti-Slop Discipline) */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-500 font-mono">
          <span className="text-white font-medium">Google Gemini 3.8 Flash</span>
          <span aria-hidden="true">·</span>
          <span>Zero Paid API Costs</span>
          <span aria-hidden="true">·</span>
          <span>No Login Required</span>
          <span aria-hidden="true">·</span>
          <span>Verified In-Repo Grounding</span>
          <span aria-hidden="true">·</span>
          <span>Sandboxed Unittests</span>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={scrollToDropzone}
            className="rounded-full bg-white text-black px-6 py-2.5 text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Start Investigation
          </button>
          <button
            onClick={onLoadDemoProject}
            className="rounded-full border border-white/20 bg-transparent text-white px-6 py-2.5 text-xs font-medium hover:border-white/40 transition-colors"
          >
            Load Buggy Demo Project
          </button>
        </div>

        {/* DRAG & DROP ZIP CONTAINER (Visuvate Surface Style) */}
        <div id="upload-zone" className="w-full max-w-2xl mt-16 text-left">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer rounded-2xl p-8 sm:p-10 border transition-all duration-200 ${
              isDragOver
                ? 'bg-[#181818] border-white/40'
                : 'bg-[#111111] border-white/[0.08] hover:border-white/20'
            }`}
            style={{
              background: 'linear-gradient(158deg, #1f1f1f, #141414 34%, #0b0b0b 68%, #000000)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 text-neutral-300" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Drop your repository ZIP here
                </h3>
                <p className="text-xs text-neutral-400">
                  or click to select an archive from your local files
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-500">
                <span className="bg-black/60 px-2.5 py-1 rounded border border-white/[0.06]">
                  .ZIP archives up to 50MB
                </span>
                <span className="bg-black/60 px-2.5 py-1 rounded border border-white/[0.06]">
                  Safe in-memory traversal protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: OUR APPROACH (4-Card Grid matching Visuvate) */}
      <section id="approach" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/[0.08]">
        <div className="mb-14 text-left">
          <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase mb-2">
            Our Approach
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">
            Generative Intelligence.<br />
            Verifiable Source Grounding.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="p-7 rounded-xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between space-y-6 hover:border-white/20 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500">01</span>
              <h3 className="text-lg font-semibold text-white">Discovery & AST Evidence Collection</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ingests local ZIP archives without uploading files to third-party clouds. Executes Python 3.10 standard library AST parsing to collect functions, classes, imports, call edges, and static notices.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Native ast.parse · Zero privacy leak
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between space-y-6 hover:border-white/20 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500">02</span>
              <h3 className="text-lg font-semibold text-white">Cross-File Call & Context Synthesis</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connects callers, services, and callee functions across modules. Synthesizes a compact, line-numbered context package respecting model limits while preserving exact file paths.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Cross-module dependency tracing · Bounded context
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between space-y-6 hover:border-white/20 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500">03</span>
              <h3 className="text-lg font-semibold text-white">Google Gemini 3.8 Flash Reasoning</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Calls Gemini 3.8 Flash on the free tier to reason over cross-file evidence, rank root-cause hypotheses, explain failure mechanisms, and generate candidate code patches and regression tests.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Structured JSON schema · Verified in repo
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-7 rounded-xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between space-y-6 hover:border-white/20 transition-colors">
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500">04</span>
              <h3 className="text-lg font-semibold text-white">Sandboxed Patch Verification</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Stages AI-generated patches in an isolated temporary sandbox and executes tests using python3 -m unittest. Compares baseline failures to verify bug resolution before exporting Git diffs.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Disposable tempdir · Timeout guards
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: ARCHITECTURE & COMPARISON TABLE */}
      <section id="comparison" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/[0.08]">
        <div className="mb-14 text-left">
          <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase mb-2">
            Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">
            Grounded AI Reasoning. Zero Cost Guarantee.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl">
            A side-by-side contrast between CodeSherlock's evidence-grounded Gemini 3.8 Flash pipeline and generic ungrounded chat interfaces.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0c0c0c]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#141414] text-neutral-400 font-mono uppercase text-[10px] border-b border-white/[0.08]">
              <tr>
                <th className="p-4 font-medium">Dimension</th>
                <th className="p-4 font-semibold text-white">CodeSherlock (Gemini 3.8 Flash + AST)</th>
                <th className="p-4 font-medium text-neutral-500">Generic Ungrounded Chatbots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono text-neutral-300">
              <tr>
                <td className="p-4 font-sans font-medium text-white">Cost & Billing</td>
                <td className="p-4 text-white font-semibold">100% Free (Free-Tier Gemini 3.8 Flash)</td>
                <td className="p-4 text-neutral-500">Per-token paid billing or monthly fees</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-medium text-white">Authentication Gate</td>
                <td className="p-4 text-white font-semibold">No login / Instant workspace access</td>
                <td className="p-4 text-neutral-500">Requires account, billing profile, or OAuth</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-medium text-white">Repository Context</td>
                <td className="p-4 text-white font-semibold">Parser-extracted AST caller/callee graphs</td>
                <td className="p-4 text-neutral-500">Single pasted file or truncated clipboard</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-medium text-white">Anti-Hallucination</td>
                <td className="p-4 text-white font-semibold">Strict server validation against actual file lines</td>
                <td className="p-4 text-neutral-500">Hallucinates nonexistent files and lines</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-medium text-white">Patch Execution Validation</td>
                <td className="p-4 text-white font-semibold">Real sandboxed python3 unittest runs</td>
                <td className="p-4 text-neutral-500">Speculative patches without execution</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION: FREQUENTLY ASKED QUESTIONS (Visuvate Style Accordion) */}
      <section id="faq" className="py-24 px-6 max-w-5xl mx-auto border-t border-white/[0.08]">
        <div className="mb-14 text-left">
          <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase mb-2">
            FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className="flex items-center gap-4 text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                    <span className="font-mono text-xs text-neutral-500">{idx + 1}.</span>
                    <span>{faq.q}</span>
                  </span>
                  <span className="text-neutral-500 group-hover:text-white transition-colors ml-4">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3 pl-8 text-xs text-neutral-400 leading-relaxed max-w-3xl">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER (Visuvate Style) */}
      <footer className="border-t border-white/[0.08] py-12 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">CodeSherlock</span>
          <span aria-hidden="true">·</span>
          <span>NYLP AI Hackathon 2026</span>
          <span aria-hidden="true">·</span>
          <span className="text-neutral-400">Zero-Cost Deterministic Engine</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={scrollToDropzone} className="hover:text-white transition-colors">
            Upload ZIP
          </button>
          <button onClick={onLoadDemoProject} className="hover:text-white transition-colors">
            Demo Project
          </button>
          {hasLoadedRepo && (
            <button onClick={onOpenWorkspace} className="text-white hover:underline transition-all">
              Workspace
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
