import React, { useMemo } from 'react';

type IntelligenceSignal = {
  id: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  icon: string;
  sourceReference?: string;
  sourceType?: string;
};

interface IntelligenceViewProps {
  currentCase: {
    id: string;
    title: string;
    priority: string;
    status: string;
    summary: string;
  };
  onNavigate: (view: any) => void;

  alerts?: any[];
  relationships?: any[];
  entities?: any[];
  evidence?: any[];
  timeline?: any[];
  nodes?: any[];
  edges?: any[];

  intelligence?: {
    overview?: string;
    keyFindings?: any[];
    riskIndicators?: any[];
    unknowns?: any[];
    verificationSteps?: any[];
    confidence?: number;
    confidenceScore?: number;
  };

  networkAnalysis?: {
    bridgeEntities?: any[];
    clusters?: any[];
    relationshipPatterns?: any[];
    isolatedEntities?: any[];
    networkRisk?: string;
    findings?: any[];
  };

  anomalyAnalysis?: {
    anomalies?: any[];
    unusualPatterns?: any[];
    highRiskPatterns?: any[];
  };
}

const clampPercent = (value: any, fallback = 0): number => {
  let n = Number(value);

  // Some AI responses return confidence as 0.0 - 1.0.
  if (Number.isFinite(n) && n > 0 && n <= 1) n *= 100;

  return Number.isFinite(n)
    ? Math.round(Math.max(0, Math.min(100, n)))
    : fallback;
};

const textValue = (value: any, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;

  if (typeof value === 'object') {
    return String(
      value.description ??
      value.text ??
      value.title ??
      value.name ??
      value.label ??
      value.value ??
      ''
    ).trim() || fallback;
  }

  return String(value).trim() || fallback;
};

const arrayValue = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

const severityRank = (severity: any): number => {
  const value = textValue(severity, 'LOW').toUpperCase();

  if (value === 'CRITICAL') return 4;
  if (value === 'HIGH') return 3;
  if (value === 'MEDIUM' || value === 'ELEVATED') return 2;
  return 1;
};

const normalizeSeverity = (severity: any): string => {
  const value = textValue(severity, 'LOW').toUpperCase();

  if (value.includes('CRITICAL')) return 'CRITICAL';
  if (value.includes('HIGH')) return 'HIGH';
  if (value.includes('MEDIUM') || value.includes('ELEVATED')) return 'MEDIUM';
  return 'LOW';
};

const getSignalIcon = (title: string, icon?: string): string => {
  if (icon) return icon;

  const value = title.toLowerCase();

  if (
    value.includes('network') ||
    value.includes('bridge') ||
    value.includes('cluster') ||
    value.includes('relationship')
  ) {
    return 'hub';
  }

  if (
    value.includes('communicat') ||
    value.includes('message') ||
    value.includes('call')
  ) {
    return 'forum';
  }

  if (
    value.includes('financial') ||
    value.includes('transaction') ||
    value.includes('payment') ||
    value.includes('bank')
  ) {
    return 'account_balance';
  }

  if (
    value.includes('entity') ||
    value.includes('person') ||
    value.includes('subject')
  ) {
    return 'person_search';
  }

  if (
    value.includes('timeline') ||
    value.includes('event') ||
    value.includes('activity')
  ) {
    return 'schedule';
  }

  if (
    value.includes('anomal') ||
    value.includes('unusual') ||
    value.includes('pattern')
  ) {
    return 'warning';
  }

  if (
    value.includes('risk') ||
    value.includes('threat') ||
    value.includes('suspicious')
  ) {
    return 'security';
  }

  return 'psychology';
};

const getCaseId = (item: any): string => {
  return textValue(
    item?.caseId ??
    item?.case_id ??
    item?.caseID ??
    item?.investigationId ??
    item?.investigation_id,
    ''
  );
};

/**
 * Keep data case-safe without breaking legacy/demo records that do not
 * contain a case identifier.
 */
const caseScoped = (items: any[], caseId: string): any[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const withCaseId = items.filter((item) => Boolean(getCaseId(item)));

  // Legacy/static data has no case id. Keep it instead of hiding it.
  if (withCaseId.length === 0) return items.filter(Boolean);

  const matched = items.filter((item) => {
    const itemCaseId = getCaseId(item);
    return !itemCaseId || itemCaseId === caseId;
  });

  // If the supplied dataset uses case IDs but none match, don't display
  // another case's intelligence.
  return matched;
};

const normalizeSignal = (
  raw: any,
  index: number,
  fallbackSeverity = 'LOW',
  fallbackConfidence = 0
): IntelligenceSignal | null => {
  if (raw === null || raw === undefined) return null;

  const title = textValue(
    raw?.title ??
    raw?.name ??
    raw?.label ??
    raw?.signal ??
    raw?.type ??
    raw?.category,
    `INTELLIGENCE SIGNAL ${index + 1}`
  );

  const description = textValue(
    raw?.description ??
    raw?.summary ??
    raw?.finding ??
    raw?.details ??
    raw?.text ??
    raw?.reason,
    'An intelligence signal was generated from the supplied case data.'
  );

  const severity = normalizeSeverity(
    raw?.severity ?? raw?.riskLevel ?? raw?.risk ?? fallbackSeverity
  );

  const confidence = clampPercent(
    raw?.confidence ??
    raw?.confidenceScore ??
    raw?.score ??
    raw?.probability,
    fallbackConfidence
  );

  return {
    id: textValue(raw?.id ?? raw?.signalId, `signal-${index}`),
    title: title.toUpperCase(),
    description,
    severity,
    confidence,
    icon: getSignalIcon(title, textValue(raw?.icon, '')),
    sourceReference: textValue(
      raw?.sourceReference ??
      raw?.source_reference ??
      raw?.source ??
      raw?.evidenceId ??
      raw?.evidence_id,
      ''
    ),
    sourceType: textValue(raw?.sourceType ?? raw?.source_type, ''),
  };
};

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  currentCase,
  onNavigate,
  alerts = [],
  relationships = [],
  entities = [],
  evidence = [],
  timeline = [],
  nodes = [],
  edges = [],
  intelligence = {},
  networkAnalysis = {},
  anomalyAnalysis = {},
}) => {
  const currentCaseId = currentCase?.id || '';

  /*
   * -------------------------------------------------------------
   * CASE-SAFE DATA
   * -------------------------------------------------------------
   *
   * App.tsx normally sends data already belonging to the selected case.
   * These helpers additionally protect this screen if mixed records are
   * returned by Supabase/backend.
   */
  const caseAlerts = useMemo(
    () => caseScoped(alerts, currentCaseId),
    [alerts, currentCaseId]
  );

  const caseRelationships = useMemo(
    () => caseScoped(relationships, currentCaseId),
    [relationships, currentCaseId]
  );

  const caseEntities = useMemo(
    () => caseScoped(entities, currentCaseId),
    [entities, currentCaseId]
  );

  const caseEvidence = useMemo(
    () => caseScoped(evidence, currentCaseId),
    [evidence, currentCaseId]
  );

  const caseTimeline = useMemo(
    () => caseScoped(timeline, currentCaseId),
    [timeline, currentCaseId]
  );

  const caseNodes = useMemo(
    () => caseScoped(nodes, currentCaseId),
    [nodes, currentCaseId]
  );

  const caseEdges = useMemo(
    () => caseScoped(edges, currentCaseId),
    [edges, currentCaseId]
  );

  const intelligenceData: any = intelligence ?? {};
  const networkData: any = networkAnalysis ?? {};
  const anomalyData: any = anomalyAnalysis ?? {};

  /*
   * -------------------------------------------------------------
   * METRICS
   * -------------------------------------------------------------
   */
  const highRiskCount = useMemo(
    () =>
      caseAlerts.filter((alert) =>
        ['HIGH', 'CRITICAL'].includes(
          normalizeSeverity(alert?.severity)
        )
      ).length,
    [caseAlerts]
  );

  const intelligenceConfidence = useMemo(() => {
    const direct =
      intelligenceData.confidence ??
      intelligenceData.confidenceScore;

    if (direct !== undefined && direct !== null) {
      return clampPercent(direct);
    }

    const alertConfidences = caseAlerts
      .map((alert) =>
        clampPercent(
          alert?.confidence ??
          alert?.confidenceScore ??
          alert?.score,
          -1
        )
      )
      .filter((n) => n >= 0);

    if (alertConfidences.length > 0) {
      return Math.round(
        alertConfidences.reduce((sum, n) => sum + n, 0) /
        alertConfidences.length
      );
    }

    return 0;
  }, [intelligenceData, caseAlerts]);

  /*
   * -------------------------------------------------------------
   * INTELLIGENCE SIGNALS
   * -------------------------------------------------------------
   *
   * Alerts are the primary signal source. If there are no alerts,
   * AI findings/anomalies are converted into useful intelligence
   * cards so the Intelligence page does not look empty after analysis.
   */
  const intelligenceSignals = useMemo<IntelligenceSignal[]>(() => {
    const signals: IntelligenceSignal[] = [];

    caseAlerts.forEach((alert, index) => {
      const signal = normalizeSignal(
        alert,
        index,
        'LOW',
        intelligenceConfidence
      );

      if (signal) signals.push(signal);
    });

    if (signals.length === 0) {
      const findings = arrayValue(networkData.findings);

      findings.forEach((finding, index) => {
        const signal = normalizeSignal(
          finding,
          index,
          'MEDIUM',
          intelligenceConfidence
        );

        if (signal) {
          signals.push({
            ...signal,
            title: signal.title || 'NETWORK FINDING',
            icon: 'hub',
          });
        }
      });

      arrayValue(anomalyData.anomalies).forEach((anomaly, index) => {
        const signal = normalizeSignal(
          anomaly,
          index + signals.length,
          'HIGH',
          intelligenceConfidence
        );

        if (signal) {
          signals.push({
            ...signal,
            icon: signal.icon || 'warning',
          });
        }
      });

      arrayValue(anomalyData.highRiskPatterns).forEach((pattern, index) => {
        const signal = normalizeSignal(
          pattern,
          index + signals.length,
          'HIGH',
          intelligenceConfidence
        );

        if (signal) {
          signals.push({
            ...signal,
            icon: 'security',
          });
        }
      });
    }

    return signals
      .sort(
        (a, b) =>
          severityRank(b.severity) - severityRank(a.severity) ||
          b.confidence - a.confidence
      )
      .slice(0, 12);
  }, [
    caseAlerts,
    networkData,
    anomalyData,
    intelligenceConfidence,
  ]);

  const bridgeEntities = arrayValue(networkData.bridgeEntities);
  const clusters = arrayValue(networkData.clusters);
  const keyFindings = arrayValue(intelligenceData.keyFindings);
  const riskIndicators = arrayValue(intelligenceData.riskIndicators);
  const unknowns = arrayValue(intelligenceData.unknowns);
  const verificationSteps = arrayValue(
    intelligenceData.verificationSteps
  );
  const anomalies = [
    ...arrayValue(anomalyData.anomalies),
    ...arrayValue(anomalyData.unusualPatterns),
    ...arrayValue(anomalyData.highRiskPatterns),
  ];

  const networkFindings = arrayValue(networkData.findings);

  const networkRisk = textValue(
    networkData.networkRisk ??
    networkData.risk ??
    networkData.assessment,
    ''
  );

  const overview = textValue(
    intelligenceData.overview ??
    intelligenceData.summary ??
    intelligenceData.assessment,
    ''
  );

  const hasCase = Boolean(
    currentCase?.id && currentCase.id !== 'NO-CASE'
  );

  const renderListItem = (item: any, index: number) => {
    const value = textValue(item, '');
    if (!value) return null;

    return (
      <div
        key={`${value}-${index}`}
        className="flex items-start gap-2 text-[10px] text-[#bacac7] leading-relaxed"
      >
        <span className="text-[#66FCF1] mt-0.5">•</span>
        <span>{value}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0a0d10] border border-[#3c4948]/30 rounded-lg shadow-2xl">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="flex-shrink-0 px-5 py-4 bg-[#0e1514] border-b border-[#3c4948]/30">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#66FCF1] text-[20px]">
                psychology
              </span>

              <h1 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
                INTELLIGENCE ENGINE
              </h1>

              <span className="px-2 py-0.5 rounded border border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1] font-mono text-[8px] font-bold">
                ONLINE
              </span>
            </div>

            <p className="font-mono text-[9px] text-[#859491] uppercase tracking-wider">
              CASE-DATA DRIVEN AI INTELLIGENCE & THREAT CORRELATION
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('network')}
              className="px-3 py-2 rounded border border-[#3c4948]/50 bg-[#1a2120] text-[#7bd6d1] hover:bg-[#242b2a] font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                hub
              </span>
              NETWORK GRAPH
            </button>

            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="px-3 py-2 rounded border border-[#66FCF1]/40 text-[#66FCF1] hover:bg-[#66FCF1]/10 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                notifications_active
              </span>
              ALERTS
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          SCROLL AREA
      ========================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
        {/* CASE */}
        <div className="mb-5 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-[8px] text-[#859491] uppercase tracking-widest mb-1">
                ACTIVE INVESTIGATION
              </div>

              <h2 className="font-sans text-base font-bold text-white truncate">
                {hasCase ? currentCase.title : 'No Case Selected'}
              </h2>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="font-mono text-[8px] text-[#859491]">
                CASE ID
              </div>

              <div className="font-mono text-[10px] font-bold text-[#66FCF1]">
                {hasCase ? currentCase.id : 'NO-CASE'}
              </div>
            </div>
          </div>

          <p className="font-sans text-[11px] text-[#bacac7] leading-relaxed mt-3">
            {hasCase
              ? currentCase.summary || 'No case summary is available.'
              : 'No investigation case is assigned to this account yet.'}
          </p>

          {hasCase && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="font-mono text-[7px] text-[#66FCF1] border border-[#66FCF1]/20 bg-[#66FCF1]/5 rounded px-2 py-1">
                STATUS: {textValue(currentCase.status, 'UNKNOWN').toUpperCase()}
              </span>

              <span className="font-mono text-[7px] text-[#F6B352] border border-[#F6B352]/20 bg-[#F6B352]/5 rounded px-2 py-1">
                PRIORITY: {textValue(currentCase.priority, 'NORMAL').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* =======================================================
            METRICS
        ======================================================= */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-3">
            <div className="font-mono text-[8px] text-[#859491] uppercase">
              SIGNALS
            </div>
            <div className="font-mono text-xl font-bold text-white mt-1">
              {intelligenceSignals.length}
            </div>
            <div className="font-mono text-[8px] text-[#7bd6d1] mt-1">
              DETECTED
            </div>
          </div>

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-3">
            <div className="font-mono text-[8px] text-[#859491] uppercase">
              HIGH RISK
            </div>
            <div className="font-mono text-xl font-bold text-[#ffb4ab] mt-1">
              {highRiskCount}
            </div>
            <div className="font-mono text-[8px] text-[#ffb4ab] mt-1">
              REQUIRE REVIEW
            </div>
          </div>

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-3">
            <div className="font-mono text-[8px] text-[#859491] uppercase">
              CORRELATIONS
            </div>
            <div className="font-mono text-xl font-bold text-[#66FCF1] mt-1">
              {caseRelationships.length}
            </div>
            <div className="font-mono text-[8px] text-[#7bd6d1] mt-1">
              MATCHED
            </div>
          </div>

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-3">
            <div className="font-mono text-[8px] text-[#859491] uppercase">
              ENGINE CONFIDENCE
            </div>

            <div className="font-mono text-xl font-bold text-[#66FCF1] mt-1">
              {intelligenceConfidence}%
            </div>

            <div className="h-1 bg-[#2f3635] rounded mt-2 overflow-hidden">
              <div
                className="h-full bg-[#66FCF1] transition-all duration-500"
                style={{ width: `${intelligenceConfidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            NETWORK + CASE ACTIVITY
        ======================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-5">
          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
            <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              NETWORK INTELLIGENCE
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  ENTITIES
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {caseEntities.length || caseNodes.length}
                </div>
              </div>

              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  BRIDGES
                </div>
                <div className="font-mono text-lg font-bold text-[#66FCF1]">
                  {bridgeEntities.length}
                </div>
              </div>

              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  LINKS
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {caseEdges.length || caseRelationships.length}
                </div>
              </div>
            </div>

            <p className="font-sans text-[10px] text-[#bacac7] leading-relaxed mt-4">
              {networkRisk ||
                (networkFindings.length
                  ? textValue(
                    networkFindings[0],
                    'Network findings detected from current case data.'
                  )
                  : 'No network-risk assessment is available for this case.')}
            </p>

            {clusters.length > 0 && (
              <div className="mt-3 font-mono text-[7px] text-[#859491] uppercase">
                {clusters.length} NETWORK CLUSTER
                {clusters.length === 1 ? '' : 'S'} IDENTIFIED
              </div>
            )}
          </div>

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
            <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              CASE ACTIVITY
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  EVIDENCE
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {caseEvidence.length}
                </div>
              </div>

              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  EVENTS
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {caseTimeline.length}
                </div>
              </div>

              <div>
                <div className="font-mono text-[8px] text-[#859491]">
                  ANOMALIES
                </div>
                <div className="font-mono text-lg font-bold text-[#F6B352]">
                  {anomalies.length}
                </div>
              </div>
            </div>

            <p className="font-sans text-[10px] text-[#bacac7] leading-relaxed mt-4">
              {overview ||
                'No AI overview is available. Run case analysis/deep scan after supplying investigation data.'}
            </p>
          </div>
        </div>

        {/* =======================================================
            SIGNALS
        ======================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="font-mono text-[10px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              DETECTED INTELLIGENCE SIGNALS
            </h3>

            <p className="font-mono text-[8px] text-[#859491] mt-1 uppercase">
              GENERATED FROM CURRENT CASE DATA
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="font-mono text-[8px] font-bold text-[#66FCF1] hover:text-white uppercase tracking-wider self-start sm:self-auto"
          >
            VIEW ALL ALERTS →
          </button>
        </div>

        {intelligenceSignals.length === 0 ? (
          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-8 text-center">
            <span className="material-symbols-outlined text-[#859491] text-3xl">
              query_stats
            </span>

            <div className="font-mono text-[9px] font-bold text-white uppercase mt-2">
              NO INTELLIGENCE SIGNALS
            </div>

            <p className="font-sans text-[10px] text-[#859491] mt-2 max-w-lg mx-auto leading-relaxed">
              This case currently has no generated alerts or AI findings.
              Supply case evidence and run analysis/deep scan to generate
              intelligence signals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {intelligenceSignals.map((signal) => {
              const isHighRisk =
                signal.severity === 'CRITICAL' ||
                signal.severity === 'HIGH';

              return (
                <div
                  key={signal.id}
                  className={`bg-[#1a2120] border rounded-lg p-4 transition-colors hover:bg-[#202826] ${isHighRisk
                      ? 'border-[#ffb4ab]/25'
                      : 'border-[#3c4948]/40 hover:border-[#66FCF1]/30'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-[#090f0f] border border-[#3c4948]/50 flex items-center justify-center">
                        <span
                          className={`material-symbols-outlined text-[18px] ${isHighRisk
                              ? 'text-[#ffb4ab]'
                              : 'text-[#66FCF1]'
                            }`}
                        >
                          {signal.icon}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-mono text-[9px] font-bold text-white tracking-wider break-words">
                          {signal.title}
                        </div>

                        <span
                          className={`inline-block mt-1 px-1.5 py-0.5 rounded font-mono text-[7px] font-bold border ${signal.severity === 'CRITICAL' ||
                              signal.severity === 'HIGH'
                              ? 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ffb4ab]/20'
                              : signal.severity === 'MEDIUM'
                                ? 'bg-[#F6B352]/10 text-[#F6B352] border-[#F6B352]/20'
                                : 'bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/20'
                            }`}
                        >
                          {signal.severity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-[8px] text-[#859491]">
                        CONFIDENCE
                      </div>

                      <div className="font-mono text-sm font-bold text-[#66FCF1]">
                        {signal.confidence}%
                      </div>
                    </div>
                  </div>

                  <p className="font-sans text-[10px] text-[#bacac7] leading-relaxed mt-4">
                    {signal.description}
                  </p>

                  {signal.sourceReference && (
                    <div className="mt-2 font-mono text-[7px] text-[#859491] uppercase break-all">
                      SOURCE: {signal.sourceReference}
                    </div>
                  )}

                  {signal.sourceType && (
                    <div className="mt-1 font-mono text-[7px] text-[#859491] uppercase">
                      SOURCE TYPE: {signal.sourceType}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#3c4948]/30 flex justify-between items-center">
                    <span className="font-mono text-[7px] text-[#859491] uppercase">
                      CASE INTELLIGENCE
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigate('alerts')}
                      className="font-mono text-[8px] text-[#7bd6d1] hover:text-white"
                    >
                      INVESTIGATE →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =======================================================
            FINDINGS / RISKS / UNKNOWNS
        ======================================================= */}
        {(keyFindings.length > 0 ||
          riskIndicators.length > 0 ||
          unknowns.length > 0 ||
          verificationSteps.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-5">
              {keyFindings.length > 0 && (
                <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
                  <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest mb-3">
                    KEY FINDINGS
                  </div>

                  <div className="space-y-2">
                    {keyFindings.slice(0, 8).map(renderListItem)}
                  </div>
                </div>
              )}

              {riskIndicators.length > 0 && (
                <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
                  <div className="font-mono text-[9px] font-bold text-[#F6B352] uppercase tracking-widest mb-3">
                    RISK INDICATORS
                  </div>

                  <div className="space-y-2">
                    {riskIndicators.slice(0, 8).map((item, index) => {
                      const value = textValue(item, '');
                      if (!value) return null;

                      return (
                        <div
                          key={`${value}-${index}`}
                          className="flex items-start gap-2 text-[10px] text-[#bacac7] leading-relaxed"
                        >
                          <span className="text-[#F6B352] mt-0.5">•</span>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {unknowns.length > 0 && (
                <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
                  <div className="font-mono text-[9px] font-bold text-[#859491] uppercase tracking-widest mb-3">
                    UNKNOWNS / LIMITATIONS
                  </div>

                  <div className="space-y-2">
                    {unknowns.slice(0, 8).map((item, index) => {
                      const value = textValue(item, '');
                      if (!value) return null;

                      return (
                        <div
                          key={`${value}-${index}`}
                          className="flex items-start gap-2 text-[10px] text-[#bacac7] leading-relaxed"
                        >
                          <span className="text-[#859491] mt-0.5">•</span>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {verificationSteps.length > 0 && (
                <div className="bg-[#1a2120] border border-[#66FCF1]/15 rounded-lg p-4">
                  <div className="font-mono text-[9px] font-bold text-[#66FCF1] uppercase tracking-widest mb-3">
                    VERIFICATION STEPS
                  </div>

                  <div className="space-y-2">
                    {verificationSteps.slice(0, 8).map((item, index) => {
                      const value = textValue(item, '');
                      if (!value) return null;

                      return (
                        <div
                          key={`${value}-${index}`}
                          className="flex items-start gap-2 text-[10px] text-[#bacac7] leading-relaxed"
                        >
                          <span className="font-mono text-[#66FCF1] shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* =======================================================
            AI DISCLAIMER
        ======================================================= */}
        <div className="mt-5 bg-[#1a2120] border border-[#F6B352]/20 rounded-lg p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-[#F6B352] text-[14px]">
            warning
          </span>

          <p className="font-mono text-[8px] text-[#859491] leading-relaxed uppercase">
            AI-generated intelligence represents investigative leads only.
            Findings require human verification before operational deployment.
            This system does not determine guilt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceView;
