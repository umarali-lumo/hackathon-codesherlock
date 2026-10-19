import React from 'react';

interface ChevronMatrixProps {
  side: 'left' | 'right';
}

export const ChevronMatrix: React.FC<ChevronMatrixProps> = ({ side }) => {
  // Generate a matrix of upward-pointing arrow/chevron glyphs (↗ / ↑)
  // that mirrors the organic flowing density in the Lumina design screenshot.
  const rows = 28;
  const cols = 14;

  return (
    <div
      className={`absolute top-0 bottom-0 pointer-events-none select-none overflow-hidden hidden md:block opacity-45 transition-opacity ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{
        width: '320px',
        maskImage:
          side === 'left'
            ? 'radial-gradient(ellipse at 30% 50%, black 40%, transparent 85%)'
            : 'radial-gradient(ellipse at 70% 50%, black 40%, transparent 85%)',
        WebkitMaskImage:
          side === 'left'
            ? 'radial-gradient(ellipse at 30% 50%, black 40%, transparent 85%)'
            : 'radial-gradient(ellipse at 70% 50%, black 40%, transparent 85%)'
      }}
    >
      <div
        className={`grid gap-x-2 gap-y-1.5 font-mono text-[9px] text-sky-400/60 leading-none p-4 ${
          side === 'left' ? 'justify-items-start' : 'justify-items-end'
        }`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          
          // Compute curve intensity: densest around middle columns curving outward
          const distFromCenter = Math.abs(col - cols / 2) / (cols / 2);
          const distFromRowMid = Math.abs(row - rows / 2) / (rows / 2);
          const opacity = Math.max(0.1, 1 - (distFromCenter * 0.7 + distFromRowMid * 0.5));
          
          return (
            <span
              key={idx}
              className="transition-colors hover:text-white"
              style={{
                opacity,
                transform: side === 'left' ? 'rotate(-10deg)' : 'rotate(10deg)'
              }}
            >
              ↗
            </span>
          );
        })}
      </div>
    </div>
  );
};
