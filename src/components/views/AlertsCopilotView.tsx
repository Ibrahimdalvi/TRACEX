import React, { useEffect, useRef, useState } from 'react';
import {
  IntelAlert,
  CopilotMessage,
  InvestigationCase,
  ActiveView,
} from '../../types';

interface AlertsCopilotViewProps {
  alerts: IntelAlert[];
  currentCase: InvestigationCase;
  onAcknowledgeAll: () => void;
  onSelectAlert: (alert: IntelAlert) => void;
  onNavigate: (view: ActiveView) => void;
}

const SEVERITY_STYLE = {
  CRITICAL: {
    border: 'border-l-[#ffb4ab] border-[#93000a]/40',
    hover: 'hover:bg-[#1a0f0e]',
    badge: 'text-[#ffb4ab] bg-[#93000a]/20 border-[#ffb4ab]/30',
    icon: 'text-[#ffb4ab] bg-[#93000a]/20',
    iconName: 'warning',
  },
  WARNING: {
    border: 'border-l-[#F6B352] border-[#F6B352]/25',
    hover: 'hover:bg-[#1a1508]',
    badge: 'text-[#F6B352] bg-[#F6B352]/10 border-[#F6B352]/30',
    icon: 'text-[#F6B352] bg-[#F6B352]/10',
    iconName: 'error_outline',
  },
  INFO: {
    border: 'border-l-[#7bd6d1] border-[#3c4948]/40',
    hover: 'hover:bg-[#0f1514]',
    badge: 'text-[#7bd6d1] bg-[#007774]/20 border-[#7bd6d1]/30',
    icon: 'text-[#7bd6d1] bg-[#007774]/20',
    iconName: 'info',
  },
};

const getTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export const AlertsCopilotView: React.FC<AlertsCopilotViewProps> = ({
  alerts,
  currentCase,
  onAcknowledgeAll,
  onSelectAlert,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'system-init',
      sender: 'system',
      text: `COPILOT READY — CASE CONTEXT: ${currentCase.id}`,
      timestamp: getTime(),
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<
    'READY' | 'ONLINE' | 'OFFLINE'
  >('READY');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const selectedAlert =
    alerts.find((alert) => alert.id === selectedAlertId) || null;

  /*
   * IMPORTANT:
   * This payload is the bridge between the frontend and the real
   * intelligence backend.
   */
  const buildCopilotContext = () => ({
    case: {
      id: currentCase.id,
      title: currentCase.title,
      status: currentCase.status,
      priority: currentCase.priority,
      progress: currentCase.progress,
      summary: currentCase.summary,
      leadInvestigator: currentCase.leadInvestigator,
      entitiesCount: currentCase.entitiesCount,
      evidenceCount: currentCase.evidenceCount,
      linksCount: currentCase.linksCount,
      assessment: currentCase.assessment,
      keyEntities: currentCase.keyEntities,
    },

    selectedAlert: selectedAlert
      ? {
        id: selectedAlert.id,
        severity: selectedAlert.severity,
        confidence: selectedAlert.confidence,
        title: selectedAlert.title,
        description: selectedAlert.description,
        source: selectedAlert.source,
        targetCase: selectedAlert.targetCase,
        targetEntityId: selectedAlert.targetEntityId,
        category: selectedAlert.category,
        timestamp: selectedAlert.timestamp,
        acknowledged: selectedAlert.acknowledged,
      }
      : null,

    availableAlerts: alerts.map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      confidence: alert.confidence,
      title: alert.title,
      description: alert.description,
      source: alert.source,
      targetCase: alert.targetCase,
      targetEntityId: alert.targetEntityId,
      category: alert.category,
      timestamp: alert.timestamp,
      acknowledged: alert.acknowledged,
    })),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  /*
   * When investigator changes case, reset the context marker.
   */
  useEffect(() => {
    setSelectedAlertId(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `context-${Date.now()}`,
        sender: 'system',
        text: `ACTIVE CONTEXT CHANGED — ${currentCase.id}`,
        timestamp: getTime(),
      },
    ]);
  }, [currentCase.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();

    if (!query || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: getTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsLoading(true);
    setServiceStatus('READY');

    try {
      const response = await fetch('http://127.0.0.1:5173/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,

          /*
           * Backend can use this to retrieve additional
           * database information.
           */
          caseId: currentCase.id,

          entityId:
            selectedAlert?.targetEntityId ||
            currentCase.keyEntities?.find((e) => e.isPrimary)?.id ||
            undefined,

          alertId: selectedAlert?.id || undefined,

          /*
           * Current frontend context.
           */
          context: buildCopilotContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data.reply !== 'string') {
        throw new Error('INVALID_COPILOT_RESPONSE');
      }

      setServiceStatus('ONLINE');

      const assistantMessage: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: getTime(),
        citations: Array.isArray(data.citations)
          ? data.citations
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Copilot API error:', error);

      setServiceStatus('OFFLINE');

      const offlineMessage: CopilotMessage = {
        id: `offline-${Date.now()}`,
        sender: 'assistant',
        text:
          `INTELLIGENCE SERVICE UNAVAILABLE\n\n` +
          `The Copilot backend could not be reached for case ${currentCase.id}.\n\n` +
          `No fabricated investigative conclusion has been generated. ` +
          `Reconnect the intelligence API and retry this query.\n\n` +
          `REQUEST CONTEXT\n` +
          `• Case: ${currentCase.id}\n` +
          `• Priority: ${currentCase.priority}\n` +
          `• Selected alert: ${selectedAlert?.id || 'NONE'}\n` +
          `• Alerts loaded: ${alerts.length}`,
        timestamp: getTime(),
      };

      setMessages((prev) => [...prev, offlineMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Speech recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript || '';

        if (transcript.trim()) {
          setInputVal(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const handleAlertClick = (alert: IntelAlert) => {
    setSelectedAlertId(alert.id);
    onSelectAlert(alert);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  const severityFilters = [
    'ALL',
    'CRITICAL',
    'WARNING',
    'INFO',
  ];

  const suggestedQueries = [
    'Summarize the current investigation.',
    'Which alert requires the highest priority review?',
    'Explain the strongest network connection.',
    'What evidence should an analyst verify first?',
  ];

  return (
    <div
      className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 relative overflow-hidden"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {/* =========================================================
          LEFT — ALERT STREAM
      ========================================================= */}

      <section className="lg:col-span-7 h-full flex flex-col z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <p className="font-mono text-[9px] font-bold text-[#859491] uppercase tracking-widest mb-0.5">
              LIVE INTELLIGENCE STREAM
            </p>

            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl font-bold text-white tracking-tight">
                Active Alerts
              </h1>

              <span className="font-mono text-[8px] text-[#66FCF1] border border-[#66FCF1]/30 px-1.5 py-0.5 rounded">
                {alerts.length} LOADED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[#1a2120] border border-[#3c4948]/40 p-0.5 rounded-lg">
              {severityFilters.map((severity) => (
                <button
                  key={severity}
                  onClick={() => setFilterSeverity(severity)}
                  className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-all ${filterSeverity === severity
                    ? 'bg-[#66FCF1] text-[#00201e]'
                    : 'text-[#859491] hover:text-white'
                    }`}
                >
                  {severity}
                </button>
              ))}
            </div>

            <button
              onClick={onAcknowledgeAll}
              className="px-3 py-1.5 font-mono text-[9px] font-bold border border-[#3c4948]/60 hover:bg-[#242b2a] text-[#859491] hover:text-white transition-colors rounded-lg uppercase tracking-wider"
            >
              ACKNOWLEDGE ALL
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 pb-6">
          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[#3c4948] text-[48px] mb-3">
                notifications_off
              </span>

              <p className="font-mono text-[11px] text-[#859491] uppercase tracking-wider">
                No alerts for this filter
              </p>
            </div>
          )}

          {filteredAlerts.map((alert) => {
            const style =
              SEVERITY_STYLE[alert.severity] ||
              SEVERITY_STYLE.INFO;

            const isSelected =
              selectedAlertId === alert.id;

            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => handleAlertClick(alert)}
                className={`w-full text-left bg-[#0e1514] border border-l-4 p-4 flex gap-3 items-start relative group rounded-lg transition-all cursor-pointer ${style.border} ${style.hover} ${isSelected
                  ? 'ring-1 ring-[#66FCF1]/50 bg-[#111c1b]'
                  : ''
                  } ${alert.acknowledged
                    ? 'opacity-60'
                    : ''
                  }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${style.icon}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {style.iconName}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border flex-shrink-0 ${style.badge}`}
                    >
                      {alert.severity} · {alert.confidence}% CONF
                    </span>

                    <span className="font-mono text-[10px] text-[#859491] flex-shrink-0">
                      {alert.timeElapsed}
                    </span>
                  </div>

                  <h3 className="font-sans text-sm font-bold text-white mb-1 leading-tight">
                    {alert.title}
                  </h3>

                  <p className="font-sans text-xs text-[#bacac7] leading-relaxed line-clamp-2">
                    {alert.description}
                  </p>

                  <div className="mt-2 flex gap-4 border-t border-[#3c4948]/20 pt-2 font-mono text-[9px]">
                    <div>
                      <span className="text-[#859491] uppercase block">
                        SOURCE
                      </span>

                      <span className="text-white font-semibold">
                        {alert.source}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#859491] uppercase block">
                        CASE
                      </span>

                      <span className="text-[#66FCF1] font-semibold">
                        {alert.targetCase}
                      </span>
                    </div>

                    {alert.acknowledged && (
                      <div className="ml-auto flex items-center gap-1 text-[#7bd6d1]">
                        <span className="material-symbols-outlined text-[12px]">
                          check_circle
                        </span>

                        <span>ACK</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          RIGHT — COPILOT
      ========================================================= */}

      <section className="lg:col-span-5 h-full z-10 flex flex-col bg-[#0e1514] border border-[#3c4948]/40 rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="border-b border-[#3c4948]/40 p-3.5 bg-[#1a2120] flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66FCF1] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66FCF1]" />
            </div>

            <div>
              <h2 className="font-mono text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px] text-[#66FCF1]">
                  terminal
                </span>

                TRACEX COPILOT

                {serviceStatus === 'ONLINE' && (
                  <span className="text-[8px] text-[#66FCF1]">
                    ● API ONLINE
                  </span>
                )}

                {serviceStatus === 'OFFLINE' && (
                  <span className="text-[8px] text-[#ffb4ab]">
                    ● API OFFLINE
                  </span>
                )}
              </h2>

              <p className="font-mono text-[9px] text-[#859491] uppercase tracking-wider">
                CASE: {currentCase.id}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              handleSendMessage(
                selectedAlert
                  ? `Analyze alert ${selectedAlert.id} and explain what an analyst should verify first.`
                  : `Provide an analyst briefing for case ${currentCase.id}.`
              )
            }
            disabled={isLoading}
            className="font-mono text-[9px] text-[#7bd6d1] hover:text-[#66FCF1] border border-[#3c4948]/60 hover:border-[#66FCF1]/50 px-2 py-1 rounded transition-all disabled:opacity-40"
          >
            BRIEF ME
          </button>
        </div>

        {/* Context strip */}
        <div className="flex-shrink-0 px-3 py-1.5 bg-[#0b1110] border-b border-[#3c4948]/30 flex items-center justify-between">
          <span className="font-mono text-[8px] text-[#859491]">
            CONTEXT
          </span>

          <span className="font-mono text-[8px] text-[#66FCF1]">
            {selectedAlert
              ? `ALERT: ${selectedAlert.id}`
              : 'CASE ONLY'}
          </span>
        </div>

        {/* Disclaimer */}
        <div className="flex-shrink-0 border-b border-[#F6B352]/20 bg-[#1a1508] px-3 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F6B352] text-[12px]">
            info
          </span>

          <p className="font-mono text-[8px] text-[#859491] leading-snug">
            AI findings are investigative leads. Human verification is required before operational action.
          </p>
        </div>

        {/* Chat */}
        <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 bg-[#0a0d10]">
          {messages.map((message) => {
            if (message.sender === 'system') {
              return (
                <div
                  key={message.id}
                  className="flex justify-center my-1"
                >
                  <span className="font-mono text-[9px] text-[#859491] bg-[#1a2120] px-3 py-1 rounded-full border border-[#3c4948]/30">
                    {message.text}
                  </span>
                </div>
              );
            }

            if (message.sender === 'user') {
              return (
                <div
                  key={message.id}
                  className="self-end max-w-[85%]"
                >
                  <div className="bg-[#242b2a] border border-[#3c4948]/50 p-3 rounded-lg rounded-br-sm">
                    <p className="font-sans text-xs text-white leading-relaxed">
                      {message.text}
                    </p>

                    <span className="font-mono text-[9px] text-[#859491] block text-right mt-1.5">
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className="self-start max-w-[95%]"
              >
                <div className="bg-[#1a2120] border border-[#3c4948]/40 p-3.5 rounded-lg rounded-bl-sm">
                  <p className="font-sans text-xs text-[#dde4e2] leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>

                  {message.citations &&
                    message.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#3c4948]/30">
                        <span className="font-mono text-[8px] font-bold text-[#859491] block mb-1.5 uppercase tracking-wider">
                          SUPPORTING EVIDENCE
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {message.citations.map(
                            (citation, index) => (
                              <button
                                key={`${citation.title}-${index}`}
                                onClick={() =>
                                  onNavigate('evidence')
                                }
                                className="inline-flex items-center gap-1.5 font-mono text-[9px] bg-[#0e1514] border border-[#3c4948]/60 px-2 py-1 rounded hover:bg-[#242b2a] hover:border-[#66FCF1]/40 transition-colors text-[#bacac7] hover:text-white"
                              >
                                <span className="material-symbols-outlined text-[12px] text-[#66FCF1]">
                                  {citation.type || 'description'}
                                </span>

                                {citation.title}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <span className="font-mono text-[9px] text-[#859491] block mt-2">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="self-start max-w-[90%]">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="material-symbols-outlined text-[#66FCF1] text-[14px] animate-spin">
                  progress_activity
                </span>

                <span className="font-mono text-[9px] font-bold text-[#66FCF1] tracking-widest uppercase animate-pulse">
                  ANALYZING CASE CONTEXT...
                </span>
              </div>

              <div className="bg-[#1a2120] border border-[#3c4948]/40 p-3 rounded-lg">
                <div className="h-2 w-3/4 bg-[#2f3635] rounded animate-pulse mb-2" />
                <div className="h-2 w-1/2 bg-[#2f3635] rounded animate-pulse" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        <div className="flex-shrink-0 border-t border-[#3c4948]/30 bg-[#1a2120] px-3 pt-2.5 pb-1.5">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {suggestedQueries.map((query) => (
              <button
                key={query}
                onClick={() => handleSendMessage(query)}
                disabled={isLoading}
                className="flex-shrink-0 font-mono text-[9px] text-[#859491] bg-[#0e1514] border border-[#3c4948]/50 px-2.5 py-1 rounded-full hover:text-white hover:border-[#66FCF1]/50 transition-all whitespace-nowrap disabled:opacity-40"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#3c4948]/30 bg-[#1a2120] px-3 py-2.5">
          <div className="flex items-center bg-[#0e1514] border border-[#3c4948]/60 focus-within:border-[#66FCF1]/60 transition-colors px-2.5 py-1.5 rounded-lg gap-2">
            <button
              onClick={handleMicToggle}
              className={`p-0.5 transition-colors rounded flex-shrink-0 ${isListening
                ? 'text-[#ffb4ab] animate-pulse'
                : 'text-[#859491] hover:text-white'
                }`}
              title="Voice Input"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(event) =>
                setInputVal(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                selectedAlert
                  ? 'Ask about selected alert...'
                  : 'Command Copilot...'
              }
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder:text-[#859491]/50 disabled:opacity-50"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoading}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${inputVal.trim() && !isLoading
                ? 'bg-[#66FCF1] text-[#00201e] hover:opacity-90'
                : 'bg-[#242b2a] text-[#859491] cursor-not-allowed'
                }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                send
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AlertsCopilotView;