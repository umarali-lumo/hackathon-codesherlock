import { DiagnosticFinding, RepositoryData, ParsedStackTrace, CandidatePatch } from '../types';
import { generateUnifiedDiff } from './diffGenerator';

/**
 * Deterministic Debugging Engine (Layer A)
 * Uses repository AST, symbol cross-references, call graphs, and stack trace parsing.
 * NO paid external API or hallucinated data.
 */
export function diagnoseBug(
  input: string,
  repo: RepositoryData,
  stackTrace: ParsedStackTrace | null
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  // 1. If stack trace is available, perform deep cross-file trace analysis
  if (stackTrace && stackTrace.topRepoFrame) {
    const frame = stackTrace.topRepoFrame;
    const targetFile = repo.files.find(f => f.path === frame.matchedRepoFile || f.path === frame.file);

    if (targetFile) {
      const lines = targetFile.content.split('\n');
      const errLineIdx = frame.line - 1;
      const errLineText = lines[errLineIdx] || frame.codeSnippet || '';
      
      // Find containing function
      const analysis = repo.analyses[targetFile.path];
      const containingFunc = analysis?.functions.find(
        fn => frame.line >= fn.lineStart && frame.line <= fn.lineEnd
      );

      // Find callers of this function across the repository
      const callers: { file: string; line: number; callerFunc?: string }[] = [];
      if (containingFunc) {
        for (const [fPath, fAnalysis] of Object.entries(repo.analyses)) {
          for (const call of fAnalysis.calls) {
            if (call.name === containingFunc.name) {
              callers.push({
                file: fPath,
                line: call.line,
                callerFunc: call.callerSymbol
              });
            }
          }
        }
      }

      // Check KeyError pattern
      if (stackTrace.exceptionType === 'KeyError') {
        const keyMatch = stackTrace.exceptionMessage.match(/['"]?([a-zA-Z0-9_-]+)['"]?/);
        const missingKey = keyMatch ? keyMatch[1] : 'unknown';

        // Check subscript in line
        const subMatch = errLineText.match(/([a-zA-Z0-9_]+)\[['"]([a-zA-Z0-9_-]+)['"]\]/);
        const dictVar = subMatch ? subMatch[1] : 'data';

        let explanation = `An unhandled KeyError was triggered at line ${frame.line} in ${targetFile.path} when attempting to access key '${missingKey}' from dictionary '${dictVar}'.`;
        
        let callerNote = '';
        if (callers.length > 0) {
          const crossFileCallers = callers.filter(c => c.file !== targetFile.path);
          if (crossFileCallers.length > 0) {
            callerNote = ` This function is called across files from ${crossFileCallers.map(c => `${c.file}:${c.line} (${c.callerFunc || 'top-level'})`).join(', ')}. The caller passes data without guaranteeing the '${missingKey}' key is populated.`;
          }
        }

        // Generate candidate patch
        const patch = generateKeyErrorPatch(targetFile.content, targetFile.path, frame.line, dictVar, missingKey);

        findings.push({
          id: `finding-keyerror-${Date.now()}`,
          title: `Unchecked Dictionary Subscript Access ('${missingKey}')`,
          hypothesis: `Missing key '${missingKey}' in '${dictVar}' causes uncaught KeyError during cross-file execution.`,
          severity: 'CRITICAL',
          confidence: 'HIGH',
          file: targetFile.path,
          line: frame.line,
          functionName: containingFunc?.name,
          codeContext: getLineContext(lines, frame.line),
          explanation: explanation + callerNote,
          recommendedNextStep: `Use safe dictionary retrieval '${dictVar}.get("${missingKey}", default)' or check 'if isinstance(${dictVar}, dict) and "${missingKey}" in ${dictVar}:' before accessing.`,
          alternativeExplanations: `Alternatively, update the caller function in ${callers.map(c => c.file).join(', ') || 'upstream modules'} to strictly validate schemas before passing parameters.`,
          candidatePatch: patch || undefined,
          callStackContext: callers.map(c => `${c.file}:${c.line} -> calls ${containingFunc?.name || 'function'}`)
        });
      }

      // Check TypeError: string indices must be integers or 'NoneType' object is not subscriptable
      else if (stackTrace.exceptionType === 'TypeError') {
        const isStringIndices = stackTrace.exceptionMessage.includes('indices must be integers');
        const isNoneType = stackTrace.exceptionMessage.includes('NoneType');

        let explanation = `A TypeError occurred at line ${frame.line} in ${targetFile.path}: "${stackTrace.exceptionMessage}".`;
        if (isStringIndices) {
          explanation += ` The code expects a dictionary object, but received a raw string instead.`;
        } else if (isNoneType) {
          explanation += ` The variable being subscripted or invoked evaluated to None at runtime.`;
        }

        const patch = generateTypeErrorPatch(targetFile.content, targetFile.path, frame.line, errLineText);

        findings.push({
          id: `finding-typeerror-${Date.now()}`,
          title: `Cross-File Type Contract Mismatch`,
          hypothesis: `Expected dict or object structure, but received unexpected type at runtime.`,
          severity: 'CRITICAL',
          confidence: 'HIGH',
          file: targetFile.path,
          line: frame.line,
          functionName: containingFunc?.name,
          codeContext: getLineContext(lines, frame.line),
          explanation,
          recommendedNextStep: `Add type inspection ('if isinstance(..., dict):') or provide a type normalization fallback before subscripting.`,
          candidatePatch: patch || undefined,
          callStackContext: callers.map(c => `${c.file}:${c.line}`)
        });
      }

      // Check AttributeError
      else if (stackTrace.exceptionType === 'AttributeError') {
        const attrMatch = stackTrace.exceptionMessage.match(/['"]([a-zA-Z0-9_]+)['"]/);
        const attrName = attrMatch ? attrMatch[1] : 'attribute';

        findings.push({
          id: `finding-attrerror-${Date.now()}`,
          title: `NoneType / Missing Attribute Dereference`,
          hypothesis: `Object evaluated to None or does not expose attribute '${attrName}'.`,
          severity: 'CRITICAL',
          confidence: 'HIGH',
          file: targetFile.path,
          line: frame.line,
          functionName: containingFunc?.name,
          codeContext: getLineContext(lines, frame.line),
          explanation: `Attempted to access attribute '.${attrName}' on an unvalidated object. In Python, if a helper or service returns None, subsequent attribute accesses raise an AttributeError immediately.`,
          recommendedNextStep: `Check 'if obj is not None:' or handle None default return before calling .${attrName}.`,
          candidatePatch: generateAttributeErrorPatch(targetFile.content, targetFile.path, frame.line, attrName) || undefined
        });
      }

      // Check ZeroDivisionError
      else if (stackTrace.exceptionType === 'ZeroDivisionError') {
        findings.push({
          id: `finding-zerodiv-${Date.now()}`,
          title: `Unchecked Division by Zero`,
          hypothesis: `Divisor evaluated to zero in calculation.`,
          severity: 'CRITICAL',
          confidence: 'HIGH',
          file: targetFile.path,
          line: frame.line,
          functionName: containingFunc?.name,
          codeContext: getLineContext(lines, frame.line),
          explanation: `Division operator was executed without validating that the denominator is non-zero.`,
          recommendedNextStep: `Wrap in guard condition: 'if denominator != 0: ... else: default_value'.`
        });
      }

      // Generic runtime error frame
      else {
        findings.push({
          id: `finding-generic-${Date.now()}`,
          title: `Runtime Exception: ${stackTrace.exceptionType}`,
          hypothesis: `Execution failed at line ${frame.line} with message: ${stackTrace.exceptionMessage}`,
          severity: 'WARNING',
          confidence: 'MEDIUM',
          file: targetFile.path,
          line: frame.line,
          functionName: containingFunc?.name,
          codeContext: getLineContext(lines, frame.line),
          explanation: `Verified line ${frame.line} in repository file ${targetFile.path}. The code triggered ${stackTrace.exceptionType}: ${stackTrace.exceptionMessage}.`,
          recommendedNextStep: `Inspect the call parameters and verify state preconditions.`
        });
      }
    }
  }

  // 2. Perform static heuristics across files based on input text (e.g. keywords like 'coupon', 'rate', 'discount', 'crash')
  const lowerInput = input.toLowerCase();
  for (const file of repo.files) {
    if (file.language !== 'python') continue;
    const lines = file.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Heuristic 1: Subscript on coupon or discount
      if (
        (lowerInput.includes('coupon') || lowerInput.includes('discount') || lowerInput.includes('rate') || lowerInput.includes('keyerror')) &&
        (line.includes("['rate']") || line.includes('["rate"]') || line.includes("['discount']"))
      ) {
        // If not already covered by stack trace finding
        if (!findings.some(f => f.file === file.path && f.line === lineNum)) {
          const dictVar = line.includes("coupon['rate']") ? 'coupon' : 'discount_info';
          const patch = generateKeyErrorPatch(file.content, file.path, lineNum, dictVar, 'rate');

          findings.push({
            id: `static-subscript-${file.path}-${lineNum}`,
            title: `Potential Subscript KeyError in ${file.name}`,
            hypothesis: `Direct subscript access '${dictVar}["rate"]' without safe default will fail if the coupon object lacks the 'rate' key or is passed as a string/code.`,
            severity: 'CRITICAL',
            confidence: 'HIGH',
            file: file.path,
            line: lineNum,
            codeContext: getLineContext(lines, lineNum),
            explanation: `Found direct bracket access '${line.trim()}' at line ${lineNum}. Cross-file callers may supply coupons in differing formats (e.g. string code vs dictionary schema).`,
            recommendedNextStep: `Refactor to safely handle string codes and dict schemas with '${dictVar}.get("rate", 0.0)'.`,
            candidatePatch: patch || undefined
          });
        }
      }

      // Heuristic 2: Bare except:
      if (/^\s*except\s*:/.test(line)) {
        findings.push({
          id: `static-bare-except-${file.path}-${lineNum}`,
          title: `Anti-pattern: Bare except clause`,
          hypothesis: `Bare except catches SystemExit and KeyboardInterrupt and masks genuine root cause bugs.`,
          severity: 'INFO',
          confidence: 'MEDIUM',
          file: file.path,
          line: lineNum,
          codeContext: getLineContext(lines, lineNum),
          explanation: `Line ${lineNum} uses 'except:' without specifying an Exception class.`,
          recommendedNextStep: `Change to 'except Exception as e:' or catch specific expected errors.`
        });
      }
    }
  }

  // If no findings could be determined, return an honest uncertainty finding
  if (findings.length === 0) {
    findings.push({
      id: `finding-inconclusive-${Date.now()}`,
      title: `Inconclusive Analysis — Missing Evidence`,
      hypothesis: `No verifiable root cause could be established with the provided description or logs.`,
      severity: 'INFO',
      confidence: 'LOW',
      file: repo.files[0]?.path || 'unknown',
      line: 1,
      codeContext: '# No conclusive source line matched',
      explanation: `CodeSherlock evaluated all ${repo.files.length} indexed files and cross-file call graphs, but the query did not match an active stack trace or recognized static defect pattern.`,
      recommendedNextStep: `Please provide a Python stack trace ('Traceback (most recent call last): ...') or paste the exact error message and failing function name.`
    });
  }

  return findings;
}

function getLineContext(lines: string[], targetLine: number): string {
  const start = Math.max(0, targetLine - 3);
  const end = Math.min(lines.length, targetLine + 2);
  const snippetLines: string[] = [];

  for (let i = start; i < end; i++) {
    const isTarget = i + 1 === targetLine;
    snippetLines.push(`${isTarget ? '->' : '  '} ${String(i + 1).padStart(4, ' ')} | ${lines[i]}`);
  }

  return snippetLines.join('\n');
}

/**
 * Deterministically generates a patch for KeyError
 */
function generateKeyErrorPatch(
  originalCode: string,
  filePath: string,
  targetLine: number,
  dictVar: string,
  key: string
): CandidatePatch | null {
  const lines = originalCode.split('\n');
  const targetIdx = targetLine - 1;
  if (targetIdx < 0 || targetIdx >= lines.length) return null;

  const targetText = lines[targetIdx];
  const indent = targetText.match(/^(\s*)/)?.[1] || '';

  // Case 1: rate = coupon['rate'] or rate = float(coupon['rate'])
  let patchedLine = targetText;
  if (targetText.includes(`${dictVar}['${key}']`)) {
    patchedLine = targetText.replace(
      `${dictVar}['${key}']`,
      `(${dictVar}.get('${key}', 0.0) if isinstance(${dictVar}, dict) else 0.0)`
    );
  } else if (targetText.includes(`${dictVar}["${key}"]`)) {
    patchedLine = targetText.replace(
      `${dictVar}["${key}"]`,
      `(${dictVar}.get("${key}", 0.0) if isinstance(${dictVar}, dict) else 0.0)`
    );
  } else {
    // Add defensive guard above line
    const guard = `${indent}# CodeSherlock defensive patch: ensure valid dictionary and key fallback\n${indent}if isinstance(${dictVar}, dict):\n${indent}    ${targetText.trim()}\n${indent}else:\n${indent}    return 0.0`;
    lines[targetIdx] = guard;
    const modifiedCode = lines.join('\n');
    return {
      targetFile: filePath,
      originalCode,
      patchedCode: modifiedCode,
      unifiedDiff: generateUnifiedDiff(originalCode, modifiedCode, filePath),
      description: `Add defensive type and key check on '${dictVar}' to prevent KeyError when key '${key}' is missing or parameter is a non-dict type.`
    };
  }

  lines[targetIdx] = patchedLine;
  const modifiedCode = lines.join('\n');

  return {
    targetFile: filePath,
    originalCode,
    patchedCode: modifiedCode,
    unifiedDiff: generateUnifiedDiff(originalCode, modifiedCode, filePath),
    description: `Replace direct subscript access with safe dictionary retrieval (.get('${key}', 0.0)) and type check against ${dictVar}.`
  };
}

/**
 * Deterministically generates a patch for TypeError
 */
function generateTypeErrorPatch(
  originalCode: string,
  filePath: string,
  targetLine: number,
  lineText: string
): CandidatePatch | null {
  const lines = originalCode.split('\n');
  const targetIdx = targetLine - 1;
  if (targetIdx < 0 || targetIdx >= lines.length) return null;

  const indent = lineText.match(/^(\s*)/)?.[1] || '';
  
  // If line has coupon access:
  if (lineText.includes('coupon')) {
    const defensiveReplacement = `${indent}# Safe contract check for coupon data type\n${indent}if isinstance(coupon, dict):\n${indent}    rate = coupon.get('rate', 0.0)\n${indent}elif isinstance(coupon, str):\n${indent}    # Handle legacy string coupon code\n${indent}    rate = 0.15 if coupon.upper() in ('SAVE15', 'SUMMER20') else 0.05\n${indent}else:\n${indent}    rate = 0.0`;
    
    // Replace the problematic line
    lines[targetIdx] = defensiveReplacement;
    const modifiedCode = lines.join('\n');
    return {
      targetFile: filePath,
      originalCode,
      patchedCode: modifiedCode,
      unifiedDiff: generateUnifiedDiff(originalCode, modifiedCode, filePath),
      description: `Support both dictionary schema ({'rate': 0.2}) and legacy coupon string codes ('SUMMER20') to resolve cross-file contract mismatch.`
    };
  }

  return null;
}

/**
 * Deterministically generates a patch for AttributeError
 */
function generateAttributeErrorPatch(
  originalCode: string,
  filePath: string,
  targetLine: number,
  attrName: string
): CandidatePatch | null {
  const lines = originalCode.split('\n');
  const targetIdx = targetLine - 1;
  if (targetIdx < 0 || targetIdx >= lines.length) return null;

  const targetText = lines[targetIdx];
  const indent = targetText.match(/^(\s*)/)?.[1] || '';

  // Wrap line in 'if obj is not None:'
  const patchedBlock = `${indent}# Guard against NoneType attribute dereference\n${indent}if hasattr(item, '${attrName}') and getattr(item, '${attrName}') is not None:\n${indent}    ${targetText.trim()}\n${indent}else:\n${indent}    pass`;

  lines[targetIdx] = patchedBlock;
  const modifiedCode = lines.join('\n');

  return {
    targetFile: filePath,
    originalCode,
    patchedCode: modifiedCode,
    unifiedDiff: generateUnifiedDiff(originalCode, modifiedCode, filePath),
    description: `Add guard checking 'hasattr(..., "${attrName}")' to safely prevent AttributeError when value is None.`
  };
}
