import React, { useState } from 'react';
import { DeficitRequest, ClosureResolutionType, User, ManagementFollowUp } from '../types';
import { CheckCircle2, Clock, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClosureModalProps {
  request: DeficitRequest;
  currentUser: User;
  onConfirmClosure: (
    updatedRequest: DeficitRequest,
    newFollowUp?: ManagementFollowUp
  ) => void;
  onClose: () => void;
}

export const ClosureModal: React.FC<ClosureModalProps> = ({
  request,
  currentUser,
  onConfirmClosure,
  onClose,
}) => {
  const [resolutionType, setResolutionType] = useState<ClosureResolutionType>(
    request.status === 'remanejamento_em_andamento' || request.status === 'remanejamento_autorizado'
      ? 'solucionado_remanejamento'
      : request.status === 'solucao_interna'
      ? 'solucionado_internamente'
      : 'solucionado_remanejamento'
  );

  const [effectiveness, setEffectiveness] = useState<'eficaz' | 'parcialmente_eficaz' | 'ineficaz'>(
    'eficaz'
  );

  // Auto calculate resolution minutes from creation to now
  const defaultMinutes = Math.max(
    15,
    Math.round((Date.now() - new Date(request.createdAt).getTime()) / 60000)
  );
  const [resolutionMinutes, setResolutionMinutes] = useState<number>(defaultMinutes);

  const [closureNotes, setClosureNotes] = useState<string>('');

  // Follow-up requirement (Section 17)
  const [needsFollowUp, setNeedsFollowUp] = useState<boolean>(request.criticality === 'critica');
  const [followUpReason, setFollowUpReason] = useState<string>(
    `Revisão de absenteísmo no setor ${request.solicitorSector}`
  );
  const [followUpResponsible, setFollowUpResponsible] = useState<string>('Supervisão DENF / RH');
  const [followUpDeadline, setFollowUpDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [followUpNotes, setFollowUpNotes] = useState<string>('');

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    let followUpCreated: ManagementFollowUp | undefined = undefined;

    if (needsFollowUp) {
      followUpCreated = {
        id: `fu-${Date.now()}`,
        requestId: request.id,
        protocol: request.protocol,
        sector: request.solicitorSector,
        date: today,
        reason: followUpReason,
        criticality: request.criticality,
        impact: request.impactAssessment?.assistentialImpact || 'moderado',
        responsibleName: followUpResponsible,
        deadline: followUpDeadline,
        situationNotes: followUpNotes,
        providencias: 'Plano de contingência e revisão da escala.',
        status: 'aberto',
        createdAt: today,
      };
    }

    const updated: DeficitRequest = {
      ...request,
      status: 'encerrada',
      needsManagementFollowUp: needsFollowUp,
      managementFollowUpId: followUpCreated ? followUpCreated.id : undefined,
      updatedAt: new Date().toISOString(),
      closure: {
        resolutionType,
        closedAt: `${today} ${nowTime}`,
        totalResolutionMinutes: resolutionMinutes,
        conductEffectiveness: effectiveness,
        closureNotes,
        closedBy: currentUser.name,
        closedRole: currentUser.roleTitle,
        needsManagementFollowUp: needsFollowUp,
        followUpReason: needsFollowUp ? followUpReason : undefined,
        followUpResponsible: needsFollowUp ? followUpResponsible : undefined,
        followUpDeadline: needsFollowUp ? followUpDeadline : undefined,
      },
      timeline: [
        ...request.timeline,
        {
          id: `tl-close-${Date.now()}`,
          timestamp: nowTime,
          title: `Ocorrência Encerrada: ${resolutionType.replace('_', ' ').toUpperCase()}`,
          description: `Desfecho registrado por ${currentUser.name}. Tempo total de resolução: ${resolutionMinutes} min. Efetividade: ${effectiveness}.`,
          user: currentUser.name,
          userRole: currentUser.roleTitle,
          type: 'closure',
        },
      ],
      auditTrail: [
        ...request.auditTrail,
        {
          id: `aud-close-${Date.now()}`,
          requestId: request.id,
          protocol: request.protocol,
          user: currentUser.name,
          action: 'Encerramento Formal da Ocorrência',
          fieldAffected: 'status',
          oldValue: request.status,
          newValue: 'encerrada',
          timestamp: `${today} ${nowTime}:00`,
        },
      ],
    };

    onConfirmClosure(updated, followUpCreated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2D2A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E8E6D9] overflow-hidden animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-[#5A5A40] to-[#4A4A35] text-white px-6 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#8C9C82]" />
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D8D6C9]">
                Desfecho & Fechamento de Plantão
              </span>
              <h3 className="font-serif text-base font-bold">Encerramento — {request.protocol}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[#D8D6C9] hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Resolution Type */}
          <div>
            <label className="block font-bold text-[#2D2D2A] mb-1">Tipo de Desfecho Final *</label>
            <select
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value as ClosureResolutionType)}
              className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-medium text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
            >
              <option value="solucionado_remanejamento">Solucionado com Remanejamento</option>
              <option value="solucionado_internamente">Solucionado Internamente pelo Setor</option>
              <option value="parcialmente_solucionado">Parcialmente Solucionado</option>
              <option value="nao_solucionado">Não Solucionado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Time & Effectiveness */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#7D7D72] mb-1">
                Tempo Total de Resolução (minutos)
              </label>
              <input
                type="number"
                min="0"
                value={resolutionMinutes}
                onChange={(e) => setResolutionMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-mono font-bold text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#7D7D72] mb-1">
                Efetividade da Conduta Adotada *
              </label>
              <select
                value={effectiveness}
                onChange={(e) => setEffectiveness(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-medium text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
              >
                <option value="eficaz">Eficaz</option>
                <option value="parcialmente_eficaz">Parcialmente Eficaz</option>
                <option value="ineficaz">Ineficaz</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-bold text-[#7D7D72] mb-1">
              Observações Finais de Encerramento
            </label>
            <textarea
              rows={2}
              placeholder="Registro de entrega de plantão ou observações assistenciais..."
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
            />
          </div>

          {/* Necessidade de Acompanhamento Gerencial (Section 17) */}
          <div className="p-4 bg-[#F9F7F2] border border-[#E8E6D9] rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2D2D2A]">
              <input
                type="checkbox"
                checked={needsFollowUp}
                onChange={(e) => setNeedsFollowUp(e.target.checked)}
                className="rounded text-[#5A5A40] focus:ring-[#8C9C82] w-4 h-4"
              />
              <span>Necessita Acompanhamento Gerencial Posterior? (Gera pendência no painel)</span>
            </label>

            {needsFollowUp && (
              <div className="space-y-2.5 pt-2.5 border-t border-[#E8E6D9]">
                <div>
                  <label className="block font-bold text-[#7D7D72] mb-1">
                    Motivo do Acompanhamento *
                  </label>
                  <input
                    type="text"
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#7D7D72] mb-1">
                      Responsável Designado *
                    </label>
                    <input
                      type="text"
                      value={followUpResponsible}
                      onChange={(e) => setFollowUpResponsible(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#7D7D72] mb-1">
                      Prazo para Ação *
                    </label>
                    <input
                      type="date"
                      value={followUpDeadline}
                      onChange={(e) => setFollowUpDeadline(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-mono text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#7D7D72] mb-1">
                    Diretrizes ou Providências Iniciais
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Abrir processo com RH; convocar reunião com coordenação"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#F9F7F2] px-6 py-3.5 border-t border-[#E8E6D9] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] text-[#2D2D2A] font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold shadow-xs transition-colors"
          >
            Concluir & Encerrar Ocorrência
          </button>
        </div>
      </div>
    </div>
  );
};
