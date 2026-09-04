import React, { useState, useEffect } from 'react';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => setHealth(data))
        .catch(() => {
          setHealth({
            status: 'online',
            system: 'TraceX Criminal Intel Local Core',
            geminiConfigured: false,
            timestamp: new Date().toISOString(),
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b21] border border-[#3c4948]/60 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-[#1a2027] border-b border-[#3c4948]/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">sensors</span>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              SYSTEM TELEMETRY & ENGINE STATUS
            </h3>
          </div>
          <button onClick={onClose} className="text-[#859491] hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 font-mono text-xs text-[#bacac7]">
          <div className="flex items-center justify-between p-3 bg-[#0e1514] rounded border border-[#3c4948]/40">
            <span className="text-[#859491]">INTELLIGENCE CORE:</span>
            <span className="text-[#66FCF1] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse"></span>
              {health?.status?.toUpperCase() || 'ONLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0e1514] rounded border border-[#3c4948]/40">
            <span className="text-[#859491]">AI COPILOT BACKEND:</span>
            <span className="text-[#7bd6d1] font-bold">
              {health?.geminiConfigured ? 'GEMINI 3.7 FLASH (ACTIVE)' : 'LOCAL FORENSIC CORE (ACTIVE)'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0e1514] rounded border border-[#3c4948]/40">
            <span className="text-[#859491]">LINK ANALYSIS ALGORITHM:</span>
            <span className="text-white font-bold">BETWEENNESS-V4 / GRAPH-D3</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0e1514] rounded border border-[#3c4948]/40">
            <span className="text-[#859491]">TIMESTAMP:</span>
            <span className="text-[#859491]">{health?.timestamp || new Date().toISOString()}</span>
          </div>
        </div>

        <div className="p-4 bg-[#1a2027] border-t border-[#3c4948]/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all shadow-md"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
