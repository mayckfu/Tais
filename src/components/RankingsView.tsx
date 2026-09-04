import React, { useMemo, useState } from 'react';
import { DeficitRequest } from '../types';
import { Trophy, TrendingUp, AlertTriangle, ShieldAlert, Award, Clock, ArrowRightLeft } from 'lucide-react';

interface RankingsViewProps {
  requests: DeficitRequest[];
}

export const RankingsView: React.FC<RankingsViewProps> = ({ requests }) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today'>('all');

  const filteredRequests = useMemo(() => {
    if (periodFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return requests.filter((r) => r.requestDate === today);
    }
    return requests;
  }, [requests, periodFilter]);

  // Calculations for Rankings
  const rankings = useMemo(() => {
    // 1. Setores com maior número de déficits
    const sectorDeficitCount: Record<string, number> = {};
    // 2. Setores com maior déficit de profissionais (soma de ausentes)
    const sectorProfessionalsVolume: Record<string, number> = {};
    // 3. Categorias com maior absenteísmo
    const categoryAbsenteeism: Record<string, number> = {};
    // 4. Principais motivos de ausência
    const reasonsCount: Record<string, number> = {};
    // 5. Setores com mais solicitações emergenciais
    const sectorEmergencyCount: Record<string, number> = {};
    // 6. Setores com mais ocorrências críticas
    const sectorCriticalCount: Record<string, number> = {};
    // 7. Setores com maior impacto assistencial (alto/crítico)
    const sectorImpactCount: Record<string, number> = {};
    // 8. Setores que mais solicitaram remanejamento
    const sectorRequestedRelocation: Record<string, number> = {};
    // 9. Setores que mais forneceram profissionais
    const sectorProvidedRelocation: Record<string, number> = {};

    filteredRequests.forEach((req) => {
      const sec = req.solicitorSector;
      const qty = req.absentQuantity;
      const cat = req.absentCategory;
      const reason = req.absenceReason;

      sectorDeficitCount[sec] = (sectorDeficitCount[sec] || 0) + 1;
      sectorProfessionalsVolume[sec] = (sectorProfessionalsVolume[sec] || 0) + qty;
      categoryAbsenteeism[cat] = (categoryAbsenteeism[cat] || 0) + qty;
      reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;

      if (req.classification === 'emergencial') {
        sectorEmergencyCount[sec] = (sectorEmergencyCount[sec] || 0) + 1;
      }
      if (req.criticality === 'critica') {
        sectorCriticalCount[sec] = (sectorCriticalCount[sec] || 0) + 1;
      }
      if (req.impactAssessment?.assistentialImpact === 'alto' || req.impactAssessment?.assistentialImpact === 'critico') {
        sectorImpactCount[sec] = (sectorImpactCount[sec] || 0) + 1;
      }
      if (req.needsRelocation) {
        sectorRequestedRelocation[sec] = (sectorRequestedRelocation[sec] || 0) + (req.requestedRelocationQuantity || qty);
      }

      req.relocations.forEach((rel) => {
        const origin = rel.originSector;
        sectorProvidedRelocation[origin] = (sectorProvidedRelocation[origin] || 0) + (rel.quantityDispatched || 1);
      });
    });

    const toSortedArray = (rec: Record<string, number>) =>
      Object.entries(rec)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 10. Ocorrências com maior tempo de resolução
    const longestResolutions = [...filteredRequests]
      .filter((r) => r.closure?.totalResolutionMinutes && r.closure.totalResolutionMinutes > 0)
      .map((r) => ({
        protocol: r.protocol,
        sector: r.solicitorSector,
        category: r.absentCategory,
        minutes: r.closure?.totalResolutionMinutes || 0,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    return {
      topDeficitSectors: toSortedArray(sectorDeficitCount).slice(0, 5),
      topVolumeSectors: toSortedArray(sectorProfessionalsVolume).slice(0, 5),
      topCategories: toSortedArray(categoryAbsenteeism).slice(0, 5),
      topReasons: toSortedArray(reasonsCount).slice(0, 5),
      topEmergencySectors: toSortedArray(sectorEmergencyCount).slice(0, 5),
      topCriticalSectors: toSortedArray(sectorCriticalCount).slice(0, 5),
      topImpactSectors: toSortedArray(sectorImpactCount).slice(0, 5),
      topRequestingSectors: toSortedArray(sectorRequestedRelocation).slice(0, 5),
      topDonorSectors: toSortedArray(sectorProvidedRelocation).slice(0, 5),
      longestResolutions,
    };
  }, [filteredRequests]);

  const renderRankingCard = (
    title: string,
    icon: React.ReactNode,
    items: { name: string; value: number }[],
    unit: string,
    accentColor: string
  ) => {
    const maxValue = items.length > 0 ? items[0].value : 1;
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">{title}</h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum dado registrado.</p>
          ) : (
            items.map((it, idx) => {
              const pct = Math.round((it.value / maxValue) * 100);
              return (
                <div key={it.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900 font-bold'
                            : idx === 2
                            ? 'bg-amber-700 text-white font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{it.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 shrink-0 font-mono">
                      {it.value} {unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${accentColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="rankings-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Painel de Desempenho Institucional
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Rankings Gerenciais</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas estratégicas para subsidiar planejamento de escala, dimensionamento e alocação de recursos.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Período:</span>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              periodFilter === 'all' ? 'bg-teal-700 text-white' : 'border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Histórico Completo
          </button>
          <button
            onClick={() => setPeriodFilter('today')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              periodFilter === 'today' ? 'bg-teal-700 text-white' : 'border border-slate-300 hover:bg-slate-100'
            }`}
          >
            Apenas Hoje
          </button>
        </div>
      </div>

      {/* Grid of Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {renderRankingCard(
          '1. Setores com Mais Ocorrências de Déficit',
          <TrendingUp className="w-4 h-4 text-teal-600" />,
          rankings.topDeficitSectors,
          'ocorr.',
          'bg-teal-600'
        )}

        {renderRankingCard(
          '2. Setores com Maior Volume de Ausentes',
          <Award className="w-4 h-4 text-indigo-600" />,
          rankings.topVolumeSectors,
          'prof.',
          'bg-indigo-600'
        )}

        {renderRankingCard(
          '3. Categorias com Maior Absenteísmo',
          <AlertTriangle className="w-4 h-4 text-amber-600" />,
          rankings.topCategories,
          'ausências',
          'bg-amber-600'
        )}

        {renderRankingCard(
          '4. Principais Motivos de Ausência',
          <Award className="w-4 h-4 text-blue-600" />,
          rankings.topReasons,
          'casos',
          'bg-blue-600'
        )}

        {renderRankingCard(
          '5. Setores com Mais Solicitações Emergenciais',
          <ShieldAlert className="w-4 h-4 text-rose-600" />,
          rankings.topEmergencySectors,
          'emerg.',
          'bg-rose-600'
        )}

        {renderRankingCard(
          '6. Setores com Mais Ocorrências Críticas',
          <ShieldAlert className="w-4 h-4 text-red-600" />,
          rankings.topCriticalSectors,
          'críticas',
          'bg-red-600'
        )}

        {renderRankingCard(
          '7. Setores que Mais Solicitaram Remanejamento',
          <ArrowRightLeft className="w-4 h-4 text-purple-600" />,
          rankings.topRequestingSectors,
          'solicitados',
          'bg-purple-600'
        )}

        {renderRankingCard(
          '8. Setores que Mais Forneceram Profissionais',
          <Trophy className="w-4 h-4 text-emerald-600" />,
          rankings.topDonorSectors,
          'cedidos',
          'bg-emerald-600'
        )}

        {/* 9. Maior tempo de resolução */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
                9. Ocorrências com Maior Tempo de Resolução
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {rankings.longestResolutions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">Nenhuma ocorrência encerrada.</p>
            ) : (
              rankings.longestResolutions.map((res, idx) => (
                <div
                  key={res.protocol}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">{res.protocol}</span>
                    <span className="text-[11px] text-slate-500">
                      {res.sector} • {res.category}
                    </span>
                  </div>
                  <span className="font-mono font-black text-rose-700 text-xs">
                    {res.minutes} minutos
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
