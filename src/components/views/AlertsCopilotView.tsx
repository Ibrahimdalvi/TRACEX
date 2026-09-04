import React, { useState, useRef, useEffect } from 'react';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://tracex-pshh.onrender.com';
import { IntelAlert, CopilotMessage, InvestigationCase, ActiveView } from '../../types';

interface AlertsCopilotViewProps {
  alerts: IntelAlert[];
  currentCase: InvestigationCase;
  onAcknowledgeAll: () => void;
  onSelectAlert: (alert: IntelAlert) => void;
  onNavigate: (view: ActiveView) => void;
}

export const AlertsCopilotView: React.FC<AlertsCopilotViewProps> = ({
  alerts,
  currentCase,
  onAcknowledgeAll,
  onSelectAlert,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'system',
      text: 'SYSTEM: COPILOT INITIALIZED ON ALERT THREAD',
      timestamp: '14:35',
    },
    {
      id: 'msg-1',
      sender: 'user',
      text: 'Analyze the bridge entity alert for P-104. Why was this specifically flagged as critical?',
      timestamp: '14:36',
    },
    {
      id: 'msg-2',
      sender: 'assistant',
      text: `P-104 is the strongest bridge candidate in the loaded network view. The dossier records betweenness 0.82, degree 17, and 6 active cases.\n\nThe current CRITICAL alert (ALT-9041) says P-104 is connecting previously isolated network clusters. That is an analytical finding from the supplied dataset, not proof of coordination or criminal conduct. Human verification is required before any operational decision.`, 
      timestamp: '14:36',
      citations: [
        { type: 'account_balance', title: 'Bank Records (Tx-992)' },
        { type: 'call', title: 'Call Logs (Intercept A)' },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [apiStatus, setApiStatus] = useState<'CHECKING' | 'ONLINE' | 'LOCAL' | 'OFFLINE'>('CHECKING');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Health check failed');
      const data = await response.json();
      setApiStatus(data.geminiConfigured || data.groqConfigured || data.cerebrasConfigured ? 'ONLINE' : 'LOCAL');
    } catch {
      setApiStatus('OFFLINE');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    checkApiHealth();
    const timer = window.setInterval(checkApiHealth, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!speakReplies || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      text.replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim(),
    );
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    const selectedAlert = alerts.find((alert) => alert.id === selectedAlertId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          contextCaseId: currentCase.id,
          entityId: 'P-104',
          alertId: selectedAlertId,
          context: {
            case: currentCase,
            selectedAlert: selectedAlert || null,
            availableAlerts: alerts,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Copilot response failed');
      }

      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, botMsg]);
      speak(data.reply);
    } catch (err: any) {
      const errorText =
        'COPILOT CONNECTION ERROR\n\n' +
        (err?.message || 'Unable to reach the TRACEX backend.') +
        `\n\nBackend: ${API_BASE_URL}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: [],
        },
      ]);
      setApiStatus('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Use Microsoft Edge or Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }

        setInputVal(transcript);

        const finalResult = event.results[event.results.length - 1];
        if (finalResult?.isFinal) {
          recognition.stop();
          setIsListening(false);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event?.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'ALL') return true;
    return alert.severity === filterSeverity;
  });

  return (
    <div className="flex-1 h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-12 gap-6 relative overflow-hidden">
      {/* Left Column: Active Alerts Feed (7 Cols) */}
      <section className="lg:col-span-7 h-full flex flex-col z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="font-sans text-2xl font-bold text-white tracking-tight">
              ACTIVE ALERTS
            </h1>
            <p className="font-mono text-[10px] text-[#859491] mt-0.5 uppercase tracking-wider">
              LIVE INTELLIGENCE STREAM // HIGH SEVERITY PRIORITY
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (filterSeverity === 'ALL') setFilterSeverity('CRITICAL');
                else if (filterSeverity === 'CRITICAL') setFilterSeverity('WARNING');
                else setFilterSeverity('ALL');
              }}
              className="px-3 py-1 font-mono text-[10px] font-bold border border-[#3c4948]/60 hover:bg-[#242b2a] text-[#bacac7] hover:text-white transition-colors rounded uppercase"
            >
              FILTER: {filterSeverity}
            </button>
            <button
              onClick={onAcknowledgeAll}
              className="px-3 py-1 font-mono text-[10px] font-bold border border-[#3c4948]/60 hover:bg-[#242b2a] text-[#bacac7] hover:text-white transition-colors rounded uppercase"
            >
              ACKNOWLEDGE ALL
            </button>
          </div>
        </div>

        {/* Alerts Scrollable List */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 pb-6">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            return (
              <div
                key={alert.id}
                onClick={() => {
                  setSelectedAlertId(alert.id);
                  onSelectAlert(alert);
                }}
                className={`bg-[#0e1514] border p-4 flex gap-4 items-start relative group rounded transition-all cursor-pointer shadow-sm ${
                  isCritical
                    ? 'border-[#93000a]/50 border-l-4 border-l-[#ffb4ab] hover:border-[#ffb4ab]'
                    : isWarning
                    ? 'border-[#F6B352]/40 border-l-4 border-l-[#F6B352] hover:border-[#F6B352]'
                    : 'border-[#3c4948]/40 border-l-4 border-l-[#7bd6d1] hover:border-[#66FCF1]'
                }`}
              >
                {/* Alert Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center ${
                    isCritical
                      ? 'bg-[#93000a]/20 text-[#ffb4ab]'
                      : isWarning
                      ? 'bg-[#F6B352]/10 text-[#F6B352]'
                      : 'bg-[#007774]/20 text-[#7bd6d1]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isCritical ? 'warning' : isWarning ? 'repeat' : 'info'}
                  </span>
                </div>

                {/* Alert Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1.5">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                        isCritical
                          ? 'text-[#ffb4ab] bg-[#93000a]/20 border-[#ffb4ab]/30'
                          : isWarning
                          ? 'text-[#F6B352] bg-[#F6B352]/10 border-[#F6B352]/30'
                          : 'text-[#7bd6d1] bg-[#007774]/20 border-[#7bd6d1]/30'
                      }`}
                    >
                      {alert.severity} / CONFIDENCE: {alert.confidence}%
                    </span>
                    <span className="font-mono text-[11px] text-[#859491] font-semibold">
                      {alert.timeElapsed}
                    </span>
                  </div>

                  <h3 className="font-sans text-sm font-bold text-white mb-1 tracking-tight">
                    {alert.title}
                  </h3>

                  <p className="font-sans text-xs text-[#bacac7] leading-relaxed">
                    {alert.description.includes('P-104') ? (
                      <>
                        Entity{' '}
                        <span className="text-[#66FCF1] font-mono font-bold bg-[#66FCF1]/10 px-1 rounded">
                          P-104
                        </span>{' '}
                        {alert.description.replace('Entity P-104', '')}
                      </>
                    ) : alert.description.includes('+91 98XXXXXX12') ? (
                      <>
                        Phone identifier{' '}
                        <span className="text-[#F6B352] font-mono font-bold bg-[#F6B352]/10 px-1 rounded">
                          +91 98XXXXXX12
                        </span>{' '}
                        {alert.description.replace('Phone identifier +91 98XXXXXX12', '')}
                      </>
                    ) : (
                      alert.description
                    )}
                  </p>

                  <div className="mt-3 flex gap-6 border-t border-[#3c4948]/20 pt-2 font-mono text-[9px]">
                    <div className="flex flex-col">
                      <span className="text-[#859491] font-bold uppercase">SOURCE</span>
                      <span className="text-white font-semibold">{alert.source}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#859491] font-bold uppercase">TARGET</span>
                      <span className="text-white font-semibold">{alert.targetCase}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Right Column: AI Copilot Panel (5 Cols) */}
      <section className="lg:col-span-5 h-full z-10 flex flex-col bg-[#1a2120] border border-[#3c4948]/40 rounded-lg overflow-hidden shadow-2xl relative">
        {/* Copilot Header */}
        <div className="relative z-10 border-b border-[#3c4948]/40 p-3.5 bg-[#242b2a] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66FCF1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66FCF1]"></span>
            </div>
            <div>
              <h2 className="font-mono text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-[#66FCF1]">terminal</span>
                ARGUS COPILOT
              </h2>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[9px] text-[#859491] uppercase tracking-wider">
                  CONTEXT: {currentCase.id}
                </p>
                <span className={`font-mono text-[8px] uppercase tracking-wider ${
                  apiStatus === 'ONLINE' ? 'text-[#66FCF1]' :
                  apiStatus === 'LOCAL' ? 'text-[#F6B352]' :
                  apiStatus === 'OFFLINE' ? 'text-[#ffb4ab]' : 'text-[#859491]'
                }`}>
                  ● {apiStatus === 'ONLINE' ? 'AI ONLINE' : apiStatus === 'LOCAL' ? 'LOCAL CORE' : apiStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage('Summarize the current investigation and identify the highest-priority loaded alert.')}
              className="font-mono text-[9px] text-[#7bd6d1] border border-[#3c4948]/60 hover:border-[#66FCF1]/60 px-2 py-1 rounded uppercase"
            >
              BRIEF ME
            </button>
            <button
              onClick={() => setSpeakReplies((value) => !value)}
              className={`p-1 rounded ${speakReplies ? 'text-[#66FCF1]' : 'text-[#859491]'} hover:text-white`}
              title={speakReplies ? 'Voice replies ON' : 'Voice replies OFF'}
            >
              <span className="material-symbols-outlined text-[17px]">
                {speakReplies ? 'volume_up' : 'volume_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Copilot Chat Area */}
        <div className="relative z-10 flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#0e1514]">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <span className="font-mono text-[9px] text-[#859491] bg-[#242b2a] px-3 py-1 rounded border border-[#3c4948]/30">
                    {msg.text}
                  </span>
                </div>
              );
            }

            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="self-end max-w-[85%]">
                  <div className="bg-[#2f3635] border border-[#3c4948]/40 p-3 rounded-lg shadow-sm">
                    <p className="font-sans text-xs sm:text-sm text-white leading-relaxed">
                      {msg.text}
                    </p>
                    <span className="font-mono text-[9px] text-[#859491] block text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="self-start max-w-[95%]">
                <div className="bg-[#1a2120] border border-[#3c4948]/40 p-3.5 rounded-lg relative shadow-sm">
                  <p className="font-sans text-xs sm:text-sm text-[#dde4e2] leading-relaxed whitespace-pre-line mb-3">
                    {msg.text}
                  </p>

                  {/* Citations Pill Bar */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#3c4948]/30">
                      <span className="font-mono text-[9px] font-bold text-[#859491] block mb-1.5 uppercase tracking-wider">
                        SUPPORTING EVIDENCE (CITATIONS)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            onClick={() => onNavigate('evidence')}
                            className="inline-flex items-center gap-1 font-mono text-[10px] bg-[#0e1514] border border-[#3c4948]/60 px-2 py-1 rounded hover:bg-[#242b2a] hover:border-[#66FCF1]/50 transition-colors text-[#bacac7] hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[14px] text-[#66FCF1]">
                              {cite.type}
                            </span>
                            {cite.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="font-mono text-[9px] text-[#859491] block mt-2">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="self-start max-w-[90%]">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#66FCF1] text-[16px] animate-spin">
                  progress_activity
                </span>
                <span className="font-mono text-[10px] font-bold text-[#66FCF1] tracking-widest uppercase animate-pulse">
                  PROCESSING ANALYTICS...
                </span>
              </div>
              <div className="bg-[#1a2120] border border-[#3c4948]/40 p-3 rounded-lg">
                <div className="h-2 w-3/4 bg-[#2f3635] rounded animate-pulse mb-2"></div>
                <div className="h-2 w-1/2 bg-[#2f3635] rounded animate-pulse"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Copilot Input & Suggested Queries */}
        <div className="relative z-10 border-t border-[#3c4948]/40 bg-[#242b2a] p-3">
          {/* Suggested Queries Chips */}
          <div className="flex gap-2 overflow-x-auto mb-2 pb-1 scrollbar-none">
            <button
              onClick={() => handleSendMessage('Who is the strongest connector in the network?')}
              className="flex-shrink-0 font-mono text-[10px] text-[#bacac7] bg-[#0e1514] border border-[#3c4948]/60 px-2.5 py-1 rounded hover:text-white hover:border-[#66FCF1]/60 transition-all whitespace-nowrap"
            >
              &gt; &quot;Who is the strongest connector?&quot;
            </button>
            <button
              onClick={() => {
                handleSendMessage('Show visual link map for P-104 and explain cluster affiliations.');
                onNavigate('network');
              }}
              className="flex-shrink-0 font-mono text-[10px] text-[#bacac7] bg-[#0e1514] border border-[#3c4948]/60 px-2.5 py-1 rounded hover:text-white hover:border-[#66FCF1]/60 transition-all whitespace-nowrap"
            >
              &gt; &quot;Show visual link map for P-104&quot;
            </button>
            <button
              onClick={() => handleSendMessage('Draft forensic subpoena for Aegis Holdings FZE accounts.')}
              className="flex-shrink-0 font-mono text-[10px] text-[#bacac7] bg-[#0e1514] border border-[#3c4948]/60 px-2.5 py-1 rounded hover:text-white hover:border-[#66FCF1]/60 transition-all whitespace-nowrap"
            >
              &gt; &quot;Draft subpoena for ORG-42&quot;
            </button>
          </div>

          {/* Input Box */}
          <div className="flex items-center bg-[#0e1514] border border-[#3c4948]/70 focus-within:border-[#66FCF1] transition-colors px-2 py-1 rounded">
            <button
              onClick={handleMicToggle}
              className={`p-1 mr-1 transition-colors rounded ${
                isListening ? 'text-[#ffb4ab] animate-pulse' : 'text-[#859491] hover:text-white'
              }`}
              title="Voice Input"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Command Copilot..."
              className="w-full bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder:text-[#859491]/60 px-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoading}
              className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
                inputVal.trim() && !isLoading
                  ? 'bg-[#66FCF1] text-[#00201e] hover:opacity-90 shadow-sm'
                  : 'bg-[#242b2a] text-[#859491] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
