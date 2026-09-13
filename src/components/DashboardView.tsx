import React, { useMemo } from 'react';
import { DeficitRequest, User, RelocationMovement } from '../types';
import { RequestStatusBadge, CriticalityBadge, RelocationStatusBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import { MobileProtocolCard } from './MobileProtocolCard';
import { playHospitalChime } from '../services/soundEngine';
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
  ClipboardList,
  Bell,
  Volume2,
  Sparkles,
  Radio,
  FileCheck,
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
  onOpenNotifications?: () => void;
  onTriggerSimulatedAlert?: () => void;
  unreadAlertsCount?: number;
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
  onOpenNotifications,
  onTriggerSimulatedAlert,
  unreadAlertsCount = 0,
}) => {
  const isDENFOrAdmin =
    currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador';
  const isEnfermeiroDePlantao = currentUser.role === 'solicitante';

  // Scoped requests: If nurse, strictly scoped to their assigned sector
  const visibleRequests = useMemo(() => {
    if (isEnfermeiroDePlantao) {
      return requests.filter(
        (r) =>
          r.solicitorSector.toLowerCase() === currentUser.sector.toLowerCase() ||
          r.solicitorUserId === currentUser.id
      );
    }
    return requests;
  }, [requests, currentUser, isEnfermeiroDePlantao]);

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

  // Active open requests count for nurse
  const activeRequestsCount = visibleRequests.filter(
    (r) => r.status !== 'encerrada' && r.status !== 'cancelada'
  ).length;

  // Urgent attention items (For Coordinator/Director hospital view)
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

  // Nurse's sector-specific items (Recent active requests in the unit)
  const nurseSectorRequests = useMemo(() => {
    return [...visibleRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  // Recent requests for the bottom table
  const recentRequests = useMemo(() => {
    return [...visibleRequests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [visibleRequests]);

  // All in-transit relocations across hospital
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

  // In-transit relocations specifically destined for the nurse's unit
  const inboundToNurseSector = useMemo(() => {
    if (!isEnfermeiroDePlantao) return [];
    return inTransitRelocations.filter(
      ({ rel }) => rel.destinationSector.trim().toLowerCase() === currentUser.sector.trim().toLowerCase()
    );
  }, [inTransitRelocations, isEnfermeiroDePlantao, currentUser.sector]);

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* 1. TOP BANNER: SEPARATED BY USER PROFILE */}
      {isEnfermeiroDePlantao ? (
        /* PAINEL DO ENFERMEIRO DE PLANTÃO (FOCO NO SETOR) */
        <div className="bg-gradient-to-br from-[#405446] via-[#36473B] to-[#2B3930] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden border border-[#526B5A]/40">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  Posto de Enfermagem
                </span>
                <span className="text-xs text-emerald-100 font-semibold">
                  Lotação Ativa: <strong>{currentUser.sector}</strong>
                </span>
              </div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-white">
                Painel do Plantão — {currentUser.sector}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-normal leading-relaxed">
                Acompanhe o dimensionamento da sua equipe, registre ausências não programadas e monitore os profissionais em cobertura para a sua unidade.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                id="btn-dash-meu-plantao"
                onClick={() => onNavigateTab('my_shift')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-semibold text-xs backdrop-blur-xs transition-all"
              >
                <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Meu Plantão Agora</span>
              </button>
              <button
                id="btn-dash-new-request"
                onClick={onOpenNewRequest}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D1A661] hover:bg-[#BA8F4D] text-[#2D2D2A] font-bold text-xs shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Comunicar Novo Déficit</span>
              </button>
              <button
                onClick={() => onNavigateTab('requests')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition-all"
              >
                <ClipboardList className="w-4 h-4 text-[#D1A661]" />
                <span>Minhas Solicitações ({visibleRequests.length})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PAINEL DA DIRETORIA E COORDENAÇÃO DE ENFERMAGEM (DENF / ADMIN) */
        <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3E3E32] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden border border-[#5A5A40]/40">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#E8E6D9]/20 text-[#E8E6D9] border border-[#E8E6D9]/30">
                  Diretoria & Coordenação de Enfermagem
                </span>
                <span className="text-xs text-[#D8D6C9]">
                  Hospital Central • Gestão Hospitalar
                </span>
              </div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-white">
                Gestão Centralizada de Déficits & Remanejamento
              </h1>
              <p className="text-xs sm:text-sm text-[#D8D6C9] max-w-2xl font-normal leading-relaxed">
                Triagem centralizada de criticidade, deliberação de condutas assistenciais em tempo real e redistribuição equilibrada da força de trabalho hospitalar.
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
              <button
                onClick={() => onNavigateTab('denf_queue')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition-all"
              >
                <Clock className="w-4 h-4 text-[#D1A661]" />
                <span>Fila de Deliberação DENF ({pendingCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALERTAS HOSPITALARES E CENTRAL DE COMUNICAÇÃO: EXCLUSIVOS DA DENF E COORDENAÇÃO */}
      {isDENFOrAdmin && criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#9E5A4E] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#7D3F35]">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-white shrink-0 animate-pulse mt-0.5 sm:mt-0" />
            <div>
              <h3 className="font-bold text-sm">
                Alerta Assistencial: {criticalCount === 1 ? '1 solicitação em estado CRÍTICO requer atenção imediata!' : `${criticalCount} solicitações em estado CRÍTICO requerem atenção imediata!`}
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
            Atender Fila de Deliberação
          </button>
        </div>
      )}

      {isDENFOrAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2F3E34] via-[#28362D] to-[#1E2922] text-white shadow-sm border border-[#415648] relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#8C9C82]/25 border border-[#8C9C82]/40 flex items-center justify-center shrink-0 shadow-xs">
                <Radio className="w-5 h-5 text-[#C4D1BD] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Central de Notificações e Alertas Hospitalares</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8C9C82]/30 text-[#D8E2D3] border border-[#8C9C82]/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Canal Central DENF Ativo
                  </span>
                </div>
                <p className="text-xs text-[#BAC8B3] mt-0.5 max-w-2xl">
                  Canal de despacho e chamadas de emergência ativo para Coordenação e DENF. Avisos acústicos, vibração e pop-ups de plantão.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                id="btn-dash-test-chime"
                onClick={() => playHospitalChime('dispatch')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all hover:-translate-y-0.5"
                title="Testar sinal sonoro de deliberação"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#D1A661]" />
                <span>Testar Sinal Sonoro</span>
              </button>
              <button
                id="btn-dash-simulate-alert"
                onClick={onTriggerSimulatedAlert}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D1A661] hover:bg-[#BA8F4D] text-[#2D2D2A] text-xs font-bold transition-all shadow-xs hover:-translate-y-0.5"
                title="Simular despacho de profissional para testes operacionais"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simular Notificação</span>
              </button>
              {onOpenNotifications && (
                <button
                  id="btn-dash-open-notifs"
                  onClick={onOpenNotifications}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>Central ({unreadAlertsCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. AVISO DE CHEGADA: EXIBIDO APENAS SE HOUVER PROFISSIONAL EM TRÂNSITO */}
      {/* Para o enfermeiro: apenas se estiver vindo para a sua unidade */}
      {isEnfermeiroDePlantao && inboundToNurseSector.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 text-white shadow-sm border border-emerald-700/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Profissional a Caminho da Sua Unidade ({inboundToNurseSector.length})</span>
                </h3>
                <p className="text-xs text-emerald-200">
                  O profissional designado pela DENF está em trânsito para o seu setor (<strong>{currentUser.sector}</strong>). Confirme a chegada assim que se apresentar no posto.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {inboundToNurseSector.map(({ rel, req }) => (
              <div
                key={rel.id}
                className="p-3 bg-white/10 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-300">{rel.protocol}</span>
                    <span className="font-bold text-white">
                      {rel.professionalName || 'Profissional Designado'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-200 mt-0.5">
                    Origem: <strong>{rel.originSector}</strong> → Destino: <strong>{rel.destinationSector}</strong> ({rel.professionalCategory})
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    Autorizado por {rel.authorizedBy} às {rel.startTime}
                  </div>
                </div>

                <button
                  onClick={() =>
                    onOpenArrivalModal ? onOpenArrivalModal(rel, req) : onOpenDetails(req)
                  }
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirmar Apresentação no Posto</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Para Coordenador e DENF: lista geral de remanejamentos em trânsito no hospital */}
      {isDENFOrAdmin && inTransitRelocations.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-sm border border-blue-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Profissionais em Deslocamento no Hospital ({inTransitRelocations.length})</span>
                </h3>
                <p className="text-xs text-blue-200">
                  Remanejamentos autorizados em trânsito. A confirmação de chegada cabe ao enfermeiro da unidade de destino.
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
            {inTransitRelocations.map(({ rel, req }) => (
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
                    onOpenArrivalModal ? onOpenArrivalModal(rel, req) : onOpenDetails(req)
                  }
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirmar Chegada (Supervisão)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CARDS DE INDICADORES: ADAPTADOS AO PERFIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateTab(isEnfermeiroDePlantao ? 'requests' : 'denf_queue')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              {isEnfermeiroDePlantao ? 'Aguardando Parecer DENF' : 'Fila DENF Pendente'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#5A5A40] shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">{pendingCount}</span>
            <span className="text-xs text-[#7D7D72] font-medium">
              {isEnfermeiroDePlantao ? 'solicitações pendentes' : 'aguardando deliberação'}
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>{isEnfermeiroDePlantao ? 'Ver Minhas Solicitações' : 'Atender Fila Operacional'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#9E5A4E] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              {isEnfermeiroDePlantao ? 'Minhas Solicitações Ativas' : 'Déficits Críticos no Hospital'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#9E5A4E] shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#9E5A4E]">
              {isEnfermeiroDePlantao ? activeRequestsCount : criticalCount}
            </span>
            <span className="text-xs text-[#9E5A4E] font-medium">
              {isEnfermeiroDePlantao ? 'em acompanhamento' : 'risco assistencial elevado'}
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#9E5A4E] font-semibold gap-1">
            <span>{isEnfermeiroDePlantao ? 'Acompanhar Plantão' : 'Triagem Prioritária'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateTab('relocations')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              {isEnfermeiroDePlantao ? 'Profissionais em Cobertura' : 'Remanejamentos Ativos'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#5A5A40] shrink-0">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">
              {isEnfermeiroDePlantao ? inboundToNurseSector.length : activeRelocationsCount}
            </span>
            <span className="text-xs text-[#7D7D72] font-medium">
              {isEnfermeiroDePlantao ? 'para a sua unidade' : 'em trânsito ou cobertura'}
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>{isEnfermeiroDePlantao ? 'Ver Coberturas Recebidas' : 'Painel em Tempo Real'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateTab(isEnfermeiroDePlantao ? 'requests' : 'indicators')}
          className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 cursor-pointer hover:border-[#8C9C82] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E80]">
              {isEnfermeiroDePlantao ? 'Solicitações Concluídas' : 'Demandas Solucionadas'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-center text-[#8C9C82] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-serif font-bold text-3xl text-[#5A5A40]">{resolvedTodayCount}</span>
            <span className="text-xs text-[#7D7D72] font-medium">
              {isEnfermeiroDePlantao ? 'encerradas no setor' : 'atendimentos concluídos'}
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-[#5A5A40] font-semibold gap-1">
            <span>{isEnfermeiroDePlantao ? 'Ver Histórico' : 'Ver Indicadores Globais'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 5. SEÇÃO PRINCIPAL: SOLICITAÇÕES DA UNIDADE (ENFERMEIRO) OU PRIORIDADES HOSPITALARES (DENF) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-3.5">
            <div className="flex items-center gap-2.5">
              {isEnfermeiroDePlantao ? (
                <ClipboardList className="w-5 h-5 text-[#5A6D50] shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#9E5A4E] shrink-0" />
              )}
              <div>
                <h2 className="font-serif font-bold text-base text-[#2D2D2A]">
                  {isEnfermeiroDePlantao
                    ? `Solicitações da Unidade — ${currentUser.sector}`
                    : 'Ocorrências de Alta Prioridade Assistencial (Visão Hospitalar)'}
                </h2>
                <p className="text-[11px] text-[#7D7D72]">
                  {isEnfermeiroDePlantao
                    ? 'Histórico e acompanhamento das ausências comunicadas no seu setor de lotação.'
                    : 'Demandas críticas e emergenciais de todas as unidades hospitalares pendentes de ação.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab(isEnfermeiroDePlantao ? 'requests' : 'denf_queue')}
              className="text-xs font-bold text-[#5A5A40] hover:text-[#3E3E32]"
            >
              {isEnfermeiroDePlantao ? 'Ver Todas as Minhas Solicitações →' : 'Ver Fila DENF Completa →'}
            </button>
          </div>

          <div className="space-y-3.5">
            {(isEnfermeiroDePlantao ? nurseSectorRequests : urgentRequests).length === 0 ? (
              <div className="py-8 text-center text-[#8E8E80] text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#8C9C82] mx-auto mb-1.5" />
                <span>
                  {isEnfermeiroDePlantao
                    ? 'Nenhuma solicitação registrada para a sua unidade até o momento.'
                    : 'Nenhuma ocorrência prioritária ou crítica pendente no hospital no momento.'}
                </span>
              </div>
            ) : (
              (isEnfermeiroDePlantao ? nurseSectorRequests : urgentRequests).map((req) => {
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E6D9]/70 pb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#2D2D2A] bg-white px-2 py-0.5 rounded border border-[#E8E6D9] shrink-0">
                          {req.protocol}
                        </span>
                        <RequestStatusBadge status={req.status} />
                        <CriticalityBadge criticality={req.criticality} />
                        <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                      </div>
                      <span className="text-[11px] text-[#8E8E80] font-medium flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-[#8E8E80] shrink-0" />
                        <span className="whitespace-nowrap">{req.requestDate} às {req.requestTime}</span>
                      </span>
                    </div>

                    {/* Linha 2: Setor Solicitante e Déficit */}
                    <div className="text-xs space-y-0.5">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="font-bold text-[#2D2D2A] text-sm break-words">
                          {req.solicitorSector}:
                        </span>
                        <span className="font-extrabold text-[#9E5A4E] break-words">
                          {req.absentQuantity}x {req.absentCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7D7D72] leading-snug break-words">
                        Plantão: <strong>{req.affectedShift}</strong> • Solicitante: <strong>{req.solicitorName}</strong>
                        {req.absentReason && (
                          <span className="capitalize"> • Motivo: {req.absentReason.replace('_', ' ')}</span>
                        )}
                      </p>
                    </div>

                    {/* Linha 3: Status Real do Atendimento / Remanejamento */}
                    {hasRelocations ? (
                      <div className="p-3 rounded-lg bg-white border border-[#E8E6D9] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-[#5A6D50]" />
                            Remanejamento Assistencial Designado:
                          </span>
                          <span className="text-[10px] text-[#7D7D72]">
                            Diretoria de Enfermagem (DENF)
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
                          Aguardando análise e deliberação da Diretoria de Enfermagem (DENF).
                        </span>
                      </div>
                    )}

                    {/* Linha 4: Ações Operacionais */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#E8E6D9]/50">
                      <div className="text-[11px] text-[#7D7D72] break-words">
                        {isAttended ? (
                          <span className="text-[#3E4D36] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#5A6D50] shrink-0" />
                            <span>
                              {isEnfermeiroDePlantao
                                ? 'Cobertura encaminhada. Ao término do plantão, registre o desfecho da ocorrência.'
                                : 'Atendimento prestado. Desfecho final sob responsabilidade do enfermeiro do setor.'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#7D7D72]">
                            Ocorrência aguardando providências.
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
                        {/* Botão de Encerramento / Desfecho: exclusivo do enfermeiro da unidade solicitante */}
                        {isEnfermeiroDePlantao && isAttended && req.status !== 'encerrada' && (
                          <button
                            id={`btn-closure-card-${req.id}`}
                            onClick={() => (onOpenClosure ? onOpenClosure(req) : onOpenDetails(req))}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#4A6344] hover:bg-[#3B5036] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
                            title="Registrar desfecho e encerrar o chamado"
                          >
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Registrar Desfecho</span>
                          </button>
                        )}

                        {/* Botão de Deliberação: para coordenador e DENF */}
                        {isDENFOrAdmin &&
                          (req.status === 'aguardando_analise' || req.status === 'em_analise') && (
                            <button
                              id={`btn-decision-card-${req.id}`}
                              onClick={() => onOpenDecision(req)}
                              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Deliberar</span>
                            </button>
                          )}

                        <button
                          id={`btn-details-card-${req.id}`}
                          onClick={() => onOpenDetails(req)}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] text-[#2D2D2A] font-semibold text-xs transition-colors text-center whitespace-nowrap"
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

        {/* Right 1 Col: Acesso Rápido */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm text-[#2D2D2A] border-b border-[#E8E6D9] pb-3">
              {isEnfermeiroDePlantao ? 'Ações Rápidas do Plantonista' : 'Acesso Rápido Gerencial'}
            </h3>

            {isEnfermeiroDePlantao ? (
              <div className="mt-3 space-y-2 text-xs">
                <button
                  id="btn-fast-new-request"
                  onClick={onOpenNewRequest}
                  className="w-full text-left p-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold flex items-center justify-between transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-[#D1A661]" />
                    <span>Comunicar Novo Déficit</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                </button>

                <button
                  id="btn-fast-my-requests"
                  onClick={() => onNavigateTab('requests')}
                  className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-[#8C9C82]" />
                    <span>Minhas Solicitações do Setor</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
                </button>

                <button
                  id="btn-fast-relocations"
                  onClick={() => onNavigateTab('relocations')}
                  className="w-full text-left p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F0EFEC] border border-[#E8E6D9] font-medium text-[#2D2D2A] flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-[#5A5A40]" />
                    <span>Remanejamentos & Deslocamento</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E8E80]" />
                </button>
              </div>
            ) : (
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
            )}
          </div>

          <div className="p-3.5 bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl text-xs text-[#5A5A40] mt-4">
            <span className="font-bold block text-[#3E3E32]">
              {isEnfermeiroDePlantao ? 'Diretriz do Plantão:' : 'Protocolo de Comunicação DENF:'}
            </span>
            <p className="text-[11px] text-[#7D7D72] mt-1 leading-relaxed">
              {isEnfermeiroDePlantao
                ? 'Comunique déficits com a maior antecedência possível do início do plantão. Ao término da cobertura assistencial, registre o desfecho para formalizar o encerramento da ocorrência.'
                : 'Notifique ausências com antecedência mínima de 2 horas do início do plantão para otimizar as rotas de remanejamento e dimensionamento.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. TABELA DE ÚLTIMAS OCORRÊNCIAS REGISTRADAS */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] overflow-hidden">
        <div className="p-4 bg-[#F9F7F2] border-b border-[#E8E6D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-sm text-[#2D2D2A]">
              {isEnfermeiroDePlantao
                ? `Últimas Ocorrências Registradas — ${currentUser.sector}`
                : 'Últimas Ocorrências Registradas no Hospital'}
            </h2>
            <p className="text-[11px] text-[#7D7D72] mt-0.5 flex items-center gap-1.5">
              {isEnfermeiroDePlantao ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#8C9C82]"></span>
                  <span>
                    Exibindo exclusivamente ocorrências da sua unidade de lotação: <strong>{currentUser.sector}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-[#5A5A40]"></span>
                  <span>
                    Visão Geral do Hospital: Todos os setores, blocos cirúrgicos e enfermarias
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-[#5A5A40] hover:text-[#3E3E32] self-start sm:self-auto"
          >
            {isEnfermeiroDePlantao
              ? `Ver Todas da ${currentUser.sector} (${visibleRequests.length}) →`
              : `Ver Histórico Hospitalar (${visibleRequests.length}) →`}
          </button>
        </div>

        {/* Mobile View: Protocol Cards */}
        <div className="block sm:hidden p-3 space-y-3 bg-[#F9F7F2]/50">
          {recentRequests.length === 0 ? (
            <div className="p-6 text-center text-[#8E8E80] text-xs">
              Nenhuma ocorrência recente registrada.
            </div>
          ) : (
            recentRequests.map((req) => (
              <MobileProtocolCard
                key={req.id}
                request={req}
                currentUser={currentUser}
                onSelectRequest={onOpenDetails}
                onOpenDecisionModal={onOpenDecision}
                onOpenClosureModal={onOpenClosure}
              />
            ))
          )}
        </div>

        {/* Desktop / Tablet View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#F9F7F2]/60 text-[#7D7D72] font-bold border-b border-[#E8E6D9] uppercase text-[10px] tracking-wider whitespace-nowrap">
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
                  <td className="py-3 px-4 font-mono font-bold text-[#2D2D2A] whitespace-nowrap">
                    {req.protocol}
                    <span className="text-[10px] text-[#8E8E80] block font-normal">
                      {req.requestDate} às {req.requestTime}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#2D2D2A] whitespace-nowrap">
                    {req.solicitorSector}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-[#2D2D2A]">
                      {req.absentQuantity}x {req.absentCategory}
                    </span>
                    <span className="text-[10px] text-[#7D7D72] block">
                      Plantão {req.affectedShift}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CriticalityBadge criticality={req.criticality} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenDetails(req)}
                      className="px-3 py-1.5 rounded-lg border border-[#E8E6D9] hover:bg-[#F9F7F2] text-[#2D2D2A] font-semibold text-xs transition-colors"
                    >
                      Ver Detalhes
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
