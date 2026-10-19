import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, FileCode, Network, Bug, Terminal } from 'lucide-react';

interface AnalysisAnimationProps {
  fileName: string;
  onComplete: () => void;
}

export const AnalysisAnimation: React.FC<AnalysisAnimationProps> = ({
  fileName,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { label: 'Inspecting ZIP archive & verifying safety bounds', icon: ShieldCheck },
    { label: 'Unpacking source tree & filtering build artifacts', icon: FileCode },
    { label: 'Executing Python 3.10 AST lexical analysis & symbol mapping', icon: Terminal },
    { label: 'Constructing cross-file caller and callee dependency graph', icon: Network },
    { label: 'Discovering unittest suites & verifying invariants', icon: Bug }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 120);
          return 100;
        }
        const next = prev + 8;
        const stepIdx = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        setCurrentStepIndex(stepIdx);
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Visuvate-style animated bars heights
  const barScales = [0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8, 0.3, 0.9, 0.5];

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-8">
        {/* Visuvate-style minimal animated equalizer bars */}
        <div className="flex items-end justify-center gap-1.5 h-12 w-28 py-2">
          {barScales.map((scale, i) => (
            <div
              key={i}
              className="w-1.5 bg-white rounded-full vv-pulse-bar"
              style={{
                height: '100%',
                '--initial-scale': scale,
                animationDelay: `${i * 0.12}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Text Header */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            Analysis In Progress
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Indexing <span className="text-white font-mono">{fileName}</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Local AST extraction with zero cloud API dependencies
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
            <span>Deterministic Engine</span>
            <span className="text-white font-medium tabular-nums">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-white/[0.08]">
            <div
              className="h-full bg-white rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Progress List */}
        <div className="w-full bg-[#111111] border border-white/[0.08] rounded-xl p-4 space-y-2.5 text-left text-xs font-mono">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || progress === 100;
            const isCurrent = idx === currentStepIndex && progress < 100;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-colors ${
                  isCompleted
                    ? 'text-neutral-200'
                    : isCurrent
                    ? 'text-white font-semibold'
                    : 'text-neutral-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex-shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
