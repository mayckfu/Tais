import React, { useState } from 'react';
import { RelocationMovement, RelocationStatus, User } from '../types';
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
  currentUser: User;
  onUpdateStatus: (
    relocationId: string,
    newStatus: RelocationStatus,
    notes?: string
  ) => void;
  onNavigateToRequest: (reqId: string) => void;
}

export const RelocationsRealtimeView: React.FC<RelocationsRealtimeViewProps> = ({
  relocations,
  currentUser,
  onUpdateStatus,
  onNavigateToRequest,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('active');

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
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-between">
                  <button
                    onClick={() => onNavigateToRequest(rel.requestId)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Ver Ocorrência
                  </button>

                  {/* Transitions */}
                  {rel.status === 'aguardando_inicio' && (
                    <button
                      onClick={() => onUpdateStatus(rel.id, 'em_deslocamento')}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-500 shadow-xs"
                    >
                      Marcar Em Deslocamento
                    </button>
                  )}

                  {rel.status === 'em_deslocamento' && (
                    <button
                      onClick={() => onUpdateStatus(rel.id, 'em_cobertura')}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
                    >
                      Confirmar Início de Cobertura
                    </button>
                  )}

                  {rel.status === 'em_cobertura' && (
                    <button
                      onClick={() => onUpdateStatus(rel.id, 'finalizado')}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-800 text-white hover:bg-slate-700 shadow-xs"
                    >
                      Finalizar Remanejamento
                    </button>
                  )}

                  {rel.status === 'finalizado' && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Remanejamento Concluído
                    </span>
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
