import React, { useState } from 'react';
import { InvestigationCase } from '../../types';

interface ReportsViewProps {
  currentCase: InvestigationCase;
  onOpenExportDossier: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentCase, onOpenExportDossier }) => {
  const [includeClassified, setIncludeClassified] = useState(true);
  const [includeGraphMetrics, setIncludeGraphMetrics] = useState(true);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#7bd6d1] font-bold uppercase tracking-wider">
              INTELLIGENCE BRIEFING GENERATOR
            </span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Case Reports & Executive Summaries
          </h2>
        </div>

        <button
          onClick={onOpenExportDossier}
          className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          PRINT / EXPORT REPORT
        </button>
      </div>

      {/* Report Configuration & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config (4 cols) */}
        <div className="lg:col-span-4 bg-[#1a2120] border border-[#3c4948]/40 p-5 rounded-lg flex flex-col gap-4 shadow-sm">
          <h3 className="font-mono text-xs font-bold text-[#7bd6d1] uppercase tracking-wider border-b border-[#3c4948]/40 pb-2">
            REPORT PARAMETERS
          </h3>

          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] font-bold text-[#859491] uppercase tracking-wider block mb-1">
                CLASSIFICATION MARKING
              </label>
              <select className="w-full bg-[#0e1514] border border-[#3c4948]/60 text-white font-mono text-xs p-2 rounded focus:outline-none focus:border-[#66FCF1]">
                <option>TOP SECRET // NOFORN // ORCON</option>
                <option>SECRET // LAW ENFORCEMENT SENSITIVE</option>
                <option>CONFIDENTIAL / PROSECUTORIAL USE</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#3c4948]/30 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-[#dde4e2]">
                <input
                  type="checkbox"
                  checked={includeClassified}
                  onChange={(e) => setIncludeClassified(e.target.checked)}
                  className="rounded border-[#3c4948] text-[#66FCF1] focus:ring-0"
                />
                Include SIGINT & Cellular Intercept Logs
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-[#dde4e2]">
                <input
                  type="checkbox"
                  checked={includeGraphMetrics}
                  onChange={(e) => setIncludeGraphMetrics(e.target.checked)}
                  className="rounded border-[#3c4948] text-[#66FCF1] focus:ring-0"
                />
                Include Betweenness & Degree Centrality Vector Analysis
              </label>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-[#3c4948]/30">
            <span className="font-mono text-[9px] text-[#859491] block uppercase">
              DOCUMENT ID: REP-{currentCase.id}-V4
            </span>
            <span className="font-mono text-[9px] text-[#7bd6d1] block mt-0.5">
              LEAD OFFICER: {currentCase.leadInvestigator}
            </span>
          </div>
        </div>

        {/* Live Formatted Report Preview (8 cols) */}
        <div className="lg:col-span-8 bg-[#090f0f] border border-[#3c4948]/50 p-6 rounded-lg shadow-xl font-sans text-[#dde4e2]">
          {/* Classification Header Banner */}
          <div className="text-center py-1.5 bg-[#93000a] text-[#ffdad6] font-mono text-[10px] font-extrabold tracking-widest uppercase mb-6 rounded-sm">
            TOP SECRET // LAW ENFORCEMENT SENSITIVE // NOFORN
          </div>

          <div className="flex justify-between items-start border-b border-[#3c4948]/40 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                CRIMINAL INTELLIGENCE ASSESSMENT DOSSIER
              </h1>
              <p className="font-mono text-xs text-[#7bd6d1] mt-0.5">
                SUBJECT CASE: {currentCase.id} ({currentCase.title})
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-[#859491]">
              <div>DATE: {currentCase.lastUpdated}</div>
              <div>ORIGIN: TRACEX INTEL DIVISION</div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="mb-6">
            <h4 className="font-mono text-[10px] font-bold text-[#66FCF1] uppercase tracking-wider mb-1.5">
              1.0 EXECUTIVE SUMMARY & SYNOPSIS
            </h4>
            <p className="text-xs text-[#bacac7] leading-relaxed bg-[#1a2120]/60 p-3 rounded border border-[#3c4948]/30">
              {currentCase.summary}
            </p>
          </div>

          {/* Section 2: Key Targets & Shell Entities */}
          <div className="mb-6">
            <h4 className="font-mono text-[10px] font-bold text-[#66FCF1] uppercase tracking-wider mb-2">
              2.0 PRIMARY SUBJECTS & CORPORATE VEHICLES
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentCase.keyEntities.map((ent) => (
                <div key={ent.id} className="bg-[#1a2120] border border-[#3c4948]/40 p-3 rounded text-xs">
                  <div className="flex justify-between font-mono text-[10px] font-bold mb-1">
                    <span className="text-[#66FCF1]">{ent.id}</span>
                    <span className="text-[#ffb4ab]">{ent.tag}</span>
                  </div>
                  <div className="font-bold text-white text-sm">{ent.name}</div>
                  <div className="text-[#859491] text-[11px] mt-1">
                    Role: {ent.role || 'Corporate Front'} | Jurisdiction: {ent.location || ent.jurisdiction || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Technical Risk Assessment */}
          <div className="mb-4">
            <h4 className="font-mono text-[10px] font-bold text-[#66FCF1] uppercase tracking-wider mb-1.5">
              3.0 AUTOMATED NETWORK TOPOLOGY FINDINGS
            </h4>
            <p className="text-xs text-[#bacac7] leading-relaxed bg-[#1a2120]/60 p-3 rounded border border-[#3c4948]/30">
              {currentCase.assessment.summary} Confidence Index verified at{' '}
              <strong className="text-[#66FCF1]">{currentCase.assessment.confidenceInterval}%</strong> (LCL{' '}
              {currentCase.assessment.lcl}% / UCL {currentCase.assessment.ucl}%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
