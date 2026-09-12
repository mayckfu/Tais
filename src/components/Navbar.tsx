import React, { useState } from 'react';
import { User, SystemAlert, isAlertRelevantToUser } from '../types';
import { usePlatform } from '../hooks/usePlatform';
import {
  Bell,
  Building2,
  ChevronDown,
  Shield,
  UserCheck,
  Check,
  AlertTriangle,
  Flame,
  Info,
  Menu,
  Smartphone,
  Monitor,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  alerts: SystemAlert[];
  onSelectUser: (user: User) => void;
  onSwitchUser?: (user: User) => void;
  onOpenAlerts: () => void;
  onNavigateToRequest?: (requestId: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  alerts,
  onSelectUser,
  onSwitchUser,
  onOpenAlerts,
  onToggleMobileMenu,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  const userAlerts = alerts.filter((a) => isAlertRelevantToUser(a, currentUser));
  const unreadAlerts = userAlerts.filter((a) => !a.read);
  const { isMobile, detectedType, platformMode, setPlatformMode } = usePlatform();

  const handleUserSelect = onSelectUser || onSwitchUser;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'solicitante':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8E6D9]/70 text-[#5A5A40] border border-[#E8E6D9]">
            Unidade / Solicitante
          </span>
        );
      case 'coordenador':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1A661]/20 text-[#7A581E] border border-[#D1A661]/40">
            Coordenador / Supervisor
          </span>
        );
      case 'denf':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5A5A40] text-white border border-[#4A4A35]">
            DENF / Diretoria
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D2D2A] text-white">
            Administrador
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header id="app-navbar" className="bg-white/80 backdrop-blur-md border-b border-[#E8E6D9] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile/Tablet Hamburger Toggle + Brand / Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {onToggleMobileMenu && (
              <button
                id="btn-toggle-tablet-menu"
                onClick={onToggleMobileMenu}
                aria-label="Abrir Menu de Navegação"
                className="lg:hidden p-2 rounded-xl text-[#5A5A40] hover:bg-[#F0EFEC] transition-colors shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif font-bold text-xs sm:text-sm md:text-base tracking-tight text-[#2D2D2A] truncate">
                  HOSPITAL CENTRAL
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E8E6D9]/70 text-[#5A5A40] font-bold border border-[#E8E6D9] shrink-0">
                  DENF
                </span>
              </div>
              <h1 className="text-[10px] sm:text-xs text-[#7D7D72] font-medium truncate max-w-[130px] sm:max-w-[190px] md:max-w-[240px] lg:max-w-none">
                Gestão de Déficit & Remanejamento
              </h1>
            </div>
          </div>

          {/* Center / Fast Notice */}
          <div className="hidden xl:flex items-center gap-4 text-xs shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F9F7F2] border border-[#E8E6D9] text-[#7D7D72]">
              <span className="w-2 h-2 rounded-full bg-[#8C9C82]" />
              <span>Plantão Ativo: <strong className="text-[#2D2D2A]">Diurno 12h</strong></span>
              <span className="text-[#E8E6D9]">|</span>
              <span className="text-[#5A5A40] font-medium">Central DENF Operando</span>
            </div>
          </div>

          {/* Right Controls: Platform Indicator, Notifications & Profile Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Automatic Platform Recognition Indicator */}
            <div className="relative">
              <button
                id="btn-platform-mode-selector"
                onClick={() => setShowPlatformMenu(!showPlatformMenu)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
                  isMobile
                    ? 'bg-[#E8E6D9]/90 text-[#5A5A40] border-[#8C9C82]/60 ring-1 ring-[#8C9C82]/30'
                    : 'bg-[#F9F7F2] text-[#7D7D72] border-[#E8E6D9] hover:text-[#2D2D2A]'
                }`}
                title="Detecção Automática de Plataforma (Mobile / Desktop)"
              >
                {isMobile ? (
                  <Smartphone className="w-3.5 h-3.5 text-[#5A5A40]" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-[#7D7D72]" />
                )}
                <span className="hidden sm:inline">
                  {platformMode === 'auto'
                    ? `Auto: ${isMobile ? 'Mobile' : 'Desktop'}`
                    : platformMode === 'mobile'
                    ? 'Mobile (Forçado)'
                    : 'Desktop (Forçado)'}
                </span>
                <span className="sm:hidden text-[10px]">
                  {isMobile ? 'Mobile' : 'PC'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Platform Dropdown */}
              {showPlatformMenu && (
                <div
                  id="platform-mode-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E8E6D9] p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8E6D9]">
                    <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#8C9C82]" />
                      Plataforma & Interface
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#F9F7F2] text-[#7D7D72] border border-[#E8E6D9]">
                      {detectedType}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7D7D72] mt-2 mb-3">
                    O sistema adapta automaticamente os gráficos e cartões de protocolo ao dispositivo detectado.
                  </p>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setPlatformMode('auto');
                        setShowPlatformMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between border transition-all ${
                        platformMode === 'auto'
                          ? 'bg-[#5A5A40] text-white border-[#4A4A35] font-bold'
                          : 'bg-[#F9F7F2] text-[#2D2D2A] border-[#E8E6D9] hover:bg-[#E8E6D9]'
                      }`}
                    >
                      <div>
                        <div className="font-bold">Automático (Padrão)</div>
                        <div className={`text-[10px] ${platformMode === 'auto' ? 'text-white/80' : 'text-[#7D7D72]'}`}>
                          Detecta tela ({detectedType})
                        </div>
                      </div>
                      {platformMode === 'auto' && <Check className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setPlatformMode('mobile');
                        setShowPlatformMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between border transition-all ${
                        platformMode === 'mobile'
                          ? 'bg-[#5A5A40] text-white border-[#4A4A35] font-bold'
                          : 'bg-[#F9F7F2] text-[#2D2D2A] border-[#E8E6D9] hover:bg-[#E8E6D9]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <div>
                          <div className="font-bold">Forçar Modo Mobile</div>
                          <div className={`text-[10px] ${platformMode === 'mobile' ? 'text-white/80' : 'text-[#7D7D72]'}`}>
                            Cartões de protocolo & gráficos verticais
                          </div>
                        </div>
                      </div>
                      {platformMode === 'mobile' && <Check className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setPlatformMode('desktop');
                        setShowPlatformMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between border transition-all ${
                        platformMode === 'desktop'
                          ? 'bg-[#5A5A40] text-white border-[#4A4A35] font-bold'
                          : 'bg-[#F9F7F2] text-[#2D2D2A] border-[#E8E6D9] hover:bg-[#E8E6D9]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <div>
                          <div className="font-bold">Forçar Modo Desktop</div>
                          <div className={`text-[10px] ${platformMode === 'desktop' ? 'text-white/80' : 'text-[#7D7D72]'}`}>
                            Tabelas completas & matriz em colunas
                          </div>
                        </div>
                      </div>
                      {platformMode === 'desktop' && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenAlerts}
              className="relative p-2 rounded-full text-[#7D7D72] hover:text-[#2D2D2A] hover:bg-[#F0EFEC] transition-colors shrink-0"
              title="Central de Alertas & Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#D1A661] text-[10px] font-bold text-[#2D2D2A] shadow-xs">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* User Profile Switcher */}
            <div className="relative shrink-0">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-2.5 pl-2.5 sm:pl-3 pr-2 sm:pr-2.5 py-1.5 rounded-full border border-[#E8E6D9] hover:border-[#8C9C82] hover:bg-[#F9F7F2] bg-white transition-all text-left shadow-xs"
              >
                <div className="w-8 h-8 rounded-full bg-[#E8E6D9] border border-white text-[#5A5A40] flex items-center justify-center font-serif font-bold text-xs shrink-0">
                  {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-[#2D2D2A] flex items-center gap-1.5">
                    <span className="truncate max-w-[100px] sm:max-w-[120px] lg:max-w-none">{currentUser.name}</span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <div className="text-[11px] text-[#8E8E80] hidden xl:flex items-center gap-1">
                    <span className="truncate max-w-[100px]">{currentUser.sector}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{currentUser.registrationNumber}</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#8E8E80] shrink-0" />
              </button>

              {/* User Dropdown to switch roles */}
              {showUserMenu && (
                <div
                  id="user-profile-dropdown"
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#E8E6D9] py-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-[#E8E6D9]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C9C82]">
                      Alternar Perfil de Teste (4 Perfis)
                    </p>
                    <p className="text-[11px] text-[#7D7D72] mt-0.5">
                      Troque de usuário para validar fluxos específicos de cada permissão:
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1">
                    {allUsers.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          id={`btn-switch-user-${user.id}`}
                          onClick={() => {
                            onSelectUser(user);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[#F9F7F2] transition-colors ${
                            isSelected ? 'bg-[#F0EFEC] border-l-4 border-[#5A5A40]' : ''
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#E8E6D9] flex items-center justify-center text-[#5A5A40] font-serif font-bold text-xs shrink-0 mt-0.5">
                            {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#2D2D2A] truncate">
                                {user.name}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#5A5A40] shrink-0" />}
                            </div>
                            <div className="text-[11px] text-[#5A5A40] font-medium">
                              {user.roleTitle}
                            </div>
                            <div className="text-[10px] text-[#8E8E80] flex items-center gap-1.5 mt-0.5">
                              <span>Setor: {user.sector}</span>
                              <span>•</span>
                              <span className="font-mono">{user.registrationNumber}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2 bg-[#F9F7F2] border-t border-[#E8E6D9] text-[11px] text-[#7D7D72]">
                    <span className="font-bold text-[#5A5A40]">Regras de Acesso:</span>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside text-[10px] text-[#8E8E80]">
                      <li>Solicitante: cria e acompanha setor próprio</li>
                      <li>Coordenador: avalia tentativas e supervisiona</li>
                      <li>DENF: autoriza remanejamento, define origem/destino</li>
                      <li>Administrador: configurações, auditoria e usuários</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
