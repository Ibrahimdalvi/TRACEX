import React, { useMemo } from 'react';
import { InvestigationCase, TimelineEntry } from '../../types';

interface TimelineViewProps {
  timeline: TimelineEntry[];
  currentCase: InvestigationCase;
}

type TimelineLike = TimelineEntry & {
  caseId?: string;
  case_id?: string;
  caseID?: string;
  timestamp?: string | number;
  date?: string | number;
  time?: string | number;
  relativeTime?: string;
  severity?: string;
  type?: string;
  title?: string;
  description?: string;
  entitiesInvolved?: string[];
  entities_involved?: string[];
  entities?: string[];
};

const getSeverityClasses = (severity?: string) => {
  switch (String(severity || '').trim().toLowerCase()) {
    case 'critical':
      return {
        dot: 'bg-[#ff6b6b]',
        border: 'border-[#ff6b6b]/45',
        text: 'text-[#ffb4ab]',
        badge: 'bg-[#93000a]/25 text-[#ffb4ab] border-[#ff6b6b]/25',
      };

    case 'high':
      return {
        dot: 'bg-[#ffb4ab]',
        border: 'border-[#ffb4ab]/35',
        text: 'text-[#ffb4ab]',
        badge: 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/20',
      };

    case 'medium':
      return {
        dot: 'bg-[#dec74a]',
        border: 'border-[#dec74a]/35',
        text: 'text-[#dec74a]',
        badge: 'bg-[#dec74a]/10 text-[#dec74a] border-[#dec74a]/20',
      };

    case 'low':
      return {
        dot: 'bg-[#66FCF1]',
        border: 'border-[#66FCF1]/25',
        text: 'text-[#66FCF1]',
        badge: 'bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/20',
      };

    default:
      return {
        dot: 'bg-[#66FCF1]',
        border: 'border-[#66FCF1]/25',
        text: 'text-[#66FCF1]',
        badge: 'bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/20',
      };
  }
};

const getEventIcon = (type?: string) => {
  const value = String(type || '').toUpperCase();

  if (
    value.includes('TRANSACTION') ||
    value.includes('PAYMENT') ||
    value.includes('FINANCIAL') ||
    value.includes('BANK')
  ) {
    return 'account_balance';
  }

  if (
    value.includes('COMMUNICATION') ||
    value.includes('CALL') ||
    value.includes('MESSAGE') ||
    value.includes('EMAIL')
  ) {
    return 'forum';
  }

  if (
    value.includes('SYSTEM') ||
    value.includes('LOGIN') ||
    value.includes('ACCESS') ||
    value.includes('DEVICE')
  ) {
    return 'memory';
  }

  if (
    value.includes('EVIDENCE') ||
    value.includes('DOCUMENT') ||
    value.includes('FILE')
  ) {
    return 'description';
  }

  if (
    value.includes('LOCATION') ||
    value.includes('TRAVEL') ||
    value.includes('GEO')
  ) {
    return 'location_on';
  }

  if (
    value.includes('ALERT') ||
    value.includes('THREAT') ||
    value.includes('ANOMALY')
  ) {
    return 'warning';
  }

  if (
    value.includes('ENTITY') ||
    value.includes('PERSON') ||
    value.includes('ORGANIZATION')
  ) {
    return 'person';
  }

  return 'timeline';
};

const getEventTimestamp = (event: TimelineLike) => {
  return event.timestamp ?? event.date ?? event.time ?? '';
};

const getSortTime = (event: TimelineLike) => {
  const raw = getEventTimestamp(event);

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  const parsed = new Date(String(raw)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCaseId = (event: TimelineLike) => {
  return String(
    event.caseId ??
      event.case_id ??
      event.caseID ??
      ''
  ).trim();
};

const getEntities = (event: TimelineLike): string[] => {
  const raw =
    event.entitiesInvolved ??
    event.entities_involved ??
    event.entities ??
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const formatTimestamp = (value: string | number) => {
  if (value === '' || value === null || value === undefined) {
    return 'TIME UNKNOWN';
  }

  const raw = String(value).trim();

  // Keep already-readable timestamps unchanged.
  if (
    raw &&
    Number.isNaN(new Date(raw).getTime())
  ) {
    return raw;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw || 'TIME UNKNOWN';
  }

  return parsed.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  currentCase,
}) => {
  /*
   * ---------------------------------------------------------
   * CASE-SAFE TIMELINE NORMALIZATION
   * ---------------------------------------------------------
   *
   * The backend/database can return slightly different field names
   * depending on the source:
   *   caseId / case_id
   *   timestamp / date / time
   *   entitiesInvolved / entities_involved / entities
   *
   * Normalize those fields here so the UI does not silently break.
   */

  const caseTimeline = useMemo(() => {
    const currentCaseId = String(currentCase?.id || '').trim();

    const source = Array.isArray(timeline)
      ? (timeline as TimelineLike[])
      : [];

    return source
      .filter(Boolean)
      .filter((event) => {
        const eventCaseId = getCaseId(event);

        /*
         * If both sides contain a case ID, enforce the match.
         * If old/demo data has no case ID, keep the event so it
         * remains visible instead of incorrectly producing an empty UI.
         */
        if (eventCaseId && currentCaseId) {
          return eventCaseId === currentCaseId;
        }

        return true;
      })
      .sort((a, b) => getSortTime(b) - getSortTime(a));
  }, [timeline, currentCase?.id]);

  const latestEvent = caseTimeline[0];

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto bg-[#080d0d] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1500px] pb-10">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg border border-[#66FCF1]/30 bg-[#66FCF1]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#66FCF1] text-[22px]">
                    timeline
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-white text-xl font-bold tracking-wide">
                    INVESTIGATION TIMELINE
                  </h1>

                  <p className="font-mono text-[10px] text-[#859491] mt-1 tracking-wider">
                    CHRONOLOGICAL INTELLIGENCE EVENT RECORD
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVE CASE */}
            <div className="shrink-0 border border-[#3c4948]/50 bg-[#111817] rounded-lg px-4 py-3 min-w-[180px]">
              <p className="font-mono text-[8px] text-[#859491] tracking-wider">
                ACTIVE CASE
              </p>

              <p className="font-mono text-[12px] text-[#66FCF1] font-bold mt-1 truncate">
                {currentCase?.id || 'UNKNOWN CASE'}
              </p>

              {currentCase?.title && (
                <p className="text-[9px] text-[#bacac7] mt-1 truncate max-w-[220px]">
                  {currentCase.title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">

          <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">
            <p className="font-mono text-[8px] text-[#859491] tracking-widest">
              TOTAL EVENTS
            </p>

            <p className="text-2xl font-bold text-white mt-2">
              {caseTimeline.length}
            </p>

            <p className="font-mono text-[7px] text-[#5f716e] mt-1">
              CASE-SCOPED RECORDS
            </p>
          </div>

          <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">
            <p className="font-mono text-[8px] text-[#859491] tracking-widest">
              CASE STATUS
            </p>

            <p className="text-sm font-bold text-[#66FCF1] mt-3 uppercase">
              {currentCase?.status || 'UNKNOWN'}
            </p>
          </div>

          <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">
            <p className="font-mono text-[8px] text-[#859491] tracking-widest">
              PRIORITY
            </p>

            <p className="text-sm font-bold text-[#dec74a] mt-3 uppercase">
              {currentCase?.priority || 'NORMAL'}
            </p>
          </div>
        </div>

        {/* =====================================================
            TIMELINE PANEL
        ===================================================== */}
        <div className="border border-[#3c4948]/50 bg-[#0e1514] rounded-lg overflow-hidden">

          {/* TIMELINE HEADER */}
          <div className="px-4 sm:px-5 py-4 border-b border-[#3c4948]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <h2 className="text-white text-sm font-bold tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#66FCF1] text-[18px]">
                  account_tree
                </span>
                CASE EVENTS
              </h2>

              <p className="font-mono text-[8px] text-[#859491] mt-1">
                {caseTimeline.length} CHRONOLOGICAL RECORD
                {caseTimeline.length === 1 ? '' : 'S'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {latestEvent && (
                <div className="hidden sm:block font-mono text-[8px] text-[#859491] border border-[#3c4948]/50 rounded px-3 py-2">
                  LATEST EVENT&nbsp;&nbsp;
                  <span className="text-[#66FCF1]">
                    {formatTimestamp(getEventTimestamp(latestEvent))}
                  </span>
                </div>
              )}

              <div className="font-mono text-[8px] text-[#66FCF1] border border-[#66FCF1]/20 bg-[#66FCF1]/5 rounded px-3 py-2">
                LIVE CASE DATA
              </div>
            </div>
          </div>

          {/* ===================================================
              EMPTY STATE
          =================================================== */}
          {caseTimeline.length === 0 && (
            <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-6">

              <div className="w-16 h-16 rounded-full border border-[#3c4948] bg-[#111817] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#3c4948] text-3xl">
                  timeline
                </span>
              </div>

              <h3 className="text-white text-sm font-semibold">
                NO TIMELINE EVENTS
              </h3>

              <p className="text-[#859491] text-xs mt-2 max-w-md leading-5">
                No chronological events are currently available for{' '}
                <span className="text-[#66FCF1] font-mono">
                  {currentCase?.id || 'this case'}
                </span>.
              </p>

              <div className="mt-5 px-4 py-3 rounded border border-[#3c4948]/40 bg-[#111817] max-w-lg">
                <p className="font-mono text-[8px] text-[#859491] leading-4">
                  TIMELINE DATA IS GENERATED FROM THE ACTIVE CASE ANALYSIS.
                  <br />
                  VERIFY THAT THE CASE ANALYSIS CONTAINS TIMELINE EVENTS.
                </p>
              </div>
            </div>
          )}

          {/* ===================================================
              EVENTS
          =================================================== */}
          {caseTimeline.length > 0 && (
            <div className="relative px-4 sm:px-6 py-7">

              {/* VERTICAL LINE */}
              <div
                className="
                  absolute
                  left-[34px] sm:left-[43px]
                  top-8
                  bottom-8
                  w-px
                  bg-[#3c4948]/70
                "
                aria-hidden="true"
              />

              <div className="space-y-6 sm:space-y-7">
                {caseTimeline.map((rawEvent, index) => {
                  const event = rawEvent as TimelineLike;
                  const severity = getSeverityClasses(event.severity);
                  const icon = getEventIcon(event.type);
                  const timestamp = getEventTimestamp(event);
                  const entities = getEntities(event);

                  return (
                    <div
                      key={String(event.id || `timeline-${index}`)}
                      className="relative flex gap-3 sm:gap-5"
                    >

                      {/* TIMELINE DOT */}
                      <div className="relative z-10 shrink-0 w-[28px] sm:w-[36px] flex justify-center">
                        <div
                          className="
                            w-7
                            h-7
                            rounded-full
                            border
                            border-[#3c4948]
                            bg-[#0b1110]
                            flex
                            items-center
                            justify-center
                            shadow-[0_0_12px_rgba(102,252,241,0.08)]
                          "
                        >
                          <div
                            className={`
                              w-2
                              h-2
                              rounded-full
                              ${severity.dot}
                            `}
                          />
                        </div>
                      </div>

                      {/* EVENT CARD */}
                      <div
                        className={`
                          flex-1
                          min-w-0
                          rounded-lg
                          border
                          ${severity.border}
                          bg-[#111817]
                          hover:bg-[#151d1c]
                          transition-colors
                        `}
                      >
                        <div className="p-4 sm:p-5">

                          {/* TOP ROW */}
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                            <div className="flex items-start gap-3 min-w-0">

                              <div className="w-9 h-9 shrink-0 rounded-md border border-[#3c4948]/60 bg-[#0a100f] flex items-center justify-center">
                                <span className={`material-symbols-outlined ${severity.text} text-[19px]`}>
                                  {icon}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-white text-sm font-bold break-words">
                                    {event.title || 'Untitled Event'}
                                  </h3>

                                  {event.severity && (
                                    <span
                                      className={`
                                        font-mono
                                        text-[7px]
                                        font-bold
                                        tracking-wider
                                        px-2
                                        py-1
                                        rounded
                                        border
                                        ${severity.badge}
                                      `}
                                    >
                                      {String(event.severity).toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                <p className="font-mono text-[8px] text-[#859491] mt-1 tracking-wider uppercase">
                                  {event.type || 'SYSTEM EVENT'}
                                </p>
                              </div>
                            </div>

                            {/* TIME */}
                            <div className="shrink-0 md:text-right md:min-w-[170px]">
                              <p className="font-mono text-[9px] text-[#66FCF1] font-bold">
                                {formatTimestamp(timestamp)}
                              </p>

                              {event.relativeTime && (
                                <p className="font-mono text-[7px] text-[#859491] mt-1">
                                  {event.relativeTime}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* DESCRIPTION */}
                          {event.description && (
                            <div className="mt-4 ml-0 md:ml-12">
                              <p className="text-xs leading-5 text-[#bacac7]">
                                {event.description}
                              </p>
                            </div>
                          )}

                          {/* ENTITIES */}
                          {entities.length > 0 && (
                            <div className="mt-4 ml-0 md:ml-12 pt-3 border-t border-[#3c4948]/30">
                              <p className="font-mono text-[7px] text-[#859491] tracking-widest mb-2">
                                ENTITIES INVOLVED
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {entities.map((entity, entityIndex) => (
                                  <span
                                    key={`${entity}-${entityIndex}`}
                                    className="font-mono text-[8px] text-[#66FCF1] border border-[#66FCF1]/20 bg-[#66FCF1]/5 rounded px-2 py-1"
                                  >
                                    {entity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* EVENT METADATA */}
                          <div className="mt-4 ml-0 md:ml-12 pt-3 border-t border-[#3c4948]/20 flex flex-wrap gap-x-5 gap-y-2">
                            {event.id && (
                              <div>
                                <span className="font-mono text-[7px] text-[#5f716e] mr-1">
                                  EVENT ID
                                </span>
                                <span className="font-mono text-[7px] text-[#859491]">
                                  {event.id}
                                </span>
                              </div>
                            )}

                            {getCaseId(event) && (
                              <div>
                                <span className="font-mono text-[7px] text-[#5f716e] mr-1">
                                  CASE
                                </span>
                                <span className="font-mono text-[7px] text-[#859491]">
                                  {getCaseId(event)}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="font-mono text-[7px] text-[#5f716e] mr-1">
                                SOURCE
                              </span>
                              <span className="font-mono text-[7px] text-[#859491]">
                                CASE ANALYSIS
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-4 flex items-start gap-2 px-1">
          <span className="material-symbols-outlined text-[#5f716e] text-[14px] mt-0.5">
            verified_user
          </span>
          <p className="font-mono text-[7px] text-[#5f716e] leading-4">
            AI-assisted timeline interpretation is an investigative lead only.
            Verify source records before taking investigative action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
