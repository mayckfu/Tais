import React, { useState } from 'react';
import { ManagementFollowUp, ManagementFollowUpStatus, User } from '../types';
import { CriticalityBadge } from './StatusBadge';
import {
  FolderSync,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  Calendar,
  Edit3,
  ExternalLink,
} from 'lucide-react';

interface ManagementFollowUpViewProps {
  followUps: ManagementFollowUp[];
  currentUser: User;
  onUpdateFollowUp: (updated: ManagementFollowUp) => void;
  onNavigateToRequest: (reqId: string) => void;
}

export const ManagementFollowUpView: React.FC<ManagementFollowUpViewProps> = ({
  followUps,
  currentUser,
  onUpdateFollowUp,
  onNavigateToRequest,
}) => {
  const [selectedFollowUp, setSelectedFollowUp] = useState<ManagementFollowUp | null>(null);
  const [editStatus, setEditStatus] = useState<ManagementFollowUpStatus>('em_acompanhamento');
  const [editProvidencias, setEditProvidencias] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const openEditModal = (item: ManagementFollowUp) => {
    setSelectedFollowUp(item);
    setEditStatus(item.status);
    setEditProvidencias(item.providencias);
    setEditNotes(item.situationNotes);
  };

  const handleSave = () => {
    if (!selectedFollowUp) return;
    const updated: ManagementFollowUp = {
      ...selectedFollowUp,
      status: editStatus,
      providencias: editProvidencias,
      situationNotes: editNotes,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateFollowUp(updated);
    setSelectedFollowUp(null);
  };

  const getStatusBadge = (status: ManagementFollowUpStatus) => {
    switch (status) {
      case 'aberto':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Aberto
          </span>
        );
      case 'em_acompanhamento':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Em Acompanhamento
          </span>
        );
      case 'aguardando_acao':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Aguardando Ação
          </span>
        );
      case 'concluido':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Concluído
          </span>
        );
    }
  };

  return (
    <div id="management-followup-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
              Diretoria & Gestão Estratégica
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Acompanhamento Gerencial de Ocorrências Críticas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de planos de ação, intervenções de RH, revisão de escalas e providências institucionais pós-déficit.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto text-center text-xs">
          <div className="bg-indigo-50 border border-indigo-200 px-2.5 sm:px-4 py-2 rounded-xl min-w-0">
            <span className="text-lg sm:text-xl font-black text-indigo-900 block">
              {followUps.filter((f) => f.status !== 'concluido').length}
            </span>
            <span className="text-[9px] sm:text-[10px] text-indigo-700 uppercase font-bold block truncate">Em Aberto</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-2.5 sm:px-4 py-2 rounded-xl min-w-0">
            <span className="text-lg sm:text-xl font-black text-emerald-900 block">
              {followUps.filter((f) => f.status === 'concluido').length}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 uppercase font-bold block truncate">Concluídos</span>
          </div>
        </div>
      </div>

      {/* Follow-ups Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Protocolo</th>
                <th className="py-3.5 px-4">Setor</th>
                <th className="py-3.5 px-4">Motivo / Causa Raiz</th>
                <th className="py-3.5 px-4">Criticidade / Impacto</th>
                <th className="py-3.5 px-4">Responsável & Prazo</th>
                <th className="py-3.5 px-4">Situação / Providências</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum acompanhamento gerencial pendente</p>
                  </td>
                </tr>
              ) : (
                followUps.map((item) => (
                  <tr
                    key={item.id}
                    id={`followup-row-${item.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">
                        {item.protocol}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Criado em: {item.createdAt}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.sector}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-2">{item.reason}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <CriticalityBadge criticality={item.criticality} size="sm" />
                        <span className="text-[10px] text-slate-500 block font-semibold">
                          Impacto: {item.impact.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.responsibleName}</div>
                      <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Prazo: {item.deadline}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-700 line-clamp-2 font-medium">{item.providencias}</p>
                      {item.situationNotes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                          Nota: {item.situationNotes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                      >
                        Atualizar
                      </button>
                      <button
                        onClick={() => onNavigateToRequest(item.requestId)}
                        className="px-2 py-1 text-xs font-medium rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700"
                        title="Ver Solicitação"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Follow-Up Modal */}
      {selectedFollowUp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-200">
                  {selectedFollowUp.protocol} • {selectedFollowUp.sector}
                </span>
                <h3 className="text-base font-extrabold">Atualizar Acompanhamento Gerencial</h3>
              </div>
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="text-indigo-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Status do Acompanhamento</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ManagementFollowUpStatus)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_acompanhamento">Em Acompanhamento</option>
                  <option value="aguardando_acao">Aguardando Ação</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Providências Adotadas / Plano de Ação
                </label>
                <textarea
                  rows={4}
                  value={editProvidencias}
                  onChange={(e) => setEditProvidencias(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Observações e Situação Atual
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
              >
                Salvar Atualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
