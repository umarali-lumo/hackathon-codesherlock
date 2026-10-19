import { 
  RepositoryData, 
  ParsedStackTrace, 
  EvidencePackage, 
  TestRunResult,
  SourceFile 
} from '../types';
import { buildCrossFileDependencies } from './pythonParser';

/**
 * Step 1 & 2 of CodeSherlock AI Pipeline:
 * Collects parser-derived relationships, stack trace frames, AST symbols,
 * static analysis notices, and formats a compact, bounded context package
 * grounded in the actual repository.
 */
export function collectInvestigationEvidence(
  query: string,
  repo: RepositoryData,
  stackTrace: ParsedStackTrace | null,
  baselineResult?: TestRunResult | null
): EvidencePackage {
  const queryLower = query.toLowerCase();
  const fileScore = new Map<string, { score: number; reasons: string[] }>();

  // Helper to record file relevance score
  const addScore = (path: string, points: number, reason: string) => {
    const cur = fileScore.get(path) || { score: 0, reasons: [] };
    cur.score += points;
    if (!cur.reasons.includes(reason)) cur.reasons.push(reason);
    fileScore.set(path, cur);
  };

  // 1. Stack trace evidence (Highest priority)
  if (stackTrace && stackTrace.frames.length > 0) {
    stackTrace.frames.forEach((frame, idx) => {
      const match = frame.matchedRepoFile || frame.file;
      const weight = 100 - idx * 10;
      addScore(match, Math.max(weight, 50), `Stack frame #${idx + 1}: ${frame.functionName}() line ${frame.line}`);
    });
  }

  // 2. Cross-file call edges from AST
  const { callEdges } = buildCrossFileDependencies(repo.analyses);
  const relevantCallEdges: EvidencePackage['callEdges'] = [];

  for (const edge of callEdges) {
    let isRelevant = false;
    // Check if callee or caller relates to stack trace or query
    if (stackTrace?.frames.some(f => f.functionName === edge.calleeFunction || f.matchedRepoFile === edge.calleeFile)) {
      isRelevant = true;
      addScore(edge.callerFile, 60, `Calls failing function ${edge.calleeFunction}() in ${edge.calleeFile}`);
      addScore(edge.calleeFile, 70, `Target of call from ${edge.callerFile}`);
    } else if (queryLower.includes(edge.calleeFunction.toLowerCase()) || queryLower.includes(edge.calleeFile.toLowerCase())) {
      isRelevant = true;
      addScore(edge.callerFile, 40, `Calls mentioned function ${edge.calleeFunction}()`);
      addScore(edge.calleeFile, 50, `Contains mentioned function ${edge.calleeFunction}()`);
    }

    if (isRelevant || edge.isCrossFile) {
      relevantCallEdges.push({
        callerFile: edge.callerFile,
        callerFunction: edge.callerFunction,
        calleeFile: edge.calleeFile,
        calleeFunction: edge.calleeFunction,
        line: edge.line
      });
    }
  }

  // 3. Related module imports
  const relevantImports: EvidencePackage['imports'] = [];
  for (const [filePath, analysis] of Object.entries(repo.analyses)) {
    for (const imp of analysis.imports) {
      const impLower = imp.module.toLowerCase();
      if (
        (stackTrace && stackTrace.frames.some(f => (f.matchedRepoFile || f.file).toLowerCase().includes(impLower))) ||
        queryLower.includes(impLower) ||
        (fileScore.has(filePath) && (fileScore.get(filePath)?.score || 0) > 30)
      ) {
        relevantImports.push({
          file: filePath,
          module: imp.module,
          symbol: imp.symbol,
          line: imp.line
        });
      }
    }
  }

  // 4. Static-analysis findings (Syntax errors, risky dict key lookups)
  const staticFindings: EvidencePackage['staticFindings'] = [];
  for (const [filePath, analysis] of Object.entries(repo.analyses)) {
    if (analysis.syntaxError) {
      staticFindings.push({
        file: filePath,
        type: 'SyntaxError',
        message: analysis.syntaxError.msg,
        line: analysis.syntaxError.line
      });
      addScore(filePath, 80, `Static syntax error at line ${analysis.syntaxError.line}`);
    }

    // Inspect file content for unchecked dict key access matching query tokens
    const file = repo.files.find(f => f.path === filePath);
    if (file) {
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        // Check for KeyError risk e.g., ['rate'] or ['discount'] or [var]
        const subscriptMatch = lineText.match(/\[(['"])([a-zA-Z0-9_-]+)\1\]/);
        if (subscriptMatch && (queryLower.includes('keyerror') || queryLower.includes(subscriptMatch[2].toLowerCase()))) {
          staticFindings.push({
            file: filePath,
            type: 'UncheckedSubscript',
            message: `Direct dict access ['${subscriptMatch[2]}'] without .get() guard`,
            line: lineNum
          });
          addScore(filePath, 45, `Unchecked subscript ['${subscriptMatch[2]}'] at line ${lineNum}`);
        }
      });
    }
  }

  // 5. Available test failures (from baseline test runner)
  const testFailures: EvidencePackage['testFailures'] = [];
  if (baselineResult && baselineResult.failed + baselineResult.errors > 0) {
    const raw = baselineResult.rawOutput;
    // Extract failure or error block
    const failBlocks = raw.split(/(?:FAIL|ERROR): /g).slice(1);
    for (const block of failBlocks) {
      const firstLine = block.split('\n')[0].trim();
      const snippet = block.slice(0, 500);
      testFailures.push({
        testName: firstLine,
        outputSnippet: snippet
      });
    }
    // Boost test files
    for (const testFile of repo.testFiles) {
      addScore(testFile, 50, 'Repository test suite with observed execution failures');
    }
  }

  // 6. Keyword matching on query for remaining files
  const queryTokens = queryLower
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 3 && !['what', 'when', 'with', 'from', 'this', 'that', 'file', 'line', 'code'].includes(t));

  for (const file of repo.files) {
    let tokenMatches = 0;
    const contentLower = file.content.toLowerCase();
    for (const token of queryTokens) {
      if (contentLower.includes(token)) {
        tokenMatches++;
      }
    }
    if (tokenMatches > 0) {
      addScore(file.path, Math.min(tokenMatches * 10, 40), `Matches ${tokenMatches} query terms`);
    }
  }

  // Sort files by relevance score
  const rankedFiles = Array.from(fileScore.entries())
    .sort((a, b) => b[1].score - a[1].score);

  // If no files scored, pick the entry point and service files
  let selectedFilePaths = rankedFiles.map(r => r[0]);
  if (selectedFilePaths.length === 0) {
    selectedFilePaths = repo.files.slice(0, 4).map(f => f.path);
  } else {
    // Take top 5 most relevant files to fit compact context window
    selectedFilePaths = selectedFilePaths.slice(0, 5);
  }

  // Ensure test files are represented if there's room
  if (selectedFilePaths.length < 5) {
    for (const tf of repo.testFiles) {
      if (!selectedFilePaths.includes(tf) && selectedFilePaths.length < 5) {
        selectedFilePaths.push(tf);
      }
    }
  }

  // Format relevant files with explicit line numbers
  const relevantFiles: EvidencePackage['relevantFiles'] = selectedFilePaths.map(filePath => {
    const file = repo.files.find(f => f.path === filePath) || {
      path: filePath,
      content: '',
      loc: 0
    };

    const reasons = fileScore.get(filePath)?.reasons || ['Repository source file'];
    const lines = file.content.split('\n');
    const numberedContent = lines.map((l, i) => `${String(i + 1).padStart(4, ' ')} | ${l}`).join('\n');

    return {
      path: filePath,
      relevanceReason: reasons.join('; '),
      content: numberedContent
    };
  });

  const totalEvidenceItems = 
    (stackTrace ? stackTrace.frames.length : 0) +
    relevantCallEdges.length +
    relevantImports.length +
    staticFindings.length +
    testFailures.length;

  return {
    stackTrace: stackTrace || undefined,
    callEdges: relevantCallEdges.slice(0, 15),
    imports: relevantImports.slice(0, 10),
    staticFindings: staticFindings.slice(0, 10),
    testFailures: testFailures.slice(0, 5),
    relevantFiles,
    totalEvidenceItems
  };
}
