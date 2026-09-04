import React, { useState, useMemo } from 'react';
import { DeficitRequest } from '../types';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { RequestStatusBadge, CriticalityBadge } from './StatusBadge';

interface ReportsViewProps {
  requests: DeficitRequest[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ requests }) => {
  const [filterPeriodType, setFilterPeriodType] = useState<string>('mes');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCriticality, setFilterCriticality] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterSector !== 'all' && r.solicitorSector !== filterSector) return false;
      if (filterCategory !== 'all' && r.absentCategory !== filterCategory) return false;
      if (filterCriticality !== 'all' && r.criticality !== filterCriticality) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [requests, filterSector, filterCategory, filterCriticality, filterStatus]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Protocolo',
      'Data',
      'Horário',
      'Setor',
      'Solicitante',
      'Cargo',
      'Profissional Ausente',
      'Quantidade Ausente',
      'Turno',
      'Motivo da Ausência',
      'Previsível',
      'Comunicado Antecipado',
      'Classificação',
      'Criticidade',
      'Tentativa Interna',
      'Remanejamento Solicitado',
      'Qtd Remanejamento',
      'Setor Destino',
      'Status',
      'Score Prioridade',
      'Impacto Assistencial',
      'Risco Segurança',
    ];

    const rows = filteredRequests.map((r) => [
      `"${r.protocol}"`,
      `"${r.requestDate}"`,
      `"${r.requestTime}"`,
      `"${r.solicitorSector}"`,
      `"${r.solicitorName}"`,
      `"${r.solicitorRole}"`,
      `"${r.absentCategory}"`,
      r.absentQuantity,
      `"${r.affectedShift}"`,
      `"${r.absenceReason}"`,
      r.isPredictable ? 'Sim' : 'Não',
      r.communicatedInAdvance ? 'Sim' : 'Não',
      `"${r.classification}"`,
      `"${r.criticality}"`,
      r.hasInternalAttempt ? 'Sim' : 'Não',
      r.needsRelocation ? 'Sim' : 'Não',
      r.requestedRelocationQuantity || 0,
      `"${r.destinationSector || ''}"`,
      `"${r.status}"`,
      r.priorityScore,
      `"${r.impactAssessment?.assistentialImpact || 'N/A'}"`,
      r.impactAssessment?.patientSecurityRisk ? 'Sim' : 'Não',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `relatorio_deficits_hospitalar_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Exportação & Auditoria Institucional
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Relatórios Consolidados de Déficit e Remanejamento
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de relatórios analíticos para reuniões de diretoria, comissões de enfermagem e órgãos reguladores.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Excel)</span>
          </button>
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (hidden when printing) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-teal-600" />
          <span>Filtros do Relatório</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Período</label>
            <select
              value={filterPeriodType}
              onChange={(e) => setFilterPeriodType(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="dia">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="trimestre">Trimestre</option>
              <option value="ano">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Setor</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todos os Setores</option>
              <option value="UTI">UTI</option>
              <option value="Centro Cirúrgico">Centro Cirúrgico</option>
              <option value="CME">CME</option>
              <option value="CLM">CLM</option>
              <option value="CLC">CLC</option>
              <option value="Pediatria">Pediatria</option>
              <option value="EIXO">EIXO</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Enfermeiro">Enfermeiro</option>
              <option value="Técnico de enfermagem">Técnico de enfermagem</option>
              <option value="Médico">Médico</option>
              <option value="Fisioterapeuta">Fisioterapeuta</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Criticidade</label>
            <select
              value={filterCriticality}
              onChange={(e) => setFilterCriticality(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="moderada">Moderada</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todos os Status</option>
              <option value="resolvida">Resolvida</option>
              <option value="remanejamento_em_andamento">Em Andamento</option>
              <option value="aguardando_analise">Aguardando Análise</option>
              <option value="cobertura_parcial">Cobertura Parcial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 print:p-0 print:border-none">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase">
                HOSPITAL CENTRAL — DIRETORIA DE ENFERMAGEM (DENF)
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Relatório de Gestão de Déficit de Profissionais e Remanejamento Hospitalar
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              <p>Total de Registros: {filteredRequests.length}</p>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase text-[10px]">
                <th className="py-2.5 px-3">Protocolo</th>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Setor</th>
                <th className="py-2.5 px-3">Profissional Ausente</th>
                <th className="py-2.5 px-3">Motivo</th>
                <th className="py-2.5 px-3">Criticidade</th>
                <th className="py-2.5 px-3">Remanejamento</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">{req.protocol}</td>
                  <td className="py-2.5 px-3">
                    {req.requestDate} {req.requestTime}
                  </td>
                  <td className="py-2.5 px-3 font-semibold">{req.solicitorSector}</td>
                  <td className="py-2.5 px-3 font-bold">
                    {req.absentQuantity}x {req.absentCategory}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {req.absenceReason.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-bold uppercase">{req.criticality}</td>
                  <td className="py-2.5 px-3">
                    {req.needsRelocation
                      ? `${req.requestedRelocationQuantity || req.absentQuantity} prof. p/ ${req.destinationSector}`
                      : 'Não solicitado'}
                  </td>
                  <td className="py-2.5 px-3 capitalize">
                    {req.status.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono">
                    {req.priorityScore} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
          <span>Relatório gerado automaticamente pelo Sistema de Gestão de Déficit.</span>
          <span>Assinatura da Coordenação DENF: _________________________________________</span>
        </div>
      </div>
    </div>
  );
};
