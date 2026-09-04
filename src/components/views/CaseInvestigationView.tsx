import React, { useMemo, useState } from 'react';
import { InvestigationCase, ActiveView } from '../../types';

interface CaseInvestigationViewProps {
  currentCase: InvestigationCase;

  /*
    IMPORTANT:
    App.tsx se actual selectedCaseData yahan receive hoga.
    Isi ke andar backend/Gemini ka entities, evidence,
    relationships, timeline etc. data hai.
  */
  analysis?: AnalysisData;

  onNavigate: (view: ActiveView) => void;
  onOpenExportDossier: () => void;
  onOpenSubpoenaModal: () => void;
  onTriggerDeepScan: () => void;
  isScanning?: boolean;
}

interface AnalysisData {
  case?: {
    title?: string;
    riskLevel?: string;
    assessmentSummary?: string;
    confidence?: number;
    recommendedActions?: string[];
    summary?: string;
  };

  entities?: Array<{
    id?: string;
    type?: string;
    name?: string;
    identifier?: string;
    location?: string;
    role?: string;
    sourceReference?: string;
    confidence?: number;
    isTarget?: boolean;
  }>;

  relationships?: Array<{
    id?: string;
    source?: string;
    relationship?: string;
    target?: string;
    date?: string;
    time?: string;
    sourceReference?: string;
    confidence?: number;
    verificationStatus?: string;
  }>;

  events?: Array<{
    id?: string;
    date?: string;
    time?: string;
    entityId?: string;
    eventType?: string;
    description?: string;
    location?: string;
    evidenceReference?: string;
    confidence?: number;
  }>;

  evidence?: Array<{
    id?: string;
    type?: string;
    fileName?: string;
    dateCollected?: string;
    source?: string;
    relatedEntity?: string;
    description?: string;
    hashReference?: string;
    verificationStatus?: string;
  }>;

  alerts?: Array<{
    id?: string;
    severity?: string;
    title?: string;
    description?: string;
    relatedEntities?: string[];
    sourceReference?: string;
    confidence?: number;
  }>;

  keyEntities?: Array<{
    id?: string;
    name?: string;
    type?: string;
    role?: string;
    reason?: string;
  }>;

  timeline?: Array<{
    id?: string;
    date?: string;
    time?: string;
    title?: string;
    description?: string;
    entityId?: string;
    evidenceReference?: string;
  }>;

  intelligence?: {
    overview?: string;
    keyFindings?: string[];
    riskIndicators?: string[];
    unknowns?: string[];
    verificationSteps?: string[];
  };

  /*
    These are present in your App.tsx caseDataOverrides.
    They are included here so nothing breaks.
  */
  nodes?: any[];
  edges?: any[];
  anomalyAnalysis?: any;
  evidenceAnalysis?: any;
  networkAnalysis?: any;
  files?: any[];
  analysisId?: string | null;
  stats?: any;
}

type TabId =
  | 'OVERVIEW'
  | 'NETWORK'
  | 'TIMELINE'
  | 'INSIGHTS';

export const CaseInvestigationView: React.FC<
  CaseInvestigationViewProps
> = ({
  currentCase,
  analysis: incomingAnalysis,
  onNavigate,
  onOpenExportDossier,
  onOpenSubpoenaModal,
  onTriggerDeepScan,
  isScanning = false,
}) => {
    const [activeTab, setActiveTab] =
      useState<TabId>('OVERVIEW');

    /*
      =========================================================
      ACTUAL BACKEND DATA
      =========================================================
  
      IMPORTANT:
      Previously this component was doing:
  
        currentCase.analysis
  
      But App.tsx stores the actual data inside:
  
        caseDataOverrides[currentCase.id]
  
      Now App.tsx passes that object through `analysis`.
    */

    const analysis = useMemo(() => {
      return (incomingAnalysis || {}) as AnalysisData;
    }, [incomingAnalysis]);

    /*
      =========================================================
      DATA ARRAYS
      =========================================================
    */

    const entities =
      analysis.entities || [];

    const relationships =
      analysis.relationships || [];

    const events =
      analysis.events || [];

    const evidence =
      analysis.evidence || [];

    const alerts =
      analysis.alerts || [];

    const timeline =
      analysis.timeline || [];

    const intelligence =
      analysis.intelligence || {};

    /*
      =========================================================
      DEBUG
      =========================================================
  
      Browser console mein exact backend data dikhega.
    */

    console.log(
      'TRACEX Investigation View Data:',
      {
        caseId: currentCase.id,
        entities: entities,
        entitiesCount: entities.length,
        evidence: evidence,
        evidenceCount: evidence.length,
        relationships: relationships,
        relationshipsCount: relationships.length,
        events: events,
        eventsCount: events.length,
        alerts: alerts,
        alertsCount: alerts.length,
      }
    );

    /*
      =========================================================
      TABS
      =========================================================
    */

    const tabs: Array<{
      id: TabId;
      label: string;
      icon: string;
    }> = [
        {
          id: 'OVERVIEW',
          label: 'OVERVIEW',
          icon: 'dashboard',
        },
        {
          id: 'NETWORK',
          label: 'NETWORK',
          icon: 'hub',
        },
        {
          id: 'TIMELINE',
          label: 'TIMELINE',
          icon: 'timeline',
        },
        {
          id: 'INSIGHTS',
          label: 'AI INSIGHTS',
          icon: 'psychology',
        },
      ];

    /*
      =========================================================
      STATUS
      =========================================================
    */

    const statusColor =
      currentCase.status === 'ACTIVE'
        ? 'text-[#62f9ee] border-[#62f9ee]/30 bg-[#62f9ee]/10'
        : 'text-[#859491] border-[#3c4948]/50 bg-[#2f3635]/30';

    /*
      =========================================================
      ASSESSMENT
      =========================================================
    */

    const riskLevel =
      analysis.case?.riskLevel ||
      currentCase.assessment?.riskLevel ||
      'LOW RISK';

    const confidence =
      typeof analysis.case?.confidence ===
        'number'
        ? analysis.case.confidence
        : currentCase.assessment
          ?.confidenceInterval || 0;

    const assessmentSummary =
      analysis.case?.assessmentSummary ||
      currentCase.assessment?.summary ||
      'No analytical assessment available.';

    const recommendedActions =
      analysis.case?.recommendedActions ||
      currentCase.assessment
        ?.recommendedActions ||
      [];

    /*
      =========================================================
      ENTITY ICON
      =========================================================
    */

    const entityIcon = (
      type?: string
    ) => {
      const normalized =
        (type || '').toUpperCase();

      if (
        normalized.includes('PERSON')
      ) {
        return 'person';
      }

      if (
        normalized.includes(
          'ORGANIZATION'
        ) ||
        normalized === 'ORG'
      ) {
        return 'business';
      }

      if (
        normalized.includes('PHONE')
      ) {
        return 'phone';
      }

      if (
        normalized.includes('EMAIL')
      ) {
        return 'mail';
      }

      if (
        normalized.includes('ACCOUNT') ||
        normalized.includes('BANK') ||
        normalized.includes('FINANCIAL')
      ) {
        return 'account_balance';
      }

      if (
        normalized.includes('VEHICLE') ||
        normalized.includes('CAR')
      ) {
        return 'directions_car';
      }

      if (
        normalized.includes('LOCATION')
      ) {
        return 'location_on';
      }

      if (
        normalized.includes('DEVICE')
      ) {
        return 'devices';
      }

      return 'device_hub';
    };

    /*
      =========================================================
      SEVERITY
      =========================================================
    */

    const severityClass = (
      severity?: string
    ) => {
      switch (
      (severity || '').toUpperCase()
      ) {
        case 'CRITICAL':
          return 'text-[#ffb4ab] bg-[#93000a]/25 border-[#ffb4ab]/40';

        case 'HIGH':
          return 'text-[#ffdad6] bg-[#93000a]/20 border-[#ffb4ab]/30';

        case 'MEDIUM':
          return 'text-[#fce363] bg-[#736400]/20 border-[#fce363]/30';

        default:
          return 'text-[#a1fcf7] bg-[#007774]/20 border-[#a1fcf7]/30';
      }
    };

    const confidenceBar = Math.max(
      0,
      Math.min(
        100,
        Number(confidence) || 0
      )
    );

    /*
      =========================================================
      RENDER
      =========================================================
    */

    return (
      <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12">

        {/* =====================================================
          PAGE HEADER
      ===================================================== */}

        <div className="mb-5">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">

            <div>

              <div className="flex items-center gap-2.5 mb-1.5">

                <span className="font-mono text-xs font-bold text-[#7bd6d1]">
                  {currentCase.id}
                </span>

                <span
                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold flex items-center gap-1.5 border ${statusColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#62f9ee] animate-pulse" />

                  {currentCase.status}
                </span>

                <span
                  className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border ${currentCase.priority ===
                      'HIGH'
                      ? 'text-[#ffdad6] bg-[#93000a]/20 border-[#ffb4ab]/30'
                      : currentCase.priority ===
                        'MEDIUM'
                        ? 'text-[#fce363] bg-[#736400]/20 border-[#fce363]/30'
                        : 'text-[#a1fcf7] bg-[#007774]/20 border-[#a1fcf7]/30'
                    }`}
                >
                  {currentCase.priority}{' '}
                  PRIORITY
                </span>

              </div>

              <h2 className="font-sans text-2xl font-bold text-white tracking-tight">
                {currentCase.title}
              </h2>

              <p className="font-mono text-[10px] text-[#859491] mt-0.5">
                Lead:{' '}
                {currentCase.leadInvestigator}{' '}
                · Updated:{' '}
                {currentCase.lastUpdated}
              </p>

            </div>

            <div className="flex items-center gap-2.5">

              <button
                onClick={() =>
                  onNavigate('evidence')
                }
                className="px-3 py-2 border border-[#3c4948]/60 rounded-lg bg-[#1a2120] text-[#bacac7] font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-[#242b2a] hover:border-[#3c4948] hover:text-white transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px] text-[#7bd6d1]">
                  folder_open
                </span>

                EVIDENCE
              </button>

              <button
                onClick={
                  onOpenExportDossier
                }
                className="px-3 py-2 border border-[#3c4948]/60 rounded-lg bg-[#1a2120] text-[#bacac7] font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-[#242b2a] hover:border-[#66FCF1]/50 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px] text-[#66FCF1]">
                  download
                </span>

                EXPORT
              </button>

            </div>

          </div>

          {/* =====================================================
            LIVE STATS
        ===================================================== */}

          <div className="flex flex-wrap items-center gap-3 mb-4">

            {/* ENTITIES */}

            <button
              onClick={() =>
                setActiveTab('OVERVIEW')
              }
              className="flex items-center gap-2 bg-[#1a2120] border border-[#3c4948]/40 px-3 py-2 rounded-lg hover:border-[#66FCF1]/50 hover:bg-[#202726] transition-all"
            >

              <span className="material-symbols-outlined text-[#7bd6d1] text-[14px]">
                groups
              </span>

              <span className="font-mono text-sm font-bold text-white">
                {entities.length}
              </span>

              <span className="font-mono text-[9px] text-[#859491] uppercase">
                ENTITIES
              </span>

            </button>

            {/* EVIDENCE */}

            <button
              onClick={() =>
                onNavigate('evidence')
              }
              className="flex items-center gap-2 bg-[#1a2120] border border-[#3c4948]/40 px-3 py-2 rounded-lg hover:border-[#66FCF1]/50 hover:bg-[#202726] transition-all"
            >

              <span className="material-symbols-outlined text-[#7bd6d1] text-[14px]">
                folder_open
              </span>

              <span className="font-mono text-sm font-bold text-white">
                {evidence.length}
              </span>

              <span className="font-mono text-[9px] text-[#859491] uppercase">
                EVIDENCE
              </span>

            </button>

            {/* LINKS */}

            <button
              onClick={() =>
                setActiveTab('NETWORK')
              }
              className="flex items-center gap-2 bg-[#1a2120] border border-[#3c4948]/40 px-3 py-2 rounded-lg hover:border-[#66FCF1]/50 hover:bg-[#202726] transition-all"
            >

              <span className="material-symbols-outlined text-[#7bd6d1] text-[14px]">
                hub
              </span>

              <span className="font-mono text-sm font-bold text-white">
                {relationships.length}
              </span>

              <span className="font-mono text-[9px] text-[#859491] uppercase">
                LINKS
              </span>

            </button>

            {/* EVENTS */}

            <button
              onClick={() =>
                setActiveTab('TIMELINE')
              }
              className="flex items-center gap-2 bg-[#1a2120] border border-[#3c4948]/40 px-3 py-2 rounded-lg hover:border-[#66FCF1]/50 hover:bg-[#202726] transition-all"
            >

              <span className="material-symbols-outlined text-[#7bd6d1] text-[14px]">
                event
              </span>

              <span className="font-mono text-sm font-bold text-white">
                {events.length}
              </span>

              <span className="font-mono text-[9px] text-[#859491] uppercase">
                EVENTS
              </span>

            </button>

            {/* ALERTS */}

            <button
              onClick={() =>
                onNavigate('alerts')
              }
              className="flex items-center gap-2 bg-[#1a2120] border border-[#3c4948]/40 px-3 py-2 rounded-lg hover:border-[#66FCF1]/50 hover:bg-[#202726] transition-all"
            >

              <span className="material-symbols-outlined text-[#7bd6d1] text-[14px]">
                warning
              </span>

              <span className="font-mono text-sm font-bold text-white">
                {alerts.length}
              </span>

              <span className="font-mono text-[9px] text-[#859491] uppercase">
                ALERTS
              </span>

            </button>

          </div>

          {/* =====================================================
            TABS
        ===================================================== */}

          <div className="flex gap-0.5 border-b border-[#3c4948]/30">

            {tabs.map((tab) => {

              const isActive =
                activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] font-bold tracking-wider transition-all relative ${isActive
                      ? 'text-white'
                      : 'text-[#859491] hover:text-[#dde4e2] hover:bg-[#1a2120]/40'
                    }`}
                >

                  <span className="material-symbols-outlined text-[14px]">
                    {tab.icon}
                  </span>

                  {tab.label}

                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#66FCF1] rounded-t-full" />
                  )}

                </button>
              );
            })}

            <div className="ml-auto flex items-center gap-1 pb-1">

              <button
                onClick={() =>
                  onNavigate('entities')
                }
                className="px-2 py-1 font-mono text-[9px] text-[#859491] hover:text-[#66FCF1] flex items-center gap-1 transition-colors"
              >

                <span className="material-symbols-outlined text-[13px]">
                  groups
                </span>

                ALL ENTITIES

              </button>

            </div>

          </div>

        </div>

        {/* =====================================================
          OVERVIEW
      ===================================================== */}

        {activeTab === 'OVERVIEW' && (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* LEFT */}

            <div className="lg:col-span-8 flex flex-col gap-5">

              {/* CASE SUMMARY */}

              <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5 shadow-sm">

                <div className="flex flex-col md:flex-row gap-5 items-start">

                  <div className="flex-1">

                    <h3 className="font-sans text-sm font-bold text-white mb-2 flex items-center gap-2">

                      <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                        summarize
                      </span>

                      Case Summary

                    </h3>

                    <p className="font-sans text-sm text-[#bacac7] leading-relaxed">
                      {currentCase.summary}
                    </p>

                  </div>

                  {/* PROGRESS */}

                  <div className="flex flex-col items-center justify-center min-w-[110px] p-4 bg-[#0e1514] rounded-lg border border-[#3c4948]/30 self-center shadow-inner">

                    <div
                      className="relative w-18 h-18 mb-2"
                      style={{
                        width: '72px',
                        height: '72px',
                      }}
                    >

                      <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 36 36"
                      >

                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#2f3635"
                          strokeWidth="3"
                        />

                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#62f9ee"
                          strokeDasharray={`${currentCase.progress}, 100`}
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">

                        <span className="font-mono text-sm font-bold text-white">
                          {currentCase.progress}%
                        </span>

                      </div>

                    </div>

                    <span className="font-mono text-[8px] font-bold tracking-widest text-[#859491] uppercase">
                      PROGRESS
                    </span>

                  </div>

                </div>

              </div>

              {/* ALERTS */}

              {alerts.length > 0 && (

                <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">

                      <span className="material-symbols-outlined text-[#fce363] text-[16px]">
                        warning
                      </span>

                      Intelligence Alerts

                    </h3>

                    <span className="font-mono text-[9px] text-[#859491]">
                      {alerts.length}{' '}
                      DETECTED
                    </span>

                  </div>

                  <div className="flex flex-col gap-2.5">

                    {alerts
                      .slice(0, 5)
                      .map(
                        (
                          alert,
                          index
                        ) => (

                          <div
                            key={
                              alert.id ||
                              index
                            }
                            className={`border rounded-lg p-3 ${severityClass(
                              alert.severity
                            )}`}
                          >

                            <div className="flex justify-between gap-3">

                              <div>

                                <div className="flex items-center gap-2 mb-1">

                                  <span className="font-mono text-[9px] font-bold uppercase">
                                    {alert.severity ||
                                      'LOW'}
                                  </span>

                                  <span className="font-sans text-xs font-bold text-white">
                                    {alert.title ||
                                      'Analytical Alert'}
                                  </span>

                                </div>

                                <p className="font-sans text-[11px] text-[#bacac7] leading-relaxed">
                                  {
                                    alert.description
                                  }
                                </p>

                              </div>

                              <span className="font-mono text-[8px] text-[#859491] whitespace-nowrap">
                                {alert.confidence ??
                                  0}
                                % CONF.
                              </span>

                            </div>

                            {alert.sourceReference && (

                              <p className="font-mono text-[8px] text-[#859491] mt-2">
                                SOURCE:{' '}
                                {
                                  alert.sourceReference
                                }
                              </p>

                            )}

                          </div>

                        )
                      )}

                  </div>

                </div>

              )}

              {/* =================================================
                ALL 6 ENTITIES
            ================================================= */}

              <div>

                <div className="flex justify-between items-center mb-3">

                  <div>

                    <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">

                      <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                        groups
                      </span>

                      Extracted Entities

                    </h3>

                    <p className="font-mono text-[8px] text-[#859491] mt-1">
                      {entities.length}{' '}
                      ENTITIES EXTRACTED
                      FROM CASE DATA
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      onNavigate('entities')
                    }
                    className="font-mono text-[9px] font-bold text-[#7bd6d1] hover:text-[#66FCF1] flex items-center gap-1 uppercase tracking-wider transition-colors"
                  >

                    VIEW REGISTRY

                    <span className="material-symbols-outlined text-[13px]">
                      arrow_forward
                    </span>

                  </button>

                </div>

                {entities.length === 0 ? (

                  <div className="bg-[#1a2120] border border-dashed border-[#3c4948]/50 rounded-lg p-8 text-center">

                    <span className="material-symbols-outlined text-3xl text-[#596563]">
                      search_off
                    </span>

                    <p className="font-sans text-sm text-[#859491] mt-3">
                      No entities found
                    </p>

                    <p className="font-mono text-[9px] text-[#596563] mt-1">
                      Backend returned an empty
                      entity array.
                    </p>

                  </div>

                ) : (

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    {entities.map(
                      (
                        entity,
                        index
                      ) => (

                        <div
                          key={
                            entity.id ||
                            index
                          }
                          className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4 shadow-sm hover:bg-[#202726] hover:border-[#66FCF1]/30 transition-all"
                        >

                          <div className="flex items-center gap-2 mb-3">

                            <span className="material-symbols-outlined text-[#7bd6d1] text-[17px]">
                              {entityIcon(
                                entity.type
                              )}
                            </span>

                            <span className="font-mono text-[10px] text-[#66FCF1] bg-[#66FCF1]/10 px-2 py-0.5 rounded border border-[#66FCF1]/20 font-bold">
                              {entity.id ||
                                `ENTITY-${index + 1}`}
                            </span>

                            <span className="ml-auto font-mono text-[8px] text-[#66FCF1]">
                              {entity.confidence ??
                                0}
                              %
                            </span>

                          </div>

                          <h4 className="font-sans text-sm font-bold text-white mb-3">
                            {entity.name ||
                              entity.identifier ||
                              'Unnamed Entity'}
                          </h4>

                          <div className="grid grid-cols-2 gap-2">

                            {entity.type && (

                              <div>

                                <p className="font-mono text-[8px] text-[#859491] uppercase">
                                  TYPE
                                </p>

                                <p className="font-sans text-xs text-white">
                                  {entity.type}
                                </p>

                              </div>

                            )}

                            {entity.role && (

                              <div>

                                <p className="font-mono text-[8px] text-[#859491] uppercase">
                                  ROLE
                                </p>

                                <p className="font-sans text-xs text-white">
                                  {entity.role}
                                </p>

                              </div>

                            )}

                            {entity.location && (

                              <div>

                                <p className="font-mono text-[8px] text-[#859491] uppercase">
                                  LOCATION
                                </p>

                                <p className="font-sans text-xs text-white">
                                  {entity.location}
                                </p>

                              </div>

                            )}

                            {entity.identifier && (

                              <div>

                                <p className="font-mono text-[8px] text-[#859491] uppercase">
                                  IDENTIFIER
                                </p>

                                <p className="font-sans text-xs text-white break-all">
                                  {entity.identifier}
                                </p>

                              </div>

                            )}

                          </div>

                          {entity.sourceReference && (

                            <div className="mt-3 pt-2 border-t border-[#3c4948]/25">

                              <p className="font-mono text-[8px] text-[#596563]">
                                SOURCE:{' '}
                                {
                                  entity.sourceReference
                                }
                              </p>

                            </div>

                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* RECENT ACTIVITY */}

              <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5 shadow-sm">

                <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                  <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                    history
                  </span>

                  Recent Activity

                </h3>

                {currentCase
                  .recentActivity
                  .length === 0 ? (

                  <p className="font-mono text-[9px] text-[#596563]">
                    No recent activity
                    recorded.
                  </p>

                ) : (

                  <div className="flex flex-col divide-y divide-[#3c4948]/25">

                    {currentCase.recentActivity.map(
                      (act) => (

                        <div
                          key={act.id}
                          className="flex gap-3.5 py-3 hover:bg-[#242b2a]/30 px-2 -mx-2 rounded transition-colors"
                        >

                          <div className="mt-0.5 flex-shrink-0">

                            <span
                              className="material-symbols-outlined text-[15px] p-1.5 rounded flex items-center justify-center"
                              style={{
                                backgroundColor:
                                  act.iconBg,
                                color:
                                  act.iconColor,
                              }}
                            >
                              {act.icon}
                            </span>

                          </div>

                          <div className="flex-1 min-w-0">

                            <p className="font-sans text-xs text-[#dde4e2] font-medium leading-snug">
                              {act.text}
                            </p>

                            <p className="font-mono text-[9px] text-[#859491] mt-1">
                              {act.subtext}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

            {/* RIGHT */}

            <div className="lg:col-span-4 flex flex-col gap-5">

              {/* TECHNICAL ASSESSMENT */}

              <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5 shadow-sm">

                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#3c4948]/40">

                  <span className="material-symbols-outlined text-[#7bd6d1] text-[18px]">
                    analytics
                  </span>

                  <h3 className="font-sans text-sm font-bold text-white">
                    Technical Assessment
                  </h3>

                </div>

                <div className="flex items-center justify-between mb-3">

                  <span
                    className={`font-mono text-[9px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider border ${riskLevel ===
                        'HIGH RISK DETECTED'
                        ? 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30'
                        : riskLevel ===
                          'ELEVATED RISK'
                          ? 'bg-[#736400]/20 text-[#fce363] border-[#fce363]/30'
                          : 'bg-[#007774]/20 text-[#a1fcf7] border-[#a1fcf7]/30'
                      }`}
                  >
                    {riskLevel}
                  </span>

                  <span className="font-mono text-[9px] text-[#859491]">
                    AI ANALYSIS
                  </span>

                </div>

                <p className="font-sans text-xs text-[#bacac7] leading-relaxed mb-4">
                  {assessmentSummary}
                </p>

                <p className="font-mono text-[8px] text-[#859491] leading-tight mb-4 border-l-2 border-[#F6B352]/40 pl-2">
                  ⚠ AI-generated findings.
                  Human verification required
                  before operational action.
                </p>

                {/* CONFIDENCE */}

                <div className="bg-[#0e1514] p-3.5 rounded-lg border border-[#3c4948]/30 shadow-inner mb-4">

                  <div className="flex justify-between items-end mb-2">

                    <span className="font-mono text-[9px] font-bold text-[#859491] uppercase tracking-wider">
                      CONFIDENCE
                    </span>

                    <span className="font-mono text-sm font-extrabold text-[#62f9ee]">
                      {confidenceBar}%
                    </span>

                  </div>

                  <div className="w-full bg-[#2f3635] rounded-full h-1.5 overflow-hidden">

                    <div
                      className="bg-[#62f9ee] h-1.5 rounded-full transition-all duration-1000"
                      style={{
                        width: `${confidenceBar}%`,
                      }}
                    />

                  </div>

                </div>

                {/* RECOMMENDED ACTIONS */}

                <div className="border-t border-[#3c4948]/30 pt-4">

                  <h4 className="font-mono text-[9px] font-bold text-[#859491] uppercase tracking-wider mb-2.5">
                    RECOMMENDED ACTIONS
                  </h4>

                  <div className="flex flex-col gap-2">

                    {recommendedActions
                      .slice(0, 3)
                      .map(
                        (
                          action,
                          index
                        ) => (

                          <div
                            key={index}
                            className="px-3 py-2.5 bg-[#0e1514] border border-[#3c4948]/50 rounded-lg font-sans text-xs text-[#dde4e2]"
                          >

                            <span className="text-[#66FCF1] mr-2">
                              {index + 1}.
                            </span>

                            {action}

                          </div>

                        )
                      )}

                    <button
                      onClick={
                        onOpenSubpoenaModal
                      }
                      className="w-full text-left px-3 py-2.5 bg-[#0e1514] hover:bg-[#242b2a] border border-[#3c4948]/50 rounded-lg font-sans text-xs text-white transition-all flex justify-between items-center group hover:border-[#66FCF1]/40"
                    >

                      <span className="font-medium">
                        Generate Subpoena Draft
                      </span>

                      <span className="material-symbols-outlined text-[14px] text-[#859491] group-hover:text-[#66FCF1]">
                        chevron_right
                      </span>

                    </button>

                    <button
                      onClick={
                        onTriggerDeepScan
                      }
                      disabled={isScanning}
                      className="w-full text-left px-3 py-2.5 bg-[#0e1514] hover:bg-[#242b2a] border border-[#3c4948]/50 rounded-lg font-sans text-xs text-white transition-all flex justify-between items-center group hover:border-[#66FCF1]/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    >

                      <div className="flex items-center gap-2">

                        <span className="font-medium">
                          Initiate Deep Network
                          Scan
                        </span>

                        {isScanning && (

                          <span className="material-symbols-outlined text-[13px] text-[#66FCF1] animate-spin">
                            progress_activity
                          </span>

                        )}

                      </div>

                      <span className="material-symbols-outlined text-[14px] text-[#859491] group-hover:text-[#66FCF1]">
                        chevron_right
                      </span>

                    </button>

                    <button
                      onClick={() =>
                        setActiveTab(
                          'NETWORK'
                        )
                      }
                      className="w-full text-left px-3 py-2.5 bg-[#0e1514] hover:bg-[#242b2a] border border-[#3c4948]/50 rounded-lg font-sans text-xs text-white transition-all flex justify-between items-center group hover:border-[#66FCF1]/40"
                    >

                      <span className="font-medium">
                        View Network
                        Intelligence
                      </span>

                      <span className="material-symbols-outlined text-[14px] text-[#859491] group-hover:text-[#66FCF1]">
                        chevron_right
                      </span>

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
          NETWORK TAB
      ===================================================== */}

        {activeTab === 'NETWORK' && (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            <div className="lg:col-span-8 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <div className="flex justify-between items-center mb-5">

                <div>

                  <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">

                    <span className="material-symbols-outlined text-[#66FCF1]">
                      hub
                    </span>

                    Relationship Network

                  </h3>

                  <p className="font-mono text-[9px] text-[#859491] mt-1">
                    {relationships.length}{' '}
                    RELATIONSHIPS DETECTED
                  </p>

                </div>

                <button
                  onClick={
                    onTriggerDeepScan
                  }
                  disabled={isScanning}
                  className="px-3 py-2 rounded-lg border border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1] font-mono text-[9px] font-bold hover:bg-[#66FCF1]/20 disabled:opacity-50"
                >
                  {isScanning
                    ? 'SCANNING...'
                    : 'DEEP SCAN'}
                </button>

              </div>

              {relationships.length ===
                0 ? (

                <div className="py-16 text-center border border-dashed border-[#3c4948]/50 rounded-lg">

                  <span className="material-symbols-outlined text-4xl text-[#3c4948]">
                    hub
                  </span>

                  <p className="font-sans text-sm text-[#859491] mt-3">
                    No relationships detected
                    in supplied data.
                  </p>

                  <p className="font-mono text-[9px] text-[#596563] mt-1">
                    Upload additional
                    investigation documents
                    to expand the network.
                  </p>

                </div>

              ) : (

                <div className="flex flex-col gap-2">

                  {relationships.map(
                    (
                      relationship,
                      index
                    ) => (

                      <div
                        key={
                          relationship.id ||
                          index
                        }
                        className="bg-[#0e1514] border border-[#3c4948]/40 rounded-lg p-3.5"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex-1">

                            <span className="font-mono text-[10px] text-[#66FCF1]">
                              {relationship.source ||
                                'UNKNOWN'}
                            </span>

                          </div>

                          <div className="flex flex-col items-center min-w-[130px]">

                            <span className="font-mono text-[8px] text-[#859491] uppercase mb-1">
                              {relationship.relationship ||
                                'CONNECTED TO'}
                            </span>

                            <span className="material-symbols-outlined text-[#62f9ee] text-[16px]">
                              arrow_forward
                            </span>

                          </div>

                          <div className="flex-1 text-right">

                            <span className="font-mono text-[10px] text-white">
                              {relationship.target ||
                                'UNKNOWN'}
                            </span>

                          </div>

                        </div>

                        <div className="flex justify-between mt-3 pt-2 border-t border-[#3c4948]/20">

                          <span className="font-mono text-[8px] text-[#859491]">

                            {relationship.date ||
                              'DATE UNKNOWN'}

                            {relationship.time
                              ? ` · ${relationship.time}`
                              : ''}

                          </span>

                          <span className="font-mono text-[8px] text-[#859491]">

                            {relationship.verificationStatus ||
                              'UNVERIFIED'}

                            {' · '}

                            {relationship.confidence ??
                              0}
                            % CONF.

                          </span>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {/* NETWORK ENTITIES */}

            <div className="lg:col-span-4 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                <span className="material-symbols-outlined text-[#7bd6d1]">
                  account_tree
                </span>

                Network Entities

              </h3>

              <div className="flex flex-col gap-2">

                {entities.length === 0 ? (

                  <p className="font-mono text-[9px] text-[#859491]">
                    No entities available.
                  </p>

                ) : (

                  entities
                    .slice(0, 12)
                    .map(
                      (
                        entity,
                        index
                      ) => (

                        <div
                          key={
                            entity.id ||
                            index
                          }
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0e1514] border border-[#3c4948]/30"
                        >

                          <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                            {entityIcon(
                              entity.type
                            )}
                          </span>

                          <div className="flex-1 min-w-0">

                            <p className="font-sans text-xs text-white truncate">
                              {entity.name ||
                                entity.identifier ||
                                'Unnamed'}
                            </p>

                            <p className="font-mono text-[8px] text-[#859491]">
                              {entity.type ||
                                'OTHER'}
                            </p>

                          </div>

                          <span className="font-mono text-[8px] text-[#66FCF1]">
                            {entity.confidence ??
                              0}
                            %
                          </span>

                        </div>

                      )
                    )

                )}

              </div>

            </div>

          </div>

        )}

        {/* =====================================================
          TIMELINE
      ===================================================== */}

        {activeTab === 'TIMELINE' && (

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

            <div className="mb-5">

              <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">

                <span className="material-symbols-outlined text-[#66FCF1]">
                  timeline
                </span>

                Investigation Timeline

              </h3>

              <p className="font-mono text-[9px] text-[#859491] mt-1">
                {timeline.length ||
                  events.length}{' '}
                EVENTS
              </p>

            </div>

            {(timeline.length > 0
              ? timeline
              : events
            ).length === 0 ? (

              <div className="py-16 text-center border border-dashed border-[#3c4948]/50 rounded-lg">

                <span className="material-symbols-outlined text-4xl text-[#3c4948]">
                  timeline
                </span>

                <p className="font-sans text-sm text-[#859491] mt-3">
                  No timeline events
                  detected.
                </p>

              </div>

            ) : (

              <div className="relative">

                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#3c4948]/50" />

                <div className="flex flex-col gap-5">

                  {(timeline.length > 0
                    ? timeline
                    : events
                  ).map(
                    (
                      item: any,
                      index
                    ) => (

                      <div
                        key={
                          item.id ||
                          index
                        }
                        className="relative pl-8"
                      >

                        <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 border-[#62f9ee] bg-[#0e1514]" />

                        <div className="bg-[#0e1514] border border-[#3c4948]/40 rounded-lg p-4">

                          <div className="flex flex-wrap justify-between gap-2 mb-2">

                            <h4 className="font-sans text-xs font-bold text-white">
                              {item.title ||
                                item.eventType ||
                                'Investigation Event'}
                            </h4>

                            <span className="font-mono text-[9px] text-[#66FCF1]">

                              {item.date ||
                                'DATE UNKNOWN'}

                              {item.time
                                ? ` · ${item.time}`
                                : ''}

                            </span>

                          </div>

                          <p className="font-sans text-xs text-[#bacac7] leading-relaxed">
                            {item.description ||
                              'No description available.'}
                          </p>

                          {(item.entityId ||
                            item.evidenceReference) && (

                              <div className="flex flex-wrap gap-3 mt-3">

                                {item.entityId && (

                                  <span className="font-mono text-[8px] text-[#859491]">
                                    ENTITY:{' '}
                                    {
                                      item.entityId
                                    }
                                  </span>

                                )}

                                {item.evidenceReference && (

                                  <span className="font-mono text-[8px] text-[#859491]">
                                    SOURCE:{' '}
                                    {
                                      item.evidenceReference
                                    }
                                  </span>

                                )}

                              </div>

                            )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

          </div>

        )}

        {/* =====================================================
          AI INSIGHTS
      ===================================================== */}

        {activeTab === 'INSIGHTS' && (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <div className="lg:col-span-2 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <div className="flex items-center gap-2 mb-3">

                <span className="material-symbols-outlined text-[#66FCF1]">
                  psychology
                </span>

                <h3 className="font-sans text-sm font-bold text-white">
                  AI Intelligence Overview
                </h3>

              </div>

              <p className="font-sans text-sm text-[#bacac7] leading-relaxed">
                {intelligence.overview ||
                  assessmentSummary ||
                  'No AI intelligence overview is available.'}
              </p>

              <p className="font-mono text-[8px] text-[#859491] mt-4 border-l-2 border-[#F6B352]/40 pl-2">
                AI-generated analytical output.
                Findings are investigative
                leads and require human
                verification.
              </p>

            </div>

            {/* KEY FINDINGS */}

            <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                <span className="material-symbols-outlined text-[#62f9ee]">
                  lightbulb
                </span>

                Key Findings

              </h3>

              <div className="flex flex-col gap-2">

                {(intelligence.keyFindings ||
                  []).length === 0 ? (

                  <p className="font-mono text-[9px] text-[#859491]">
                    No key findings
                    generated.
                  </p>

                ) : (

                  intelligence.keyFindings!.map(
                    (
                      finding,
                      index
                    ) => (

                      <div
                        key={index}
                        className="flex gap-2 p-3 bg-[#0e1514] rounded-lg border border-[#3c4948]/30"
                      >

                        <span className="font-mono text-[9px] text-[#66FCF1]">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </span>

                        <p className="font-sans text-xs text-[#bacac7] leading-relaxed">
                          {finding}
                        </p>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* RISK INDICATORS */}

            <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                <span className="material-symbols-outlined text-[#fce363]">
                  warning
                </span>

                Risk Indicators

              </h3>

              <div className="flex flex-col gap-2">

                {(intelligence.riskIndicators ||
                  []).length === 0 ? (

                  <p className="font-mono text-[9px] text-[#859491]">
                    No risk indicators
                    identified.
                  </p>

                ) : (

                  intelligence.riskIndicators!.map(
                    (
                      indicator,
                      index
                    ) => (

                      <div
                        key={index}
                        className="p-3 bg-[#0e1514] rounded-lg border border-[#fce363]/20"
                      >

                        <p className="font-sans text-xs text-[#fce363]">
                          {indicator}
                        </p>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* UNKNOWNS */}

            <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                <span className="material-symbols-outlined text-[#859491]">
                  help
                </span>

                Unknowns / Limitations

              </h3>

              <div className="flex flex-col gap-2">

                {(intelligence.unknowns ||
                  []).map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                        className="p-3 bg-[#0e1514] rounded-lg border border-[#3c4948]/30"
                      >

                        <p className="font-sans text-xs text-[#bacac7]">
                          {item}
                        </p>

                      </div>

                    )
                  )}

                {(intelligence.unknowns ||
                  []).length === 0 && (

                    <p className="font-mono text-[9px] text-[#859491]">
                      No explicit unknowns
                      reported.
                    </p>

                  )}

              </div>

            </div>

            {/* VERIFICATION STEPS */}

            <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-5">

              <h3 className="font-sans text-sm font-bold text-white mb-4 flex items-center gap-2">

                <span className="material-symbols-outlined text-[#7bd6d1]">
                  fact_check
                </span>

                Verification Steps

              </h3>

              <div className="flex flex-col gap-2">

                {(intelligence.verificationSteps ||
                  []).map(
                    (
                      step,
                      index
                    ) => (

                      <div
                        key={index}
                        className="flex gap-2 p-3 bg-[#0e1514] rounded-lg border border-[#3c4948]/30"
                      >

                        <span className="font-mono text-[9px] text-[#66FCF1]">
                          {index + 1}.
                        </span>

                        <p className="font-sans text-xs text-[#bacac7]">
                          {step}
                        </p>

                      </div>

                    )
                  )}

                {(intelligence.verificationSteps ||
                  []).length === 0 && (

                    <p className="font-mono text-[9px] text-[#859491]">
                      No verification steps
                      generated.
                    </p>

                  )}

              </div>

            </div>

          </div>

        )}

      </div>
    );
  };

export default CaseInvestigationView;