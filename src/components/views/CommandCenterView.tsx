import React from 'react';
import { InvestigationCase, ActiveView } from '../../types';

interface CommandCenterViewProps {
  cases: InvestigationCase[];
  currentCase: InvestigationCase;
  onSelectCase: (caseItem: InvestigationCase) => void;
  onNavigate: (view: ActiveView) => void;
  onCreateCase: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  cases,
  currentCase,
  onSelectCase,
  onNavigate,
  onCreateCase,
}) => {
  /* =========================================================
     DYNAMIC COMMAND CENTER METRICS
  ========================================================= */

  const activeCases = cases.filter(
    (caseItem) =>
      caseItem.status === 'ACTIVE'
  ).length;

  const entitiesTracked = cases.reduce(
    (total, caseItem) =>
      total +
      (caseItem.entitiesCount || 0),
    0
  );

  const networkLinks = cases.reduce(
    (total, caseItem) =>
      total +
      (caseItem.linksCount || 0),
    0
  );

  const highPriorityCases =
    cases.filter(
      (caseItem) =>
        caseItem.priority === 'HIGH' &&
        caseItem.status === 'ACTIVE'
    ).length;

  const keyEntities =
    currentCase?.keyEntities || [];

  const displayedEntities =
    keyEntities.slice(0, 6);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getPriorityClass = (
    priority?: string
  ) => {
    if (priority === 'HIGH') {
      return 'text-[#ffb4ab] bg-[#93000a]/30 border-[#ffb4ab]/30';
    }

    if (priority === 'MEDIUM') {
      return 'text-[#F6B352] bg-[#F6B352]/10 border-[#F6B352]/30';
    }

    return 'text-[#66FCF1] bg-[#66FCF1]/10 border-[#66FCF1]/30';
  };

  const getEntityIcon = (
    type?: string
  ) => {
    const value =
      String(type || '')
        .toLowerCase();

    if (value.includes('person')) {
      return 'person_search';
    }

    if (
      value.includes('phone') ||
      value.includes('telecom')
    ) {
      return 'phone_iphone';
    }

    if (
      value.includes('bank') ||
      value.includes('account') ||
      value.includes('financial')
    ) {
      return 'account_balance';
    }

    if (
      value.includes('vehicle') ||
      value.includes('car')
    ) {
      return 'directions_car';
    }

    if (
      value.includes('organization') ||
      value.includes('organisation') ||
      value.includes('company') ||
      value.includes('org')
    ) {
      return 'business';
    }

    if (
      value.includes('location') ||
      value.includes('place')
    ) {
      return 'location_on';
    }

    if (
      value.includes('device')
    ) {
      return 'devices';
    }

    return 'hub';
  };

  const getEntityTone = (
    type?: string
  ) => {
    const value =
      String(type || '')
        .toLowerCase();

    if (value.includes('person')) {
      return '#66FCF1';
    }

    if (
      value.includes('phone') ||
      value.includes('telecom')
    ) {
      return '#F6B352';
    }

    if (
      value.includes('bank') ||
      value.includes('account') ||
      value.includes('financial')
    ) {
      return '#ffb4ab';
    }

    if (
      value.includes('vehicle') ||
      value.includes('car')
    ) {
      return '#dec74a';
    }

    if (
      value.includes('organization') ||
      value.includes('organisation') ||
      value.includes('company') ||
      value.includes('org')
    ) {
      return '#a1fcf7';
    }

    return '#7bd6d1';
  };

  const riskLevel =
    currentCase?.assessment?.riskLevel ||
    (
      currentCase?.priority === 'HIGH'
        ? 'HIGH RISK DETECTED'
        : currentCase?.priority === 'MEDIUM'
          ? 'ELEVATED RISK'
          : 'LOW RISK'
    );

  const confidence =
    Number(
      currentCase?.assessment
        ?.confidenceInterval || 0
    );

  const recentCases =
    cases.slice(0, 8);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div>
          <p className="font-mono text-[9px] font-bold text-[#66FCF1] uppercase tracking-widest mb-1">
            TRACEX INTELLIGENCE PLATFORM
          </p>

          <h2 className="font-sans text-3xl font-bold text-white tracking-tight">
            Investigation Command Center
          </h2>

          <p className="font-sans text-sm text-[#bacac7] mt-1">
            Live case-management and cross-source intelligence overview
          </p>
        </div>

        <button
          onClick={onCreateCase}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#66FCF1] text-[#00201e] font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-[#8afff7] transition-colors shadow-[0_0_18px_rgba(102,252,241,0.12)] flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[17px]">
            add_circle
          </span>

          NEW CASE
        </button>
      </div>

      {/* =========================================================
          SYSTEM METRICS
      ========================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ACTIVE CASES */}
        <div className="bg-[#1a2120] border border-[#3c4948]/40 p-4 rounded-lg flex flex-col gap-1 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="font-mono text-[9px] font-bold tracking-widest text-[#859491] uppercase">
              ACTIVE CASES
            </span>

            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">
              folder_open
            </span>

          </div>

          <span className="font-mono text-3xl font-bold text-white tracking-tight mt-1">
            {activeCases}
          </span>

          <span className="font-mono text-[9px] text-[#66FCF1]">
            LIVE INVESTIGATIONS
          </span>

        </div>

        {/* ENTITIES */}
        <div className="bg-[#1a2120] border border-[#3c4948]/40 p-4 rounded-lg flex flex-col gap-1 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="font-mono text-[9px] font-bold tracking-widest text-[#859491] uppercase">
              ENTITIES TRACKED
            </span>

            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">
              groups
            </span>

          </div>

          <span className="font-mono text-3xl font-bold text-white tracking-tight mt-1">
            {entitiesTracked.toLocaleString()}
          </span>

          <span className="font-mono text-[9px] text-[#7bd6d1]">
            ACROSS REGISTERED CASES
          </span>

        </div>

        {/* NETWORK LINKS */}
        <div className="bg-[#1a2120] border border-[#3c4948]/40 p-4 rounded-lg flex flex-col gap-1 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="font-mono text-[9px] font-bold tracking-widest text-[#859491] uppercase">
              NETWORK LINKS
            </span>

            <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">
              hub
            </span>

          </div>

          <span className="font-mono text-3xl font-bold text-white tracking-tight mt-1">
            {networkLinks}
          </span>

          <span className="font-mono text-[9px] text-[#7bd6d1]">
            EXTRACTED RELATIONSHIPS
          </span>

        </div>

        {/* HIGH PRIORITY */}
        <div className="bg-[#1a2120] border border-[#3c4948]/40 border-l-[3px] border-l-[#ffb4ab] p-4 rounded-lg flex flex-col gap-1 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="font-mono text-[9px] font-bold tracking-widest text-[#ffb4ab] uppercase">
              HIGH PRIORITY
            </span>

            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
              warning
            </span>

          </div>

          <span className="font-mono text-3xl font-bold text-white tracking-tight mt-1">
            {highPriorityCases}
          </span>

          <span className="font-mono text-[9px] text-[#ffb4ab]">
            REQUIRES REVIEW
          </span>

        </div>

      </div>

      {/* =========================================================
          CURRENT CASE INTELLIGENCE
      ========================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 min-h-[440px]">

        {/* =====================================================
            NETWORK PREVIEW
        ===================================================== */}

        <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg overflow-hidden flex flex-col shadow-sm">

          {/* HEADER */}
          <div className="px-4 py-3 border-b border-[#3c4948]/40 flex justify-between items-center bg-[#242b2a]/60">

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />

              <span className="font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase">
                CURRENT CASE NETWORK
              </span>

            </div>

            <button
              onClick={() =>
                onNavigate('network')
              }
              className="font-mono text-[10px] text-[#7bd6d1] hover:text-[#66FCF1] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                open_in_full
              </span>

              OPEN NETWORK
            </button>

          </div>

          {/* NETWORK AREA */}

          <div
            className="flex-1 relative bg-[#090f0f] min-h-[370px] hud-grid overflow-hidden"
          >

            {/* GRID / HUD decoration */}
            <div className="absolute inset-0 pointer-events-none">

              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#3c4948]/20" />

              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#3c4948]/20" />

              <div className="absolute inset-[12%] rounded-full border border-[#3c4948]/20" />

              <div className="absolute inset-[25%] rounded-full border border-[#3c4948]/15" />

            </div>

            {/* CURRENT CASE CENTER */}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">

              <div className="w-24 h-24 rounded-full bg-[#0e1514] border-2 border-[#66FCF1] flex items-center justify-center shadow-[0_0_35px_rgba(102,252,241,0.18)]">

                <div className="text-center px-2">

                  <span className="material-symbols-outlined text-[#66FCF1] text-[24px]">
                    folder_special
                  </span>

                  <div className="font-mono text-[8px] font-bold text-[#66FCF1] tracking-wider mt-1">
                    CASE
                  </div>

                </div>

              </div>

              <div className="mt-2 bg-[#1a2120]/95 border border-[#66FCF1]/30 rounded px-3 py-1.5 text-center max-w-[190px]">

                <div className="font-mono text-[9px] font-bold text-white truncate">
                  {currentCase?.id || 'NO CASE'}
                </div>

                <div className="font-mono text-[8px] text-[#859491] truncate mt-0.5">
                  {currentCase?.title || 'No active investigation'}
                </div>

              </div>

            </div>

            {/* AI KEY ENTITIES */}

            {displayedEntities.length > 0 ? (
              displayedEntities.map(
                (entity: any, index: number) => {

                  const positions = [
                    {
                      top: '14%',
                      left: '18%',
                    },
                    {
                      top: '15%',
                      left: '73%',
                    },
                    {
                      top: '42%',
                      left: '10%',
                    },
                    {
                      top: '43%',
                      left: '88%',
                    },
                    {
                      top: '76%',
                      left: '25%',
                    },
                    {
                      top: '75%',
                      left: '72%',
                    },
                  ];

                  const pos =
                    positions[
                      index %
                        positions.length
                    ];

                  const tone =
                    getEntityTone(
                      entity.type
                    );

                  return (
                    <div
                      key={
                        entity.id ||
                        `entity-${index}`
                      }
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{
                        top:
                          pos.top,
                        left:
                          pos.left,
                      }}
                    >

                      <div
                        className="w-12 h-12 rounded-full bg-[#1a2120] border flex items-center justify-center shadow-lg"
                        style={{
                          borderColor:
                            `${tone}80`,
                          boxShadow:
                            `0 0 16px ${tone}18`,
                        }}
                      >

                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{
                            color:
                              tone,
                          }}
                        >
                          {getEntityIcon(
                            entity.type
                          )}
                        </span>

                      </div>

                      <div className="mt-1.5 bg-[#1a2120]/95 border border-[#3c4948]/60 rounded px-2 py-1 max-w-[135px] text-center">

                        <div className="font-mono text-[8px] text-white font-bold truncate">
                          {entity.name ||
                            entity.id ||
                            'ENTITY'}
                        </div>

                        <div className="font-mono text-[7px] text-[#859491] uppercase truncate mt-0.5">
                          {entity.type ||
                            'UNKNOWN'}
                        </div>

                      </div>

                    </div>
                  );
                }
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">

                <div className="text-center max-w-sm px-6">

                  <span className="material-symbols-outlined text-[#3c4948] text-[44px]">
                    account_tree
                  </span>

                  <p className="font-mono text-[10px] text-[#859491] uppercase tracking-widest mt-3">
                    NETWORK DATA PENDING
                  </p>

                  <p className="font-sans text-xs text-[#596563] mt-2 leading-relaxed">
                    Upload case material to generate
                    entities and relationships automatically.
                  </p>

                </div>

              </div>
            )}

            {/* INFO STRIP */}

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-30">

              <div className="bg-[#0e1514]/90 border border-[#3c4948]/50 rounded px-2.5 py-1.5">

                <span className="font-mono text-[8px] text-[#859491]">
                  ENTITIES
                </span>

                <span className="font-mono text-[10px] font-bold text-white ml-2">
                  {currentCase?.entitiesCount || 0}
                </span>

              </div>

              <div className="bg-[#0e1514]/90 border border-[#3c4948]/50 rounded px-2.5 py-1.5">

                <span className="font-mono text-[8px] text-[#859491]">
                  LINKS
                </span>

                <span className="font-mono text-[10px] font-bold text-white ml-2">
                  {currentCase?.linksCount || 0}
                </span>

              </div>

              <div className="bg-[#0e1514]/90 border border-[#3c4948]/50 rounded px-2.5 py-1.5">

                <span className="font-mono text-[8px] text-[#859491]">
                  EVIDENCE
                </span>

                <span className="font-mono text-[10px] font-bold text-white ml-2">
                  {currentCase?.evidenceCount || 0}
                </span>

              </div>

              <div className="bg-[#0e1514]/90 border border-[#3c4948]/50 rounded px-2.5 py-1.5">

                <span className="font-mono text-[8px] text-[#859491]">
                  CONFIDENCE
                </span>

                <span className="font-mono text-[10px] font-bold text-[#66FCF1] ml-2">
                  {confidence
                    ? `${confidence}%`
                    : '—'}
                </span>

              </div>

            </div>

          </div>
        </div>

        {/* =====================================================
            PRIORITY INTELLIGENCE
        ===================================================== */}

        <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4 flex flex-col gap-4 border-t-[3px] border-t-[#66FCF1] shadow-sm">

          <div>

            <span className="font-mono text-[9px] font-bold tracking-widest text-[#7bd6d1] mb-1 block uppercase">
              PRIORITY INTELLIGENCE
            </span>

            <h3 className="font-sans text-lg font-bold text-white">
              {currentCase?.title ||
                'No active case'}
            </h3>

            <p className="font-mono text-[10px] text-[#66FCF1] mt-1">
              {currentCase?.id || '—'}
            </p>

          </div>

          {/* RISK BADGE */}

          <div className="bg-[#0e1514] border border-[#3c4948]/50 rounded-lg p-3">

            <div className="flex justify-between items-center">

              <span className="font-mono text-[8px] text-[#859491] tracking-widest uppercase">
                CURRENT ASSESSMENT
              </span>

              <span
                className={`font-mono text-[8px] font-bold px-2 py-1 border rounded ${riskLevel === 'HIGH RISK DETECTED'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#93000a]/20'
                  : riskLevel === 'ELEVATED RISK'
                    ? 'text-[#F6B352] border-[#F6B352]/30 bg-[#F6B352]/10'
                    : 'text-[#66FCF1] border-[#66FCF1]/30 bg-[#66FCF1]/10'
                  }`}
              >
                {riskLevel}
              </span>

            </div>

            <p className="font-sans text-[11px] text-[#bacac7] leading-relaxed mt-3">
              {currentCase?.assessment
                ?.summary ||
                'Initial assessment pending.'}
            </p>

          </div>

          {/* CASE STATS */}

          <div className="grid grid-cols-2 gap-2">

            <div className="bg-[#0e1514] border border-[#3c4948]/40 p-2.5 rounded">

              <div className="font-mono text-[8px] text-[#859491] uppercase">
                ENTITIES
              </div>

              <div className="font-mono text-lg font-bold text-white mt-1">
                {currentCase?.entitiesCount ||
                  0}
              </div>

            </div>

            <div className="bg-[#0e1514] border border-[#3c4948]/40 p-2.5 rounded">

              <div className="font-mono text-[8px] text-[#859491] uppercase">
                EVIDENCE
              </div>

              <div className="font-mono text-lg font-bold text-white mt-1">
                {currentCase?.evidenceCount ||
                  0}
              </div>

            </div>

            <div className="bg-[#0e1514] border border-[#3c4948]/40 p-2.5 rounded">

              <div className="font-mono text-[8px] text-[#859491] uppercase">
                LINKS
              </div>

              <div className="font-mono text-lg font-bold text-white mt-1">
                {currentCase?.linksCount ||
                  0}
              </div>

            </div>

            <div className="bg-[#0e1514] border border-[#3c4948]/40 p-2.5 rounded">

              <div className="font-mono text-[8px] text-[#859491] uppercase">
                PROGRESS
              </div>

              <div className="font-mono text-lg font-bold text-[#66FCF1] mt-1">
                {currentCase?.progress ??
                  0}%
              </div>

            </div>

          </div>

          {/* CONFIDENCE */}

          <div className="bg-[#0e1514] border border-[#3c4948]/40 p-3 rounded">

            <div className="flex items-center justify-between mb-2">

              <span className="font-mono text-[8px] text-[#859491] uppercase tracking-wider">
                INVESTIGATIVE CONFIDENCE
              </span>

              <span className="font-mono text-[10px] font-bold text-[#66FCF1]">
                {confidence
                  ? `${confidence}%`
                  : 'PENDING'}
              </span>

            </div>

            <div className="h-1.5 bg-[#2f3635] rounded overflow-hidden">

              <div
                className="h-full bg-[#66FCF1] rounded transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.max(
                      confidence,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* BUTTON */}

          <div className="mt-auto">

            <button
              disabled={
                !currentCase
              }
              onClick={() => {
                if (!currentCase) {
                  return;
                }

                onSelectCase(
                  currentCase
                );

                onNavigate(
                  'investigations'
                );
              }}
              className="w-full bg-[#2f3635] border border-[#3c4948]/60 text-white font-mono text-[10px] py-2.5 rounded-lg hover:bg-[#66FCF1] hover:text-[#00201e] hover:border-[#66FCF1] disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold tracking-widest flex items-center justify-center gap-2 shadow-sm"
            >
              OPEN INVESTIGATION

              <span className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>

            </button>

          </div>

        </div>
      </div>

      {/* =========================================================
          KEY ENTITIES
      ========================================================= */}

      <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg overflow-hidden shadow-sm">

        <div className="px-4 py-3 border-b border-[#3c4948]/40 bg-[#242b2a]/60 flex items-center justify-between">

          <div>

            <span className="font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase">
              KEY ENTITIES
            </span>

            <p className="font-mono text-[8px] text-[#596563] mt-1 uppercase">
              Highest-priority entities extracted from current case
            </p>

          </div>

          <button
            onClick={() =>
              onNavigate('entities')
            }
            className="font-mono text-[9px] text-[#7bd6d1] hover:text-[#66FCF1] transition-colors"
          >
            OPEN REGISTRY →
          </button>

        </div>

        {displayedEntities.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3">

            {displayedEntities.map(
              (
                entity: any,
                index: number
              ) => {

                const tone =
                  getEntityTone(
                    entity.type
                  );

                return (
                  <button
                    key={
                      entity.id ||
                      `key-${index}`
                    }
                    type="button"
                    onClick={() =>
                      onNavigate(
                        'network'
                      )
                    }
                    className="text-left bg-[#0e1514] border border-[#3c4948]/40 rounded-lg p-3 hover:border-[#66FCF1]/40 transition-colors group"
                  >

                    <div className="flex items-start gap-3">

                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center border flex-shrink-0"
                        style={{
                          borderColor:
                            `${tone}60`,
                          background:
                            `${tone}10`,
                        }}
                      >

                        <span
                          className="material-symbols-outlined text-[17px]"
                          style={{
                            color:
                              tone,
                          }}
                        >
                          {getEntityIcon(
                            entity.type
                          )}
                        </span>

                      </div>

                      <div className="min-w-0">

                        <div className="font-mono text-[10px] font-bold text-white truncate group-hover:text-[#66FCF1] transition-colors">
                          {entity.name ||
                            entity.id ||
                            'Unknown Entity'}
                        </div>

                        <div className="font-mono text-[8px] text-[#859491] uppercase mt-0.5">
                          {entity.type ||
                            'UNKNOWN'}
                        </div>

                        {entity.role && (
                          <div className="font-sans text-[9px] text-[#bacac7] mt-1 truncate">
                            {entity.role}
                          </div>
                        )}

                      </div>

                    </div>

                  </button>
                );
              }
            )}

          </div>

        ) : (

          <div className="py-10 text-center">

            <span className="material-symbols-outlined text-[#3c4948] text-[36px]">
              person_search
            </span>

            <p className="font-mono text-[9px] text-[#859491] uppercase tracking-widest mt-2">
              No key entities available
            </p>

            <p className="font-sans text-[10px] text-[#596563] mt-1">
              Analyze case files to populate the entity registry.
            </p>

          </div>

        )}

      </div>

      {/* =========================================================
          CASE REGISTER
      ========================================================= */}

      <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg flex flex-col shadow-sm overflow-hidden">

        <div className="px-4 py-3 border-b border-[#3c4948]/40 bg-[#242b2a]/60 flex items-center justify-between">

          <div>

            <span className="font-mono text-[10px] font-bold tracking-widest text-[#bacac7] uppercase">
              CASE REGISTER
            </span>

            <p className="font-mono text-[8px] text-[#596563] mt-1 uppercase">
              Active investigation files
            </p>

          </div>

          <span className="font-mono text-[9px] text-[#7bd6d1]">
            {cases.length} REGISTERED
          </span>

        </div>

        {cases.length === 0 ? (

          <div className="py-12 flex flex-col items-center justify-center text-center">

            <span className="material-symbols-outlined text-[#3c4948] text-[42px] mb-2">
              folder_off
            </span>

            <p className="font-mono text-[10px] text-[#859491] uppercase">
              No investigation files registered
            </p>

            <button
              onClick={
                onCreateCase
              }
              className="mt-4 px-4 py-2 bg-[#66FCF1] text-[#00201e] rounded-lg font-mono text-[9px] font-bold tracking-widest uppercase"
            >
              CREATE FIRST CASE
            </button>

          </div>

        ) : (

          <>
            {/* TABLE HEADER */}

            <div className="grid grid-cols-[1.1fr_2.2fr_0.9fr_0.9fr_1fr] px-4 py-2 bg-[#090f0f] font-mono text-[9px] font-bold tracking-wider text-[#859491] border-b border-[#3c4948]/40">

              <div>
                CASE ID
              </div>

              <div>
                CASE TITLE
              </div>

              <div>
                PRIORITY
              </div>

              <div>
                STATUS
              </div>

              <div className="text-right">
                UPDATED
              </div>

            </div>

            {/* CASE ROWS */}

            {recentCases.map(
              (caseItem) => (

                <button
                  key={
                    caseItem.id
                  }
                  type="button"
                  onClick={() => {
                    onSelectCase(
                      caseItem
                    );

                    onNavigate(
                      'investigations'
                    );
                  }}
                  className={`w-full grid grid-cols-[1.1fr_2.2fr_0.9fr_0.9fr_1fr] px-4 py-3.5 items-center text-left hover:bg-[#242b2a] border-b border-[#3c4948]/20 transition-colors group ${caseItem.id === currentCase?.id
                    ? 'bg-[#242b2a]/50'
                    : ''
                    }`}
                >

                  {/* CASE ID */}

                  <div className="font-mono text-[10px] text-white font-semibold flex items-center gap-1.5 min-w-0">

                    <span
                      className={`material-symbols-outlined text-[13px] transition-opacity ${caseItem.id === currentCase?.id
                        ? 'text-[#66FCF1] opacity-100'
                        : 'text-[#7bd6d1] opacity-0 group-hover:opacity-100'
                        }`}
                    >
                      {caseItem.id ===
                        currentCase?.id
                        ? 'radio_button_checked'
                        : 'arrow_right'}
                    </span>

                    <span className="truncate">
                      {caseItem.id}
                    </span>

                  </div>

                  {/* TITLE */}

                  <div className="font-sans text-xs text-[#dde4e2] font-medium pr-3 truncate">

                    {caseItem.title}

                  </div>

                  {/* PRIORITY */}

                  <div>

                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold tracking-wider border ${getPriorityClass(
                        caseItem.priority
                      )}`}
                    >
                      {caseItem.priority}
                    </span>

                  </div>

                  {/* STATUS */}

                  <div>

                    <span
                      className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded border ${caseItem.status === 'ACTIVE'
                        ? 'text-[#66FCF1] border-[#66FCF1]/30 bg-[#66FCF1]/10'
                        : 'text-[#F6B352] border-[#F6B352]/30 bg-[#F6B352]/10'
                        }`}
                    >
                      {String(
                        caseItem.status
                      ).replace(
                        '_',
                        ' '
                      )}
                    </span>

                  </div>

                  {/* UPDATED */}

                  <div className="font-mono text-[9px] text-[#bacac7] text-right truncate">

                    {caseItem.lastUpdated}

                  </div>

                </button>

              )
            )}

          </>
        )}

      </div>

      {/* =========================================================
          FOOTER DISCLAIMER
      ========================================================= */}

      <div className="flex items-center gap-2 px-1 pb-2">

        <span className="material-symbols-outlined text-[#F6B352] text-[14px]">
          shield
        </span>

        <p className="font-mono text-[8px] text-[#596563] uppercase tracking-wider">
          AI-generated findings are investigative leads and require human verification.
        </p>

      </div>

    </div>
  );
};

export default CommandCenterView;