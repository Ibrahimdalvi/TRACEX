import React from 'react';
import { ActiveView } from '../../types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenSystemStatus: () => void;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenSystemStatus,
  unreadAlertsCount = 0,
}) => {
  const navItems: Array<{
    id: ActiveView;
    label: string;
    icon: string;
    badge?: number;
    section?: string;
  }> = [
    { id: 'command-center', label: 'COMMAND CENTER', icon: 'dashboard', section: 'OPERATIONS' },
    { id: 'investigations', label: 'INVESTIGATIONS', icon: 'manage_search' },
    { id: 'network', label: 'NETWORK GRAPH', icon: 'hub', section: 'INTELLIGENCE' },
    { id: 'intelligence', label: 'INTELLIGENCE', icon: 'psychology' },
    { id: 'entities', label: 'ENTITIES', icon: 'groups' },
    { id: 'timeline', label: 'TIMELINE', icon: 'timeline', section: 'RECORDS' },
    { id: 'evidence', label: 'EVIDENCE VAULT', icon: 'folder_open' },
    { id: 'reports', label: 'REPORTS', icon: 'description' },
    { id: 'alerts', label: 'ALERTS', icon: 'notifications_active', badge: unreadAlertsCount, section: 'MONITOR' },
  ];

  let lastSection = '';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#090f0f] border-r border-[#3c4948]/25 flex flex-col z-50 shadow-2xl select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#3c4948]/25">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a2120] flex items-center justify-center border border-[#3c4948]/50 shadow-inner flex-shrink-0">
            <span className="material-symbols-outlined text-[#66FCF1]" style={{ fontSize: '20px' }}>
              security
            </span>
          </div>
          <div>
            <h1 className="font-sans text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-tight">
              TRACEX
              <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse inline-block flex-shrink-0"></span>
            </h1>
            <p className="font-mono text-[9px] font-bold tracking-widest text-[#859491] uppercase leading-tight">
              CRIMINAL INTELLIGENCE
            </p>
          </div>
        </div>
      </div>

      {/* AI Copilot Action Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => onSelectView('alerts')}
          className={`w-full py-2 px-3 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-2.5 transition-all duration-150 ${
            activeView === 'alerts'
              ? 'bg-[#66FCF1] text-[#00201e] shadow-[0_0_12px_rgba(102,252,241,0.2)]'
              : 'bg-[#1a2120] text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#242b2a] hover:border-[#66FCF1]/60'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">smart_toy</span>
          AI COPILOT
          <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeView === 'alerts' ? 'bg-[#00201e]' : 'bg-[#ffb4ab] animate-pulse'}`}></span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 flex flex-col px-2 overflow-y-auto py-1 gap-0.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="px-3 pt-3 pb-1">
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#3c4948] uppercase">
                    {item.section}
                  </span>
                </div>
              )}
              <button
                onClick={() => onSelectView(item.id)}
                title={item.label}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left group relative ${
                  isActive
                    ? 'bg-[#66FCF1]/10 text-white'
                    : 'text-[#859491] hover:bg-[#1a2120] hover:text-[#dde4e2]'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#66FCF1] rounded-r-full" />
                )}

                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined transition-colors flex-shrink-0 ${
                      isActive ? 'text-[#66FCF1]' : 'text-[#4a5a58] group-hover:text-[#7bd6d1]'
                    }`}
                    style={{ fontSize: '18px' }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-mono text-[10px] tracking-wider uppercase font-semibold transition-colors ${
                      isActive ? 'text-white font-bold' : 'text-[#859491] group-hover:text-[#dde4e2]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded font-mono text-[8px] font-bold bg-[#93000a] text-[#ffdad6] flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-[#3c4948]/25">
        <button
          onClick={onOpenSystemStatus}
          className="w-full flex items-center gap-2.5 py-2 px-3 text-[#859491] hover:text-[#66FCF1] hover:bg-[#1a2120] rounded-lg transition-colors text-left"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] flex-shrink-0"></span>
          <span className="font-mono text-[9px] tracking-wider uppercase flex-1">SYSTEM ONLINE</span>
          <span className="material-symbols-outlined text-[16px]">settings</span>
        </button>
      </div>
    </aside>
  );
};
