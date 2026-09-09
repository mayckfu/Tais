import React, { useState } from 'react';
import { DeficitRequest, DENFConduct, User, SystemSettings, RelocationMovement } from '../types';
import { UserCheck, ShieldAlert, AlertCircle, Building, Clock, CheckCircle } from 'lucide-react';

interface DecisionModalProps {
  request: DeficitRequest;
  currentUser: User;
  settings: SystemSettings;
  onSaveDecision: (updatedRequest: DeficitRequest) => void;
  onClose: () => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  request,
  currentUser,
  settings,
  onSaveDecision,
  onClose,
}) => {
  const [conduct, setConduct] = useState<DENFConduct>('remanejamento_interno');
  const [conductCustom, setConductCustom] = useState<string>('');
  const [denialJustification, setDenialJustification] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');

  // Origin details (if relocation)
  const [originSector, setOriginSector] = useState<string>('CME');
  const [quantityApproved, setQuantityApproved] = useState<number>(
    request.requestedRelocationQuantity || request.absentQuantity
  );
  const [nominalProfessionalName, setNominalProfessionalName] = useState<string>('');
  const [nominalProfessionalMatricula, setNominalProfessionalMatricula] = useState<string>('');

  // Timing
  const [startTime, setStartTime] = useState<string>(
    request.coverageStartTime || new Date().toTimeString().slice(0, 5)
  );
  const [endTime, setEndTime] = useState<string>(request.coverageEndTime || '19:00');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirm = () => {
    setErrorMsg(null);

    if (conduct === 'nao_realizado' && !denialJustification.trim()) {
      setErrorMsg('A justificativa da decisão é obrigatória quando não for realizado remanejamento.');
      return;
    }

    if (conduct === 'outra' && !conductCustom.trim()) {
      setErrorMsg('Por favor, especifique a outra conduta adotada.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    // Create new relocation movement if conduct is remanejamento_interno
    const updatedRelocations: RelocationMovement[] = [...request.relocations];

    if (conduct === 'remanejamento_interno') {
      const newRel: RelocationMovement = {
        id: `rel-${Date.now()}`,
        requestId: request.id,
        protocol: request.protocol,
        professionalCategory: request.requestedCategory || request.absentCategory,
        originSector,
        destinationSector: request.destinationSector || request.solicitorSector,
        professionalName: nominalProfessionalName.trim() || undefined,
        professionalRegistration: nominalProfessionalMatricula.trim() || undefined,
        quantityDispatched: quantityApproved,
        startTime,
        endTime,
        startDate: today,
        durationEstimated: `${startTime} às ${endTime}`,
        status: 'em_deslocamento',
        authorizedBy: currentUser.name,
        authorizedRole: currentUser.roleTitle,
        authorizedAt: nowTime,
        notes: decisionNotes,
      };
      updatedRelocations.push(newRel);
    }

    const newStatus =
      conduct === 'nao_realizado'
        ? 'nao_resolvida'
        : conduct === 'remanejamento_interno'
        ? 'remanejamento_em_andamento'
        : 'resolvida';

    const updatedRequest: DeficitRequest = {
      ...request,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      denfDecision: {
        conduct,
        conductCustom: conduct === 'outra' ? conductCustom : undefined,
        denialJustification: conduct === 'nao_realizado' ? denialJustification : undefined,
        decisionNotes,
        decidedBy: currentUser.name,
        decidedRole: currentUser.roleTitle,
        decidedAt: `${today} ${nowTime}`,
        originSector: conduct === 'remanejamento_interno' ? originSector : undefined,
        quantityApproved: conduct === 'remanejamento_interno' ? quantityApproved : undefined,
        nominalProfessionalName: nominalProfessionalName.trim() || undefined,
        nominalProfessionalMatricula: nominalProfessionalMatricula.trim() || undefined,
      },
      relocations: updatedRelocations,
      timeline: [
        ...request.timeline,
        {
          id: `tl-dec-${Date.now()}`,
          timestamp: nowTime,
          title: `Decisão ${currentUser.role === 'coordenador' ? 'Coordenação' : 'DENF'}: ${conduct.replace('_', ' ').toUpperCase()}`,
          description:
            conduct === 'remanejamento_interno'
              ? `Autorizada cessão de ${quantityApproved} prof. do setor ${originSector} para ${request.solicitorSector}.`
              : conduct === 'nao_realizado'
              ? `Remanejamento negado. Justificativa: ${denialJustification}`
              : `Conduta adotada: ${conduct}`,
          user: currentUser.name,
          userRole: currentUser.roleTitle,
          type: 'decision',
        },
      ],
      auditTrail: [
        ...request.auditTrail,
        {
          id: `aud-dec-${Date.now()}`,
          requestId: request.id,
          protocol: request.protocol,
          user: currentUser.name,
          action: `Registro de Decisão (${currentUser.roleTitle})`,
          fieldAffected: 'status',
          oldValue: request.status,
          newValue: newStatus,
          timestamp: `${today} ${nowTime}:00`,
        },
      ],
    };

    onSaveDecision(updatedRequest);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-300" />
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-200">
                {currentUser.role === 'coordenador'
                  ? 'Coordenação / DENF • Análise Decisória'
                  : 'Central DENF • Análise Decisória'}
              </span>
              <h3 className="text-base font-extrabold">
                {request.protocol} — {request.solicitorSector}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Quick Context Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ausente</span>
              <span className="font-extrabold text-slate-800">
                {request.absentQuantity}x {request.absentCategory}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Plantão Afetado</span>
              <span className="font-semibold text-slate-800">
                {request.affectedShift} ({request.deficitStartTime})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Criticidade</span>
              <span className="font-black text-rose-700 uppercase">{request.criticality}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 font-bold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conduta adotada (Section 9) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {currentUser.role === 'coordenador'
                ? 'Conduta Adotada pela Coordenação / Gestão *'
                : 'Conduta Adotada pela DENF / Gestão *'}
            </label>
            <select
              value={conduct}
              onChange={(e) => setConduct(e.target.value as DENFConduct)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              {settings.conductOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {conduct === 'outra' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Descrição da Conduta Adotada *
              </label>
              <input
                type="text"
                placeholder="Descreva detalhadamente a conduta alternativa"
                value={conductCustom}
                onChange={(e) => setConductCustom(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          )}

          {conduct === 'nao_realizado' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-1">
              <label className="block font-bold text-rose-950">
                Justificativa Obrigatória da Decisão de Não Remanejamento *
              </label>
              <textarea
                rows={3}
                placeholder="Informe o motivo institucional da negativa de remanejamento..."
                value={denialJustification}
                onChange={(e) => setDenialJustification(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-rose-300 bg-white"
              />
            </div>
          )}

          {/* Relocation Origin details if remanejamento_interno */}
          {conduct === 'remanejamento_interno' && (
            <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
              <h4 className="font-extrabold text-teal-950 text-xs uppercase tracking-wider">
                Origem & Parâmetros do Remanejamento
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Setor de Origem (Cedente) *
                  </label>
                  <select
                    value={originSector}
                    onChange={(e) => setOriginSector(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {settings.sectors
                      .filter((s) => s !== request.solicitorSector)
                      .map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantidade Aprovada para Cessão *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantityApproved}
                    onChange={(e) => setQuantityApproved(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>

              {/* Nominal info (optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nome do Profissional Cedido (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Téc. Carla Regina"
                    value={nominalProfessionalName}
                    onChange={(e) => setNominalProfessionalName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Matrícula / Registro Profissional (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: COREN-SP 482103"
                    value={nominalProfessionalMatricula}
                    onChange={(e) => setNominalProfessionalMatricula(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Horários de Início e Término */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horário de Início do Remanejamento *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horário de Término Previsto *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observations */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações da Decisão / Orientações para a Unidade
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para o setor solicitante e para a supervisão do setor cedente..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          {/* Autorizador preview */}
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-[11px] flex items-center justify-between">
            <span>
              Autorizado por: <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-decision"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-xs"
          >
            Registrar Decisão
          </button>
        </div>
      </div>
    </div>
  );
};
