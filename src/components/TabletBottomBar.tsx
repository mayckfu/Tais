import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  ArrowRightLeft,
  Menu,
} from 'lucide-react';
import { NavigationTab } from '../App';

interface TabletBottomBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onToggleMenu: () => void;
  pendingCount: number;
  activeRelocationsCount: number;
}

export const TabletBottomBar: React.FC<TabletBottomBarProps> = ({
  currentTab,
  onSelectTab,
  onToggleMenu,
  pendingCount,
  activeRelocationsCount,
}) => {
  return (
    <nav
      id="tablet-bottom-navigation"
      aria-label="Navegação Rápida para Tablet"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E6D9] pb-safe shadow-lg px-2"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            currentTab === 'dashboard'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#8E8E80] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {currentTab === 'dashboard' && (
              <span className="w-1 h-1 rounded-full bg-[#5A5A40] mx-auto mt-0.5 block" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Painel</span>
        </button>

        {/* 2. Fila DENF */}
        <button
          onClick={() => onSelectTab('denf_queue')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors relative ${
            currentTab === 'denf_queue'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#8E8E80] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#9E5A4E] text-[9px] font-bold text-white shadow-xs">
                {pendingCount}
              </span>
            )}
            {currentTab === 'denf_queue' && (
              <span className="w-1 h-1 rounded-full bg-[#5A5A40] mx-auto mt-0.5 block" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Fila DENF</span>
        </button>

        {/* 3. + Novo Déficit (Center Prominent) */}
        <button
          onClick={() => onSelectTab('new_request')}
          className="flex flex-col items-center justify-center -mt-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white flex items-center justify-center shadow-md border-2 border-white transition-all transform active:scale-95">
            <PlusCircle className="w-6 h-6 text-[#D1A661]" />
          </div>
          <span className="text-[9px] font-bold text-[#5A5A40] mt-0.5">+ Déficit</span>
        </button>

        {/* 4. Remanejamentos */}
        <button
          onClick={() => onSelectTab('relocations')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors relative ${
            currentTab === 'relocations'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#8E8E80] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="relative">
            <ArrowRightLeft className="w-5 h-5" />
            {activeRelocationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#5A5A40] text-[9px] font-bold text-white shadow-xs">
                {activeRelocationsCount}
              </span>
            )}
            {currentTab === 'relocations' && (
              <span className="w-1 h-1 rounded-full bg-[#5A5A40] mx-auto mt-0.5 block" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Remanejar</span>
        </button>

        {/* 5. Menu Drawer Toggle */}
        <button
          onClick={onToggleMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] text-[#8E8E80] hover:text-[#2D2D2A] transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
