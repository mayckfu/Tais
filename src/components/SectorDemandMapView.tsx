import React, { useMemo } from 'react';
import { DeficitRequest, RelocationMovement } from '../types';
import {
  Network,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Building,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';

interface SectorDemandMapViewProps {
  requests: DeficitRequest[];
}

export const SectorDemandMapView: React.FC<SectorDemandMapViewProps> = ({ requests }) => {
  // Aggregate all relocations across requests
  const flowMatrix = useMemo(() => {
    const flows: Record<string, Record<string, { count: number; professionals: number }>> = {};
    const donorTotals: Record<string, number> = {};
    const receiverTotals: Record<string, number> = {};

    requests.forEach((req) => {
      req.relocations.forEach((rel) => {
        const origin = rel.originSector || 'CME';
        const dest = rel.destinationSector || req.solicitorSector;
        const qty = rel.quantityDispatched || 1;

        if (!flows[origin]) flows[origin] = {};
        if (!flows[origin][dest]) flows[origin][dest] = { count: 0, professionals: 0 };
        flows[origin][dest].count += 1;
        flows[origin][dest].professionals += qty;

        donorTotals[origin] = (donorTotals[origin] || 0) + qty;
        receiverTotals[dest] = (receiverTotals[dest] || 0) + qty;
      });
    });

    // Flatten to array
    const list: {
      origin: string;
      destination: string;
      movementsCount: number;
      professionalsCount: number;
    }[] = [];

    Object.keys(flows).forEach((origin) => {
      Object.keys(flows[origin]).forEach((dest) => {
        list.push({
          origin,
          destination: dest,
          movementsCount: flows[origin][dest].count,
          professionalsCount: flows[origin][dest].professionals,
        });
      });
    });

    list.sort((a, b) => b.professionalsCount - a.professionalsCount);

    return { list, donorTotals, receiverTotals };
  }, [requests]);

  // Identify dependencies
  const topDonors = Object.entries(flowMatrix.donorTotals).sort((a, b) => Number(b[1]) - Number(a[1]));
  const topReceivers = Object.entries(flowMatrix.receiverTotals).sort((a, b) => Number(b[1]) - Number(a[1]));

  return (
    <div id="sector-demand-map-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
              Análise Estrutural de Escala
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Mapa de Demanda & Fluxo entre Setores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreamento de Origem → Destino das transferências hospitalares para identificar dependências estruturais.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center w-full sm:w-auto">
            <span className="text-xl font-black text-slate-800 block">
              {flowMatrix.list.length}
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Rotas Mapeadas</span>
          </div>
        </div>
      </div>

      {/* Structural Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Setores Fonte (Doadores) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Setores Cedentes (Fonte de Profissionais)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Total cedido</span>
          </div>
          <p className="text-xs text-slate-500">
            Unidades frequentemente acionadas para ceder equipe a outros setores do hospital:
          </p>

          <div className="space-y-2">
            {topDonors.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma cessão registrada.</p>
            ) : (
              topDonors.map(([sector, count]) => (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Building className="w-4 h-4 text-amber-600" />
                    <span>{sector}</span>
                  </div>
                  <span className="font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    {count} prof. cedidos
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Setores Deficitários (Receptores) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Setores Frequentemente Deficitários (Receptores)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Total recebido</span>
          </div>
          <p className="text-xs text-slate-500">
            Unidades com dependência de remanejamento externo para cobertura de escalas:
          </p>

          <div className="space-y-2">
            {topReceivers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum remanejamento recebido.</p>
            ) : (
              topReceivers.map(([sector, count]) => (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 border border-rose-200 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Building className="w-4 h-4 text-rose-600" />
                    <span>{sector}</span>
                  </div>
                  <span className="font-black text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded-full">
                    {count} prof. recebidos
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Flow Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-xs uppercase text-slate-700 tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-teal-600" />
            Matriz de Fluxo de Profissionais (Origem → Destino)
          </h3>
          <span className="text-xs text-slate-500">Ordenado por volume de movimentações</span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Setor de Origem (Cedeu)</th>
                <th className="py-3 px-4 text-center">Fluxo</th>
                <th className="py-3 px-4">Setor de Destino (Recebeu)</th>
                <th className="py-3 px-4 text-center">Remanejamentos Realizados</th>
                <th className="py-3 px-4 text-center">Total de Profissionais</th>
                <th className="py-3 px-4 text-right">Diagnóstico de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flowMatrix.list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum fluxo de remanejamento registrado no período.
                  </td>
                </tr>
              ) : (
                flowMatrix.list.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>{item.origin}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <ArrowRight className="w-4 h-4 text-teal-600 mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-600" />
                        <span>{item.destination}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {item.movementsCount} evento(s)
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                      {item.professionalsCount} profissional(is)
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] text-slate-500">
                      {item.professionalsCount >= 3 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Dependência Estrutural Alta
                        </span>
                      ) : (
                        <span>Compensação Pontual</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
