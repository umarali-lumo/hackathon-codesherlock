import JSZip from 'jszip';
import { SourceFile } from '../types';

const MAX_TOTAL_FILES = 500;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024; // 5MB

// Ignored paths and directories
const IGNORE_PATTERNS = [
  /(^|\/)\.git\//i,
  /(^|\/)node_modules\//i,
  /(^|\/)__pycache__\//i,
  /(^|\/)\.venv\//i,
  /(^|\/)venv\//i,
  /(^|\/)env\//i,
  /(^|\/)\.pytest_cache\//i,
  /(^|\/)\.mypy_cache\//i,
  /(^|\/)\.tox\//i,
  /(^|\/)dist\//i,
  /(^|\/)build\//i,
  /(^|\/)\.egg-info\//i,
  /(^|\/)\.idea\//i,
  /(^|\/)\.vscode\//i,
  /(^|\/)\.DS_Store$/i,
  /\.(pyc|pyo|pyd|so|dll|exe|dylib|bin|iso|tar|gz|zip|png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot|mp4|mp3|pdf)$/i
];

import { detectFileLanguage } from './multiLanguageParser';

export function detectLanguage(filePath: string): string {
  return detectFileLanguage(filePath).id;
}

export function isTestFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes('test_') ||
    lower.includes('_test.py') ||
    lower.includes('/tests/') ||
    lower.includes('/test/') ||
    lower.endsWith('.test.js') ||
    lower.endsWith('.spec.js') ||
    lower.endsWith('.test.ts') ||
    lower.endsWith('.spec.ts')
  );
}

// Sanitize path to prevent Zip Slip (Directory Traversal)
export function sanitizePath(rawPath: string): string | null {
  // Normalize slashes
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Reject path traversal attempts
  const parts = normalized.split('/');
  for (const part of parts) {
    if (part === '..' || part === '') {
      if (part === '..') return null; // Unsafe zip entry
    }
  }
  
  return normalized;
}

export async function parseZipArchive(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  archiveName: string = 'repository.zip'
): Promise<{
  files: SourceFile[];
  totalBytes: number;
  warnings: string[];
  languages: Record<string, number>;
}> {
  const zip = new JSZip();
  let loadedZip: JSZip;
  
  try {
    loadedZip = await zip.loadAsync(fileOrBuffer);
  } catch (err: any) {
    throw new Error(`Invalid or corrupted ZIP archive: ${err.message || 'Unable to decompress'}`);
  }

  const files: SourceFile[] = [];
  const warnings: string[] = [];
  let totalBytes = 0;
  const languages: Record<string, number> = {};

  const entries = Object.keys(loadedZip.files);
  if (entries.length === 0) {
    throw new Error('ZIP archive is completely empty.');
  }

  // Filter root wrapping directory if entire zip is wrapped in a single root folder (e.g. repo-main/)
  let commonPrefix = '';
  const firstSlashIdx = entries[0].indexOf('/');
  if (firstSlashIdx !== -1) {
    const candidatePrefix = entries[0].substring(0, firstSlashIdx + 1);
    const allSharePrefix = entries.every(e => e.startsWith(candidatePrefix) || e === candidatePrefix.slice(0, -1));
    if (allSharePrefix) {
      commonPrefix = candidatePrefix;
    }
  }

  for (const entryPath of entries) {
    const entry = loadedZip.files[entryPath];
    if (entry.dir) continue;

    // Check ignore patterns
    if (IGNORE_PATTERNS.some(p => p.test(entryPath))) {
      continue;
    }

    // Strip common prefix if present
    const adjustedPath = commonPrefix && entryPath.startsWith(commonPrefix)
      ? entryPath.substring(commonPrefix.length)
      : entryPath;

    // Sanitize path
    const safePath = sanitizePath(adjustedPath);
    if (!safePath) {
      warnings.push(`Skipped potentially dangerous path entry: ${entryPath}`);
      continue;
    }

    // Check limits
    if (files.length >= MAX_TOTAL_FILES) {
      warnings.push(`File count exceeded maximum allowed limit (${MAX_TOTAL_FILES} files). Remaining files omitted.`);
      break;
    }

    try {
      const content = await entry.async('string');
      const size = content.length;

      if (size > MAX_SINGLE_FILE_BYTES) {
        warnings.push(`Skipped large file ${safePath} (${(size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit).`);
        continue;
      }

      totalBytes += size;
      if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
        warnings.push(`Uncompressed repository exceeded 50MB limit.`);
        break;
      }

      const lang = detectLanguage(safePath);
      languages[lang] = (languages[lang] || 0) + 1;

      files.push({
        path: safePath,
        name: safePath.split('/').pop() || safePath,
        content,
        language: lang,
        size,
        isTest: isTestFile(safePath),
        loc: content.split('\n').length
      });
    } catch (readErr: any) {
      warnings.push(`Failed to read ${safePath} as text: ${readErr.message}`);
    }
  }

  if (files.length === 0) {
    throw new Error('No valid, readable source code files found in the archive.');
  }

  // Sort files alphabetically by path
  files.sort((a, b) => a.path.localeCompare(b.path));

  return {
    files,
    totalBytes,
    warnings,
    languages
  };
}
