import React from 'react';
import { InvestigationCase } from '../../types';

interface HeaderProps {
  currentCase: InvestigationCase;
  onOpenCaseSelector: () => void;
  onOpenAlerts: () => void;
  onOpenSettings: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  onOpenCaseSelector,
  onOpenAlerts,
  onOpenSettings,
  searchQuery = '',
  onSearchChange,
  showSearch = false,
}) => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-256px)] h-14 z-40 border-b border-[#3c4948]/25 bg-[#090f0f]/95 backdrop-blur-md flex justify-between items-center px-5 shadow-sm">
      {/* Left: System Status Banner */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-[11px] text-[#7bd6d1] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#66FCF1] shadow-[0_0_8px_#66FCF1] animate-pulse"></span>
          <span>SYSTEM STATUS: INTELLIGENCE ENGINE ONLINE</span>
        </div>
        <div className="h-4 w-px bg-[#3c4948]/40 hidden md:block"></div>
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-[#859491]">
          <span>ACTIVE CONTEXT:</span>
          <span className="text-[#66FCF1] bg-[#1a2120] px-2 py-0.5 rounded border border-[#3c4948]/50">
            {currentCase.id}
          </span>
        </div>
      </div>

      {/* Center Search (Optional on Network/Entities views) */}
      {showSearch && (
        <div className="hidden md:flex items-center bg-[#0B0C10] border border-[#45A29E]/30 px-3 py-1 w-64 rounded-sm focus-within:border-[#66FCF1] transition-colors">
          <span className="material-symbols-outlined text-[#7bd6d1] text-[16px] mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search network nodes, IDs..."
            className="bg-transparent border-none text-[12px] text-white focus:outline-none w-full placeholder:text-[#859491]/60 p-0 h-6 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="text-[#859491] hover:text-white text-[12px]"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        {/* Case Selector Button */}
        <button
          onClick={onOpenCaseSelector}
          className="font-mono text-[10px] font-bold text-[#bacac7] hover:text-white uppercase tracking-widest px-3 py-1.5 rounded bg-[#1a2120] border border-[#3c4948]/50 hover:border-[#66FCF1]/60 transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[15px] text-[#66FCF1]">folder_open</span>
          CASE SELECTOR
        </button>

        <div className="flex items-center gap-3 border-l border-[#3c4948]/30 pl-4 text-[#bacac7]">
          {/* Notifications / Alerts Button */}
          <button
            onClick={onOpenAlerts}
            className="p-1.5 rounded hover:bg-[#242b2a] hover:text-[#66FCF1] transition-colors relative"
            title="Intelligence Alerts"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-[#242b2a] hover:text-[#66FCF1] transition-colors"
            title="System Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          {/* Investigator Avatar */}
          <div className="flex items-center gap-2.5 ml-1 group cursor-pointer" onClick={onOpenSettings}>
            <div className="relative w-8 h-8 rounded-full border border-[#3c4948]/80 overflow-hidden bg-[#242b2a] shadow-md group-hover:border-[#66FCF1] transition-colors">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnnIxkMwXLile8lAb3DfFelA4H9USqUkNgLB2BYzv4tseszPLRKXh6crm7C5Z1hfy5ONXh4UQFRcQ6OCxVuSVmvmfLD5FBH9tWfr6oAwGYUpbnI9UZHON6dKIaMN6u5DJNsArFtPMD7oNSLfw8737_rFhfiyJ55hq9RepMilmxJiqnNwY3rP77cfvA3j3O7-JluNH8QQrINvRRJpr1EbUNw9sh7-0it32R-gW1PalfZt-jbkQjny2w"
                alt="Investigator Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#66FCF1] border border-[#090f0f]"></span>
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-mono text-[11px] font-bold text-white leading-tight">AGT. REYNOLDS</span>
              <span className="font-mono text-[9px] text-[#7bd6d1] leading-tight">TS/SCI CLEARANCE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
