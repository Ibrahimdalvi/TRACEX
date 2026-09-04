import React, { useState } from 'react';
import { ForensicDossierEntity, ActiveView } from '../../types';

interface EntitiesRegistryViewProps {
  onSelectEntity: (entity: ForensicDossierEntity) => void;
  onNavigate: (view: ActiveView) => void;
}

export const EntitiesRegistryView: React.FC<EntitiesRegistryViewProps> = ({
  onSelectEntity,
  onNavigate,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const entities: ForensicDossierEntity[] = [
    {
      id: 'P-104',
      name: 'Rahul Sharma',
      type: 'PERSON',
      role: 'Director / Beneficial Owner',
      degree: 17,
      betweenness: 0.82,
      cases: 6,
      commLinks: 8,
      financialTies: 2,
      confidenceScore: 91,
      activeCasesCount: 6,
      status: 'ACTIVE TARGET',
      flagCriteria: [
        'Appears across multiple investigations',
        'Connects two distinct network clusters',
        'Demonstrates anomalous repeated communication patterns',
      ],
      tacticalAssessment:
        'Acts as a solitary coordination bridge. Wire transfers precede encrypted satellite calls by an average of 4.2 hours.',
    },
    {
      id: 'ORG-42',
      name: 'Aegis Holdings FZE',
      type: 'ORGANIZATION',
      role: 'Shell Front / Corporate Asset',
      degree: 9,
      betweenness: 0.54,
      cases: 4,
      commLinks: 3,
      financialTies: 7,
      confidenceScore: 88,
      activeCasesCount: 4,
      status: 'AUDITED / RED FLAG',
      flagCriteria: ['Zero commercial footprint', 'Nominee shareholder structure'],
      tacticalAssessment: 'Primary offshore conduit for routing structured funds.',
    },
    {
      id: 'NODE-PHONE',
      name: '+91 98XXXXXX12',
      type: 'TELECOM',
      role: 'Encrypted Cellular Identifier',
      degree: 12,
      betweenness: 0.68,
      cases: 4,
      commLinks: 12,
      financialTies: 0,
      confidenceScore: 88,
      activeCasesCount: 4,
      status: 'INTERCEPT ACTIVE',
      flagCriteria: ['Surfaced in 4 active files within 72h'],
      tacticalAssessment: 'High-frequency burst calls preceding major financial dispatches.',
    },
    {
      id: 'NODE-BANK',
      name: 'Falcon Interbank (Acct XXXX9821)',
      type: 'FINANCIAL',
      role: 'Intermediary Settlement Account',
      degree: 14,
      betweenness: 0.74,
      cases: 3,
      commLinks: 0,
      financialTies: 14,
      confidenceScore: 85,
      activeCasesCount: 3,
      status: 'SUBPOENA PENDING',
      flagCriteria: ['Circular A->B->C->A structuring'],
      tacticalAssessment: 'Laundering hub showing rapid fund dispersion into shell subsidiaries.',
    },
    {
      id: 'NODE-VEHICLE',
      name: 'MH-04-AB-1234 (Armored SUV)',
      type: 'VEHICLE',
      role: 'Transport Asset',
      degree: 4,
      betweenness: 0.19,
      cases: 2,
      commLinks: 2,
      financialTies: 1,
      confidenceScore: 76,
      activeCasesCount: 2,
      status: 'ALPR TRACKED',
      flagCriteria: ['Border crossing timed with wire transfers'],
      tacticalAssessment: 'Physical courier transport for offshore bearer bonds and encrypted hardware tokens.',
    },
  ];

  const filteredEntities = entities.filter((e) => {
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesQuery =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Entities & Targets Registry
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#bacac7] mt-0.5">
            Cross-jurisdictional person, corporate, telecommunication, and asset directory
          </p>
        </div>

        <button
          onClick={() => onNavigate('network')}
          className="px-3.5 py-2 rounded bg-[#1a2120] border border-[#66FCF1]/60 text-[#66FCF1] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#66FCF1] hover:text-[#00201e] transition-all flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">hub</span>
          VIEW IN NETWORK GRAPH
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#1a2120] border border-[#3c4948]/40 p-3 rounded-lg">
        <div className="flex gap-2 overflow-x-auto">
          {['ALL', 'PERSON', 'ORGANIZATION', 'TELECOM', 'FINANCIAL', 'VEHICLE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterType === t
                  ? 'bg-[#66FCF1] text-[#00201e]'
                  : 'bg-[#0e1514] text-[#bacac7] hover:text-white border border-[#3c4948]/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#0e1514] border border-[#3c4948]/60 px-3 py-1.5 rounded w-full md:w-72">
          <span className="material-symbols-outlined text-[#7bd6d1] text-[16px] mr-2">search</span>
          <input
            type="text"
            placeholder="Search entity by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-white text-xs font-mono focus:outline-none w-full placeholder:text-[#859491]/60"
          />
        </div>
      </div>

      {/* Entities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map((entity) => (
          <div
            key={entity.id}
            onClick={() => onSelectEntity(entity)}
            className="bg-[#1a2120] border border-[#3c4948]/40 hover:border-[#66FCF1]/70 p-4 rounded-lg flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(102,252,241,0.15)]"
          >
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#66FCF1] text-[18px]">
                    {entity.type === 'PERSON'
                      ? 'person'
                      : entity.type === 'ORGANIZATION'
                      ? 'business'
                      : entity.type === 'TELECOM'
                      ? 'phone_iphone'
                      : entity.type === 'FINANCIAL'
                      ? 'account_balance'
                      : 'directions_car'}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#66FCF1] bg-[#66FCF1]/10 px-2 py-0.5 rounded border border-[#66FCF1]/20">
                    {entity.id}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase tracking-wider bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30">
                  {entity.status}
                </span>
              </div>

              <h3 className="font-sans text-base font-bold text-white group-hover:text-[#66FCF1] transition-colors mb-1">
                {entity.name}
              </h3>
              <p className="font-sans text-xs text-[#bacac7] mb-3">{entity.role}</p>

              {/* Metrics Matrix */}
              <div className="grid grid-cols-3 gap-2 bg-[#0e1514] p-2.5 rounded border border-[#3c4948]/30 font-mono text-[10px] mb-3">
                <div className="text-center">
                  <div className="text-[#859491] text-[8px] uppercase">BETWEENNESS</div>
                  <div className="text-[#66FCF1] font-bold mt-0.5">{entity.betweenness}</div>
                </div>
                <div className="text-center border-x border-[#3c4948]/40">
                  <div className="text-[#859491] text-[8px] uppercase">CASES</div>
                  <div className="text-white font-bold mt-0.5">{entity.cases}</div>
                </div>
                <div className="text-center">
                  <div className="text-[#859491] text-[8px] uppercase">DEGREE</div>
                  <div className="text-white font-bold mt-0.5">{entity.degree}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3c4948]/30 flex justify-between items-center text-xs">
              <span className="font-sans text-[#859491] text-[11px]">
                Confidence: <strong className="text-white">{entity.confidenceScore}%</strong>
              </span>
              <span className="font-mono text-[10px] text-[#66FCF1] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                OPEN PROFILE <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
