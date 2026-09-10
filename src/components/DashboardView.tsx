import React, { useMemo } from 'react';
import { DeficitRequest, User, RelocationMovement } from '../types';
import { RequestStatusBadge, CriticalityBadge, RelocationStatusBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import {
  ShieldAlert,
  Clock,
  ArrowRightLeft,
  Users,
  CheckCircle2,
  PlusCircle,
  Building,
  ArrowRight,
  TrendingUp,
  Flame,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  requests: DeficitRequest[];
  currentUser: User;
  onNavigateTab: (tab: any) => void;
  onOpenNewRequest: () => void;
  onOpenDetails: (request: DeficitRequest) => void;
  onOpenDecision: (request: DeficitRequest) => void;
  onOpenClosure?: (request: DeficitRequest) => void;
  onOpenArrivalModal?: (relocation: RelocationMovement, req?: DeficitRequest) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  requests,
  currentUser,
  onNavigateTab,
  onOpenNewRequest,
  onOpenDetails,
  onOpenDecision,
  onOpenClosure,
  onOpenArrivalModal,
}) => {
  // Scoped requests if solicitante
  const visibleRequests = useMemo(() => {
    if (currentUser.role === 'solicitante') {
      return requests.filter(
        (r) =>
          r.solicitorSector.toLowerCase() === currentUser.sector.toLowerCase() ||
          r.solicitorUserId === currentUser.id
      );
    }
    return requests;
  }, [requests, currentUser]);

  // Key KPI numbers
  const pendingCount = visibleRequests.filter(
    (r) => r.status === 'aguardando_analise' || r.status === 'em_analise'
  ).length;

  const criticalCount = visibleRequests.filter(
    (r) => r.criticality === 'critica' && r.status !== 'encerrada' && r.status !== 'cancelada'
  ).length;

  const activeRelocationsCount = visibleRequests.reduce((total, req) => {
    return (
      total +
      req.relocations.filter(
        (rel) =>
          rel.status === 'aguardando_inicio' ||
          rel.status === 'em_deslocamento' ||
          rel.status === 'em_cobertura'
      ).length
    );
  }, 0);

  const resolvedTodayCount = visibleRequests.filter((r) => {
    return r.status === 'resolvida' || r.status === 'solucao_interna' || r.status === 'encerrada';
  }).length;

  // Urgent attention items (Critical, Emergency, Immediate or High priority pending closure)
  const urgentRequests = useMemo(() => {
    return visibleRequests
      .filter(
        (r) =>
          (r.criticality === 'critica' ||
            r.criticality === 'alta' ||
            r.classification === 'emergencial' ||
            r.priorityLevel === 'imediata' ||
            r.priorityLevel === 'alta') &&
          r.status !== 'encerrada' &&
          r.status !== 'cancelada'
      )
      .slice(0, 5);
  }, [visibleRequests]);

  const getConductLabel = (conductType?: string, custom?: string) => {
    if (!conductType) return 'Conduta Registrada';
    const labels: Record<string, string> = {
      remanejamento_interno: 'Remanejamento Interno de Profissional',
      sobreaviso: 'Acionamento de Sobreaviso',
      cobertura_proprio_setor: 'Cobertura pelo Próprio Setor',
      troca_plantao: 'Troca de Plantão',
      convocacao: 'Convocação / Hora Extra',
      redistribuicao_pacientes: 'Redistribuição de Leitos / Pacientes',
      nao_autorizado: 'Não Autorizado / Recusado pela DENF',
      outro: custom || 'Outra Deliberação',
    };
    return labels[conductType] || custom || conductType;
  };

  // Recent 6 requests
  const recentRequests = useMemo(() => {
    return [...visibleRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [visibleRequests]);

  // Professionals in transit requiring arrival confirmation
  const inTransitRelocations = useMemo(() => {
    const list: { rel: RelocationMovement; req: DeficitRequest }[] = [];
    requests.forEach((req) => {
      req.relocations.forEach((rel) => {
        if (rel.status === 'em_deslocamento') {
          list.push({ rel, req });
        }
      });
    });
    return list;
  }, [requests]);

  const isDENFOrAdmin =
    currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador';

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner / Welcome with Natural Tones */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3E3E32] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden border border-[#5A5A40]/40">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#E8E6D9]/20 text-[#E8E6D9] border border-[#E8E6D9]/30">
                Painel Operacional
              </span>
              <span className="text-xs text-[#D8D6C9]">
                Hospital Central • Diretoria de Enfermagem
              </span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-white">
              Gestão de Déficit de Profissionais & Remanejamento
            </h1>
            <p className="text-xs sm:text-sm text-[#D8D6C9] max-w-2xl font-normal leading-relaxed">
              Comunicação ágil de ausências, triagem de criticidade baseada em dados, deliberação centralizada da DENF e rastreabilidade total do fluxo assistencial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-dash-new-request"
              onClick={onOpenNewRequest}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D1A661] hover:bg-[#BA8F4D] text-[#2D2D2A] font-bold text-xs shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Comunicar Novo Déficit</span>
            </button>
            {isDENFOrAdmin && (
              <button
                onClick={() => onNavigateTab('denf_queue')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition-all"
              >
                <Clock className="w-4 h-4 text-[#D1A661]" />
                <span>Fila DENF ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Strip (if any critical deficit is pending) */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#9E5A4E] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#7D3F35]">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-white shrink-0 animate-pulse mt-0.5 sm:mt-0" />
            <div>
              <h3 className="font-bold text-sm">
                Alerta Assistencial: {criticalCount} solicitação(ões) em estado CRÍTICO requerem ação imediata!
              </h3>
              <p className="text-xs text-[#F5DFDC]">
                Ocorrências com alto risco à segurança do paciente e dimensionamento sob pressão.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('denf_queue')}
            className="px-4 py-2 rounded-full bg-white text-[#9E5A4E] font-bold text-xs shrink-0 hover:bg-[#F9F7F2] shadow-xs transition-all w-full sm:w-auto text-center"
          >
            Atender Fila de Emergência
          </button>
        </div>
      )}

      {/* In-Transit Relocations Strip (Professionals dispatched awaiting sector arrival) */}
      {inTransitRelocations.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-sm border border-blue-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Profissional em Deslocamento no Hospital ({inTransitRelocations.length})</span>
                </h3>
                <p className="text-xs text-blue-200">
                  {currentUser.role === 'solicitante'
                    ? 'Atenção: o profissional está a caminho. Confirme a chegada no posto assim que ele se apresentar.'
                    : 'Remanejamentos autorizados em trânsito. A confirmação de chegada cabe ao Enfermeiro do setor de destino.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('relocations')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-blue-100 transition-colors shrink-0 text-center"
            >
              Ver Painel Operacional →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {inTransitRelocations.map(({ rel, req }) => {
              const isDestNurse =
                currentUser.sector.toLowerCase() === rel.destinationSector.toLowerCase() ||
                currentUser.role === 'solicitante' ||
                req.solicitorUserId === currentUser.id;

              return (
                <div
                  key={rel.id}
                  className="p-3 bg-white/10 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-300">{rel.protocol}</span>
                      <span className="font-bold text-white">
                        {rel.professionalName || 'Profissional Designado'}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-200 mt-0.5">
                      <span>{rel.originSector}</span> → <strong className="text-emerald-300 font-bold">{rel.destinationSector}</strong>{' '}
                      ({rel.professionalCategory})
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Despachado por: {rel.authorizedBy} às {rel.startTime}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onOpenArrivalModal
                        ? onOpenArrivalModal(rel, req)
                        : onOpenDetails(req)
                    }
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {isDestNurse
                        ? 'Confirmar Chegada no Setor'
                        : 'Confirmar Chegada (Supervisão)'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Pendentes DENF */}
        <div
          onClick={() => onNavigateTab('denf_queue')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              Aguardando DENF
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#5A5A40] shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">{pendingCount}</span>
            <span className="text-xs text-[#7D7D72] font-medium">solicitações</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>Ver Fila Operacional</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* 2. Ocorrências Críticas */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#9E5A4E] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              Déficits Críticos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#9E5A4E] shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#9E5A4E]">{criticalCount}</span>
            <span className="text-xs text-[#9E5A4E] font-medium">prioridade alta</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#9E5A4E] font-semibold gap-1">
            <span>Filtrar Críticas</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* 3. Remanejamentos em Andamento */}
        <div
          onClick={() => onNavigateTab('relocations')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              Remanejamentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#5A5A40] shrink-0">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">{activeRelocationsCount}</span>
            <span className="text-xs text-[#7D7D72] font-medium">em trânsito / cobertura</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>Rastrear em Tempo Real</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* 4. Coberturas Concluídas */}
        <div
          onClick={() => onNavigateTab('indicators')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              Solucionadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#8C9C82] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">{resolvedTodayCount}</span>
            <span className="text-xs text-[#7D7D72] font-medium">demandas atendidas</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>Ver Indicadores</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Urgent Attention Grid & Fast Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgências Assistenciais */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#9E5A4E] shrink-0" />
              <div>
                <h2 className="font-serif font-bold text-base text-[#2D2D2A]">
                  Ocorrências de Alta Prioridade Assistencial
                </h2>
                <p className="text-[11px] text-[#7D7D72]">
                  {currentUser.role === 'solicitante'
                    ? `Filtrado para sua unidade: ${currentUser.sector}`
                    : 'Visão Institucional: Demandas prioritárias de todas as unidades'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab(currentUser.role === 'solicitante' ? 'requests' : 'denf_queue')}
              className="text-xs font-bold text-[#5A5A40] hover:text-[#3E3E32]"
            >
              {currentUser.role === 'solicitante' ? 'Minhas Solicitações →' : 'Ver todas na Fila →'}
            </button>
          </div>

          <div className="space-y-3.5">
            {urgentRequests.length === 0 ? (
              <div className="py-8 text-center text-[#8E8E80] text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#8C9C82] mx-auto mb-1.5" />
                <span>Nenhuma ocorrência prioritária ou crítica pendente no momento.</span>
              </div>
            ) : (
              urgentRequests.map((req) => {
                const hasRelocations = req.relocations && req.relocations.length > 0;
                const isAttended =
                  req.status === 'resolvida' ||
                  req.status === 'solucao_interna' ||
                  req.status === 'remanejamento_autorizado' ||
                  req.status === 'remanejamento_em_andamento' ||
                  hasRelocations;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] flex flex-col gap-3 hover:border-[#8C9C82] transition-all"
                  >
                    {/* Linha 1: Identificação, Status Oficial e Prioridade */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E6D9]/70 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#2D2D2A] bg-white px-2 py-0.5 rounded border border-[#E8E6D9]">
                          {req.protocol}
                        </span>
                        <RequestStatusBadge status={req.status} />
                        <CriticalityBadge criticality={req.criticality} />
                        <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                      </div>
                      <span className="text-[11px] text-[#8E8E80] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8E8E80]" />
                        {req.requestDate} às {req.requestTime}
                      </span>
                    </div>

                    {/* Linha 2: Setor Solicitante e Déficit */}
                    <div className="text-xs">
                      <span className="font-bold text-[#2D2D2A] text-sm">
                        {req.solicitorSector}:
                      </span>{' '}
                      <span className="font-extrabold text-[#9E5A4E]">
                        {req.absentQuantity}x {req.absentCategory}
                      </span>
                      <p className="text-[11px] text-[#7D7D72] mt-0.5">
                        Plantão: <strong>{req.affectedShift}</strong> • Solicitante: <strong>{req.solicitorName}</strong>
                        {req.absentReason && (
                          <span className="capitalize"> • Motivo: {req.absentReason.replace('_', ' ')}</span>
                        )}
                      </p>
                    </div>

                    {/* Linha 3: Status Real do Atendimento / Remanejamento em Tempo Real */}
                    {hasRelocations ? (
                      <div className="p-3 rounded-lg bg-white border border-[#E8E6D9] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-[#5A6D50]" />
                            Remanejamento Assistencial Designado:
                          </span>
                          <span className="text-[10px] text-[#7D7D72]">
                            Central DENF
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {req.relocations.map((rel) => (
                            <div
                              key={rel.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-xs p-2 rounded bg-[#F9F7F2] border border-[#E8E6D9]/70"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#2D2D2A]">
                                  {rel.professionalName || `${rel.quantity}x ${rel.category}`}
                                </span>
                                <span className="text-[11px] text-[#7D7D72]">
                                  ({rel.originSector} → {rel.destinationSector})
                                </span>
                              </div>
                              <RelocationStatusBadge status={rel.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : req.decision ? (
                      <div className="p-2.5 rounded-lg bg-white border border-[#E8E6D9] text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6D50]" />
                            Conduta Definida pela Central DENF:
                          </span>
                          <span className="text-[10px] text-[#7D7D72]">
                            Decidido por {req.decision.decidedBy}
                          </span>
                        </div>
                        <p className="text-[#2D2D2A] font-semibold text-[11px]">
                          {getConductLabel(req.decision.conductType, req.decision.conductCustom)}
                        </p>
                        {(req.decision.decisionNotes || req.decision.denialJustification) && (
                          <p className="text-[11px] text-[#7D7D72] italic bg-[#F9F7F2] p-1.5 rounded">
                            "{req.decision.denialJustification || req.decision.decisionNotes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-[#D1A661]/10 border border-[#D1A661]/30 text-xs text-[#7A581E] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#BA8F4D] shrink-0 animate-pulse" />
                        <span className="text-[11px]">
                          Aguardando análise e deliberação da Central DENF / Coordenação de Enfermagem.
                        </span>
                      </div>
                    )}

                    {/* Linha 4: Ações Operacionais (Encerramento pelo Enfermeiro ou Deliberação DENF) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8E6D9]/50">
                      <div className="text-[11px] text-[#7D7D72]">
                        {isAttended ? (
                          <span className="text-[#3E4D36] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#5A6D50]" />
                            Atendimento prestado. Pronto para registro de desfecho pelo plantonista.
                          </span>
                        ) : (
                          <span className="text-[#7D7D72]">
                            Ocorrência aguardando providências.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {/* Botão de Encerramento / Desfecho se atendida/remanejada */}
                        {isAttended && req.status !== 'encerrada' && (
                          <button
                            id={`btn-closure-card-${req.id}`}
                            onClick={() => (onOpenClosure ? onOpenClosure(req) : onOpenDetails(req))}
                            className="px-3.5 py-1.5 rounded-lg bg-[#4A6344] hover:bg-[#3B5036] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                            title="Registrar desfecho e encerrar o chamado"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Registrar Desfecho (Encerrar)</span>
                          </button>
                        )}

                        {/* Botão de Deliberação para DENF se ainda pendente */}
                        {isDENFOrAdmin &&
                          (req.status === 'aguardando_analise' || req.status === 'em_analise') && (
                            <button
                              id={`btn-decision-card-${req.id}`}
                              onClick={() => onOpenDecision(req)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Deliberar / Analisar</span>
                            </button>
                          )}

                        <button
                          id={`btn-details-card-${req.id}`}
                          onClick={() => onOpenDetails(req)}
                          className="px-3.5 py-1.5 rounded-lg border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] text-[#2D2D2A] font-semibold text-xs transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Acesso Rápido & Diretoria */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm text-[#2D2D2A] border-b border-[#E8E6D9] pb-3">
              Acesso Rápido Operacional
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <button
                onClick={() => onNavigateTab('sector_demand')}
                className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowRightLeft className="w-4 h-4 text-[#5A5A40]" />
                  <span>Mapa de Demanda (Origem → Destino)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
              </button>

              <button
                onClick={() => onNavigateTab('rankings')}
                className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-[#D1A661]" />
                  <span>Rankings de Absenteísmo Hospitalar</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
              </button>

              <button
                onClick={() => onNavigateTab('followup')}
                className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-[#8C9C82]" />
                  <span>Acompanhamento Gerencial</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#5A5A40]" />
                  <span>Exportação de Relatórios & Auditoria</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl text-xs text-[#5A5A40] mt-4">
            <span className="font-bold block text-[#3E3E32]">Protocolo de Comunicação DENF:</span>
            <p className="text-[11px] text-[#7D7D72] mt-1 leading-relaxed">
              Notifique ausências com antecedência mínima de 2 horas do início do plantão para
              otimizar as rotas de remanejamento.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] overflow-hidden">
        <div className="p-4 bg-[#F9F7F2] border-b border-[#E8E6D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-sm text-[#2D2D2A]">
              Últimas Ocorrências Registradas
            </h2>
            <p className="text-[11px] text-[#7D7D72] mt-0.5 flex items-center gap-1.5">
              {currentUser.role === 'solicitante' ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#8C9C82]"></span>
                  <span>
                    Exibindo apenas ocorrências da sua unidade: <strong>{currentUser.sector}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#5A5A40]"></span>
                  <span>
                    Visão Geral do Hospital: Todos os setores, blocos e enfermarias
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-[#5A5A40] hover:text-[#3E3E32] self-start sm:self-auto"
          >
            {currentUser.role === 'solicitante'
              ? `Ver Todas da ${currentUser.sector} (${visibleRequests.length}) →`
              : `Ver Histórico Geral (${visibleRequests.length}) →`}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9F7F2]/60 text-[#7D7D72] font-bold border-b border-[#E8E6D9] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Protocolo</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Ausência</th>
                <th className="py-3 px-4">Criticidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6D9]/50">
              {recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-[#F9F7F2]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#2D2D2A]">
                    {req.protocol}
                    <span className="text-[10px] text-[#8E8E80] block font-normal">
                      {req.requestDate} {req.requestTime}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#2D2D2A]">
                    {req.solicitorSector}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#2D2D2A]">
                      {req.absentQuantity}x {req.absentCategory}
                    </span>
                    <span className="text-[10px] text-[#7D7D72] block">
                      Plantão {req.affectedShift}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <CriticalityBadge criticality={req.criticality} />
                  </td>
                  <td className="py-3 px-4">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4">
                    <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenDetails(req)}
                      className="px-3 py-1 rounded-lg border border-[#E8E6D9] hover:bg-[#F9F7F2] text-[#2D2D2A] font-medium text-xs transition-colors"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
