import React, { useMemo } from 'react';

type IntelligenceSignal = {
  id?: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  icon?: string;
  sourceReference?: string;
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

  // Connect these from App.tsx in the next step.
  alerts?: any[];
  relationships?: any[];
  entities?: any[];
  evidence?: any[];
  timeline?: any[];
  nodes?: any[];
  edges?: any[];
  intelligence?: {
    overview?: string;
    keyFindings?: string[];
    riskIndicators?: string[];
    unknowns?: string[];
    verificationSteps?: string[];
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

const asNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
};

const severityRank = (severity: string) => {
  const value = String(severity || '').toUpperCase();
  if (value === 'CRITICAL') return 4;
  if (value === 'HIGH') return 3;
  if (value === 'MEDIUM' || value === 'ELEVATED') return 2;
  return 1;
};

const getSignalIcon = (title: string, icon?: string) => {
  if (icon) return icon;
  const value = title.toLowerCase();
  if (value.includes('network') || value.includes('bridge')) return 'hub';
  if (value.includes('communicat')) return 'forum';
  if (value.includes('financial') || value.includes('transaction')) return 'account_balance';
  if (value.includes('entity')) return 'person_search';
  if (value.includes('timeline') || value.includes('event')) return 'schedule';
  return 'psychology';
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
  // Keep this view compatible with the existing App.tsx data shape.
  // App.tsx will be wired to these props in the next step.
  const intelligenceData: any = intelligence ?? {};
  const networkData: any = networkAnalysis ?? {};
  const anomalyData: any = anomalyAnalysis ?? {};

  const highRiskCount = useMemo(
    () =>
      alerts.filter((alert) =>
        ['HIGH', 'CRITICAL'].includes(String(alert?.severity || '').toUpperCase())
      ).length,
    [alerts]
  );

  const intelligenceConfidence = useMemo(() => {
    const direct =
      intelligenceData.confidence ??
      intelligenceData.confidenceScore;

    if (direct !== undefined) return asNumber(direct);

    const alertConfidences = alerts
      .map((a) => Number(a?.confidence))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (alertConfidences.length) {
      return Math.round(
        alertConfidences.reduce((sum, n) => sum + n, 0) /
          alertConfidences.length
      );
    }

    return 0;
  }, [intelligence, alerts]);

  const intelligenceSignals: IntelligenceSignal[] = useMemo(() => {
    const fromAlerts = alerts.map((alert: any, index) => ({
      id: alert?.id || `alert-${index}`,
      title: String(alert?.title || 'INTELLIGENCE ALERT').toUpperCase(),
      description:
        alert?.description ||
        'An intelligence alert was generated from the supplied case data.',
      severity: String(alert?.severity || 'LOW').toUpperCase(),
      confidence: asNumber(alert?.confidence, intelligenceConfidence),
      icon: getSignalIcon(String(alert?.title || ''), alert?.icon),
      sourceReference: alert?.sourceReference,
    }));

    return fromAlerts.sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        b.confidence - a.confidence
    );
  }, [alerts, intelligenceConfidence]);

  const bridgeEntities = networkData.bridgeEntities || [];
  const keyFindings = intelligenceData.keyFindings || [];
  const riskIndicators = intelligenceData.riskIndicators || [];
  const anomalies = anomalyData.anomalies || [];
  const networkFindings = networkData.findings || [];

  const hasCase = Boolean(currentCase?.id && currentCase.id !== 'NO-CASE');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0d10] border border-[#3c4948]/30 rounded-lg shadow-2xl">
      <div className="flex-shrink-0 px-5 py-4 bg-[#0e1514] border-b border-[#3c4948]/30">
        <div className="flex items-center justify-between">
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
              onClick={() => onNavigate('network')}
              className="px-3 py-2 rounded border border-[#3c4948]/50 bg-[#1a2120] text-[#7bd6d1] hover:bg-[#242b2a] font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">hub</span>
              NETWORK GRAPH
            </button>

            <button
              onClick={() => onNavigate('alerts')}
              className="px-3 py-2 rounded border border-[#66FCF1]/40 text-[#66FCF1] hover:bg-[#66FCF1]/10 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">
                notifications_active
              </span>
              ALERTS
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-mono text-[8px] text-[#859491] uppercase tracking-widest mb-1">
                ACTIVE INVESTIGATION
              </div>
              <h2 className="font-sans text-base font-bold text-white">
                {hasCase ? currentCase.title : 'No Case Selected'}
              </h2>
            </div>

            <div className="text-right">
              <div className="font-mono text-[8px] text-[#859491]">CASE ID</div>
              <div className="font-mono text-[10px] font-bold text-[#66FCF1]">
                {hasCase ? currentCase.id : 'NO-CASE'}
              </div>
            </div>
          </div>

          <p className="font-sans text-[11px] text-[#bacac7] leading-relaxed">
            {hasCase
              ? currentCase.summary || 'No case summary is available.'
              : 'No investigation case is assigned to this account yet.'}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
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
              {relationships.length}
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
                className="h-full bg-[#66FCF1]"
                style={{ width: `${intelligenceConfidence}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
            <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              NETWORK INTELLIGENCE
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div>
                <div className="font-mono text-[8px] text-[#859491]">ENTITIES</div>
                <div className="font-mono text-lg font-bold text-white">{entities.length}</div>
              </div>
              <div>
                <div className="font-mono text-[8px] text-[#859491]">BRIDGES</div>
                <div className="font-mono text-lg font-bold text-[#66FCF1]">{bridgeEntities.length}</div>
              </div>
              <div>
                <div className="font-mono text-[8px] text-[#859491]">LINKS</div>
                <div className="font-mono text-lg font-bold text-white">{edges.length}</div>
              </div>
            </div>
            <p className="font-sans text-[10px] text-[#bacac7] leading-relaxed mt-4">
              {networkData.networkRisk ||
                (networkFindings.length
                  ? String(networkFindings[0]?.description || networkFindings[0])
                  : 'No network-risk assessment is available for this case.')}
            </p>
          </div>

          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
            <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              CASE ACTIVITY
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div>
                <div className="font-mono text-[8px] text-[#859491]">EVIDENCE</div>
                <div className="font-mono text-lg font-bold text-white">{evidence.length}</div>
              </div>
              <div>
                <div className="font-mono text-[8px] text-[#859491]">EVENTS</div>
                <div className="font-mono text-lg font-bold text-white">{timeline.length}</div>
              </div>
              <div>
                <div className="font-mono text-[8px] text-[#859491]">ANOMALIES</div>
                <div className="font-mono text-lg font-bold text-[#F6B352]">{anomalies.length}</div>
              </div>
            </div>
            <p className="font-sans text-[10px] text-[#bacac7] leading-relaxed mt-4">
              {intelligenceData.overview ||
                'No AI overview is available. Run case analysis/deep scan after supplying investigation data.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-mono text-[10px] font-bold text-[#7bd6d1] uppercase tracking-widest">
              DETECTED INTELLIGENCE SIGNALS
            </h3>
            <p className="font-mono text-[8px] text-[#859491] mt-1 uppercase">
              GENERATED FROM CURRENT CASE DATA
            </p>
          </div>

          <button
            onClick={() => onNavigate('alerts')}
            className="font-mono text-[8px] font-bold text-[#66FCF1] hover:text-white uppercase tracking-wider"
          >
            VIEW ALL ALERTS →
          </button>
        </div>

        {intelligenceSignals.length === 0 ? (
          <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-6 text-center">
            <span className="material-symbols-outlined text-[#859491] text-2xl">
              query_stats
            </span>
            <div className="font-mono text-[9px] font-bold text-white uppercase mt-2">
              NO INTELLIGENCE SIGNALS
            </div>
            <p className="font-sans text-[10px] text-[#859491] mt-1">
              This case currently has no generated alerts/signals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {intelligenceSignals.map((signal) => (
              <div
                key={signal.id || signal.title}
                className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4 hover:border-[#66FCF1]/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#090f0f] border border-[#3c4948]/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#66FCF1] text-[18px]">
                        {getSignalIcon(signal.title, signal.icon)}
                      </span>
                    </div>

                    <div>
                      <div className="font-mono text-[9px] font-bold text-white tracking-wider">
                        {signal.title}
                      </div>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 rounded font-mono text-[7px] font-bold ${
                          signal.severity === 'CRITICAL' || signal.severity === 'HIGH'
                            ? 'bg-[#93000a]/30 text-[#ffb4ab] border border-[#ffb4ab]/20'
                            : signal.severity === 'MEDIUM' || signal.severity === 'ELEVATED'
                            ? 'bg-[#F6B352]/10 text-[#F6B352] border border-[#F6B352]/20'
                            : 'bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/20'
                        }`}
                      >
                        {signal.severity}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
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
                  <div className="mt-2 font-mono text-[7px] text-[#859491] uppercase">
                    SOURCE: {signal.sourceReference}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#3c4948]/30 flex justify-between items-center">
                  <span className="font-mono text-[7px] text-[#859491] uppercase">
                    CASE INTELLIGENCE
                  </span>
                  <button
                    onClick={() => onNavigate('alerts')}
                    className="font-mono text-[8px] text-[#7bd6d1] hover:text-white"
                  >
                    INVESTIGATE →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(keyFindings.length > 0 || riskIndicators.length > 0) && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            {keyFindings.length > 0 && (
              <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
                <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest mb-3">
                  KEY FINDINGS
                </div>
                <div className="space-y-2">
                  {keyFindings.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex gap-2 text-[10px] text-[#bacac7]">
                      <span className="text-[#66FCF1]">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {riskIndicators.length > 0 && (
              <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">
                <div className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-widest mb-3">
                  RISK INDICATORS
                </div>
                <div className="space-y-2">
                  {riskIndicators.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex gap-2 text-[10px] text-[#bacac7]">
                      <span className="text-[#F6B352]">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 bg-[#1a2120] border border-[#F6B352]/20 rounded-lg p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-[#F6B352] text-[14px]">
            warning
          </span>
          <p className="font-mono text-[8px] text-[#859491] leading-relaxed uppercase">
            AI-generated intelligence represents investigative leads only.
            Findings require human verification before operational deployment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceView;
