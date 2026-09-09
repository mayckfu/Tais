import React from 'react';
import { User, UserRole } from '../types';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  ArrowRightLeft,
  Clock,
  FolderSync,
  BarChart3,
  Network,
  Trophy,
  FileSpreadsheet,
  Settings,
  X,
  Tablet,
  CheckCircle2,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'new_request'
  | 'requests'
  | 'denf_queue'
  | 'relocations'
  | 'followup'
  | 'sector_demand'
  | 'rankings'
  | 'indicators'
  | 'reports'
  | 'settings'
  | string;

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: any) => void;
  currentUser?: User;
  userRole?: UserRole;
  pendingQueueCount?: number;
  activeRelocationsCount?: number;
  followUpCount?: number;
  counts?: {
    pendingAnalysis?: number;
    critical?: number;
    activeRelocations?: number;
    managementFollowUps?: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  userRole: propUserRole,
  pendingQueueCount = 0,
  activeRelocationsCount = 0,
  followUpCount = 0,
  counts,
  isMobileOpen = false,
  onCloseMobile,
  onOpenInstallModal,
}) => {
  const role = currentUser?.role || propUserRole || 'solicitante';
  const canAccessDENF = role === 'denf' || role === 'admin' || role === 'coordenador';
  const canAccessAdmin = role === 'admin' || role === 'denf' || role === 'coordenador';

  const pendingCount = counts?.pendingAnalysis ?? pendingQueueCount;
  const activeRelocCount = counts?.activeRelocations ?? activeRelocationsCount;
  const followUps = counts?.managementFollowUps ?? followUpCount;

  const isTabActive = (tabKey: string) => {
    if (tabKey === 'dashboard') return currentTab === 'dashboard';
    if (tabKey === 'new_request') return currentTab === 'new_request' || currentTab === 'nova_solicitacao';
    if (tabKey === 'requests') return currentTab === 'requests' || currentTab === 'solicitacoes';
    if (tabKey === 'denf_queue') return currentTab === 'denf_queue' || currentTab === 'pendentes_analise';
    if (tabKey === 'relocations') return currentTab === 'relocations' || currentTab === 'remanejamentos';
    if (tabKey === 'followup') return currentTab === 'followup' || currentTab === 'acompanhamento_gerencial';
    if (tabKey === 'sector_demand') return currentTab === 'sector_demand' || currentTab === 'mapa_demanda';
    if (tabKey === 'rankings') return currentTab === 'rankings';
    if (tabKey === 'indicators') return currentTab === 'indicators' || currentTab === 'indicadores';
    if (tabKey === 'reports') return currentTab === 'reports' || currentTab === 'relatorios';
    if (tabKey === 'settings') return currentTab === 'settings' || currentTab === 'configuracoes' || currentTab === 'auditoria';
    return currentTab === tabKey;
  };

  const handleItemClick = (tabKey: string) => {
    onSelectTab(tabKey);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#2D2D2A]">
      {/* Mobile/Tablet Drawer Header (Only visible in mobile overlay) */}
      <div className="lg:hidden p-4 bg-[#5A5A40] text-white flex items-center justify-between border-b border-[#4A4A35]">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-base">Menu do Sistema</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20">
            Tablet & Mobile
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-3.5 border-b border-[#E8E6D9] bg-[#F9F7F2]/50">
        <button
          id="btn-nav-nova-solicitacao"
          onClick={() => handleItemClick('new_request')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all min-h-[44px] ${
            isTabActive('new_request')
              ? 'bg-[#4A4A35] ring-2 ring-[#8C9C82] ring-offset-2'
              : 'bg-[#5A5A40] hover:bg-[#4A4A35]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[#D1A661]" />
          <span>+ Nova Solicitação</span>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto text-xs font-medium touch-scroll">
        {/* OPERACIONAL & GESTÃO GERAL */}
        <div className="px-3 pb-1 pt-1 text-[10px] font-bold tracking-widest text-[#8C9C82] uppercase">
          Operação & Fila
        </div>

        <button
          id="nav-tab-dashboard"
          onClick={() => handleItemClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('dashboard')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 shrink-0 ${isTabActive('dashboard') ? 'text-white' : 'text-[#8C9C82]'}`} />
          <span>Dashboard</span>
        </button>

        <button
          id="nav-tab-solicitacoes"
          onClick={() => handleItemClick('requests')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('requests')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ClipboardList className={`w-4 h-4 shrink-0 ${isTabActive('requests') ? 'text-white' : 'text-[#8C9C82]'}`} />
            <span>Solicitações</span>
          </div>
        </button>

        {/* DENF / DIRETORIA QUEUE */}
        <button
          id="nav-tab-pendentes-analise"
          onClick={() => handleItemClick('denf_queue')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('denf_queue')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className={`w-4 h-4 shrink-0 ${isTabActive('denf_queue') ? 'text-white' : 'text-[#D1A661]'}`} />
            <span>Fila Central DENF</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D1A661] text-[#2D2D2A]">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          id="nav-tab-remanejamentos"
          onClick={() => handleItemClick('relocations')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('relocations')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ArrowRightLeft className={`w-4 h-4 shrink-0 ${isTabActive('relocations') ? 'text-white' : 'text-[#8C9C82]'}`} />
            <span>Remanejamentos</span>
          </div>
          {activeRelocCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5A5A40] text-white">
              {activeRelocCount}
            </span>
          )}
        </button>

        {/* GESTÃO & CONTROLE ASSISTENCIAL */}
        <div className="px-3 pb-1 pt-3 text-[10px] font-bold tracking-widest text-[#8C9C82] uppercase">
          Controle Assistencial
        </div>

        <button
          id="nav-tab-acompanhamento-gerencial"
          onClick={() => handleItemClick('followup')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('followup')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderSync className={`w-4 h-4 shrink-0 ${isTabActive('followup') ? 'text-white' : 'text-[#8C9C82]'}`} />
            <span>Acompanhamento Gerencial</span>
          </div>
          {followUps > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9E5A4E] text-white">
              {followUps}
            </span>
          )}
        </button>

        <button
          id="nav-tab-mapa-demanda"
          onClick={() => handleItemClick('sector_demand')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('sector_demand')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <Network className={`w-4 h-4 shrink-0 ${isTabActive('sector_demand') ? 'text-white' : 'text-[#8C9C82]'}`} />
          <span>Mapa de Demanda</span>
        </button>

        <button
          id="nav-tab-rankings"
          onClick={() => handleItemClick('rankings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('rankings')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <Trophy className={`w-4 h-4 shrink-0 ${isTabActive('rankings') ? 'text-white' : 'text-[#D1A661]'}`} />
          <span>Rankings de Ausências</span>
        </button>

        <button
          id="nav-tab-indicadores"
          onClick={() => handleItemClick('indicators')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('indicators')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <BarChart3 className={`w-4 h-4 shrink-0 ${isTabActive('indicators') ? 'text-white' : 'text-[#8C9C82]'}`} />
          <span>Indicadores & Eficiência</span>
        </button>

        <button
          id="nav-tab-relatorios"
          onClick={() => handleItemClick('reports')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
            isTabActive('reports')
              ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
              : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
          }`}
        >
          <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isTabActive('reports') ? 'text-white' : 'text-[#8C9C82]'}`} />
          <span>Relatórios & Fechamento</span>
        </button>

        {/* GESTÃO & GOVERNANÇA */}
        {(canAccessDENF || canAccessAdmin) && (
          <>
            <div className="px-3 pb-1 pt-3 text-[10px] font-bold tracking-widest text-[#8C9C82] uppercase">
              Governança & Parâmetros
            </div>

            <button
              id="nav-tab-configuracoes"
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[40px] ${
                isTabActive('settings')
                  ? 'bg-[#5A5A40] text-white font-semibold shadow-xs'
                  : 'text-[#7D7D72] hover:bg-[#F9F7F2] hover:text-[#2D2D2A]'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${isTabActive('settings') ? 'text-white' : 'text-[#8E8E80]'}`} />
              <span>Configurações & Setores</span>
            </button>
          </>
        )}

        {/* Tablet PWA Install Trigger */}
        {onOpenInstallModal && (
          <div className="pt-3">
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenInstallModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#D1A661]/40 bg-[#D1A661]/15 hover:bg-[#D1A661]/25 text-[#7A581E] font-bold text-xs transition-colors"
            >
              <Tablet className="w-4 h-4 text-[#D1A661] shrink-0" />
              <span>Instalar no Tablet / App</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer System Info */}
      <div className="p-3.5 border-t border-[#E8E6D9] text-[11px] text-[#7D7D72] flex flex-col gap-1 bg-[#F9F7F2]/60">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#2D2D2A]">DENF Central v2.4</span>
          <span className="text-[#8C9C82] font-mono text-[10px] font-bold">TABLET READY</span>
        </div>
        <div className="text-[10px] text-[#8E8E80]">
          Padrão Assistencial Seguro
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg: and above) */}
      <aside
        id="app-sidebar"
        className="hidden lg:flex w-64 bg-white text-[#2D2D2A] flex-col shrink-0 rounded-2xl border border-[#E8E6D9] shadow-xs overflow-hidden"
      >
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Drawer (Below lg:) */}
      {isMobileOpen && (
        <div
          id="mobile-tablet-sidebar-drawer"
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#2D2D2A]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Slide-out panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
