import { FileAnalysis, ImportInfo, SymbolInfo, CallInfo, SourceFile } from '../types';
import { parseMultiLanguageFile } from './multiLanguageParser';

/**
 * Fallback browser-side Python parser using tokenized regex logic
 * when backend AST parser is offline or in client-only mode.
 */
export function parsePythonClientSide(content: string, filePath: string): FileAnalysis {
  const lines = content.split('\n');
  const functions: SymbolInfo[] = [];
  const classes: SymbolInfo[] = [];
  const imports: ImportInfo[] = [];
  const calls: CallInfo[] = [];
  
  // Regex patterns for Python code
  const funcRegex = /^(?:[ \t]*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):/;
  const classRegex = /^(?:[ \t]*)class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*\((.*?)\))?:/;
  const importRegex = /^(?:[ \t]*)import\s+([a-zA-Z0-9_., ]+)/;
  const fromImportRegex = /^(?:[ \t]*)from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_.*, ]+)/;
  const callRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;

  let currentFunc: SymbolInfo | null = null;
  let currentClass: SymbolInfo | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines or pure comment lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Detect Imports
    const fromMatch = line.match(fromImportRegex);
    if (fromMatch) {
      const module = fromMatch[1];
      const symbols = fromMatch[2].split(',').map(s => s.trim()).filter(Boolean);
      for (const sym of symbols) {
        const parts = sym.split(/\s+as\s+/);
        imports.push({
          module: `${module}.${parts[0]}`,
          importedFrom: module,
          symbol: parts[0],
          asname: parts[1] || null,
          line: lineNum,
          file: filePath
        });
      }
      continue;
    }

    const importMatch = line.match(importRegex);
    if (importMatch) {
      const mods = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const mod of mods) {
        const parts = mod.split(/\s+as\s+/);
        imports.push({
          module: parts[0],
          asname: parts[1] || null,
          line: lineNum,
          file: filePath
        });
      }
      continue;
    }

    // Detect Classes
    const classMatch = line.match(classRegex);
    if (classMatch) {
      const name = classMatch[1];
      const bases = classMatch[2] ? classMatch[2].split(',').map(b => b.trim()).filter(Boolean) : [];
      const newClass: SymbolInfo = {
        name,
        kind: 'class',
        lineStart: lineNum,
        lineEnd: lineNum,
        bases,
        file: filePath
      };
      classes.push(newClass);
      currentClass = newClass;
      continue;
    }

    // Detect Functions
    const funcMatch = line.match(funcRegex);
    if (funcMatch) {
      const name = funcMatch[1];
      const rawArgs = funcMatch[2] || '';
      const args = rawArgs
        .split(',')
        .map(a => a.trim().split(':')[0].split('=')[0].trim())
        .filter(a => a && a !== 'self' && a !== 'cls');

      const isMethod = Boolean(currentClass && line.startsWith('    '));
      const newFunc: SymbolInfo = {
        name,
        kind: isMethod ? 'method' : 'function',
        lineStart: lineNum,
        lineEnd: lineNum,
        args,
        file: filePath
      };
      functions.push(newFunc);
      if (currentFunc) {
        currentFunc.lineEnd = lineNum - 1;
      }
      currentFunc = newFunc;
      continue;
    }

    // Detect Function Calls
    let match;
    while ((match = callRegex.exec(line)) !== null) {
      const callName = match[1];
      // Ignore common language keywords
      if (!['if', 'for', 'while', 'def', 'class', 'with', 'return', 'print', 'super', 'len', 'range', 'isinstance', 'str', 'int', 'dict', 'list', 'float', 'bool', 'set'].includes(callName)) {
        calls.push({
          name: callName,
          line: lineNum,
          file: filePath,
          callerSymbol: currentFunc ? currentFunc.name : undefined
        });
      }
    }
  }

  // Close line numbers of last symbols
  if (currentFunc) {
    currentFunc.lineEnd = lines.length;
  }
  if (currentClass) {
    currentClass.lineEnd = lines.length;
  }

  return {
    file: filePath,
    syntaxError: null,
    functions,
    classes,
    imports,
    calls,
    loc: lines.length
  };
}

/**
 * Primary repository analysis function.
 * Tries server-side Python AST analysis, falling back to client-side parsing.
 */
export async function analyzeRepositoryFiles(files: SourceFile[]): Promise<{
  analyses: Record<string, FileAnalysis>;
  engineUsed: 'python-ast' | 'client-fallback';
}> {
  const pythonFiles = files.filter(f => f.language === 'python');
  const analyses: Record<string, FileAnalysis> = {};

  // For non-python files, parse symbols using universal multiLanguageParser
  for (const f of files) {
    if (f.language !== 'python') {
      analyses[f.path] = parseMultiLanguageFile(f.content, f.path, f.language);
    }
  }

  if (pythonFiles.length === 0) {
    return { analyses, engineUsed: 'client-fallback' };
  }

  // Try server-side python AST analysis
  try {
    const payload = pythonFiles.map(f => ({ path: f.path, content: f.content }));
    const resp = await fetch('/api/analyze-python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: payload })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.results) {
        for (const [p, res] of Object.entries(data.results) as [string, any][]) {
          analyses[p] = {
            file: p,
            syntaxError: res.syntax_error || null,
            functions: (res.functions || []).map((fn: any) => ({
              ...fn,
              file: p,
              kind: 'function'
            })),
            classes: (res.classes || []).map((cls: any) => ({
              ...cls,
              file: p,
              kind: 'class'
            })),
            imports: (res.imports || []).map((imp: any) => ({
              ...imp,
              file: p
            })),
            calls: (res.calls || []).map((call: any) => ({
              ...call,
              file: p
            })),
            loc: res.loc || 0
          };
        }
        return { analyses, engineUsed: 'python-ast' };
      }
    }
  } catch (err) {
    console.warn('Backend Python AST endpoint unavailable, falling back to client AST parser.', err);
  }

  // Fallback to client-side deterministic parsing
  for (const pf of pythonFiles) {
    analyses[pf.path] = parsePythonClientSide(pf.content, pf.path);
  }

  return { analyses, engineUsed: 'client-fallback' };
}

/**
 * Resolves callers and callees across files
 */
export function buildCrossFileDependencies(analyses: Record<string, FileAnalysis>) {
  // Map of symbolName -> { file, symbol }
  const definedSymbols = new Map<string, { file: string; symbol: SymbolInfo }>();
  
  for (const analysis of Object.values(analyses)) {
    for (const fn of analysis.functions) {
      definedSymbols.set(fn.name, { file: analysis.file, symbol: fn });
    }
    for (const cls of analysis.classes) {
      definedSymbols.set(cls.name, { file: analysis.file, symbol: cls });
    }
  }

  // Cross file call edges: from { file, function } -> to { file, function }
  const callEdges: {
    callerFile: string;
    callerFunction?: string;
    calleeFile: string;
    calleeFunction: string;
    line: number;
    isCrossFile: boolean;
  }[] = [];

  for (const analysis of Object.values(analyses)) {
    for (const call of analysis.calls) {
      const target = definedSymbols.get(call.name);
      if (target) {
        callEdges.push({
          callerFile: analysis.file,
          callerFunction: call.callerSymbol,
          calleeFile: target.file,
          calleeFunction: target.symbol.name,
          line: call.line,
          isCrossFile: analysis.file !== target.file
        });
      }
    }
  }

  return {
    definedSymbols,
    callEdges
  };
}
