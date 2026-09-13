import React, { useState, useMemo } from 'react';
import { DeficitRequest, ClosureResolutionType, User, ManagementFollowUp } from '../types';
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Timer,
  Info,
} from 'lucide-react';

interface ClosureModalProps {
  request: DeficitRequest;
  currentUser: User;
  onConfirmClosure: (
    updatedRequest: DeficitRequest,
    newFollowUp?: ManagementFollowUp
  ) => void;
  onClose: () => void;
}

// Converte string de horário (ex: '07:30' ou '07:30:00') em minutos do dia
function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    if (!isNaN(hours) && !isNaN(mins)) {
      return hours * 60 + mins;
    }
  }
  return null;
}

// Calcula a diferença em minutos entre dois horários HH:mm (suporta virada de noite)
function calculateDiffInMinutes(start?: string, end?: string): number | null {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return null;
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60; // Virada de noite (ex: 19:00 às 07:00 = 720 min)
  return diff;
}

// Formata minutos em "Xh Ymin"
function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m < 10 ? '0' : ''}${m}min`;
}

// Motor de cálculo automático baseado naquilo que foi executado na ocorrência
export function computeAutoResolutionDetails(
  request: DeficitRequest,
  type: ClosureResolutionType
): {
  suggestedMinutes: number;
  reason: string;
  options: { label: string; minutes: number; description: string }[];
} {
  const options: { label: string; minutes: number; description: string }[] = [];

  const shiftDurationMap: Record<string, number> = {
    'Manhã': 360,
    'Tarde': 360,
    'Noite': 720,
    '12 horas': 720,
    '24 horas': 1440,
    '6 horas': 360,
  };
  const shiftMinutes = request.affectedShift
    ? shiftDurationMap[request.affectedShift] || 360
    : 360;
  const shiftName = request.affectedShift || 'Plantão';

  // Analisa remanejamentos vinculados
  const relocations = request.relocations || [];
  const firstRel = relocations.length > 0 ? relocations[0] : undefined;

  // 1. Duração da Cobertura de Remanejamento
  let relocationCoverageMinutes = 0;
  let relocationCoverageExplanation = '';

  if (firstRel?.actualDurationMinutes && firstRel.actualDurationMinutes > 0) {
    relocationCoverageMinutes = firstRel.actualDurationMinutes;
    relocationCoverageExplanation = `Duração registrada no remanejamento (${firstRel.actualDurationMinutes} min)`;
  } else if (firstRel?.startTime && firstRel?.endTime) {
    const diff = calculateDiffInMinutes(firstRel.startTime, firstRel.endTime);
    if (diff && diff > 0 && diff <= 1440) {
      relocationCoverageMinutes = diff;
      relocationCoverageExplanation = `Horário de atuação das ${firstRel.startTime} às ${firstRel.endTime} (${diff} min)`;
    }
  } else if (request.coverageStartTime && request.coverageEndTime) {
    const diff = calculateDiffInMinutes(request.coverageStartTime, request.coverageEndTime);
    if (diff && diff > 0 && diff <= 1440) {
      relocationCoverageMinutes = diff;
      relocationCoverageExplanation = `Janela de cobertura das ${request.coverageStartTime} às ${request.coverageEndTime} (${diff} min)`;
    }
  }

  if (!relocationCoverageMinutes) {
    relocationCoverageMinutes = shiftMinutes;
    relocationCoverageExplanation = `Duração padrão do turno ${shiftName} (${shiftMinutes} min / ${Math.round(shiftMinutes / 60)}h)`;
  }

  // 2. Tempo de Resposta até Chegada ao Posto
  let responseTimeToArrival = 0;
  if (firstRel) {
    const arrivalTime = firstRel.confirmedArrivalAt || firstRel.startTime;
    const diff = calculateDiffInMinutes(request.requestTime, arrivalTime);
    if (diff && diff > 0 && diff <= 240) {
      responseTimeToArrival = diff;
    }
  }
  if (!responseTimeToArrival) {
    responseTimeToArrival = 40; // Média operacional hospitalar
  }

  // 3. Tempo de Resolução Interna
  let internalSolutionMinutes = 40;
  if (request.hasInternalAttempt && request.internalAlternativesEvaluated?.length > 0) {
    internalSolutionMinutes = 35;
  }

  // Opções rápidas para seleção
  options.push({
    label: 'Cobertura Efetiva',
    minutes: relocationCoverageMinutes,
    description: `Turno ${shiftName} (${formatMinutesToHours(relocationCoverageMinutes)})`,
  });

  options.push({
    label: 'Tempo até o Posto',
    minutes: responseTimeToArrival,
    description: `Abertura (${request.requestTime}) até chegada (${formatMinutesToHours(responseTimeToArrival)})`,
  });

  options.push({
    label: 'Solução Interna',
    minutes: internalSolutionMinutes,
    description: `Reorganização local (${formatMinutesToHours(internalSolutionMinutes)})`,
  });

  if (shiftMinutes === 360) {
    options.push({
      label: 'Turno 12h',
      minutes: 720,
      description: 'Cobertura integral estendida (720 min)',
    });
  }

  let suggestedMinutes = 360;
  let reason = '';

  switch (type) {
    case 'solucionado_remanejamento':
      suggestedMinutes = relocationCoverageMinutes;
      reason = `Automático com base no remanejamento: ${relocationCoverageExplanation}.`;
      break;

    case 'solucionado_internamente':
      suggestedMinutes = internalSolutionMinutes;
      reason = `Automático com base na resolução interna da equipe e reorganização local (${internalSolutionMinutes} min).`;
      break;

    case 'parcialmente_solucionado':
      suggestedMinutes = Math.min(relocationCoverageMinutes, Math.round(shiftMinutes / 2)) || 180;
      reason = `Automático com base na cobertura parcial executada no plantão (${suggestedMinutes} min / ${formatMinutesToHours(suggestedMinutes)}).`;
      break;

    case 'nao_solucionado':
      suggestedMinutes = responseTimeToArrival || 30;
      reason = `Automático com base no tempo decorrido até a deliberação de indisponibilidade (${suggestedMinutes} min).`;
      break;

    case 'cancelado':
      suggestedMinutes = 20;
      reason = 'Automático com base no tempo transcorrido até o cancelamento formal (20 min).';
      break;

    default:
      suggestedMinutes = relocationCoverageMinutes;
      reason = `Automático com base na cobertura do turno (${suggestedMinutes} min).`;
  }

  return { suggestedMinutes, reason, options };
}

export const ClosureModal: React.FC<ClosureModalProps> = ({
  request,
  currentUser,
  onConfirmClosure,
  onClose,
}) => {
  const initialResolutionType: ClosureResolutionType =
    request.status === 'remanejamento_em_andamento' || request.status === 'remanejamento_autorizado'
      ? 'solucionado_remanejamento'
      : request.status === 'solucao_interna'
      ? 'solucionado_internamente'
      : 'solucionado_remanejamento';

  const [resolutionType, setResolutionType] = useState<ClosureResolutionType>(initialResolutionType);

  const [effectiveness, setEffectiveness] = useState<'eficaz' | 'parcialmente_eficaz' | 'ineficaz'>(
    'eficaz'
  );

  // Cálculo automático baseado em evidências do que foi feito
  const autoDetails = useMemo(() => {
    return computeAutoResolutionDetails(request, resolutionType);
  }, [request, resolutionType]);

  const [resolutionMinutes, setResolutionMinutes] = useState<number>(() => {
    return computeAutoResolutionDetails(request, initialResolutionType).suggestedMinutes;
  });

  const [closureNotes, setClosureNotes] = useState<string>('');

  // Troca de tipo de desfecho recalcula automaticamente o tempo
  const handleResolutionTypeChange = (newType: ClosureResolutionType) => {
    setResolutionType(newType);
    const updatedAuto = computeAutoResolutionDetails(request, newType);
    setResolutionMinutes(updatedAuto.suggestedMinutes);
  };

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

  const isEnfermeiroDePlantao = currentUser.role === 'solicitante';

  const handleSave = () => {
    if (!isEnfermeiroDePlantao) return;

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

    // Sincroniza e finaliza todos os remanejamentos ativos vinculados
    const synchronizedRelocations = (request.relocations || []).map((rel) => {
      const finishTime = rel.endTime || nowTime;
      const computedDuration =
        rel.actualDurationMinutes ||
        calculateDiffInMinutes(rel.startTime, finishTime) ||
        resolutionMinutes;
      return {
        ...rel,
        status: (rel.status === 'cancelado' ? 'cancelado' : 'finalizado') as any,
        endTime: finishTime,
        actualDurationMinutes: computedDuration,
      };
    });

    const timeCategory: 'ate_30m' | '30m_1h' | '1h_2h' | '2h_4h' | 'mais_4h' =
      resolutionMinutes <= 30
        ? 'ate_30m'
        : resolutionMinutes <= 60
        ? '30m_1h'
        : resolutionMinutes <= 120
        ? '1h_2h'
        : resolutionMinutes <= 240
        ? '2h_4h'
        : 'mais_4h';

    const resolvedStatus =
      resolutionType === 'solucionado_remanejamento' || resolutionType === 'solucionado_internamente'
        ? 'sim'
        : resolutionType === 'parcialmente_solucionado'
        ? 'parcialmente'
        : 'nao';

    const updated: DeficitRequest = {
      ...request,
      status: 'encerrada',
      needsManagementFollowUp: needsFollowUp,
      managementFollowUpId: followUpCreated ? followUpCreated.id : undefined,
      updatedAt: new Date().toISOString(),
      relocations: synchronizedRelocations,
      closure: {
        resolutionType,
        resolvedStatus,
        closedAt: `${today} ${nowTime}`,
        totalResolutionMinutes: resolutionMinutes,
        resolutionTimeCategory: timeCategory,
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
          title: `Ocorrência e Remanejamentos Encerrados: ${resolutionType.replace('_', ' ').toUpperCase()}`,
          description: `Desfecho registrado pelo Enfermeiro de Plantão (${currentUser.name}). Todos os remanejamentos ativos foram sincronizados e finalizados. Tempo de resolução: ${resolutionMinutes} min (${formatMinutesToHours(resolutionMinutes)}). Efetividade: ${effectiveness}.`,
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
          action: 'Encerramento Formal da Ocorrência e Sincronização de Remanejamentos',
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
          {/* Banner de Sincronização e Perfil Exclusivo */}
          {isEnfermeiroDePlantao ? (
            <div className="p-3.5 bg-[#5A6D50]/10 border border-[#5A6D50]/30 rounded-2xl flex items-start gap-3 text-xs text-[#2D2D2A]">
              <ShieldCheck className="w-5 h-5 text-[#4A6344] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[#243320]">
                  Competência Exclusiva: Enfermeiro de Plantão ({currentUser.name})
                </span>
                <p className="text-[11px] text-[#4A6344] mt-0.5 leading-relaxed">
                  O registro de desfecho finaliza a ocorrência e sincroniza em definitivo o status de todos os profissionais remanejados vinculados, sem necessidade de finalizações manuais avulsas.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-950">
                  Acesso Restrito ao Enfermeiro de Plantão
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  O fechamento formal e registro de desfecho de plantão é atribuído privativamente ao Enfermeiro de Plantão do setor solicitante. Coordenação e Diretoria acompanham pelo módulo gerencial.
                </p>
              </div>
            </div>
          )}

          {/* Resolution Type */}
          <div>
            <label className="block font-bold text-[#2D2D2A] mb-1">Tipo de Desfecho Final *</label>
            <select
              value={resolutionType}
              onChange={(e) => handleResolutionTypeChange(e.target.value as ClosureResolutionType)}
              className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-medium text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
            >
              <option value="solucionado_remanejamento">Solucionado com Remanejamento</option>
              <option value="solucionado_internamente">Solucionado Internamente pelo Setor</option>
              <option value="parcialmente_solucionado">Parcialmente Solucionado</option>
              <option value="nao_solucionado">Não Solucionado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Tempo Total de Resolução Automático e Efetividade */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#2D2D2A]">
                    Tempo Total de Resolução *
                  </label>
                  <span className="text-[11px] font-bold text-[#5A5A40] bg-[#E8E6D9]/50 px-2 py-0.5 rounded-md">
                    {formatMinutesToHours(resolutionMinutes)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={resolutionMinutes}
                    onChange={(e) => setResolutionMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full p-2.5 pr-14 rounded-xl border border-[#E8E6D9] bg-white font-mono font-bold text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#7D7D72] font-semibold">
                    minutos
                  </span>
                </div>
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

            {/* Painel de Cálculo Automático Baseado no que foi feito */}
            <div className="p-3 bg-[#F4F3EE] rounded-2xl border border-[#E8E6D9] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2D2D2A] block text-[11px]">
                      Cálculo Automático por Conduta Realizada
                    </span>
                    <p className="text-[11px] text-[#5A5A40] mt-0.5 leading-snug">
                      {autoDetails.reason}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResolutionMinutes(autoDetails.suggestedMinutes)}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#5A5A40] hover:text-[#2D2D2A] hover:underline bg-white px-2 py-1 rounded-lg border border-[#E8E6D9] shadow-2xs"
                  title="Restaurar tempo calculado automaticamente"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar ({autoDetails.suggestedMinutes}m)</span>
                </button>
              </div>

              {/* Botões rápidos de seleção de acordo com o cenário */}
              <div className="pt-1.5 border-t border-[#E8E6D9]/70">
                <span className="text-[10px] text-[#7D7D72] font-semibold block mb-1">
                  Opções de cálculo rápido segundo o registro:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {autoDetails.options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setResolutionMinutes(opt.minutes)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                        resolutionMinutes === opt.minutes
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-2xs'
                          : 'bg-white text-[#5A5A40] border-[#E8E6D9] hover:bg-[#E8E6D9]/40 hover:text-[#2D2D2A]'
                      }`}
                    >
                      {opt.label}: {opt.minutes} min ({opt.description})
                    </button>
                  ))}
                </div>
              </div>
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
            id="btn-confirm-closure"
            disabled={!isEnfermeiroDePlantao}
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 ${
              isEnfermeiroDePlantao
                ? 'bg-[#5A5A40] hover:bg-[#4A4A35] text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluir & Encerrar Ocorrência</span>
          </button>
        </div>
      </div>
    </div>
  );
};
