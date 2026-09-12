import React, { useEffect, useState } from 'react';
import { SystemAlert, DeficitRequest } from '../types';
import {
  playHospitalChime,
  triggerHapticAlert,
  getNotificationSettings,
  saveNotificationSettings,
} from '../services/soundEngine';
import {
  BellRing,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Navigation,
} from 'lucide-react';

interface FloatingAlertBannerProps {
  alert: SystemAlert | null;
  onDismiss: () => void;
  onOpenRequestDetails?: (requestId: string) => void;
  onOpenArrivalModal?: (request: DeficitRequest) => void;
  relatedRequest?: DeficitRequest | null;
}

export const FloatingAlertBanner: React.FC<FloatingAlertBannerProps> = ({
  alert,
  onDismiss,
  onOpenRequestDetails,
  onOpenArrivalModal,
  relatedRequest,
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const prefs = getNotificationSettings();
    setIsAudioEnabled(prefs.soundEnabled);
  }, []);

  // Auto-dismiss after 14 seconds with visual progress
  useEffect(() => {
    if (!alert) return;
    setProgress(100);

    const interval = 100;
    const totalDuration = 14000;
    const decrement = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const toggleSound = () => {
    const current = getNotificationSettings();
    const updated = !current.soundEnabled;
    saveNotificationSettings({ ...current, soundEnabled: updated });
    setIsAudioEnabled(updated);
    if (updated) {
      playHospitalChime('dispatch');
    }
  };

  const handleReplayChime = () => {
    playHospitalChime(alert.severity === 'critical' ? 'urgent' : 'dispatch');
    triggerHapticAlert();
  };

  const isRelocationActive =
    alert.type === 'deliberation' ||
    alert.type === 'displacement' ||
    alert.title.toLowerCase().includes('deslocamento') ||
    alert.title.toLowerCase().includes('remanejamento');

  return (
    <div
      id="floating-nurse-alert-banner"
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-full bg-white rounded-2xl shadow-2xl border-2 border-[#5A5A40] overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ring-4 ring-[#8C9C82]/20"
    >
      {/* Visual countdown progress bar */}
      <div className="w-full bg-[#E8E6D9] h-1.5">
        <div
          className="h-full bg-[#5A5A40] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 sm:p-5">
        {/* Header with Clinical Beacon & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="flex h-3 w-3 absolute -top-1 -right-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D1A661] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D1A661]"></span>
              </span>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-[#A84B2C]'
                    : alert.type === 'deliberation'
                    ? 'bg-[#5A5A40]'
                    : 'bg-[#7A581E]'
                }`}
              >
                {alert.severity === 'critical' ? (
                  <Flame className="w-5 h-5 text-white animate-pulse" />
                ) : alert.type === 'displacement' || isRelocationActive ? (
                  <Navigation className="w-5 h-5 text-white" />
                ) : (
                  <BellRing className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5A5A40] text-white">
                  {alert.type === 'deliberation'
                    ? 'Deliberação DENF'
                    : alert.type === 'displacement'
                    ? 'Em Deslocamento'
                    : alert.severity === 'critical'
                    ? 'Alerta Crítico'
                    : 'Aviso Assistencial'}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#D1A661]/20 text-[#7A581E]">
                  {alert.targetRole === 'solicitante'
                    ? `Destinatário: Posto ${alert.targetSector || 'Enfermagem'}`
                    : alert.targetRole === 'denf'
                    ? 'Destinatário: Gestão DENF'
                    : 'Destinatário: Geral'}
                </span>
                <span className="font-mono text-[11px] text-[#7D7D72] font-semibold">
                  {alert.protocol}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#2D2D2A] mt-0.5 leading-snug">
                {alert.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Audio chime replay button */}
            <button
              id="btn-replay-alert-audio"
              onClick={handleReplayChime}
              title="Tocar som de alerta novamente"
              aria-label="Tocar som de alerta"
              className="p-1.5 rounded-lg text-[#7D7D72] hover:text-[#5A5A40] hover:bg-[#F0EFEC] transition-colors"
            >
              <BellRing className="w-4 h-4" />
            </button>

            {/* Mute/Unmute Audio */}
            <button
              id="btn-toggle-alert-sound"
              onClick={toggleSound}
              title={isAudioEnabled ? 'Desativar som do posto' : 'Ativar som do posto'}
              aria-label={isAudioEnabled ? 'Desativar som' : 'Ativar som'}
              className="p-1.5 rounded-lg text-[#7D7D72] hover:text-[#5A5A40] hover:bg-[#F0EFEC] transition-colors"
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4 text-[#8C9C82]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#A84B2C]" />
              )}
            </button>

            {/* Close */}
            <button
              id="btn-dismiss-alert-banner"
              onClick={onDismiss}
              title="Dispensar alerta"
              aria-label="Dispensar alerta"
              className="p-1.5 rounded-lg text-[#7D7D72] hover:text-[#2D2D2A] hover:bg-[#F0EFEC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message body */}
        <p className="text-xs text-[#5A5A40] bg-[#F9F7F2] p-3 rounded-xl border border-[#E8E6D9] mt-3 font-medium leading-relaxed">
          {alert.message}
        </p>

        {/* Clinical ETA and Destination metadata if present */}
        {(alert.professionalName || alert.etaMinutes || alert.destinationSector) && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-[#7D7D72]">
            {alert.professionalName && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#2D2D2A] bg-white px-2 py-0.5 rounded border border-[#E8E6D9]">
                <UserCheck className="w-3.5 h-3.5 text-[#8C9C82]" />
                {alert.professionalName}
              </span>
            )}
            {alert.etaMinutes && (
              <span className="inline-flex items-center gap-1 text-[#7A581E] bg-[#D1A661]/15 px-2 py-0.5 rounded border border-[#D1A661]/30 font-medium">
                <Clock className="w-3.5 h-3.5" />
                Previsão de Chegada: ~{alert.etaMinutes} min
              </span>
            )}
          </div>
        )}

        {/* Bottom Action Triggers */}
        <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-[#E8E6D9]">
          <span className="text-[10px] text-[#7D7D72] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recebido às {alert.timestamp}
          </span>

          <div className="flex items-center gap-2">
            {/* Quick confirm arrival button if eligible */}
            {isRelocationActive && relatedRequest && onOpenArrivalModal && (
              <button
                id="btn-alert-confirm-arrival"
                onClick={() => {
                  onOpenArrivalModal(relatedRequest);
                  onDismiss();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#8C9C82] hover:bg-[#728368] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar Chegada</span>
              </button>
            )}

            {/* View Request Details */}
            {onOpenRequestDetails && (
              <button
                id="btn-alert-view-protocol"
                onClick={() => {
                  onOpenRequestDetails(alert.requestId);
                  onDismiss();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Ver Protocolo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
