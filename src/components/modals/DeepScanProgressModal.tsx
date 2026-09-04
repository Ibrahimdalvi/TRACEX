import React from 'react';

interface DeepScanResult {
  scanId?: string;
  caseId?: string;

  summary?: string;
  riskLevel?: string;
  confidence?: number;

  nodesAnalyzed?: number;
  edgesScanned?: number;
  anomaliesDetected?: number;

  networkBridges?: string[];
  newBridgeCandidates?: string[];

  relationshipPatterns?: string[];
  timelinePatterns?: string[];
  evidenceCorrelations?: string[];

  anomalies?: string[];
  riskIndicators?: string[];
  investigativeGaps?: string[];

  priorityFindings?: string[];
  verificationSteps?: string[];

  error?: string;
}

interface DeepScanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanData: DeepScanResult | null;
  isScanning: boolean;
}

export const DeepScanProgressModal: React.FC<
  DeepScanProgressModalProps
> = ({
  isOpen,
  onClose,
  scanData,
  isScanning,
}) => {
  if (!isOpen) return null;

  const bridges =
    scanData?.networkBridges?.length
      ? scanData.networkBridges
      : scanData?.newBridgeCandidates?.length
      ? scanData.newBridgeCandidates
      : [];

  const relationshipPatterns =
    scanData?.relationshipPatterns || [];

  const timelinePatterns =
    scanData?.timelinePatterns || [];

  const evidenceCorrelations =
    scanData?.evidenceCorrelations || [];

  const anomalies =
    scanData?.anomalies || [];

  const riskIndicators =
    scanData?.riskIndicators || [];

  const investigativeGaps =
    scanData?.investigativeGaps || [];

  const priorityFindings =
    scanData?.priorityFindings || [];

  const verificationSteps =
    scanData?.verificationSteps || [];

  const confidence = Math.max(
    0,
    Math.min(100, Number(scanData?.confidence) || 0)
  );

  const riskLevel =
    scanData?.riskLevel ||
    (scanData?.error ? 'SCAN ERROR' : 'ANALYSIS COMPLETE');

  const riskClass =
    riskLevel.toUpperCase().includes('CRITICAL')
      ? 'text-[#ffb4ab] bg-[#93000a]/25 border-[#ffb4ab]/40'
      : riskLevel.toUpperCase().includes('HIGH')
      ? 'text-[#ffdad6] bg-[#93000a]/20 border-[#ffb4ab]/30'
      : riskLevel.toUpperCase().includes('MEDIUM') ||
        riskLevel.toUpperCase().includes('ELEVATED')
      ? 'text-[#fce363] bg-[#736400]/20 border-[#fce363]/30'
      : 'text-[#a1fcf7] bg-[#007774]/20 border-[#a1fcf7]/30';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161b21] border border-[#3c4948]/70 w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="p-4 bg-[#1a2027] border-b border-[#3c4948]/40 flex justify-between items-center shrink-0">

          <div className="flex items-center gap-2">

            <span
              className={`material-symbols-outlined text-[#66FCF1] text-[20px] ${
                isScanning ? 'animate-pulse' : ''
              }`}
            >
              radar
            </span>

            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                DEEP TOPOLOGICAL NETWORK SCAN
              </h3>

              <p className="font-mono text-[8px] text-[#859491] mt-0.5">
                TRACEX INTELLIGENCE ENGINE
              </p>
            </div>

          </div>

          {!isScanning && (
            <button
              onClick={onClose}
              className="text-[#859491] hover:text-white transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          )}

        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto">

          {/* =========================
              SCANNING
          ========================== */}

          {isScanning ? (

            <div className="py-12 flex flex-col items-center justify-center text-center">

              <div className="relative w-28 h-28 mb-6">

                <div className="absolute inset-0 rounded-full border-2 border-[#66FCF1]/10" />

                <div className="absolute inset-1 rounded-full border border-[#66FCF1]/20 animate-ping" />

                <div className="absolute inset-3 rounded-full border-2 border-[#66FCF1]/30 animate-spin" />

                <div className="absolute inset-6 rounded-full border border-[#66FCF1] animate-spin-slow" />

                <div className="absolute inset-0 flex items-center justify-center">

                  <span className="material-symbols-outlined text-[#66FCF1] text-[38px]">
                    hub
                  </span>

                </div>

              </div>

              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                TRAVERSING NETWORK GRAPH...
              </h4>

              <p className="font-mono text-[10px] text-[#7bd6d1] mt-2 max-w-md leading-relaxed">
                Correlating entities, relationships, evidence,
                timeline events and historical investigative data.
              </p>

              <div className="mt-6 w-full max-w-md">

                <div className="flex justify-between mb-2">

                  <span className="font-mono text-[8px] text-[#859491] uppercase">
                    ANALYSIS STATUS
                  </span>

                  <span className="font-mono text-[8px] text-[#66FCF1]">
                    PROCESSING
                  </span>

                </div>

                <div className="h-1.5 bg-[#2f3635] rounded-full overflow-hidden">

                  <div className="h-full w-1/2 bg-[#62f9ee] rounded-full animate-pulse" />

                </div>

              </div>

              <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-6">

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded">
                  <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                    account_tree
                  </span>
                  <p className="font-mono text-[8px] text-[#859491] mt-1">
                    GRAPH
                  </p>
                </div>

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded">
                  <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                    link
                  </span>
                  <p className="font-mono text-[8px] text-[#859491] mt-1">
                    RELATIONS
                  </p>
                </div>

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded">
                  <span className="material-symbols-outlined text-[#7bd6d1] text-[16px]">
                    psychology
                  </span>
                  <p className="font-mono text-[8px] text-[#859491] mt-1">
                    INTELLIGENCE
                  </p>
                </div>

              </div>

            </div>

          ) : (

            /* =========================
               RESULT
            ========================== */

            <div className="space-y-5">

              {/* RESULT HEADER */}

              <div
                className={`p-4 bg-[#0e1514] border rounded-lg border-l-4 ${
                  scanData?.error
                    ? 'border-[#ffb4ab]/40 border-l-[#ffb4ab]'
                    : 'border-[#66FCF1]/30 border-l-[#66FCF1]'
                }`}
              >

                <div className="flex justify-between items-start gap-4">

                  <div>

                    <div className="flex items-center gap-2 mb-2">

                      <span
                        className={`font-mono text-[9px] font-bold uppercase px-2 py-1 rounded border ${riskClass}`}
                      >
                        {riskLevel}
                      </span>

                      {!scanData?.error && (
                        <span className="font-mono text-[8px] text-[#62f9ee]">
                          SCAN COMPLETE
                        </span>
                      )}

                    </div>

                    <p className="font-sans text-sm text-[#dde4e2] leading-relaxed">
                      {scanData?.summary ||
                        'No summary was returned by the deep scan engine.'}
                    </p>

                  </div>

                  <div className="text-right shrink-0">

                    <p className="font-mono text-[8px] text-[#859491]">
                      SCAN ID
                    </p>

                    <p className="font-mono text-[9px] text-[#66FCF1] mt-1">
                      {scanData?.scanId || 'N/A'}
                    </p>

                  </div>

                </div>

                {scanData?.error && (
                  <div className="mt-3 p-2.5 bg-[#93000a]/15 border border-[#ffb4ab]/20 rounded">
                    <p className="font-mono text-[8px] text-[#ffb4ab]">
                      ERROR: {scanData.error}
                    </p>
                  </div>
                )}

              </div>

              {/* STATS */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded-lg">

                  <p className="font-mono text-[8px] text-[#859491] uppercase">
                    NODES ANALYZED
                  </p>

                  <p className="font-mono text-lg font-bold text-white mt-1">
                    {scanData?.nodesAnalyzed ?? 0}
                  </p>

                </div>

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded-lg">

                  <p className="font-mono text-[8px] text-[#859491] uppercase">
                    EDGES SCANNED
                  </p>

                  <p className="font-mono text-lg font-bold text-white mt-1">
                    {scanData?.edgesScanned ?? 0}
                  </p>

                </div>

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded-lg">

                  <p className="font-mono text-[8px] text-[#859491] uppercase">
                    ANOMALIES
                  </p>

                  <p className="font-mono text-lg font-bold text-[#ffb4ab] mt-1">
                    {scanData?.anomaliesDetected ??
                      anomalies.length}
                  </p>

                </div>

                <div className="p-3 bg-[#0e1514] border border-[#3c4948]/40 rounded-lg">

                  <p className="font-mono text-[8px] text-[#859491] uppercase">
                    CONFIDENCE
                  </p>

                  <p className="font-mono text-lg font-bold text-[#62f9ee] mt-1">
                    {confidence}%
                  </p>

                </div>

              </div>

              {/* CONFIDENCE BAR */}

              <div className="p-4 bg-[#0e1514] border border-[#3c4948]/40 rounded-lg">

                <div className="flex justify-between mb-2">

                  <span className="font-mono text-[9px] font-bold text-[#859491] uppercase">
                    ANALYTICAL CONFIDENCE
                  </span>

                  <span className="font-mono text-[10px] font-bold text-[#62f9ee]">
                    {confidence}%
                  </span>

                </div>

                <div className="h-2 bg-[#2f3635] rounded-full overflow-hidden">

                  <div
                    className="h-full bg-[#62f9ee] rounded-full transition-all duration-1000"
                    style={{
                      width: `${confidence}%`,
                    }}
                  />

                </div>

              </div>

              {/* BRIDGES */}

              {bridges.length > 0 && (
                <div className="bg-[#1a2120] border border-[#3c4948]/40 rounded-lg p-4">

                  <h4 className="font-mono text-[9px] font-bold text-[#7bd6d1] uppercase tracking-wider mb-3 flex items-center gap-2">

                    <span className="material-symbols-outlined text-[15px]">
                      account_tree
                    </span>

                    PRIMARY BRIDGE CONDUITS IDENTIFIED

                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {bridges.map((bridge, index) => (

                      <span
                        key={index}
                        className="px-2.5 py-1.5 rounded bg-[#0e1514] border border-[#66FCF1]/40 text-[#66FCF1] font-mono text-[9px] font-bold"
                      >
                        {bridge}
                      </span>

                    ))}

                  </div>

                </div>
              )}

              {/* PRIORITY FINDINGS */}

              {priorityFindings.length > 0 && (
                <ResultSection
                  title="PRIORITY FINDINGS"
                  icon="priority_high"
                  items={priorityFindings}
                  type="critical"
                />
              )}

              {/* RELATIONSHIPS */}

              {relationshipPatterns.length > 0 && (
                <ResultSection
                  title="RELATIONSHIP PATTERNS"
                  icon="hub"
                  items={relationshipPatterns}
                />
              )}

              {/* TIMELINE */}

              {timelinePatterns.length > 0 && (
                <ResultSection
                  title="TIMELINE PATTERNS"
                  icon="timeline"
                  items={timelinePatterns}
                />
              )}

              {/* EVIDENCE */}

              {evidenceCorrelations.length > 0 && (
                <ResultSection
                  title="EVIDENCE CORRELATIONS"
                  icon="fact_check"
                  items={evidenceCorrelations}
                />
              )}

              {/* ANOMALIES */}

              {anomalies.length > 0 && (
                <ResultSection
                  title="ANOMALIES DETECTED"
                  icon="warning"
                  items={anomalies}
                  type="warning"
                />
              )}

              {/* RISK */}

              {riskIndicators.length > 0 && (
                <ResultSection
                  title="RISK INDICATORS"
                  icon="gpp_maybe"
                  items={riskIndicators}
                  type="warning"
                />
              )}

              {/* INVESTIGATIVE GAPS */}

              {investigativeGaps.length > 0 && (
                <ResultSection
                  title="INVESTIGATIVE GAPS"
                  icon="search_off"
                  items={investigativeGaps}
                />
              )}

              {/* VERIFICATION */}

              {verificationSteps.length > 0 && (
                <ResultSection
                  title="VERIFICATION STEPS"
                  icon="verified"
                  items={verificationSteps}
                />
              )}

              {/* EMPTY RESULT */}

              {!scanData?.error &&
                bridges.length === 0 &&
                relationshipPatterns.length === 0 &&
                timelinePatterns.length === 0 &&
                evidenceCorrelations.length === 0 &&
                anomalies.length === 0 &&
                riskIndicators.length === 0 &&
                priorityFindings.length === 0 &&
                investigativeGaps.length === 0 &&
                verificationSteps.length === 0 && (

                  <div className="py-10 text-center bg-[#0e1514] border border-dashed border-[#3c4948]/50 rounded-lg">

                    <span className="material-symbols-outlined text-3xl text-[#596563]">
                      search_off
                    </span>

                    <p className="font-sans text-sm text-[#859491] mt-2">
                      Scan completed without additional findings.
                    </p>

                  </div>
                )}

            </div>
          )}

        </div>

        {/* FOOTER */}

        {!isScanning && (
          <div className="p-4 bg-[#1a2027] border-t border-[#3c4948]/40 flex justify-between items-center shrink-0">

            <span className="font-mono text-[8px] text-[#859491]">
              AI-GENERATED INTELLIGENCE · HUMAN VERIFICATION REQUIRED
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#66FCF1] text-[#00201e] font-mono text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all shadow-md"
            >
              ACKNOWLEDGE & INJECT FINDINGS
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

/* ============================================================
   RESULT SECTION
============================================================ */

interface ResultSectionProps {
  title: string;
  icon: string;
  items: string[];
  type?: 'normal' | 'warning' | 'critical';
}

const ResultSection: React.FC<ResultSectionProps> = ({
  title,
  icon,
  items,
  type = 'normal',
}) => {

  const borderClass =
    type === 'critical'
      ? 'border-[#ffb4ab]/30'
      : type === 'warning'
      ? 'border-[#fce363]/20'
      : 'border-[#3c4948]/40';

  const textClass =
    type === 'critical'
      ? 'text-[#ffb4ab]'
      : type === 'warning'
      ? 'text-[#fce363]'
      : 'text-[#bacac7]';

  return (
    <div
      className={`bg-[#1a2120] border ${borderClass} rounded-lg p-4`}
    >

      <h4
        className={`font-mono text-[9px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${textClass}`}
      >

        <span className="material-symbols-outlined text-[15px]">
          {icon}
        </span>

        {title}

        <span className="ml-auto text-[#596563]">
          {items.length}
        </span>

      </h4>

      <div className="flex flex-col gap-2">

        {items.map((item, index) => (

          <div
            key={index}
            className="flex gap-3 p-3 bg-[#0e1514] border border-[#3c4948]/30 rounded-lg"
          >

            <span className="font-mono text-[8px] text-[#66FCF1] shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>

            <p className="font-sans text-[11px] text-[#bacac7] leading-relaxed">
              {item}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
};