/**
 * Computes a standard unified diff format between original and modified text
 */
export function generateUnifiedDiff(
  originalCode: string,
  modifiedCode: string,
  filePath: string
): string {
  const origLines = originalCode.split('\n');
  const modLines = modifiedCode.split('\n');

  const header = `--- a/${filePath}\n+++ b/${filePath}\n`;
  
  // Find first divergence
  let start = 0;
  while (start < origLines.length && start < modLines.length && origLines[start] === modLines[start]) {
    start++;
  }

  // Find end divergence
  let origEnd = origLines.length - 1;
  let modEnd = modLines.length - 1;
  while (origEnd >= start && modEnd >= start && origLines[origEnd] === modLines[modEnd]) {
    origEnd--;
    modEnd--;
  }

  // If no divergence
  if (start > origEnd && start > modEnd) {
    return `${header}@@ -1,${origLines.length} +1,${modLines.length} @@\n (No changes)`;
  }

  // Context lines (3 lines before and after)
  const contextBefore = Math.max(0, start - 3);
  const contextAfterOrig = Math.min(origLines.length - 1, origEnd + 3);
  const contextAfterMod = Math.min(modLines.length - 1, modEnd + 3);

  const origCount = contextAfterOrig - contextBefore + 1;
  const modCount = contextAfterMod - contextBefore + 1;

  let hunk = `@@ -${contextBefore + 1},${origCount} +${contextBefore + 1},${modCount} @@\n`;

  // Pre-context
  for (let i = contextBefore; i < start; i++) {
    hunk += ` ${origLines[i]}\n`;
  }

  // Deleted original lines
  for (let i = start; i <= origEnd; i++) {
    hunk += `-${origLines[i]}\n`;
  }

  // Added modified lines
  for (let i = start; i <= modEnd; i++) {
    hunk += `+${modLines[i]}\n`;
  }

  // Post-context
  for (let i = origEnd + 1; i <= contextAfterOrig; i++) {
    hunk += ` ${origLines[i]}\n`;
  }

  return header + hunk;
}
