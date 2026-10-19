import { FileAnalysis, SymbolInfo, ImportInfo, CallInfo } from '../types';

export interface LanguageMeta {
  id: string;
  name: string;
  color: string;
  extensions: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageMeta> = {
  python: { id: 'python', name: 'Python', color: '#3572A5', extensions: ['.py', '.pyi', '.pyw'] },
  typescript: { id: 'typescript', name: 'TypeScript', color: '#3178c6', extensions: ['.ts', '.tsx', '.d.ts'] },
  javascript: { id: 'javascript', name: 'JavaScript', color: '#f1e05a', extensions: ['.js', '.jsx', '.mjs', '.cjs'] },
  json: { id: 'json', name: 'JSON', color: '#292929', extensions: ['.json', '.jsonc', '.json5'] },
  go: { id: 'go', name: 'Go', color: '#00ADD8', extensions: ['.go'] },
  rust: { id: 'rust', name: 'Rust', color: '#dea584', extensions: ['.rs'] },
  java: { id: 'java', name: 'Java', color: '#b07219', extensions: ['.java'] },
  cpp: { id: 'cpp', name: 'C++', color: '#f34b7d', extensions: ['.cpp', '.hpp', '.cc', '.cxx'] },
  c: { id: 'c', name: 'C', color: '#555555', extensions: ['.c', '.h'] },
  csharp: { id: 'csharp', name: 'C#', color: '#178600', extensions: ['.cs'] },
  ruby: { id: 'ruby', name: 'Ruby', color: '#701516', extensions: ['.rb'] },
  php: { id: 'php', name: 'PHP', color: '#4F5D95', extensions: ['.php'] },
  html: { id: 'html', name: 'HTML', color: '#e34c26', extensions: ['.html', '.htm'] },
  css: { id: 'css', name: 'CSS', color: '#563d7c', extensions: ['.css', '.scss', '.sass', '.less'] },
  shell: { id: 'shell', name: 'Shell', color: '#89e051', extensions: ['.sh', '.bash', '.zsh'] },
  sql: { id: 'sql', name: 'SQL', color: '#e38c00', extensions: ['.sql'] },
  yaml: { id: 'yaml', name: 'YAML', color: '#cb171e', extensions: ['.yml', '.yaml'] },
  markdown: { id: 'markdown', name: 'Markdown', color: '#083fa1', extensions: ['.md', '.markdown'] }
};

export function detectFileLanguage(filePath: string): LanguageMeta {
  const lower = filePath.toLowerCase();
  for (const lang of Object.values(SUPPORTED_LANGUAGES)) {
    if (lang.extensions.some(ext => lower.endsWith(ext))) {
      return lang;
    }
  }
  return { id: 'text', name: 'Plain Text', color: '#8b949e', extensions: ['.txt'] };
}

/**
 * Universal Multi-Language Symbol & AST-Lite Parser
 * Extracts functions, classes, and imports across Python, TS/JS, Go, Rust, Java, etc.
 */
export function parseMultiLanguageFile(content: string, filePath: string, langId: string): FileAnalysis {
  const lines = content.split('\n');
  const functions: SymbolInfo[] = [];
  const classes: SymbolInfo[] = [];
  const imports: ImportInfo[] = [];
  const calls: CallInfo[] = [];

  // Language-specific regexes
  let funcPatterns: RegExp[] = [];
  let classPatterns: RegExp[] = [];
  let importPatterns: RegExp[] = [];

  if (langId === 'python') {
    funcPatterns = [/^(?:[ \t]*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):/];
    classPatterns = [/^(?:[ \t]*)class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*\((.*?)\))?:/];
    importPatterns = [
      /^(?:[ \t]*)import\s+([a-zA-Z0-9_., ]+)/,
      /^(?:[ \t]*)from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_.*, ]+)/
    ];
  } else if (langId === 'typescript' || langId === 'javascript') {
    funcPatterns = [
      /(?:function|async\s+function)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/,
      /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\((.*?)\)\s*=>/,
      /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*\{/ // Method inside class/object
    ];
    classPatterns = [
      /(?:class|interface|type)\s+([a-zA-Z_][a-zA-Z0-9_]*)/
    ];
    importPatterns = [
      /import\s+(?:\{[^}]*\}|\*\s+as\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\s+from\s+['"]([^'"]+)['"]/,
      /require\(['"]([^'"]+)['"]\)/
    ];
  } else if (langId === 'go') {
    funcPatterns = [/func\s+(?:\([^)]+\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/];
    classPatterns = [/type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/];
    importPatterns = [/import\s+["']([^"']+)["']/];
  } else if (langId === 'rust') {
    funcPatterns = [/fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*\((.*?)\)/];
    classPatterns = [/(?:struct|enum|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)/];
    importPatterns = [/use\s+([a-zA-Z0-9_:]+)/];
  } else if (langId === 'java') {
    funcPatterns = [/(?:public|protected|private|static|\s)+[\w\<\>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*\{/];
    classPatterns = [/(?:class|interface|record)\s+([a-zA-Z_][a-zA-Z0-9_]*)/];
    importPatterns = [/import\s+(?:static\s+)?([a-zA-Z0-9_.]+);/];
  }

  const callRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;

    // Check imports
    for (const pat of importPatterns) {
      const match = line.match(pat);
      if (match) {
        imports.push({
          module: match[1]?.trim() || 'unknown',
          symbol: match[2]?.trim(),
          line: lineNum,
          file: filePath
        });
        break;
      }
    }

    // Check classes/types
    for (const pat of classPatterns) {
      const match = line.match(pat);
      if (match) {
        classes.push({
          name: match[1],
          kind: 'class',
          lineStart: lineNum,
          lineEnd: lineNum,
          file: filePath
        });
        break;
      }
    }

    // Check functions
    for (const pat of funcPatterns) {
      const match = line.match(pat);
      if (match) {
        const rawArgs = match[2] || '';
        const args = rawArgs.split(',').map(a => a.trim().split(/[\s:=]/)[0]).filter(Boolean);
        functions.push({
          name: match[1],
          kind: 'function',
          lineStart: lineNum,
          lineEnd: lineNum,
          args,
          file: filePath
        });
        break;
      }
    }

    // Check function calls
    let callMatch: RegExpExecArray | null;
    const callScanner = new RegExp(callRegex);
    while ((callMatch = callScanner.exec(line)) !== null) {
      const funcName = callMatch[1];
      if (
        !['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class', 'def', 'print', 'console'].includes(funcName)
      ) {
        calls.push({
          name: funcName,
          line: lineNum,
          file: filePath
        });
      }
    }
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
 * Universal Multi-Language Syntax Tokenizer
 * Produces styled spans for the IDE code editor
 */
export interface CodeToken {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'type' | 'variable' | 'operator' | 'plain';
}

const COMMON_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while',
  'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'break', 'continue',
  'function', 'const', 'let', 'var', 'async', 'await', 'export', 'default', 'interface', 'type',
  'extends', 'implements', 'new', 'this', 'super', 'typeof', 'instanceof', 'void', 'throw',
  'func', 'package', 'go', 'select', 'chan', 'defer', 'fallthrough', 'struct', 'map',
  'fn', 'pub', 'mut', 'use', 'mod', 'trait', 'impl', 'match', 'enum', 'crate', 'where',
  'public', 'private', 'protected', 'static', 'final', 'abstract', 'implements', 'throws'
]);

const BUILTIN_TYPES = new Set([
  'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'None', 'True', 'False',
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'null', 'undefined', 'Promise', 'Array',
  'int32', 'int64', 'uint', 'byte', 'rune', 'error', 'nil',
  'i32', 'i64', 'u32', 'u64', 'f32', 'f64', 'usize', 'isize', 'Option', 'Result', 'String', 'Vec'
]);

export function tokenizeCodeLine(line: string, langId: string): CodeToken[] {
  if (!line) return [{ text: ' ', type: 'plain' }];

  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    // Check comments
    if (
      (line[i] === '#' && (langId === 'python' || langId === 'shell' || langId === 'yaml')) ||
      (line.slice(i, i + 2) === '//')
    ) {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let str = quote;
      i++;
      while (i < line.length) {
        if (line[i] === '\\' && i + 1 < line.length) {
          str += line[i] + line[i + 1];
          i += 2;
        } else if (line[i] === quote) {
          str += quote;
          i++;
          break;
        } else {
          str += line[i];
          i++;
        }
      }
      tokens.push({ text: str, type: 'string' });
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
      let num = '';
      while (i < line.length && /[0-9\.xXoObBa-fA-F_]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push({ text: num, type: 'number' });
      continue;
    }

    // Words (keywords, types, functions, variables)
    if (/[a-zA-Z_]/.test(line[i])) {
      let word = '';
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Lookahead for function call
      let j = i;
      while (j < line.length && /\s/.test(line[j])) j++;
      const isCall = j < line.length && line[j] === '(';

      if (COMMON_KEYWORDS.has(word)) {
        tokens.push({ text: word, type: 'keyword' });
      } else if (BUILTIN_TYPES.has(word)) {
        tokens.push({ text: word, type: 'type' });
      } else if (isCall) {
        tokens.push({ text: word, type: 'function' });
      } else if (word === word.toUpperCase() && word.length > 1) {
        tokens.push({ text: word, type: 'type' }); // Constants or types
      } else {
        tokens.push({ text: word, type: 'variable' });
      }
      continue;
    }

    // Operators and punctuation
    const op = line[i];
    if (/[+\-*\/%=<>!&|^~?:;.,()[\]{}]/.test(op)) {
      tokens.push({ text: op, type: 'operator' });
    } else {
      tokens.push({ text: op, type: 'plain' });
    }
    i++;
  }

  return tokens;
}
