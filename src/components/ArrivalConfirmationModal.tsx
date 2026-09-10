import React, { useState } from 'react';
import { RelocationMovement, DeficitRequest, User } from '../types';
import { UserCheck, Clock, Building, ArrowRight, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface ArrivalConfirmationModalProps {
  relocation: RelocationMovement;
  request?: DeficitRequest;
  currentUser: User;
  onConfirmArrival: (relocationId: string, arrivalTime: string, notes?: string) => void;
  onClose: () => void;
}

export const ArrivalConfirmationModal: React.FC<ArrivalConfirmationModalProps> = ({
  relocation,
  request,
  currentUser,
  onConfirmArrival,
  onClose,
}) => {
  const defaultTime = new Date().toTimeString().slice(0, 5);
  const [arrivalTime, setArrivalTime] = useState<string>(defaultTime);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isDestinationNurse =
    currentUser.sector === relocation.destinationSector ||
    currentUser.role === 'solicitante' ||
    (request && request.solicitorUserId === currentUser.id);

  const handleConfirm = () => {
    if (!arrivalTime) {
      setError('Por favor, informe o horário de apresentação no setor.');
      return;
    }
    onConfirmArrival(relocation.id, arrivalTime, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Confirmar Chegada do Profissional</h3>
              <p className="text-xs text-emerald-100">
                Acolhimento no setor assistencial e início de cobertura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identification banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-mono font-bold text-slate-700">{relocation.protocol}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Em Deslocamento
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Profissional Remanejado</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {relocation.professionalName || 'Profissional Designado'}
                </span>
                <span className="text-slate-500 text-[11px] block">{relocation.professionalCategory}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Trajeto / Setores</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
                  <span className="text-slate-600">{relocation.originSector}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-teal-700 font-bold">{relocation.destinationSector}</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Despachado por: {relocation.authorizedBy} ({relocation.authorizedRole})
                </span>
              </div>
            </div>
          </div>

          {/* Clinical role context */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              isDestinationNurse
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isDestinationNurse ? 'text-emerald-700' : 'text-amber-700'
              }`}
            />
            <div>
              <span className="font-bold block">
                {isDestinationNurse
                  ? 'Confirmação pelo Enfermeiro do Setor de Destino'
                  : 'Confirmação por Supervisão / Coordenação'}
              </span>
              <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                {isDestinationNurse
                  ? `Você está confirmando que ${relocation.professionalName || 'o profissional'} se apresentou fisicamente ao posto do setor ${relocation.destinationSector} e já está assumindo a assistência aos leitos/pacientes.`
                  : `Registro de confirmação de chegada efetuado pela liderança em nome do setor ${relocation.destinationSector}. Esta ação será registrada com sua assinatura digital na trilha de auditoria.`}
              </p>
            </div>
          </div>

          {/* Form inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Horário Exato de Apresentação / Início da Cobertura:
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Responsável pela Recepção:
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium flex items-center justify-between">
                <span>{currentUser.name}</span>
                <span className="text-[11px] text-slate-500">
                  {currentUser.roleTitle} ({currentUser.sector})
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações do Posto de Enfermagem (Opcional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: Profissional acolhido, paramentado e alocado para cobertura dos leitos 09 a 12..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirmar Chegada e Iniciar Cobertura</span>
          </button>
        </div>
      </div>
    </div>
  );
};
