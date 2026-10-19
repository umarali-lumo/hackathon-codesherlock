import { ParsedStackTrace, StackTraceFrame, SourceFile } from '../types';

/**
 * Extracts stack trace frames from user prompt or error logs.
 * Supports Python tracebacks:
 * File "ecommerce_service/pricing_engine.py", line 18, in apply_discount
 *    rate = coupon['rate']
 * KeyError: 'rate'
 */
export function parseStackTrace(rawText: string, files: SourceFile[]): ParsedStackTrace | null {
  const fileMap = new Map<string, SourceFile>();
  for (const f of files) {
    fileMap.set(f.path.toLowerCase(), f);
    fileMap.set(f.name.toLowerCase(), f);
  }

  // Common Python Traceback frame regex:
  // File "path/to/file.py", line 123, in func_name
  const pyFrameRegex = /File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+([a-zA-Z0-9_<>\.]+))?/g;
  
  const frames: StackTraceFrame[] = [];
  let match;
  
  while ((match = pyFrameRegex.exec(rawText)) !== null) {
    const rawFilePath = match[1];
    const lineNum = parseInt(match[2], 10);
    const funcName = match[3] || '<module>';
    
    // Normalize path to look up in repository
    const normPath = rawFilePath.replace(/\\/g, '/').toLowerCase();
    
    // Check if file exists in repo
    let matchedRepoFile: SourceFile | undefined;
    for (const f of files) {
      const fNorm = f.path.toLowerCase();
      if (normPath.endsWith(fNorm) || fNorm.endsWith(normPath) || normPath.endsWith(f.name.toLowerCase())) {
        matchedRepoFile = f;
        break;
      }
    }

    // Attempt to extract line from raw text if present beneath frame
    const remainingText = rawText.substring(match.index + match[0].length);
    const nextLineMatch = remainingText.match(/^\r?\n\s+([^\r\n]+)/);
    const snippet = nextLineMatch ? nextLineMatch[1].trim() : undefined;

    frames.push({
      file: rawFilePath,
      line: lineNum,
      functionName: funcName,
      codeSnippet: snippet,
      raw: match[0],
      existsInRepo: Boolean(matchedRepoFile),
      matchedRepoFile: matchedRepoFile?.path
    });
  }

  if (frames.length === 0) {
    // Try single line reference like: "pricing_engine.py:18 KeyError" or "pricing_engine.py line 18"
    const simpleRefRegex = /([a-zA-Z0-9_\-\.\/]+\.py)(?::|\s+line\s+)(\d+)/i;
    const simpleMatch = rawText.match(simpleRefRegex);
    if (simpleMatch) {
      const rawFile = simpleMatch[1];
      const lineNum = parseInt(simpleMatch[2], 10);
      const matched = files.find(f => f.path.endsWith(rawFile) || f.name.toLowerCase() === rawFile.toLowerCase());
      frames.push({
        file: rawFile,
        line: lineNum,
        functionName: '<unknown>',
        raw: simpleMatch[0],
        existsInRepo: Boolean(matched),
        matchedRepoFile: matched?.path
      });
    }
  }

  if (frames.length === 0) {
    return null;
  }

  // Detect Exception Type and Message at bottom of traceback
  // e.g. KeyError: 'rate' or TypeError: string indices must be integers
  const exceptionRegex = /(?:^|\n)([A-Z][a-zA-Z0-9_]*Error|[A-Z][a-zA-Z0-9_]*Exception|AssertionError):\s*([^\r\n]+)/;
  const excMatch = rawText.match(exceptionRegex);
  
  const exceptionType = excMatch ? excMatch[1] : 'RuntimeError';
  const exceptionMessage = excMatch ? excMatch[2].trim() : 'Unexpected runtime failure or exception occurred';

  // Find top repo frame (the frame closest to where the actual exception was raised)
  const repoFrames = frames.filter(f => f.existsInRepo);
  const topRepoFrame = repoFrames.length > 0 ? repoFrames[repoFrames.length - 1] : undefined;

  return {
    exceptionType,
    exceptionMessage,
    frames,
    rawText,
    topRepoFrame
  };
}
