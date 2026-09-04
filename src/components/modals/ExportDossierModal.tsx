import React, { useState } from 'react';
import { InvestigationCase } from '../../types';

interface ExportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: InvestigationCase;
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  isOpen,
  onClose,
  currentCase,
}) => {
  const [format, setFormat] = useState<'PDF' | 'JSON' | 'CSV'>('PDF');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      onClose();
      alert(`Case Dossier for ${currentCase.id} exported successfully in ${format} format.`);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b21] border border-[#3c4948]/60 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-[#1a2027] border-b border-[#3c4948]/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">download</span>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              EXPORT INVESTIGATION DOSSIER
            </h3>
          </div>
          <button onClick={onClose} className="text-[#859491] hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 font-sans text-xs text-[#bacac7]">
          <div>
            <label className="font-mono text-[10px] font-bold text-[#7bd6d1] uppercase tracking-wider block mb-1">
              TARGET FILE
            </label>
            <div className="p-2.5 bg-[#090f0f] border border-[#3c4948]/40 rounded font-mono text-white">
              {currentCase.id} ({currentCase.title})
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-2">
              OUTPUT FORMAT
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PDF', 'JSON', 'CSV'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded font-mono text-xs font-bold uppercase transition-all ${
                    format === fmt
                      ? 'bg-[#66FCF1] text-[#00201e] shadow-sm'
                      : 'bg-[#090f0f] text-[#bacac7] border border-[#3c4948]/50 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#090f0f] p-3 rounded border border-[#3c4948]/40 text-[11px] space-y-1">
            <div className="text-white font-bold font-mono">Dossier Bundle Includes:</div>
            <div>• Full Key Entities Roster & Nominee Profiles</div>
            <div>• Multi-Vector Link Analysis Adjacency Matrix</div>
            <div>• Forensic Telemetry and Financial SWIFT Trails</div>
            <div>• AI Lead Assessment & Confidence Intervals</div>
          </div>
        </div>

        <div className="p-4 bg-[#1a2027] border-t border-[#3c4948]/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs text-[#859491] hover:text-white transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
          >
            {isExporting ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">file_download</span>
            )}
            DOWNLOAD DOSSIER
          </button>
        </div>
      </div>
    </div>
  );
};
