import React, { useState } from 'react';
import { RelocationMovement, RelocationStatus, User, DeficitRequest } from '../types';
import { RelocationStatusBadge } from './StatusBadge';
import {
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  RotateCcw,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface RelocationsRealtimeViewProps {
  relocations: RelocationMovement[];
  requests?: DeficitRequest[];
  currentUser: User;
  onUpdateStatus: (
    relocationId: string,
    newStatus: RelocationStatus,
    notes?: string
  ) => void;
  onNavigateToRequest: (reqId: string) => void;
  onOpenArrivalModal?: (relocation: RelocationMovement) => void;
  onOpenClosure?: (request: DeficitRequest) => void;
}

export const RelocationsRealtimeView: React.FC<RelocationsRealtimeViewProps> = ({
  relocations,
  requests = [],
  currentUser,
  onUpdateStatus,
  onNavigateToRequest,
  onOpenArrivalModal,
  onOpenClosure,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const isEnfermeiroDePlantao = currentUser.role === 'solicitante';

  const filtered = relocations.filter((rel) => {
    if (filterStatus === 'active') {
      return (
        rel.status === 'aguardando_inicio' ||
        rel.status === 'em_deslocamento' ||
        rel.status === 'em_cobertura'
      );
    }
    if (filterStatus === 'finalizado') return rel.status === 'finalizado';
    return true;
  });

  const activeCount = relocations.filter(
    (r) =>
      r.status === 'aguardando_inicio' ||
      r.status === 'em_deslocamento' ||
      r.status === 'em_cobertura'
  ).length;

  const inCoverageCount = relocations.filter((r) => r.status === 'em_cobertura').length;
  const inTransitCount = relocations.filter((r) => r.status === 'em_deslocamento').length;

  return (
    <div id="relocations-realtime-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
              Controle Operacional em Tempo Real
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Remanejamentos de Profissionais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento contínuo de deslocamento, início de cobertura e encerramento de transferências entre setores.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="bg-purple-50 border border-purple-200 px-2.5 sm:px-4 py-2 rounded-xl text-center min-w-0">
            <span className="text-base sm:text-lg font-black text-purple-900 block">{activeCount}</span>
            <span className="text-[9px] sm:text-[10px] text-purple-700 uppercase font-bold truncate block">Ativos</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-2.5 sm:px-4 py-2 rounded-xl text-center min-w-0">
            <span className="text-base sm:text-lg font-black text-blue-900 block">{inTransitCount}</span>
            <span className="text-[9px] sm:text-[10px] text-blue-700 uppercase font-bold truncate block">Em Trânsito</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-2.5 sm:px-4 py-2 rounded-xl text-center min-w-0">
            <span className="text-base sm:text-lg font-black text-emerald-900 block">{inCoverageCount}</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 uppercase font-bold truncate block">Em Cobertura</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold overflow-x-auto touch-scroll no-scrollbar sm:flex-wrap">
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 whitespace-nowrap ${
            filterStatus === 'active'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Remanejamentos em Andamento ({activeCount})
        </button>
        <button
          onClick={() => setFilterStatus('finalizado')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 whitespace-nowrap ${
            filterStatus === 'finalizado'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Finalizados ({relocations.filter((r) => r.status === 'finalizado').length})
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 whitespace-nowrap ${
            filterStatus === 'all'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todos ({relocations.length})
        </button>
      </div>

      {/* Cards Grid of Active Relocations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
            <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">Nenhum remanejamento nesta categoria</p>
            <p className="text-xs text-slate-400 mt-1">
              Os remanejamentos autorizados pela DENF serão listados aqui.
            </p>
          </div>
        ) : (
          filtered.map((rel) => {
            return (
              <div
                key={rel.id}
                id={`card-relocation-${rel.id}`}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-purple-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-slate-400 font-bold block">
                      {rel.protocol}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {rel.quantityDispatched}x {rel.professionalCategory}
                    </h3>
                    {rel.professionalName && (
                      <span className="text-[11px] text-teal-800 font-medium block truncate">
                        Profissional: {rel.professionalName}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <RelocationStatusBadge status={rel.status} />
                  </div>
                </div>

                {/* Flow: Origin -> Destination */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Origem</span>
                    <span className="font-bold text-slate-800 truncate block" title={rel.originSector}>{rel.originSector}</span>
                  </div>
                  <div className="px-1.5 shrink-0">
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-right min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destino</span>
                    <span className="font-bold text-teal-700 truncate block" title={rel.destinationSector}>{rel.destinationSector}</span>
                  </div>
                </div>

                {/* Timing */}
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Horário previsto:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {rel.startTime} às {rel.endTime || '19:00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Duração estimada:</span>
                    <span className="font-medium text-slate-700">{rel.durationEstimated}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Autorizado por:</span>
                    <span>{rel.authorizedBy}</span>
                  </div>
                </div>

                {/* Real-time Status Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onNavigateToRequest(rel.requestId)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                    >
                      Ver Ocorrência Completa
                    </button>
                    {rel.status === 'finalizado' && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Remanejamento Concluído
                      </span>
                    )}
                  </div>

                  {rel.status === 'aguardando_inicio' && (
                    <button
                      onClick={() => onUpdateStatus(rel.id, 'em_deslocamento')}
                      className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Liberar no Setor de Origem (Iniciar Deslocamento)</span>
                    </button>
                  )}

                  {rel.status === 'em_deslocamento' && (
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          A caminho do setor: {rel.destinationSector}
                        </span>
                        <span className="text-[10px] text-blue-800 font-semibold">
                          {currentUser.sector.toLowerCase() === rel.destinationSector.toLowerCase()
                            ? 'Seu Setor'
                            : 'Setor Receptor'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {currentUser.sector.toLowerCase() === rel.destinationSector.toLowerCase() ||
                        currentUser.role === 'solicitante'
                          ? 'Profissional a caminho. Confirme a chegada assim que ele se apresentar no posto de enfermagem.'
                          : `Despachado pela DENF. Confirmação preferencial pelo Enfermeiro de Plantão da ${rel.destinationSector}.`}
                      </p>
                      <button
                        onClick={() =>
                          onOpenArrivalModal
                            ? onOpenArrivalModal(rel)
                            : onUpdateStatus(rel.id, 'em_cobertura')
                        }
                        className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {currentUser.sector.toLowerCase() === rel.destinationSector.toLowerCase() ||
                          currentUser.role === 'solicitante'
                            ? 'Confirmar Chegada no Setor (Iniciar Cobertura)'
                            : 'Confirmar Chegada (Supervisão DENF / Coordenação)'}
                        </span>
                      </button>
                    </div>
                  )}

                  {rel.status === 'em_cobertura' && (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-emerald-950 block">Ativo em Cobertura</span>
                        <span className="text-[10px] text-emerald-700 block">
                          Recepcionado por: {rel.confirmedArrivalBy || 'Enfermeiro de Plantão'}{' '}
                          {rel.confirmedArrivalAt && `às ${rel.confirmedArrivalAt}`}
                        </span>
                      </div>
                      {isEnfermeiroDePlantao ? (
                        <button
                          id={`btn-closure-rel-${rel.id}`}
                          onClick={() => {
                            const matchedReq = requests.find((r) => r.id === rel.requestId);
                            if (matchedReq && onOpenClosure) {
                              onOpenClosure(matchedReq);
                            } else {
                              onNavigateToRequest(rel.requestId);
                            }
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#4A6344] hover:bg-[#3B5036] text-white shadow-xs flex items-center gap-1.5 transition-all"
                          title="Registrar desfecho e encerrar chamado em sincronia (Exclusivo Enfermeiro de Plantão)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registrar Desfecho (Encerrar)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-[#5A6D50] bg-white px-2.5 py-1 rounded-md border border-[#8C9C82]/30">
                          Fechamento pelo Plantão
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
