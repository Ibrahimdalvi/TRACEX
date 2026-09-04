import React, { useMemo } from 'react';
import { InvestigationCase, TimelineEntry } from '../../types';

interface TimelineViewProps {
  timeline: TimelineEntry[];
  currentCase: InvestigationCase;
}

const getSeverityClasses = (severity?: string) => {
  switch (String(severity || '').toLowerCase()) {
    case 'critical':
      return {
        dot: 'bg-[#ff6b6b]',
        border: 'border-[#ff6b6b]/40',
        text: 'text-[#ffb4ab]',
        badge: 'bg-[#93000a]/25 text-[#ffb4ab]',
      };

    case 'high':
      return {
        dot: 'bg-[#ffb4ab]',
        border: 'border-[#ffb4ab]/30',
        text: 'text-[#ffb4ab]',
        badge: 'bg-[#93000a]/20 text-[#ffb4ab]',
      };

    case 'medium':
      return {
        dot: 'bg-[#dec74a]',
        border: 'border-[#dec74a]/30',
        text: 'text-[#dec74a]',
        badge: 'bg-[#dec74a]/10 text-[#dec74a]',
      };

    default:
      return {
        dot: 'bg-[#66FCF1]',
        border: 'border-[#66FCF1]/25',
        text: 'text-[#66FCF1]',
        badge: 'bg-[#66FCF1]/10 text-[#66FCF1]',
      };
  }
};

const getEventIcon = (type?: string) => {
  const value = String(type || '').toUpperCase();

  if (value.includes('TRANSACTION')) {
    return 'account_balance';
  }

  if (value.includes('COMMUNICATION')) {
    return 'forum';
  }

  if (value.includes('SYSTEM')) {
    return 'memory';
  }

  if (value.includes('EVIDENCE')) {
    return 'description';
  }

  if (value.includes('LOCATION')) {
    return 'location_on';
  }

  return 'timeline';
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  currentCase,
}) => {
  /*
   * ---------------------------------------------------------
   * CASE-SAFE TIMELINE
   * ---------------------------------------------------------
   *
   * Only show events belonging to the currently selected case.
   */

  const caseTimeline = useMemo(() => {
    const currentCaseId = currentCase?.id;

    return (timeline || [])
      .filter((event) => {
        if (!event) return false;

        /*
         * If event has a caseId, enforce the match.
         * If older data doesn't have caseId, keep it.
         */
        if (event.caseId) {
          return event.caseId === currentCaseId;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(
          String(a.timestamp || '')
        ).getTime();

        const dateB = new Date(
          String(b.timestamp || '')
        ).getTime();

        return dateB - dateA;
      });
  }, [timeline, currentCase]);

  return (
    <div className="w-full h-full min-h-0 overflow-y-auto bg-[#080d0d] p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">

        <div className="flex items-start justify-between gap-6">

          <div>

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg border border-[#66FCF1]/30 bg-[#66FCF1]/10 flex items-center justify-center">

                <span className="material-symbols-outlined text-[#66FCF1] text-[22px]">
                  timeline
                </span>

              </div>

              <div>

                <h1 className="text-white text-xl font-bold tracking-wide">
                  INVESTIGATION TIMELINE
                </h1>

                <p className="font-mono text-[10px] text-[#859491] mt-1 tracking-wider">
                  CHRONOLOGICAL INTELLIGENCE EVENT RECORD
                </p>

              </div>

            </div>

          </div>


          {/* CASE INFO */}

          <div className="shrink-0 border border-[#3c4948]/50 bg-[#111817] rounded-lg px-4 py-3">

            <p className="font-mono text-[8px] text-[#859491] tracking-wider">
              ACTIVE CASE
            </p>

            <p className="font-mono text-[12px] text-[#66FCF1] font-bold mt-1">
              {currentCase?.id || 'UNKNOWN CASE'}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">

          <p className="font-mono text-[8px] text-[#859491] tracking-widest">
            TOTAL EVENTS
          </p>

          <p className="text-2xl font-bold text-white mt-2">
            {caseTimeline.length}
          </p>

        </div>


        <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">

          <p className="font-mono text-[8px] text-[#859491] tracking-widest">
            CASE STATUS
          </p>

          <p className="text-sm font-bold text-[#66FCF1] mt-3">
            {currentCase?.status || 'UNKNOWN'}
          </p>

        </div>


        <div className="border border-[#3c4948]/50 bg-[#111817] rounded-lg p-4">

          <p className="font-mono text-[8px] text-[#859491] tracking-widest">
            PRIORITY
          </p>

          <p className="text-sm font-bold text-[#dec74a] mt-3">
            {currentCase?.priority || 'NORMAL'}
          </p>

        </div>

      </div>


      {/* =====================================================
          TIMELINE
      ===================================================== */}

      <div className="border border-[#3c4948]/50 bg-[#0e1514] rounded-lg overflow-hidden">

        {/* TIMELINE HEADER */}

        <div className="px-5 py-4 border-b border-[#3c4948]/40 flex items-center justify-between">

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

          <div className="font-mono text-[8px] text-[#66FCF1] border border-[#66FCF1]/20 bg-[#66FCF1]/5 rounded px-3 py-2">
            LIVE CASE DATA
          </div>

        </div>


        {/* EMPTY STATE */}

        {caseTimeline.length === 0 && (

          <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-6">

            <div className="w-16 h-16 rounded-full border border-[#3c4948] flex items-center justify-center mb-4">

              <span className="material-symbols-outlined text-[#3c4948] text-3xl">
                timeline
              </span>

            </div>

            <h3 className="text-white text-sm font-semibold">
              NO TIMELINE EVENTS
            </h3>

            <p className="text-[#859491] text-xs mt-2 max-w-md">
              No chronological events are currently available
              for {currentCase?.id || 'this case'}.
            </p>

          </div>

        )}


        {/* EVENTS */}

        {caseTimeline.length > 0 && (

          <div className="relative px-6 py-7">

            {/* CENTRAL LINE */}

            <div
              className="
                absolute
                left-[43px]
                top-8
                bottom-8
                w-px
                bg-[#3c4948]/70
              "
            />


            <div className="space-y-7">

              {caseTimeline.map((event, index) => {

                const severity = getSeverityClasses(
                  event.severity
                );

                const icon = getEventIcon(
                  event.type
                );

                return (

                  <div
                    key={
                      event.id ||
                      `timeline-${index}`
                    }
                    className="relative flex gap-5"
                  >

                    {/* =================================================
                        TIMELINE DOT
                    ================================================= */}

                    <div className="relative z-10 shrink-0 w-[36px] flex justify-center">

                      <div
                        className={`
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
                        `}
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


                    {/* =================================================
                        EVENT CARD
                    ================================================= */}

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

                      <div className="p-5">

                        {/* TOP ROW */}

                        <div className="flex items-start justify-between gap-5">

                          <div className="flex items-start gap-3 min-w-0">

                            <div className="w-9 h-9 shrink-0 rounded-md border border-[#3c4948]/60 bg-[#0a100f] flex items-center justify-center">

                              <span className={`material-symbols-outlined ${severity.text} text-[19px]`}>
                                {icon}
                              </span>

                            </div>


                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="text-white text-sm font-bold">
                                  {event.title ||
                                    'Untitled Event'}
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
                                      ${severity.badge}
                                    `}
                                  >
                                    {String(
                                      event.severity
                                    ).toUpperCase()}
                                  </span>

                                )}

                              </div>


                              <p className="font-mono text-[8px] text-[#859491] mt-1 tracking-wider">
                                {event.type ||
                                  'SYSTEM EVENT'}
                              </p>

                            </div>

                          </div>


                          {/* TIME */}

                          <div className="shrink-0 text-right">

                            <p className="font-mono text-[9px] text-[#66FCF1] font-bold">
                              {event.timestamp ||
                                'TIME UNKNOWN'}
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

                          <div className="mt-4 ml-12">

                            <p className="text-xs leading-5 text-[#bacac7]">
                              {event.description}
                            </p>

                          </div>

                        )}


                        {/* ENTITIES */}

                        {event.entitiesInvolved &&
                          event.entitiesInvolved.length > 0 && (

                            <div className="mt-4 ml-12 pt-3 border-t border-[#3c4948]/30">

                              <p className="font-mono text-[7px] text-[#859491] tracking-widest mb-2">
                                ENTITIES INVOLVED
                              </p>

                              <div className="flex flex-wrap gap-2">

                                {event.entitiesInvolved.map(
                                  (entity, entityIndex) => (

                                    <span
                                      key={`${entity}-${entityIndex}`}
                                      className="font-mono text-[8px] text-[#66FCF1] border border-[#66FCF1]/20 bg-[#66FCF1]/5 rounded px-2 py-1"
                                    >
                                      {entity}
                                    </span>

                                  )
                                )}

                              </div>

                            </div>

                          )}

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default TimelineView;