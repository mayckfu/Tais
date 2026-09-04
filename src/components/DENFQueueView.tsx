import React, { useMemo, useState } from 'react';
import { DeficitRequest, User } from '../types';
import { RequestStatusBadge, CriticalityBadge, ClassificationBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import {
  Clock,
  ShieldAlert,
  Flame,
  CheckCircle,
  Filter,
  UserCheck,
  Building,
} from 'lucide-react';

interface DENFQueueViewProps {
  requests: DeficitRequest[];
  currentUser: User;
  onOpenDecision: (request: DeficitRequest) => void;
  onOpenDetails: (request: DeficitRequest) => void;
}

export const DENFQueueView: React.FC<DENFQueueViewProps> = ({
  requests,
  currentUser,
  onOpenDecision,
  onOpenDetails,
}) => {
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  // Filter only pending or in analysis requests
  const pendingRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.status === 'aguardando_analise' ||
        r.status === 'em_analise' ||
        r.status === 'aguardando_informacao' ||
        r.status === 'cobertura_parcial'
    );
  }, [requests]);

  // Strict sorting priority:
  // 1. Criticidade crítica
  // 2. Criticidade alta
  // 3. Emergencial
  // 4. Maior tempo aguardando (createdAt mais antigo primeiro)
  const prioritizedQueue = useMemo(() => {
    return [...pendingRequests]
      .filter((r) => {
        if (filterCriticalOnly) return r.criticality === 'critica';
        return true;
      })
      .sort((a, b) => {
        if (a.criticality === 'critica' && b.criticality !== 'critica') return -1;
        if (b.criticality === 'critica' && a.criticality !== 'critica') return 1;

        if (a.criticality === 'alta' && b.criticality !== 'alta') return -1;
        if (b.criticality === 'alta' && a.criticality !== 'alta') return 1;

        if (a.classification === 'emergencial' && b.classification !== 'emergencial') return -1;
        if (b.classification === 'emergencial' && a.classification !== 'emergencial') return 1;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [pendingRequests, filterCriticalOnly]);

  const criticalCount = pendingRequests.filter((r) => r.criticality === 'critica').length;
  const emergencyCount = pendingRequests.filter((r) => r.classification === 'emergencial').length;

  const calculateWaitTimeMinutes = (createdAtStr: string): number => {
    try {
      const created = new Date(createdAtStr).getTime();
      const now = Date.now();
      return Math.max(1, Math.round((now - created) / 60000));
    } catch {
      return 0;
    }
  };

  return (
    <div id="denf-queue-view" className="space-y-6">
      {/* Top Banner Natural Tones */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3E3E32] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#5A5A40]/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-3 py-0.5 rounded-full bg-[#E8E6D9]/20 text-[#E8E6D9] border border-[#E8E6D9]/30 uppercase tracking-widest">
                Central de Triagem Operacional
              </span>
              <span className="text-xs text-[#D8D6C9]">Ordenação Clínica Automática</span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight mt-1 text-white">
              Central de Déficits / Fila DENF
            </h2>
            <p className="text-xs sm:text-sm text-[#D8D6C9] mt-1.5 max-w-2xl font-normal leading-relaxed">
              Fila gerencial priorizada por Criticidade, Caráter Emergencial e Tempo de Espera.
              Tome decisões de remanejamento, sobreaviso ou redistribuição em tempo hábil.
            </p>
          </div>

          {/* Quick Stats in Banner */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="bg-[#9E5A4E]/30 border border-[#9E5A4E]/50 px-2.5 sm:px-4 py-2 rounded-2xl text-center min-w-0">
              <span className="font-serif text-lg sm:text-xl font-bold text-white block">{criticalCount}</span>
              <span className="text-[9px] sm:text-[10px] text-[#F5DFDC] uppercase font-bold tracking-wider block truncate">Críticas</span>
            </div>
            <div className="bg-[#D1A661]/25 border border-[#D1A661]/40 px-2.5 sm:px-4 py-2 rounded-2xl text-center min-w-0">
              <span className="font-serif text-lg sm:text-xl font-bold text-[#F3EAD8] block">{emergencyCount}</span>
              <span className="text-[9px] sm:text-[10px] text-[#F3EAD8] uppercase font-bold tracking-wider block truncate">Emergenciais</span>
            </div>
            <div className="bg-white/10 border border-white/20 px-2.5 sm:px-4 py-2 rounded-2xl text-center min-w-0">
              <span className="font-serif text-lg sm:text-xl font-bold text-white block">{pendingRequests.length}</span>
              <span className="text-[9px] sm:text-[10px] text-[#D8D6C9] uppercase font-bold tracking-wider block truncate">Na Fila</span>
            </div>
          </div>
        </div>

        {/* Filter toggle */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[#D8D6C9]">
            <div className="flex items-center gap-1.5 font-medium shrink-0">
              <Filter className="w-4 h-4 text-[#D1A661]" />
              <span>Filtro Rápido:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterCriticalOnly(false)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  !filterCriticalOnly
                    ? 'bg-[#D1A661] text-[#2D2D2A]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                Todas Pendentes ({pendingRequests.length})
              </button>
              <button
                onClick={() => setFilterCriticalOnly(true)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  filterCriticalOnly
                    ? 'bg-[#9E5A4E] text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                Apenas Críticas ({criticalCount})
              </button>
            </div>
          </div>

          <span className="text-[11px] text-[#D8D6C9] w-full sm:w-auto">
            Tempo de resposta preconizado: &lt; 10 min para críticas
          </span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F9F7F2] text-[#7D7D72] font-bold border-b border-[#E8E6D9] uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Prioridade & Protocolo</th>
                <th className="py-3.5 px-4">Horário / Espera</th>
                <th className="py-3.5 px-4">Setor</th>
                <th className="py-3.5 px-4">Déficit</th>
                <th className="py-3.5 px-4">Classificação</th>
                <th className="py-3.5 px-4">Criticidade</th>
                <th className="py-3.5 px-4">Remanejamento Solicitado</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4 text-right">Ação DENF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6D9]/50">
              {prioritizedQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8E8E80]">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-[#8C9C82]" />
                    <p className="font-serif font-bold text-[#2D2D2A] text-base">Fila DENF Zerada!</p>
                    <p className="text-xs text-[#7D7D72] mt-1">
                      Nenhuma solicitação pendente de análise no momento.
                    </p>
                  </td>
                </tr>
              ) : (
                prioritizedQueue.map((req, index) => {
                  const isCritical = req.criticality === 'critica';
                  const waitMinutes = calculateWaitTimeMinutes(req.createdAt);
                  const isOverdue = waitMinutes > 20;

                  return (
                    <tr
                      key={req.id}
                      id={`denf-queue-row-${req.id}`}
                      className={`hover:bg-[#F9F7F2]/60 transition-colors ${
                        isCritical
                          ? 'bg-[#9E5A4E]/5 border-l-4 border-l-[#9E5A4E]'
                          : req.criticality === 'alta'
                          ? 'bg-[#D1A661]/5 border-l-4 border-l-[#D1A661]'
                          : ''
                      }`}
                    >
                      {/* Priority Index & Protocol */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              index === 0
                                ? 'bg-[#9E5A4E] text-white'
                                : 'bg-[#E8E6D9] text-[#5A5A40]'
                            }`}
                          >
                            {index + 1}º
                          </span>
                          <div>
                            <span className="font-mono font-bold text-[#2D2D2A] block">
                              {req.protocol}
                            </span>
                            <span className="text-[10px] text-[#8E8E80]">
                              Por: {req.solicitorName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Request Time & Wait time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-[#2D2D2A]">
                          {req.requestTime}
                        </div>
                        <div
                          className={`text-[11px] font-bold flex items-center gap-1 ${
                            isOverdue ? 'text-[#9E5A4E]' : 'text-[#BA8F4D]'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Aguardando há {waitMinutes} min</span>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2D2D2A] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#8E8E80]" />
                          <span>{req.solicitorSector}</span>
                        </div>
                        <span className="text-[10px] text-[#8E8E80] font-normal block">
                          Plantão: {req.affectedShift}
                        </span>
                      </td>

                      {/* Deficit Category & Quantity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2D2D2A]">
                          {req.absentQuantity}x {req.absentCategory}
                        </div>
                        <span className="text-[10px] text-[#7D7D72]">
                          Motivo: {req.absenceReason.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ClassificationBadge classification={req.classification} />
                      </td>

                      {/* Criticality */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <CriticalityBadge criticality={req.criticality} />
                      </td>

                      {/* Remanejamento Solicitado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {req.needsRelocation ? (
                          <div>
                            <span className="font-bold text-[#2D2D2A] block">
                              {req.requestedRelocationQuantity || req.absentQuantity} prof.
                            </span>
                            <span className="text-[10px] text-[#7D7D72]">
                              Destino: {req.destinationSector}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8E8E80] italic">Não solicitado</span>
                        )}
                      </td>

                      {/* Priority Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                        <button
                          id={`btn-analyze-denf-${req.id}`}
                          onClick={() => onOpenDecision(req)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs transition-all inline-flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Tomar Decisão</span>
                        </button>
                        <button
                          onClick={() => onOpenDetails(req)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] text-[#2D2D2A] transition-colors"
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
