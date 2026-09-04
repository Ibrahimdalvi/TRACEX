import React from 'react';
import { InvestigationCase } from '../../types';

interface CaseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: InvestigationCase[];
  currentCaseId: string;
  onSelectCase: (c: InvestigationCase) => void;
}

export const CaseSelectorModal: React.FC<CaseSelectorModalProps> = ({
  isOpen,
  onClose,
  cases,
  currentCaseId,
  onSelectCase,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b21] border border-[#3c4948]/60 w-full max-w-xl rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-[#1a2027] border-b border-[#3c4948]/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">folder_open</span>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              SELECT ACTIVE INVESTIGATION
            </h3>
          </div>
          <button onClick={onClose} className="text-[#859491] hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {cases.map((c) => {
            const isCurrent = c.id === currentCaseId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCase(c);
                  onClose();
                }}
                className={`p-3.5 rounded border flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-[#66FCF1] bg-[#242b2a] shadow-[0_0_12px_rgba(102,252,241,0.2)]'
                    : 'border-[#3c4948]/40 bg-[#0e1514] hover:bg-[#1a2120] hover:border-[#3c4948]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#66FCF1]">{c.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase ${
                        c.priority === 'HIGH'
                          ? 'bg-[#93000a] text-[#ffdad6]'
                          : 'bg-[#736400] text-[#fce363]'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>
                  <h4 className="font-sans text-sm font-bold text-white">{c.title}</h4>
                  <p className="font-mono text-[10px] text-[#859491] mt-0.5">
                    Updated: {c.lastUpdated} • {c.entitiesCount} Entities • {c.evidenceCount} Exhibits
                  </p>
                </div>

                {isCurrent && (
                  <span className="font-mono text-[10px] text-[#66FCF1] font-bold bg-[#66FCF1]/10 px-2 py-1 rounded border border-[#66FCF1]/30">
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#1a2027] border-t border-[#3c4948]/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs text-[#859491] hover:text-white transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
