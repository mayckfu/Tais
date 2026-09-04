import React, { useState } from 'react';
import { DeficitRequest, User } from '../types';
import { Ban, AlertCircle } from 'lucide-react';

interface CancelModalProps {
  request: DeficitRequest;
  currentUser: User;
  onConfirmCancel: (updatedRequest: DeficitRequest) => void;
  onClose: () => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  request,
  currentUser,
  onConfirmCancel,
  onClose,
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('A justificativa de cancelamento é obrigatória.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const updated: DeficitRequest = {
      ...request,
      status: 'cancelada',
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...request.timeline,
        {
          id: `tl-cancel-${Date.now()}`,
          timestamp: nowTime,
          title: 'Solicitação Cancelada',
          description: `Cancelado por ${currentUser.name}. Motivo: ${reason}`,
          user: currentUser.name,
          userRole: currentUser.roleTitle,
          type: 'cancellation',
        },
      ],
      auditTrail: [
        ...request.auditTrail,
        {
          id: `aud-cancel-${Date.now()}`,
          requestId: request.id,
          protocol: request.protocol,
          user: currentUser.name,
          action: 'Cancelamento da Ocorrência',
          fieldAffected: 'status',
          oldValue: request.status,
          newValue: 'cancelada',
          timestamp: `${today} ${nowTime}:00`,
        },
      ],
    };

    onConfirmCancel(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        <div className="bg-rose-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-300" />
            <h3 className="text-base font-extrabold">Cancelar Solicitação {request.protocol}</h3>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <p className="text-slate-600">
            Você está prestes a cancelar a solicitação do setor <strong>{request.solicitorSector}</strong>.
            Esta ação ficará registrada na trilha de auditoria e notificará a equipe da DENF.
          </p>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 font-bold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Justificativa Obrigatória do Cancelamento *
            </label>
            <textarea
              rows={3}
              placeholder="Ex: O profissional ausente conseguiu comparecer ao plantão com atraso justificável..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
};
