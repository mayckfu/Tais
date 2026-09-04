import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, AlertCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="app-offline-banner"
      className="fixed bottom-20 lg:bottom-4 left-3 right-3 sm:right-auto sm:left-4 sm:max-w-md z-50 flex items-center gap-3 rounded-2xl bg-[#9E5A4E] px-4 py-3 text-xs font-semibold text-white shadow-xl border border-[#7D3F35] animate-in slide-in-from-bottom-4"
    >
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-white animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-xs">Modo Offline no Dispositivo</p>
        <p className="text-[11px] text-white/90">
          Você está sem conexão de rede. Dados em cache e alterações locais continuam preservados.
        </p>
      </div>
    </div>
  );
};
