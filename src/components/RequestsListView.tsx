import React, { useState, useMemo } from 'react';
import { DeficitRequest, User, Criticality, RequestStatus } from '../types';
import { RequestStatusBadge, CriticalityBadge, ClassificationBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import {
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  Building,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface RequestsListViewProps {
  requests: DeficitRequest[];
  currentUser: User;
  onOpenDetails: (request: DeficitRequest) => void;
  onOpenDecision?: (request: DeficitRequest) => void;
  title?: string;
  defaultStatusFilter?: string;
  defaultCriticalityFilter?: string;
}

export const RequestsListView: React.FC<RequestsListViewProps> = ({
  requests,
  currentUser,
  onOpenDetails,
  onOpenDecision,
  title = 'Todas as Solicitações de Déficit',
  defaultStatusFilter = 'all',
  defaultCriticalityFilter = 'all',
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(defaultStatusFilter);
  const [selectedCriticality, setSelectedCriticality] = useState<string>(defaultCriticalityFilter);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // all, today, 7days, 30days
  const [sortField, setSortField] = useState<'createdAt' | 'priorityScore' | 'criticality'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Distinct sectors and categories for filter dropdowns
  const sectors = useMemo(() => {
    const set = new Set(requests.map((r) => r.solicitorSector));
    return Array.from(set).sort();
  }, [requests]);

  const categories = useMemo(() => {
    const set = new Set(requests.map((r) => r.absentCategory));
    return Array.from(set).sort();
  }, [requests]);

  // Apply filters
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Role scope: If Solicitante, only show requests for their own sector
      if (currentUser.role === 'solicitante') {
        if (
          r.solicitorSector.toLowerCase() !== currentUser.sector.toLowerCase() &&
          r.solicitorUserId !== currentUser.id
        ) {
          return false;
        }
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesProto = r.protocol.toLowerCase().includes(term);
        const matchesSector = r.solicitorSector.toLowerCase().includes(term);
        const matchesSolicitor = r.solicitorName.toLowerCase().includes(term);
        const matchesCat = r.absentCategory.toLowerCase().includes(term);
        const matchesReason = r.absenceReason.toLowerCase().includes(term);
        if (!matchesProto && !matchesSector && !matchesSolicitor && !matchesCat && !matchesReason) {
          return false;
        }
      }

      // Sector filter
      if (selectedSector !== 'all' && r.solicitorSector !== selectedSector) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && r.absentCategory !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }

      // Criticality filter
      if (selectedCriticality !== 'all' && r.criticality !== selectedCriticality) {
        return false;
      }

      // Period filter
      if (selectedPeriod !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        if (selectedPeriod === 'today') {
          if (r.requestDate !== today) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'priorityScore') {
        return sortOrder === 'desc' ? b.priorityScore - a.priorityScore : a.priorityScore - b.priorityScore;
      }
      if (sortField === 'criticality') {
        const rank = { critica: 4, alta: 3, moderada: 2, baixa: 1 };
        const scoreA = rank[a.criticality] || 0;
        const scoreB = rank[b.criticality] || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      // default createdAt
      return sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [
    requests,
    currentUser,
    searchTerm,
    selectedSector,
    selectedCategory,
    selectedStatus,
    selectedCriticality,
    selectedPeriod,
    sortField,
    sortOrder,
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSector('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedCriticality('all');
    setSelectedPeriod('all');
  };

  const isDENFOrAdmin =
    currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador';

  return (
    <div id="requests-list-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exibindo <strong>{filteredRequests.length}</strong> de <strong>{requests.length}</strong> ocorrências
            {currentUser.role === 'solicitante' && ` (Restrito ao setor ${currentUser.sector})`}
          </p>
        </div>

        {/* Quick Sorting */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-slate-500 font-medium shrink-0">Ordenar por:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium flex-1 sm:flex-initial"
          >
            <option value="createdAt">Data / Horário</option>
            <option value="priorityScore">Nível de Prioridade</option>
            <option value="criticality">Grau de Criticidade</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 shrink-0"
            title="Alternar Ordem"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            id="input-search-requests"
            placeholder="Pesquisar por protocolo (DEF-...), setor, profissional, solicitante ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Sector */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Setor</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Profissional</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todos os Status</option>
              <option value="aguardando_analise">Aguardando Análise</option>
              <option value="em_analise">Em Análise</option>
              <option value="remanejamento_autorizado">Remanejamento Autorizado</option>
              <option value="remanejamento_em_andamento">Remanejamento em Andamento</option>
              <option value="cobertura_parcial">Cobertura Parcial</option>
              <option value="solucao_interna">Solução Interna</option>
              <option value="resolvida">Resolvida</option>
              <option value="nao_resolvida">Não Resolvida</option>
              <option value="encerrada">Encerrada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Criticality */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Criticidade</label>
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todas</option>
              <option value="critica">Crítica 🔴</option>
              <option value="alta">Alta 🟠</option>
              <option value="moderada">Moderada 🟡</option>
              <option value="baixa">Baixa 🟢</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Período</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">Todo Histórico</option>
              <option value="today">Apenas Hoje</option>
            </select>
          </div>
        </div>

        {(searchTerm ||
          selectedSector !== 'all' ||
          selectedCategory !== 'all' ||
          selectedStatus !== 'all' ||
          selectedCriticality !== 'all' ||
          selectedPeriod !== 'all') && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Protocolo</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Déficit / Plantão</th>
                <th className="py-3 px-4">Classificação</th>
                <th className="py-3 px-4">Criticidade</th>
                <th className="py-3 px-4">Remanejamento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">Nenhuma solicitação encontrada</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou crie uma nova solicitação.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isCritical = req.criticality === 'critica';
                  const isEmergency = req.classification === 'emergencial';

                  return (
                    <tr
                      key={req.id}
                      id={`row-request-${req.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? 'bg-red-50/30 font-medium' : ''
                      }`}
                    >
                      {/* Protocol & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">
                          {req.protocol}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {req.requestDate} às {req.requestTime}
                        </span>
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.solicitorSector}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block">
                          Por: {req.solicitorName}
                        </span>
                      </td>

                      {/* Deficit / Shift */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {req.absentQuantity}x {req.absentCategory}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Plantão: {req.affectedShift} às {req.deficitStartTime}
                        </div>
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
                            <span className="font-bold text-slate-800 block">
                              {req.requestedRelocationQuantity || req.absentQuantity} prof.
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Destino: {req.destinationSector}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Não solicitado</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <RequestStatusBadge status={req.status} />
                      </td>

                      {/* Priority Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityScoreBadge score={req.priorityScore} level={req.priorityLevel} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                        {/* Quick Decision for DENF */}
                        {isDENFOrAdmin &&
                          (req.status === 'aguardando_analise' ||
                            req.status === 'em_analise' ||
                            req.status === 'aguardando_informacao') && (
                            <button
                              id={`btn-decision-${req.id}`}
                              onClick={() => onOpenDecision && onOpenDecision(req)}
                              className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                              title="Registrar Decisão DENF"
                            >
                              Analisar
                            </button>
                          )}

                        {/* View Details Modal */}
                        <button
                          id={`btn-details-${req.id}`}
                          onClick={() => onOpenDetails(req)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700"
                          title="Ver Detalhes Completos da Ocorrência"
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
