import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Tablet, Share, PlusSquare, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode on tablet/mobile, don't show install prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android Tablet / Desktop PWA flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div
          id="pwa-install-banner"
          className={`bg-[#4A4A35] text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-[#5A5A40] ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D1A661] text-[#2D2D2A] flex items-center justify-center font-bold shrink-0">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-white">Instalar App no Tablet / Dispositivo</h4>
              <p className="text-xs text-[#D8D6C9]">
                Abra a Central DENF como aplicativo dedicado com tela cheia e acesso offline.
              </p>
            </div>
          </div>
          <button
            id="btn-install-app-banner"
            onClick={install}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D1A661] hover:bg-[#BA8F4D] text-[#2D2D2A] font-bold text-xs shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicativo</span>
          </button>
        </div>
      );
    }

    return (
      <button
        id="btn-install-pwa-compact"
        onClick={install}
        className={`min-h-[38px] flex items-center gap-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer ${className}`}
        title="Instalar Central DENF no Tablet ou Computador"
      >
        <Tablet className="w-4 h-4 text-[#D1A661]" />
        <span className="hidden md:inline">Instalar no Tablet</span>
        <span className="md:hidden">Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (iPad & iPhone)
  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios-tablet"
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[38px] flex items-center gap-1.5 rounded-xl border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] px-3 py-1.5 text-xs font-bold text-[#5A5A40] shadow-xs transition-all cursor-pointer ${className}`}
          title="Como instalar no iPad / iOS"
        >
          <Tablet className="w-4 h-4 text-[#D1A661]" />
          <span>App no iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2A]/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#E8E6D9] text-[#2D2D2A]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E6D9]">
                <div className="flex items-center gap-2">
                  <Tablet className="w-5 h-5 text-[#5A5A40]" />
                  <h3 className="font-serif font-bold text-base">Instalar no iPad / iPhone</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#8E8E80] hover:text-[#2D2D2A] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-[#7D7D72] leading-relaxed">
                <div className="flex items-start gap-3 p-3 bg-[#F9F7F2] rounded-2xl border border-[#E8E6D9]">
                  <div className="w-7 h-7 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2D2D2A] text-xs">1. Toque em Compartilhar</strong>
                    <span>No Safari, toque no ícone de compartilhamento na barra superior ou inferior.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F9F7F2] rounded-2xl border border-[#E8E6D9]">
                  <div className="w-7 h-7 rounded-lg bg-[#D1A661] text-[#2D2D2A] flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#2D2D2A] text-xs">2. Adicionar à Tela de Início</strong>
                    <span>Role para baixo e selecione a opção "Adicionar à Tela de Início".</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8E8E80] text-center pt-1">
                  O aplicativo será aberto em modo tela cheia dedicado no seu tablet.
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
