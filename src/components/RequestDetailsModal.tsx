import React, { useState } from 'react';
import { DeficitRequest, User, SystemSettings } from '../types';
import { RequestStatusBadge, CriticalityBadge, ClassificationBadge, RelocationStatusBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import {
  Building,
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  FileText,
  Activity,
  History,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  Printer,
  Ban,
  AlertOctagon,
  FolderSync,
} from 'lucide-react';

interface RequestDetailsModalProps {
  request: DeficitRequest;
  currentUser: User;
  settings: SystemSettings;
  onClose: () => void;
  onOpenDecision: (req: DeficitRequest) => void;
  onOpenImpact: (req: DeficitRequest) => void;
  onOpenClosure: (req: DeficitRequest) => void;
  onOpenCancel: (req: DeficitRequest) => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  currentUser,
  settings,
  onClose,
  onOpenDecision,
  onOpenImpact,
  onOpenClosure,
  onOpenCancel,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'resumo'
    | 'deficit'
    | 'tentativas'
    | 'remanejamento'
    | 'decisao'
    | 'impacto'
    | 'acompanhamento'
    | 'timeline'
    | 'auditoria'
  >('resumo');

  const isDENFOrAdmin = currentUser.role === 'denf' || currentUser.role === 'admin';
  const isClosedOrCancelled = request.status === 'encerrada' || request.status === 'cancelada';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Modal Header (Section 23) */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 border-b border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  {request.protocol}
                </span>
                <span className="text-xs text-slate-400">
                  {request.requestDate} às {request.requestTime}
                </span>
                <PriorityScoreBadge score={request.priorityScore} level={request.priorityLevel} />
              </div>
              <h2 className="text-xl font-black tracking-tight mt-1 text-white">
                {request.solicitorSector} — Déficit de {request.absentQuantity}x {request.absentCategory}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Solicitado por <strong>{request.solicitorName}</strong> ({request.solicitorRole})
              </p>
            </div>

            {/* Badges & Close */}
            <div className="flex items-center gap-2">
              <div className="text-right space-y-1">
                <div className="flex items-center gap-1.5 justify-end">
                  <CriticalityBadge criticality={request.criticality} />
                  <RequestStatusBadge status={request.status} />
                </div>
                <div className="text-[11px] text-slate-400">
                  Plantão: <strong>{request.affectedShift}</strong> ({request.deficitStartTime})
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {isDENFOrAdmin && !isClosedOrCancelled && (
                <button
                  id="btn-modal-open-decision"
                  onClick={() => onOpenDecision(request)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Decisão DENF</span>
                </button>
              )}

              <button
                id="btn-modal-open-impact"
                onClick={() => onOpenImpact(request)}
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold shadow-xs flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Avaliar Impacto</span>
              </button>

              {!isClosedOrCancelled && (
                <button
                  id="btn-modal-open-closure"
                  onClick={() => onOpenClosure(request)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Encerrar</span>
                </button>
              )}

              {!isClosedOrCancelled && (
                <button
                  id="btn-modal-open-cancel"
                  onClick={() => onOpenCancel(request)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        </div>

        {/* 9 Navigation Tabs (Section 23) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex gap-1 overflow-x-auto touch-scroll text-xs font-semibold shrink-0">
          {[
            { id: 'resumo', label: '1. Resumo Geral' },
            { id: 'deficit', label: '2. Detalhes Déficit' },
            { id: 'tentativas', label: '3. Tentativas Internas' },
            { id: 'remanejamento', label: '4. Remanejamento' },
            { id: 'decisao', label: '5. Decisão DENF' },
            { id: 'impacto', label: '6. Impacto Assistencial' },
            { id: 'acompanhamento', label: '7. Acompanhamento' },
            { id: 'timeline', label: '8. Timeline' },
            { id: 'auditoria', label: '9. Auditoria' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-900 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: RESUMO */}
          {activeTab === 'resumo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Classificação
                  </span>
                  <ClassificationBadge classification={request.classification} />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Previsibilidade
                  </span>
                  <span
                    className={`font-bold ${
                      request.isPredictable ? 'text-teal-700' : 'text-amber-700'
                    }`}
                  >
                    {request.isPredictable ? 'Previsível' : 'Não Previsível'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Antecedência
                  </span>
                  <span className="font-bold text-slate-800">
                    {request.communicatedInAdvance ? 'Comunicado Antecipado' : 'Comunicação Tardia'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tentativa Interna
                  </span>
                  <span className="font-bold text-slate-800">
                    {request.hasInternalAttempt ? 'Tentada no Setor' : 'Direto para DENF'}
                  </span>
                </div>
              </div>

              {/* Solicitante Context */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Dados da Origem & Solicitante
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Setor Solicitante:</span>
                    <span className="font-bold text-slate-800">{request.solicitorSector}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Responsável pelo Registro:</span>
                    <span className="font-bold text-slate-800">{request.solicitorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cargo / Função:</span>
                    <span className="font-semibold text-slate-700">{request.solicitorRole}</span>
                  </div>
                </div>
              </div>

              {/* Justification summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Justificativa Assistencial Apresentada
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {request.justification || 'Nenhuma justificativa adicional registrada.'}
                </p>
              </div>

              {/* Quick Status of Relocations */}
              {request.relocations.length > 0 && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                  <h4 className="font-extrabold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-purple-700" />
                    Remanejamento em Execução
                  </h4>
                  {request.relocations.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-3 bg-white rounded-lg border border-purple-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {rel.originSector} → {rel.destinationSector}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {rel.quantityDispatched}x {rel.professionalCategory}{' '}
                          {rel.professionalName && `(${rel.professionalName})`}
                        </span>
                      </div>
                      <RelocationStatusBadge status={rel.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETALHES DÉFICIT */}
          {activeTab === 'deficit' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Especificação do Déficit de Pessoal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Categoria Ausente:</span>
                    <span className="font-bold text-slate-800">{request.absentCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quantidade Ausente:</span>
                    <span className="font-black text-rose-700 text-sm">
                      {request.absentQuantity} colaborador(es)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Turno Afetado:</span>
                    <span className="font-bold text-slate-800">{request.affectedShift}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Horário Início do Déficit:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {request.deficitStartTime}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Motivo Informado:</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {request.absenceReason.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Período de Ausência:</span>
                    <span className="font-semibold text-slate-700">
                      {request.absencePeriodStart} até {request.absencePeriodEnd}
                    </span>
                  </div>
                </div>
              </div>

              {/* Critérios de Criticidade (Section 5) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Fatores Críticos do Setor no Momento
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        request.sectorCriticityFactors?.highBedOccupancy ? 'bg-red-500' : 'bg-slate-300'
                      }`}
                    />
                    <span>Alta taxa de ocupação / superlotação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        request.sectorCriticityFactors?.criticalPatientsPresence
                          ? 'bg-red-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span>Presença de pacientes graves / instáveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        request.sectorCriticityFactors?.lowExperiencedTeamRatio
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span>Equipe remanescente com pouca experiência</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        request.sectorCriticityFactors?.highRiskSector ? 'bg-red-500' : 'bg-slate-300'
                      }`}
                    />
                    <span>Setor de alta complexidade (UTI / CC / Hemodinâmica)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TENTATIVAS INTERNAS */}
          {activeTab === 'tentativas' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Tentativa Interna de Solução no Setor (Seção 6)
                </h4>
                <p className="text-slate-600">
                  Status:{' '}
                  <strong>
                    {request.hasInternalAttempt
                      ? 'Sim, foram tentadas medidas internas antes de solicitar à DENF'
                      : 'Não houve tentativa interna previa'}
                  </strong>
                </p>

                {request.internalAttempts && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Ação Tentada:</span>
                        <span className="font-bold text-slate-800">
                          {request.internalAttempts.actionTaken}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Profissional Contatado:</span>
                        <span className="font-bold text-slate-800">
                          {request.internalAttempts.contactedProfessional || 'Não informado'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Motivo do Insucesso:</span>
                      <p className="font-medium text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                        {request.internalAttempts.unsuccessfulReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REMANEJAMENTO */}
          {activeTab === 'remanejamento' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Parâmetros Solicitados pelo Setor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Necessita Remanejamento:</span>
                    <span className="font-bold text-slate-800">
                      {request.needsRelocation ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Qtd Solicitada:</span>
                    <span className="font-bold text-slate-800">
                      {request.requestedRelocationQuantity || request.absentQuantity} prof.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Setor de Destino:</span>
                    <span className="font-bold text-teal-700">
                      {request.destinationSector || request.solicitorSector}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relocation movements list */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Movimentações Autorizadas ({request.relocations.length})
                </h4>
                {request.relocations.length === 0 ? (
                  <p className="text-slate-400 italic">Nenhuma movimentação gerada ainda.</p>
                ) : (
                  request.relocations.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-900">{rel.protocol}</span>
                        <RelocationStatusBadge status={rel.status} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Origem:</span>
                          <span className="font-bold text-slate-800">{rel.originSector}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Destino:</span>
                          <span className="font-bold text-teal-700">{rel.destinationSector}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Qtd / Categoria:</span>
                          <span className="font-bold text-slate-800">
                            {rel.quantityDispatched}x {rel.professionalCategory}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Horários:</span>
                          <span className="font-semibold text-slate-700">
                            {rel.startTime} às {rel.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DECISÃO DENF */}
          {activeTab === 'decisao' && (
            <div className="space-y-4">
              {request.denfDecision ? (
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-teal-200 pb-2">
                    <div>
                      <span className="text-[10px] text-teal-800 uppercase font-bold block">
                        Decisão Registrada
                      </span>
                      <h4 className="font-extrabold text-sm text-teal-950 capitalize">
                        {request.denfDecision.conduct.replace('_', ' ')}
                      </h4>
                    </div>
                    <div className="text-right text-[11px] text-teal-800">
                      <span>Por: {request.denfDecision.decidedBy}</span>
                      <span className="block text-slate-500 font-mono">
                        {request.denfDecision.decidedAt}
                      </span>
                    </div>
                  </div>

                  {request.denfDecision.denialJustification && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-rose-900 font-bold block text-[11px]">
                        Justificativa da Negativa:
                      </span>
                      <p className="text-rose-800 font-medium">
                        {request.denfDecision.denialJustification}
                      </p>
                    </div>
                  )}

                  {request.denfDecision.decisionNotes && (
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold">
                        Observações da Decisão:
                      </span>
                      <p className="text-slate-700 font-medium">
                        {request.denfDecision.decisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">Decisão DENF ainda não registrada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    A solicitação aguarda análise do enfermeiro gestor de plantão.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: IMPACTO */}
          {activeTab === 'impacto' && (
            <div className="space-y-4">
              {request.impactAssessment ? (
                <div className="p-4 bg-rose-50/40 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                    <div>
                      <span className="text-[10px] text-rose-800 uppercase font-bold block">
                        Impacto Assistencial Avaliado
                      </span>
                      <h4 className="font-extrabold text-sm text-rose-950 uppercase">
                        Grau: {request.impactAssessment.assistentialImpact}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Por: {request.impactAssessment.assessedBy} ({request.impactAssessment.assessedAt})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Redução de Capacidade:</span>
                      <span className="font-bold text-slate-800">
                        {request.impactAssessment.reducedOperationalCapacity ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Redistribuição de Pacientes:</span>
                      <span className="font-bold text-slate-800">
                        {request.impactAssessment.patientRedistribution ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Atrasos no Cuidado:</span>
                      <span className="font-bold text-slate-800">
                        {request.impactAssessment.careDelay ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Risco à Segurança:</span>
                      <span className="font-bold text-rose-700">
                        {request.impactAssessment.patientSecurityRisk ? 'SIM' : 'Não'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-700">Impacto assistencial não registrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique em "Avaliar Impacto" no topo da janela para preencher os indicadores.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ACOMPANHAMENTO */}
          {activeTab === 'acompanhamento' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px]">
                  Acompanhamento Gerencial & Desfecho
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Necessita Acompanhamento:
                    </span>
                    <span className="font-bold text-slate-800">
                      {request.needsManagementFollowUp ? 'SIM' : 'NÃO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status do Desfecho:</span>
                    <span className="font-bold text-slate-800">
                      {request.closure?.resolutionType.replace('_', ' ') || 'Em andamento'}
                    </span>
                  </div>
                </div>

                {request.closure?.followUpReason && (
                  <div className="pt-2 border-t border-indigo-200">
                    <span className="text-slate-500 block text-[10px]">
                      Motivo do Acompanhamento:
                    </span>
                    <p className="font-semibold text-slate-800">{request.closure.followUpReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Linha do Tempo da Ocorrência
              </h4>
              <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
                {request.timeline.map((event) => (
                  <div key={event.id} className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-600 absolute -left-[21px] top-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {event.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{event.description}</p>
                      {event.user && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Por: {event.user} ({event.userRole})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Trilha de Auditoria (Imutável)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">Data / Hora</th>
                      <th className="p-2.5">Usuário</th>
                      <th className="p-2.5">Ação Realizada</th>
                      <th className="p-2.5">Campo</th>
                      <th className="p-2.5">Novo Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {request.auditTrail.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                          {audit.timestamp}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">{audit.user}</td>
                        <td className="p-2.5 text-slate-700">{audit.action}</td>
                        <td className="p-2.5 font-mono text-slate-500">{audit.fieldAffected || '-'}</td>
                        <td className="p-2.5 font-mono text-teal-800 font-bold">
                          {audit.newValue || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
