import React, { useState, useEffect } from 'react';
import {
  Tablet,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Smartphone,
  Wifi,
  Sparkles,
  Layers,
} from 'lucide-react';

interface InstallTabletModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any | null;
  onInstalled?: () => void;
}

export const InstallTabletModal: React.FC<InstallTabletModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS =
      /ipad|iphone|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) setDeviceType('ios');
    else if (isAndroid) setDeviceType('android');
    else setDeviceType('other');
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      setInstalling(true);
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        if (onInstalled) onInstalled();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2D2A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E8E6D9] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5A5A40] to-[#4A4A35] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D1A661]">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#E8E6D9]">
                Dispositivos Móveis & Postos de Enfermagem
              </span>
              <h3 className="font-serif text-lg font-bold text-white">
                Instalar no Tablet / Dispositivo
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[#2D2D2A]">
          {/* Status badge if already standalone */}
          {isStandalone ? (
            <div className="p-3.5 rounded-2xl bg-[#8C9C82]/20 border border-[#8C9C82]/30 flex items-center gap-3 text-[#3E4D36]">
              <CheckCircle2 className="w-5 h-5 text-[#8C9C82] shrink-0" />
              <div>
                <strong className="block font-bold">Aplicativo já instalado e operando em tela cheia!</strong>
                <span className="text-[11px]">Você já está utilizando a versão nativa standalone para tablets.</span>
              </div>
            </div>
          ) : (
            <p className="text-[#7D7D72] leading-relaxed">
              Transforme a Central DENF em um <strong>aplicativo dedicado</strong> na tela inicial do seu iPad, Galaxy Tab ou dispositivo móvel. Tenha acesso rápido durante o plantão, operando em tela cheia sem barras de navegador.
            </p>
          )}

          {/* Benefits Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#F9F7F2] border border-[#E8E6D9] text-center space-y-1">
              <Layers className="w-4 h-4 mx-auto text-[#5A5A40]" />
              <div className="font-bold text-[#2D2D2A] text-[11px]">Tela Cheia</div>
              <div className="text-[10px] text-[#8E8E80]">Sem URL ou abas</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#F9F7F2] border border-[#E8E6D9] text-center space-y-1">
              <Wifi className="w-4 h-4 mx-auto text-[#8C9C82]" />
              <div className="font-bold text-[#2D2D2A] text-[11px]">Resiliente</div>
              <div className="text-[10px] text-[#8E8E80]">Estável em Wi-Fi hospitalar</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#F9F7F2] border border-[#E8E6D9] text-center space-y-1">
              <Sparkles className="w-4 h-4 mx-auto text-[#D1A661]" />
              <div className="font-bold text-[#2D2D2A] text-[11px]">Ágil</div>
              <div className="text-[10px] text-[#8E8E80]">Toque otimizado</div>
            </div>
          </div>

          {/* 1-Click native install if prompt is available */}
          {deferredPrompt && !isStandalone && (
            <div className="p-4 rounded-2xl bg-[#D1A661]/15 border border-[#D1A661]/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#7A581E] text-xs">Instalação Direta Disponível</div>
                  <div className="text-[11px] text-[#7A581E]/80">Seu navegador suporta instalação com 1 toque.</div>
                </div>
                <button
                  onClick={handleNativeInstall}
                  disabled={installing}
                  className="px-4 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{installing ? 'Instalando...' : 'Instalar Agora'}</span>
                </button>
              </div>
            </div>
          )}

          {/* OS-Specific Guided Instructions */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-xs text-[#2D2D2A] uppercase tracking-wider">
              Como Adicionar à Tela Inicial no seu Tablet:
            </h4>

            {/* iPad / iOS instructions */}
            <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-[#E8E6D9] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#5A5A40]">
                <Tablet className="w-4 h-4 text-[#8C9C82]" />
                <span>No iPad / Safari (Apple iOS):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#7D7D72] pl-1">
                <li>
                  No topo do navegador Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima <Share className="w-3 h-3 inline mx-0.5" />).
                </li>
                <li>
                  Role para baixo no menu e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3 h-3 inline mx-0.5" />).
                </li>
                <li>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito. O ícone oficial da <strong>Central DENF</strong> aparecerá entre seus apps.
                </li>
              </ol>
            </div>

            {/* Android tablet instructions */}
            <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-[#E8E6D9] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#5A5A40]">
                <Smartphone className="w-4 h-4 text-[#D1A661]" />
                <span>No Tablet Android / Google Chrome:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#7D7D72] pl-1">
                <li>
                  No menu do Google Chrome (três pontos ⋮ no canto superior direito).
                </li>
                <li>
                  Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </li>
                <li>
                  Confirme a instalação. O aplicativo abrirá em modo independente e sem barra de pesquisa.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F9F7F2] px-6 py-4 border-t border-[#E8E6D9] flex items-center justify-between">
          <span className="text-[10px] text-[#8E8E80]">
            Suporta iPadOS, Android, Windows Surface & ChromeOS
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
