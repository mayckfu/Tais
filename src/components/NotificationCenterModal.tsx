import React, { useState, useEffect } from 'react';
import { SystemAlert, User, DeficitRequest, isAlertRelevantToUser } from '../types';
import {
  playHospitalChime,
  triggerHapticAlert,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  sendNativePushNotification,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings,
  SoundType,
} from '../services/soundEngine';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCheck,
  Trash2,
  X,
  Play,
  Flame,
  AlertTriangle,
  Info,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  ExternalLink,
  Radio,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  currentUser: User;
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onClearReadAlerts: () => void;
  onNavigateToRequest: (requestId: string) => void;
  onTriggerSimulatedAlert?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearReadAlerts,
  onNavigateToRequest,
  onTriggerSimulatedAlert,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_sector' | 'unread' | 'critical'>('all');
  const [showGlobalScope, setShowGlobalScope] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSoundPlaying, setTestSoundPlaying] = useState<SoundType | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (updated.soundEnabled) {
      playHospitalChime('dispatch', updated.volume);
    }
  };

  const handleToggleHaptic = () => {
    const updated = { ...settings, hapticEnabled: !settings.hapticEnabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (updated.hapticEnabled) {
      triggerHapticAlert([100, 50, 100]);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const updated = { ...settings, volume: newVol };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleRequestPushPermission = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      sendNativePushNotification(
        'Hospital Central - Notificações Ativas',
        'Você receberá alertas sonoros e visuais de deliberações da DENF diretamente no seu posto.'
      );
    }
  };

  const handleTestChime = (sound: SoundType) => {
    setTestSoundPlaying(sound);
    playHospitalChime(sound, settings.volume);
    triggerHapticAlert();
    setTimeout(() => setTestSoundPlaying(null), 1000);
  };

  // Base list of alerts: filtered by user role unless showGlobalScope is enabled
  const baseAlerts = alerts.filter((item) =>
    showGlobalScope ? true : isAlertRelevantToUser(item, currentUser)
  );

  // Filter alerts by active sub-tab
  const filteredAlerts = baseAlerts.filter((item) => {
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'critical') return item.severity === 'critical';
    if (activeFilter === 'my_sector') {
      return (
        item.targetSector === currentUser.sector ||
        item.title.toLowerCase().includes(currentUser.sector.toLowerCase()) ||
        item.message.toLowerCase().includes(currentUser.sector.toLowerCase())
      );
    }
    return true;
  });

  const unreadCount = baseAlerts.filter((a) => !a.read).length;
  const sectorCount = baseAlerts.filter(
    (a) =>
      a.targetSector === currentUser.sector ||
      a.title.toLowerCase().includes(currentUser.sector.toLowerCase()) ||
      a.message.toLowerCase().includes(currentUser.sector.toLowerCase())
  ).length;

  const getRoleHeader = () => {
    switch (currentUser.role) {
      case 'solicitante':
        return {
          title: `Central de Alertas: Posto de Enfermagem (${currentUser.sector})`,
          subtitle: `Canal em tempo real do plantão • ${currentUser.name} (Enfermeiro(a) Solicitante)`,
          barTitle: 'Configuração de Alerta Clínico do Posto',
          simLabel: 'Simular Deliberação DENF',
          simTooltip: 'Dispara um alerta sonoro e pop-up de profissional a caminho para o seu posto',
        };
      case 'denf':
        return {
          title: 'Central de Alertas & Notificações da DENF',
          subtitle: `Painel de controle institucional • ${currentUser.name} (Diretoria de Enfermagem)`,
          barTitle: 'Configuração de Alertas da Central DENF',
          simLabel: 'Simular Deliberação DENF (Teste)',
          simTooltip: 'Testa o disparo sonoro e push enviado aos postos de enfermagem',
        };
      case 'coordenador':
        return {
          title: `Central de Notificações da Coordenação (${currentUser.sector})`,
          subtitle: `Acompanhamento assistencial e operacional • ${currentUser.name}`,
          barTitle: 'Configuração de Alertas da Coordenação',
          simLabel: 'Simular Alerta',
          simTooltip: 'Testar sinalização acústica',
        };
      default:
        return {
          title: 'Central de Notificações do Sistema',
          subtitle: `Governança hospitalar e auditoria • ${currentUser.name}`,
          barTitle: 'Configurações Globais de Alerta',
          simLabel: 'Simular Alerta de Teste',
          simTooltip: 'Testar sinalização acústica e push',
        };
    }
  };

  const headerInfo = getRoleHeader();

  return (
    <div
      id="modal-notification-center-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-notification-center-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#E8E6D9] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#F9F7F2] border-b border-[#E8E6D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">
                  {headerInfo.title}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D1A661] text-[#2D2D2A]">
                    {unreadCount} novos
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7D7D72]">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            id="btn-close-notification-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-[#7D7D72] hover:text-[#2D2D2A] hover:bg-[#E8E6D9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic & Preferences Bar (Sound, Haptic, Native Push) */}
        <div className="p-4 bg-[#F0EFEC] border-b border-[#E8E6D9] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#5A5A40] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Radio className="w-3.5 h-3.5 text-[#8C9C82]" />
              {headerInfo.barTitle}
            </span>

            {/* Quick Simulation Button */}
            {onTriggerSimulatedAlert && (
              <button
                id="btn-simulate-denf-deliberation"
                onClick={onTriggerSimulatedAlert}
                className="px-3 py-1.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                title={headerInfo.simTooltip}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D1A661]" />
                <span>{headerInfo.simLabel}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Acoustic Sound Toggle */}
            <div className="p-2.5 bg-white rounded-xl border border-[#E8E6D9] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#8C9C82]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#A84B2C]" />
                  )}
                  Alerta Sonoro
                </span>
                <button
                  id="btn-toggle-sound-pref"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-[#5A5A40]' : 'bg-[#D1D0C7]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.soundEnabled && (
                <div className="mt-2 pt-2 border-t border-[#F0EFEC] flex items-center justify-between gap-1">
                  <span className="text-[10px] text-[#7D7D72]">Toque 3 Tons:</span>
                  <button
                    id="btn-test-chime-dispatch"
                    onClick={() => handleTestChime('dispatch')}
                    disabled={testSoundPlaying !== null}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F9F7F2] hover:bg-[#E8E6D9] text-[#5A5A40] border border-[#E8E6D9] flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" />
                    {testSoundPlaying === 'dispatch' ? 'Tocando...' : 'Testar'}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Mobile Vibration Toggle */}
            <div className="p-2.5 bg-white rounded-xl border border-[#E8E6D9] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#7A581E]" />
                  Vibração Celular
                </span>
                <button
                  id="btn-toggle-haptic-pref"
                  onClick={handleToggleHaptic}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.hapticEnabled ? 'bg-[#5A5A40]' : 'bg-[#D1D0C7]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      settings.hapticEnabled ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-[#7D7D72] mt-1.5">
                Vibra no bolso do enfermeiro durante a ronda assistencial.
              </p>
            </div>

            {/* 3. Browser Push Permission */}
            <div className="p-2.5 bg-white rounded-xl border border-[#E8E6D9] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#5A5A40]" />
                  Push Navegador
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    permissionStatus === 'granted'
                      ? 'bg-[#8C9C82]/20 text-[#5A5A40]'
                      : permissionStatus === 'denied'
                      ? 'bg-[#A84B2C]/10 text-[#A84B2C]'
                      : 'bg-[#D1A661]/20 text-[#7A581E]'
                  }`}
                >
                  {permissionStatus === 'granted'
                    ? 'Ativo'
                    : permissionStatus === 'denied'
                    ? 'Bloqueado'
                    : 'Pendente'}
                </span>
              </div>

              {permissionStatus !== 'granted' && (
                <button
                  id="btn-request-browser-notification"
                  onClick={handleRequestPushPermission}
                  className="mt-2 w-full py-1 text-[10px] font-bold bg-[#E8E6D9] hover:bg-[#D1D0C7] text-[#2D2D2A] rounded transition-colors text-center"
                >
                  Autorizar Notificações
                </button>
              )}
              {permissionStatus === 'granted' && (
                <p className="text-[10px] text-[#8C9C82] font-medium mt-1">
                  Ativo mesmo com a tela em outra aba.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Filters & Profile Scope Toggle */}
        <div className="px-5 py-2.5 border-b border-[#E8E6D9] flex flex-wrap items-center justify-between gap-2 bg-[#F9F7F2]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              id="filter-alerts-all"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#E8E6D9] border border-[#E8E6D9]'
              }`}
            >
              Todos ({baseAlerts.length})
            </button>

            {currentUser.role === 'solicitante' && (
              <button
                id="filter-alerts-my-sector"
                onClick={() => setActiveFilter('my_sector')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'my_sector'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-white text-[#7D7D72] hover:bg-[#E8E6D9] border border-[#E8E6D9]'
                }`}
              >
                Meu Setor ({currentUser.sector}) ({sectorCount})
              </button>
            )}

            <button
              id="filter-alerts-unread"
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'unread'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#E8E6D9] border border-[#E8E6D9]'
              }`}
            >
              Não Lidos ({unreadCount})
            </button>

            <button
              id="filter-alerts-critical"
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'critical'
                  ? 'bg-[#A84B2C] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#E8E6D9] border border-[#E8E6D9]'
              }`}
            >
              Críticos
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Scope Toggle: Profile vs All hospital */}
            <button
              id="btn-toggle-profile-scope"
              onClick={() => setShowGlobalScope(!showGlobalScope)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                showGlobalScope
                  ? 'bg-[#5A5A40] text-white border-[#4A4A35]'
                  : 'bg-white text-[#5A5A40] border-[#E8E6D9] hover:bg-[#E8E6D9]'
              }`}
              title="Alternar entre alertas do seu perfil ou de todo o hospital"
            >
              {showGlobalScope ? '👁️ Visão Geral (Todos os Perfis)' : `👤 Alertas de: ${currentUser.role === 'solicitante' ? 'Enfermeiro(a)' : currentUser.role.toUpperCase()}`}
            </button>

            {unreadCount > 0 && (
              <button
                id="btn-mark-all-alerts-read"
                onClick={onMarkAllAsRead}
                className="text-[11px] font-bold text-[#5A5A40] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar lidos
              </button>
            )}

            <button
              id="btn-clear-read-alerts"
              onClick={onClearReadAlerts}
              className="text-[11px] font-medium text-[#7D7D72] hover:text-[#A84B2C] flex items-center gap-1"
              title="Limpar notificações lidas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar lidos
            </button>
          </div>
        </div>

        {/* Alerts List Stage */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-[#7D7D72]">
              <div className="w-12 h-12 rounded-full bg-[#F0EFEC] text-[#5A5A40] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-bold text-[#2D2D2A]">Nenhum alerta nesta visualização</p>
              <p className="text-xs mt-1">
                Todas as ocorrências e deliberações da DENF para o seu setor aparecerão aqui.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isDeliberation =
                alert.type === 'deliberation' ||
                alert.title.toLowerCase().includes('deliberação') ||
                alert.title.toLowerCase().includes('remanejamento');
              const isCritical = alert.severity === 'critical';

              return (
                <div
                  key={alert.id}
                  id={`alert-card-${alert.id}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !alert.read
                      ? 'bg-[#F9F7F2] border-[#5A5A40] shadow-xs'
                      : 'bg-white border-[#E8E6D9] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-[#A84B2C]'
                            : isDeliberation
                            ? 'bg-[#5A5A40]'
                            : 'bg-[#7A581E]'
                        }`}
                      >
                        {isCritical ? (
                          <Flame className="w-4 h-4" />
                        ) : isDeliberation ? (
                          <Navigation className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCritical
                                ? 'bg-[#A84B2C] text-white'
                                : isDeliberation
                                ? 'bg-[#5A5A40] text-white'
                                : 'bg-[#E8E6D9] text-[#5A5A40]'
                            }`}
                          >
                            {isDeliberation ? 'Deliberação DENF' : alert.severity.toUpperCase()}
                          </span>

                          <span className="font-mono text-xs font-bold text-[#2D2D2A]">
                            {alert.protocol}
                          </span>

                          <span className="text-[10px] font-medium text-[#7A581E] bg-[#D1A661]/20 px-1.5 py-0.5 rounded">
                            {alert.targetRole === 'solicitante'
                              ? `Para: Posto (${alert.targetSector || 'Enfermeiro'})`
                              : alert.targetRole === 'denf'
                              ? 'Para: Gestão DENF'
                              : alert.targetRole === 'coordenador'
                              ? 'Para: Coordenação'
                              : 'Para: Hospital'}
                          </span>

                          {alert.targetSector && alert.targetRole !== 'solicitante' && (
                            <span className="text-[10px] font-semibold text-[#5A5A40] bg-[#E8E6D9]/60 px-1.5 py-0.5 rounded">
                              Setor: {alert.targetSector}
                            </span>
                          )}

                          <span className="text-[10px] text-[#7D7D72]">
                            {alert.timestamp}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[#2D2D2A] mt-1">
                          {alert.title}
                        </h4>

                        <p className="text-xs text-[#5A5A40] mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Extra metadata if available */}
                        {alert.professionalName && (
                          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-[#2D2D2A]">
                            <span className="px-2 py-0.5 rounded bg-white border border-[#E8E6D9] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#8C9C82]" />
                              Profissional: {alert.professionalName}
                            </span>
                            {alert.etaMinutes && (
                              <span className="text-[#7A581E] font-medium">
                                Previsão: {alert.etaMinutes} min
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {!alert.read && (
                        <button
                          id={`btn-mark-read-${alert.id}`}
                          onClick={() => onMarkAsRead(alert.id)}
                          className="text-[10px] font-bold text-[#5A5A40] hover:underline"
                        >
                          Marcar lido
                        </button>
                      )}

                      <button
                        id={`btn-nav-protocol-${alert.id}`}
                        onClick={() => {
                          onNavigateToRequest(alert.requestId);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#F0EFEC] hover:bg-[#E8E6D9] text-[#2D2D2A] text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <span>Ver Protocolo</span>
                        <ArrowRight className="w-3 h-3 text-[#5A5A40]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F7F2] border-t border-[#E8E6D9] flex items-center justify-between text-xs text-[#7D7D72]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8C9C82]" />
            <span>Notificações auditadas e vinculadas aos protocolos COREN/COFEN.</span>
          </div>

          <button
            id="btn-close-modal-bottom"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs transition-colors"
          >
            Fechar Central
          </button>
        </div>
      </div>
    </div>
  );
};
