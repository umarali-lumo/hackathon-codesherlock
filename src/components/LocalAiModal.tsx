import React, { useState } from 'react';
import { Cpu, X, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

interface LocalAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: string;
  setEndpoint: (ep: string) => void;
  isConnected: boolean;
  onTestConnection: () => Promise<boolean>;
  models: string[];
}

export const LocalAiModal: React.FC<LocalAiModalProps> = ({
  isOpen,
  onClose,
  endpoint,
  setEndpoint,
  isConnected,
  onTestConnection,
  models
}) => {
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const ok = await onTestConnection();
      setStatusMessage(ok ? 'Connected successfully to local AI endpoint.' : 'Could not reach endpoint. Ensure Ollama or local LLM server is active.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm font-sans">
      <div className="bg-[#111111] border border-white/[0.08] p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5 text-xs text-neutral-300">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-white" />
            <h3 className="font-semibold text-white text-sm">Optional Local AI Integration (Layer B)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-md hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#181818] border border-white/[0.08] p-3.5 rounded-xl text-neutral-300 text-[11px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-white mb-1">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>100% Free & Zero Cloud API Costs</span>
          </div>
          CodeSherlock’s <strong>Deterministic Engine (Layer A)</strong> operates completely free without requiring any API keys or LLMs. If you have <strong>Ollama</strong> or a local model server running on your computer, you can connect it here for augmented reasoning.
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            Local Inference Endpoint (Ollama / LocalAI)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 bg-[#0a0a0a] border border-white/[0.08] rounded-full px-3.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-white/30"
            />
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1 bg-[#1a1a1a] hover:bg-[#242424] text-white border border-white/[0.08] px-3.5 py-1.5 rounded-full font-medium transition-colors"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-[11px] flex items-center gap-2 ${
            isConnected ? 'bg-white/10 text-white border border-white/20' : 'bg-red-950/30 text-red-300 border border-red-500/20'
          }`}>
            {isConnected ? <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}

        {models.length > 0 && (
          <div className="bg-[#0a0a0a] p-3 rounded-xl border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-neutral-500 font-mono uppercase">Detected Local Models:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {models.map(m => (
                <span key={m} className="px-2 py-0.5 rounded-full bg-[#181818] font-mono text-[10px] text-neutral-300 border border-white/[0.06]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[11px]">
          <span className="text-neutral-500">Status: {isConnected ? 'Connected' : 'Offline / Deterministic Only'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-full font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
