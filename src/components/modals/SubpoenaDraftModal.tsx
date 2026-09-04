import React, { useState } from 'react';
import { InvestigationCase } from '../../types';

interface SubpoenaDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: InvestigationCase;
}

export const SubpoenaDraftModal: React.FC<SubpoenaDraftModalProps> = ({
  isOpen,
  onClose,
  currentCase,
}) => {
  const [targetEntity, setTargetEntity] = useState('ORG-42 (Aegis Holdings FZE)');
  const [institution, setInstitution] = useState('Falcon Interbank PSC (Dubai Branch)');
  const [scope, setScope] = useState('All ledger transactions, Swift MT103 logs, and KYC files (2024-Present)');
  const [isGenerated, setIsGenerated] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b21] border border-[#3c4948]/60 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#1a2027] border-b border-[#3c4948]/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">gavel</span>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              LEGAL SUBPOENA & DISCOVERY DRAFT GENERATOR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#859491] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="font-mono text-[10px] font-bold text-[#7bd6d1] uppercase tracking-wider block mb-1">
              INVESTIGATION CONTEXT
            </label>
            <div className="p-2.5 bg-[#090f0f] border border-[#3c4948]/40 rounded font-mono text-xs text-white">
              {currentCase.id} - {currentCase.title}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-1">
                TARGET ENTITY / NOMINEE
              </label>
              <select
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value)}
                className="w-full bg-[#090f0f] border border-[#3c4948]/50 text-white font-mono text-xs p-2 rounded focus:outline-none focus:border-[#66FCF1]"
              >
                <option>ORG-42 (Aegis Holdings FZE)</option>
                <option>P-104 (Rahul Sharma)</option>
                <option>Account XXXX9821</option>
                <option>NODE-PHONE (+91 98XXXXXX12)</option>
              </select>
            </div>

            <div>
              <label className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-1">
                RECIPIENT INSTITUTION
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-[#090f0f] border border-[#3c4948]/50 text-white font-mono text-xs p-2 rounded focus:outline-none focus:border-[#66FCF1]"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-1">
              DISCOVERY SCOPE & STATUTORY DEMANDS
            </label>
            <textarea
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-[#090f0f] border border-[#3c4948]/50 text-white font-mono text-xs p-2 rounded focus:outline-none focus:border-[#66FCF1]"
            />
          </div>

          {isGenerated && (
            <div className="bg-[#090f0f] border border-[#66FCF1]/40 p-4 rounded text-xs font-mono text-[#bacac7] space-y-2">
              <div className="text-[#66FCF1] font-bold uppercase tracking-wider text-[10px]">
                FINANCIAL INTELLIGENCE UNIT – INDIA (FIU-IND) // ENFORCEMENT DIRECTORATE REFERRAL
              </div>
              <div className="text-[9px] text-[#ffb4ab] font-bold uppercase">SYNTHETIC DOCUMENT — FOR INVESTIGATIVE SIMULATION ONLY</div>
              <p className="text-[11px] leading-relaxed mt-2">
                TO: {institution}
                <br />
                SUBJECT: Statutory Production Order under the Prevention of Money-Laundering Act, 2002 (PMLA) — Section 50 Read with Rule 3.
                <br /><br />
                You are hereby directed to produce, for inspection and seizure, all financial records, KYC files, SWIFT MT-103 transaction logs, and beneficial ownership disclosures relating to the entity: <strong>{targetEntity}</strong>.
              </p>
              <div className="text-[#7bd6d1] text-[10px] border-t border-[#3c4948]/40 pt-2 mt-2">
                Statutory Grounds: PMLA 2002 §3 (money-laundering offence), §12-A (reporting obligation), and §17 (search and seizure). Case Reference: {currentCase.id}.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1a2027] border-t border-[#3c4948]/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs text-[#859491] hover:text-white rounded transition-colors"
          >
            CANCEL
          </button>
          {!isGenerated ? (
            <button
              onClick={() => setIsGenerated(true)}
              className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              GENERATE DRAFT
            </button>
          ) : (
            <button
              onClick={() => {
                alert('Subpoena draft saved and queued for prosecutorial review.');
                onClose();
              }}
              className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              SUBMIT TO PROSECUTOR
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
