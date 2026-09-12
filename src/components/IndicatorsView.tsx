import React, { useMemo, useState } from 'react';
import { DeficitRequest } from '../types';
import { usePlatform } from '../hooks/usePlatform';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  Smartphone,
} from 'lucide-react';

interface IndicatorsViewProps {
  requests: DeficitRequest[];
}

export const IndicatorsView: React.FC<IndicatorsViewProps> = ({ requests }) => {
  const { isMobile, detectedType, platformMode } = usePlatform();
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (selectedShift !== 'all' && r.affectedShift !== selectedShift) return false;
      if (selectedCategory !== 'all' && r.absentCategory !== selectedCategory) return false;
      return true;
    });
  }, [requests, selectedShift, selectedCategory]);

  // Calculations for Section 37: Indicadores de Eficiência
  const metrics = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return {
        totalDeficits: 0,
        totalAbsentPros: 0,
        relocationRequestRate: 0,
        relocationFulfillmentRate: 0,
        resolutionRate: 0,
        advanceCommunicationRate: 0,
        criticalRate: 0,
        avgResponseMinutes: 0,
        avgResolutionMinutes: 0,
        predictablePct: 0,
        unpredictablePct: 0,
        impactReducedCapacityCount: 0,
        impactPatientRedistributionCount: 0,
        impactCareDelayCount: 0,
        impactSecurityRiskCount: 0,
      };
    }

    const totalAbsentPros = filtered.reduce((sum, r) => sum + r.absentQuantity, 0);

    // Relocations requested vs attended
    const relocationRequests = filtered.filter((r) => r.needsRelocation);
    const totalRequestedPros = relocationRequests.reduce(
      (sum, r) => sum + (r.requestedRelocationQuantity || r.absentQuantity),
      0
    );
    const totalDispatchedPros = filtered.reduce((sum, r) => {
      const dispatchedInReq = r.relocations.reduce((s, rel) => s + rel.quantityDispatched, 0);
      return sum + dispatchedInReq;
    }, 0);

    const relocationFulfillmentRate =
      totalRequestedPros > 0 ? Math.min(100, Math.round((totalDispatchedPros / totalRequestedPros) * 100)) : 100;

    // Resolution rate
    const closedRequests = filtered.filter(
      (r) => r.status === 'resolvida' || r.status === 'cobertura_parcial' || r.status === 'nao_resolvida' || r.status === 'solucao_interna' || r.status === 'encerrada'
    );
    const fullyResolved = filtered.filter((r) => r.status === 'resolvida' || r.status === 'solucao_interna').length;
    const resolutionRate =
      closedRequests.length > 0 ? Math.round((fullyResolved / closedRequests.length) * 100) : 0;

    // Advance communication rate
    const advanceCommCount = filtered.filter((r) => r.communicatedInAdvance).length;
    const advanceCommunicationRate = Math.round((advanceCommCount / total) * 100);

    // Critical rate
    const criticalCount = filtered.filter((r) => r.criticality === 'critica').length;
    const criticalRate = Math.round((criticalCount / total) * 100);

    // Predictable vs Unpredictable
    const predictableCount = filtered.filter((r) => r.isPredictable).length;
    const predictablePct = Math.round((predictableCount / total) * 100);
    const unpredictablePct = 100 - predictablePct;

    // Impact counters
    let impactReducedCapacityCount = 0;
    let impactPatientRedistributionCount = 0;
    let impactCareDelayCount = 0;
    let impactSecurityRiskCount = 0;

    filtered.forEach((r) => {
      if (r.impactAssessment) {
        if (r.impactAssessment.reducedOperationalCapacity) impactReducedCapacityCount++;
        if (r.impactAssessment.patientRedistribution) impactPatientRedistributionCount++;
        if (r.impactAssessment.careDelay) impactCareDelayCount++;
        if (r.impactAssessment.patientSecurityRisk) impactSecurityRiskCount++;
      }
    });

    return {
      totalDeficits: total,
      totalAbsentPros,
      relocationFulfillmentRate,
      resolutionRate,
      advanceCommunicationRate,
      criticalRate,
      predictablePct,
      unpredictablePct,
      impactReducedCapacityCount,
      impactPatientRedistributionCount,
      impactCareDelayCount,
      impactSecurityRiskCount,
    };
  }, [filtered]);

  // Breakdown aggregations
  const sectorBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      counts[r.solicitorSector] = (counts[r.solicitorSector] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      counts[r.absentCategory] = (counts[r.absentCategory] || 0) + r.absentQuantity;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const reasonsBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      counts[r.absenceReason] = (counts[r.absenceReason] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const criticalityBreakdown = useMemo(() => {
    const counts = { baixa: 0, moderada: 0, alta: 0, critica: 0 };
    filtered.forEach((r) => {
      counts[r.criticality] = (counts[r.criticality] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  return (
    <div id="indicators-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
              Gestão de Qualidade & Produtividade
            </span>
            {isMobile && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8E6D9] text-[#5A5A40] border border-[#D5D3C5]">
                <Smartphone className="w-3 h-3" />
                Gráficos em Modo Mobile
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Indicadores Estratégicos & Eficiência Operacional
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise consolidada de tempos de atendimento, taxas de resolução, absenteísmo e segurança assistencial.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs w-full sm:w-auto">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white w-full sm:w-auto min-w-0"
          >
            <option value="all">Todos os Turnos</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
            <option value="12 horas">12 horas</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg bg-white w-full sm:w-auto min-w-0"
          >
            <option value="all">Todas as Categorias</option>
            <option value="Enfermeiro">Enfermeiro</option>
            <option value="Técnico de enfermagem">Técnico de enfermagem</option>
            <option value="Médico">Médico</option>
            <option value="Fisioterapeuta">Fisioterapeuta</option>
          </select>
        </div>
      </div>

      {/* KPI Cards (Section 37: Indicadores de Eficiência) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Taxa de Atendimento de Remanejamento */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Taxa de Atendimento
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{metrics.relocationFulfillmentRate}%</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
              Meta &gt; 85%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Profissionais remanejados vs. solicitados pelas unidades
          </p>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Taxa de Resolução
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">{metrics.resolutionRate}%</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Solucionadas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ocorrências solucionadas com cobertura integral
          </p>
        </div>

        {/* Taxa de Comunicação Antecipada */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Comunicação Antecipada
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-700">
              {metrics.advanceCommunicationRate}%
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              Planejamento
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Solicitações antes do início do plantão
          </p>
        </div>

        {/* Taxa de Déficit Crítico */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Taxa de Déficit Crítico
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">{metrics.criticalRate}%</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              Alta Prioridade
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ocorrências com risco assistencial imediato
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Déficits por Setor */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
              Déficits Registrados por Setor
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{sectorBreakdown.length} setores</span>
          </div>

          <div className="space-y-2.5">
            {sectorBreakdown.map(([sec, count]) => {
              const max = sectorBreakdown[0][1] || 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={sec} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{sec}</span>
                    <span className="font-mono text-slate-600 font-bold">{count} ocorrência(s)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Déficit por Categoria Profissional */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
              Profissionais Ausentes por Categoria
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Volume ausente</span>
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown.map(([cat, qty]) => {
              const max = categoryBreakdown[0][1] || 1;
              const pct = Math.round((qty / max) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat}</span>
                    <span className="font-mono text-slate-600 font-bold">{qty} colaborador(es)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Previsibilidade & Planejamento */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
              Previsibilidade da Necessidade
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Planejamento de Escala</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <span className="text-2xl font-black text-teal-800 block">{metrics.predictablePct}%</span>
              <span className="text-xs font-bold text-teal-900 mt-1 block">Previsíveis</span>
              <p className="text-[10px] text-teal-700 mt-1">Passíveis de planejamento</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-2xl font-black text-amber-800 block">
                {metrics.unpredictablePct}%
              </span>
              <span className="text-xs font-bold text-amber-900 mt-1 block">Não Previsíveis</span>
              <p className="text-[10px] text-amber-700 mt-1">Imprevistos e emergências</p>
            </div>
          </div>
        </div>

        {/* Indicadores de Impacto Assistencial */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
              Impacto Assistencial & Segurança do Paciente
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Vulnerabilidade</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Redução de Capacidade</span>
              <span className="font-bold text-rose-700">{metrics.impactReducedCapacityCount} casos</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Redistribuição de Pacientes</span>
              <span className="font-bold text-amber-700">
                {metrics.impactPatientRedistributionCount} casos
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Atrasos Assistenciais</span>
              <span className="font-bold text-orange-700">{metrics.impactCareDelayCount} casos</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-700 font-medium">Risco à Segurança</span>
              <span className="font-black text-red-700">{metrics.impactSecurityRiskCount} casos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
