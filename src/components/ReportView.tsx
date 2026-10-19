import React from 'react';
import { FileText, Download, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { RepositoryData, DiagnosticFinding, TestRunResult, CandidatePatch } from '../types';

interface ReportViewProps {
  repo: RepositoryData;
  findings: DiagnosticFinding[];
  stagedPatch: CandidatePatch | null;
  baselineResult: TestRunResult | null;
  patchedResult: TestRunResult | null;
}

export const ReportView: React.FC<ReportViewProps> = ({
  repo,
  findings,
  stagedPatch,
  baselineResult,
  patchedResult
}) => {
  const [copied, setCopied] = React.useState(false);

  // Generate Markdown report
  const generateMarkdownReport = (): string => {
    let md = `# CodeSherlock Investigation Report\n\n`;
    md += `**Project:** ${repo.name}\n`;
    md += `**Generated:** ${new Date().toUTCString()}\n`;
    md += `**Repository Scope:** ${repo.files.length} files, ${repo.totalLoc} lines of code, ${repo.totalFunctions} functions\n\n`;

    md += `## 1. Executive Summary & Root-Cause Hypotheses\n\n`;
    if (findings.length === 0) {
      md += `No diagnostic findings recorded.\n\n`;
    } else {
      findings.forEach((f, idx) => {
        md += `### Hypothesis #${f.rank || idx + 1}: ${f.title} (${f.severity} / ${f.confidence} Confidence)\n`;
        md += `- **Engine:** ${f.engineType === 'gemini-ai' ? 'Google Gemini 3.8 Flash (Free Tier)' : 'Deterministic Static Engine'}\n`;
        md += `- **Target File & Line:** \`${f.file}:${f.line}\` (Verified in repository: ${f.verifiedInRepo ? 'Yes' : 'Unchecked'})\n`;
        md += `- **Hypothesis:** ${f.hypothesis}\n`;
        if (f.evidenceSupport) {
          md += `- **Evidence Grounding:** ${f.evidenceSupport}\n`;
        }
        md += `- **Explanation:** ${f.explanation}\n`;
        md += `- **Recommended Next Step:** ${f.recommendedNextStep}\n`;
        if (f.callStackContext && f.callStackContext.length > 0) {
          md += `- **Cross-File Call Context:**\n`;
          f.callStackContext.forEach(c => {
            md += `  - \`${c}\`\n`;
          });
        }
        md += `\n`;
      });
    }

    md += `## 2. Cross-File Dependencies & Impact\n\n`;
    md += `- **Test Files:** ${repo.testFiles.join(', ') || 'None'}\n`;
    md += `- **Deterministic Analysis:** Extracted callers & callees using Python AST.\n\n`;

    md += `## 3. Candidate Patch & Verification\n\n`;
    if (stagedPatch) {
      md += `**Target File:** \`${stagedPatch.targetFile}\`\n`;
      md += `**Description:** ${stagedPatch.description}\n\n`;
      md += `\`\`\`diff\n${stagedPatch.unifiedDiff}\n\`\`\`\n\n`;
    } else {
      md += `No candidate patch generated for this session.\n\n`;
    }

    md += `## 4. Test Execution Status\n\n`;
    if (baselineResult) {
      md += `- **Baseline Tests:** ${baselineResult.passed}/${baselineResult.total} passed (${baselineResult.failed} failed, ${baselineResult.errors} errors)\n`;
    }
    if (patchedResult) {
      md += `- **Patched Tests:** ${patchedResult.passed}/${patchedResult.total} passed (${patchedResult.failed} failed, ${patchedResult.errors} errors)\n`;
      if (patchedResult.failed === 0 && baselineResult && baselineResult.failed > 0) {
        md += `- **Verification:** PASSED (All baseline failures resolved by candidate patch without regressions).\n`;
      }
    }
    if (!baselineResult && !patchedResult) {
      md += `Tests not executed in this session.\n`;
    }

    md += `\n## 5. Remaining Uncertainties & Safe Execution Policy\n\n`;
    md += `- Deterministic static analysis cannot dynamically evaluate runtime monkey-patching or external microservice network inputs.\n`;
    md += `- Python unit tests run in temporary disposable directories with execution timeout guards.\n`;

    return md;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesherlock-investigation-${repo.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const data = {
      project: repo.name,
      createdAt: new Date().toISOString(),
      stats: {
        files: repo.files.length,
        loc: repo.totalLoc,
        functions: repo.totalFunctions,
        classes: repo.totalClasses
      },
      findings,
      stagedPatch,
      testResults: {
        baseline: baselineResult,
        patched: patchedResult
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codesherlock-investigation-${repo.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-neutral-200 overflow-y-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Action Header */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileText className="w-4 h-4 text-neutral-400" />
            <span>Investigation Report & Audit Log</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Export verifiable findings, cross-file root causes, candidate diffs, and test metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/[0.08] px-3.5 py-1.5 rounded-full transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 text-xs bg-white hover:bg-neutral-200 text-black font-semibold px-4 py-1.5 rounded-full transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 text-xs bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/[0.08] px-3.5 py-1.5 rounded-full transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .JSON</span>
          </button>
        </div>
      </div>

      {/* Formatted Markdown Preview */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 font-sans text-xs leading-relaxed space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <h1 className="text-lg font-bold text-white">CodeSherlock Investigation Report</h1>
          <div className="flex items-center gap-4 text-neutral-400 text-xs mt-2 font-mono">
            <span>Project: <strong className="text-white">{repo.name}</strong></span>
            <span>Files: <strong className="text-white">{repo.files.length}</strong></span>
            <span>LOC: <strong className="text-white">{repo.totalLoc}</strong></span>
          </div>
        </div>

        {/* Section 1: Findings */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            1. Root-Cause Hypotheses & Evidence
          </h2>
          {findings.map((f, i) => (
            <div key={f.id} className="bg-[#141414] p-4 rounded-xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Finding {i + 1}: {f.title}</span>
                <span className="font-mono text-neutral-400">{f.file}:{f.line}</span>
              </div>
              <p className="text-neutral-300">{f.explanation}</p>
              <div className="bg-[#0a0a0a] p-2.5 rounded-lg font-mono text-[11px] text-neutral-400">
                {f.recommendedNextStep}
              </div>
            </div>
          ))}
        </div>

        {/* Section 2: Patch */}
        {stagedPatch && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              2. Candidate Patch
            </h2>
            <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.08] space-y-2">
              <div className="font-mono text-xs text-neutral-300">{stagedPatch.targetFile}</div>
              <pre className="p-3 bg-[#0a0a0a] rounded-lg font-mono text-[11px] text-neutral-300 overflow-x-auto">
                {stagedPatch.unifiedDiff}
              </pre>
            </div>
          </div>
        )}

        {/* Section 3: Test Verification */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            3. Test Execution Verification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.08] text-xs font-mono">
              <div className="text-neutral-400 font-semibold mb-2">Baseline Execution:</div>
              <div>Total: {baselineResult?.total ?? 'N/A'}</div>
              <div>Passed: {baselineResult?.passed ?? 'N/A'}</div>
              <div>Failed: {baselineResult?.failed ?? 'N/A'}</div>
            </div>
            <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.08] text-xs font-mono">
              <div className="text-neutral-400 font-semibold mb-2">Patched Execution:</div>
              <div>Total: {patchedResult?.total ?? 'N/A'}</div>
              <div>Passed: {patchedResult?.passed ?? 'N/A'}</div>
              <div>Failed: {patchedResult?.failed ?? 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
