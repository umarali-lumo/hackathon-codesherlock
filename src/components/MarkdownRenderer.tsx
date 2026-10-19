import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Sparkles, ChevronRight } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onNavigateToSource?: (filePath: string, line: number) => void;
  className?: string;
}

/**
 * Strips raw markdown artifacts and parses headings, code blocks, bold, lists,
 * and clickable source references (e.g. `pricing_engine.py:23`).
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onNavigateToSource,
  className = ''
}) => {
  if (!content) return null;

  // Pre-clean raw artifacts:
  // 1. Remove empty bold tags like `****` or `******`
  // 2. Remove orphan standalone markdown markers
  const cleanedContent = content
    .replace(/\*{4,}/g, '') // remove **** or ******
    .replace(/^\s*\*\*\s*$/gm, '') // remove lines with just **
    .replace(/^\s*#{1,6}\s*$/gm, ''); // remove empty headers

  // Split content into blocks: code blocks vs text blocks
  const blocks: { type: 'code' | 'text'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(cleanedContent)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: cleanedContent.slice(lastIndex, match.index)
      });
    }
    blocks.push({
      type: 'code',
      language: match[1]?.trim() || 'python',
      content: match[2]?.trimEnd() || ''
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleanedContent.length) {
    blocks.push({
      type: 'text',
      content: cleanedContent.slice(lastIndex)
    });
  }

  return (
    <div className={`space-y-3 font-sans text-xs leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <CodeBlockCard
              key={`code-${bIdx}`}
              code={block.content}
              language={block.language || 'text'}
              onNavigateToSource={onNavigateToSource}
            />
          );
        }

        return (
          <TextBlockRenderer
            key={`text-${bIdx}`}
            text={block.content}
            onNavigateToSource={onNavigateToSource}
          />
        );
      })}
    </div>
  );
};

interface CodeBlockCardProps {
  code: string;
  language: string;
  onNavigateToSource?: (filePath: string, line: number) => void;
}

const CodeBlockCard: React.FC<CodeBlockCardProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="my-2.5 rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-white/[0.08] text-[10px] text-neutral-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-neutral-400" />
          <span className="uppercase tracking-wider font-semibold text-neutral-300">
            {language}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-500">{lines.length} lines</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 overflow-x-auto text-[11px] font-mono leading-relaxed bg-[#050505] text-neutral-200">
        <pre className="flex flex-col">
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-white/[0.03] px-1 rounded -mx-1">
              <span className="w-8 select-none text-neutral-600 text-right pr-3 text-[10px] opacity-70">
                {i + 1}
              </span>
              <span className="flex-1 whitespace-pre">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

interface TextBlockRendererProps {
  text: string;
  onNavigateToSource?: (filePath: string, line: number) => void;
}

const TextBlockRenderer: React.FC<TextBlockRendererProps> = ({ text, onNavigateToSource }) => {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const { ordered, items } = currentList;
    if (ordered) {
      renderedElements.push(
        <ol key={`ol-${renderedElements.length}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-neutral-300">
              <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/15">
                {idx + 1}
              </span>
              <div className="flex-1 pt-0.5">
                {renderInlineFormattedText(item, onNavigateToSource)}
              </div>
            </li>
          ))}
        </ol>
      );
    } else {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="my-2 space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0 mt-2" />
              <div className="flex-1">
                {renderInlineFormattedText(item, onNavigateToSource)}
              </div>
            </li>
          ))}
        </ul>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Check for Markdown Headings: ####, ###, ##, #
    const h4Match = trimmed.match(/^####\s+(.*)$/);
    const h3Match = trimmed.match(/^###\s+(.*)$/);
    const h2Match = trimmed.match(/^##\s+(.*)$/);
    const h1Match = trimmed.match(/^#\s+(.*)$/);

    if (h4Match) {
      flushList();
      renderedElements.push(
        <div
          key={`h4-${i}`}
          className="mt-3 mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white tracking-wide"
        >
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono border border-white/15 uppercase">
            {renderInlineFormattedText(h4Match[1], onNavigateToSource)}
          </span>
        </div>
      );
      continue;
    }

    if (h3Match) {
      flushList();
      renderedElements.push(
        <h4
          key={`h3-${i}`}
          className="mt-3 mb-1.5 text-xs font-semibold text-white flex items-center gap-2 border-b border-white/[0.08] pb-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span>{renderInlineFormattedText(h3Match[1], onNavigateToSource)}</span>
        </h4>
      );
      continue;
    }

    if (h2Match) {
      flushList();
      renderedElements.push(
        <h3
          key={`h2-${i}`}
          className="mt-4 mb-2 text-sm font-semibold text-white flex items-center gap-2"
        >
          <span>{renderInlineFormattedText(h2Match[1], onNavigateToSource)}</span>
        </h3>
      );
      continue;
    }

    if (h1Match) {
      flushList();
      renderedElements.push(
        <h2
          key={`h1-${i}`}
          className="mt-4 mb-2 text-base font-bold text-white flex items-center gap-2"
        >
          <span>{renderInlineFormattedText(h1Match[1], onNavigateToSource)}</span>
        </h2>
      );
      continue;
    }

    // Check for Blockquote: >
    const quoteMatch = trimmed.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      flushList();
      renderedElements.push(
        <div
          key={`quote-${i}`}
          className="my-2 pl-3 py-1 border-l-2 border-white/40 bg-white/[0.02] rounded-r-md text-neutral-300 text-[11px] italic"
        >
          {renderInlineFormattedText(quoteMatch[1], onNavigateToSource)}
        </div>
      );
      continue;
    }

    // Check for Ordered list item: 1. or 1)
    const olMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (olMatch) {
      if (currentList && !currentList.ordered) flushList();
      if (!currentList) currentList = { ordered: true, items: [] };
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Check for Unordered list item: - or *
    const ulMatch = trimmed.match(/^[\*\-•]\s+(.*)$/);
    if (ulMatch) {
      if (currentList && currentList.ordered) flushList();
      if (!currentList) currentList = { ordered: false, items: [] };
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${i}`} className="text-neutral-300 leading-relaxed my-1.5">
        {renderInlineFormattedText(trimmed, onNavigateToSource)}
      </p>
    );
  }

  flushList();

  return <>{renderedElements}</>;
};

/**
 * Handles inline markdown:
 * - Bold: **text**
 * - Italic: *text* or _text_
 * - Inline code: `code`
 * - Clickable file paths: e.g. `pricing_engine.py:23` or `order_service.py`
 * - Strips accidental leftover raw asterisks or marks
 */
function renderInlineFormattedText(
  rawText: string,
  onNavigateToSource?: (file: string, line: number) => void
): React.ReactNode {
  if (!rawText) return null;

  // First clean up any accidental 4-stars like **** or leftover formatting markers
  const text = rawText
    .replace(/\*{4,}/g, '')
    .trim();

  // Pattern matches:
  // 1. Bold: \*\*([^*]+)\*\*
  // 2. Inline code: `([^`]+)`
  // 3. Italic: \*([^*]+)\*
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2).trim();
      return (
        <strong key={index} className="text-white font-semibold">
          {renderInlineFormattedText(boldText, onNavigateToSource)}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1).trim();

      // Check if it looks like a source file or file:line (e.g. "pricing_engine.py:23" or "order_service.py")
      const fileLineMatch = codeContent.match(/^([a-zA-Z0-9_\-\.\/]+\.py)(?::(\d+))?$/);
      if (fileLineMatch && onNavigateToSource) {
        const filePath = fileLineMatch[1];
        const lineNum = fileLineMatch[2] ? parseInt(fileLineMatch[2], 10) : 1;
        return (
          <button
            key={index}
            onClick={() => onNavigateToSource(filePath, lineNum)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-[11px] transition-all hover:scale-[1.02] align-baseline"
            title={`Inspect ${filePath} at line ${lineNum}`}
          >
            <FileCode className="w-2.5 h-2.5 text-neutral-300" />
            <span>{codeContent}</span>
          </button>
        );
      }

      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#161616] text-neutral-200 border border-white/10 font-mono text-[11px]"
        >
          {codeContent}
        </code>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const italicText = part.slice(1, -1).trim();
      return (
        <em key={index} className="text-neutral-300 italic">
          {italicText}
        </em>
      );
    }

    // Clean standard text (also strip stray orphan asterisks if any exist)
    const cleanPlain = part.replace(/\*\*/g, '').replace(/###/g, '');
    return <span key={index}>{cleanPlain}</span>;
  });
}
