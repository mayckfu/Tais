import React, { useState } from 'react';
import { DeficitRequest, AssistentialImpactAssessment, User } from '../types';
import { AlertOctagon, ShieldAlert } from 'lucide-react';

interface ImpactModalProps {
  request: DeficitRequest;
  currentUser: User;
  onSaveImpact: (updatedRequest: DeficitRequest) => void;
  onClose: () => void;
}

export const ImpactModal: React.FC<ImpactModalProps> = ({
  request,
  currentUser,
  onSaveImpact,
  onClose,
}) => {
  const existing = request.impactAssessment;

  const [assistentialImpact, setAssistentialImpact] = useState<
    'leve' | 'moderado' | 'alto' | 'critico'
  >(existing?.assistentialImpact || 'moderado');

  const [reducedOperationalCapacity, setReducedOperationalCapacity] = useState(
    existing?.reducedOperationalCapacity || false
  );
  const [capacityReductionDetails, setCapacityReductionDetails] = useState(
    existing?.capacityReductionDetails || ''
  );

  const [patientRedistribution, setPatientRedistribution] = useState(
    existing?.patientRedistribution || false
  );
  const [patientRedistributionDetails, setPatientRedistributionDetails] = useState(
    existing?.patientRedistributionDetails || ''
  );

  const [careDelay, setCareDelay] = useState(existing?.careDelay || false);
  const [careDelayDetails, setCareDelayDetails] = useState(existing?.careDelayDetails || '');

  const [patientSecurityRisk, setPatientSecurityRisk] = useState(
    existing?.patientSecurityRisk || false
  );
  const [securityRiskDetails, setSecurityRiskDetails] = useState(
    existing?.securityRiskDetails || ''
  );

  const [bedRestriction, setBedRestriction] = useState(existing?.bedRestriction || false);
  const [restrictedBedsCount, setRestrictedBedsCount] = useState<number>(
    existing?.restrictedBedsCount || 0
  );

  const [teamOverload, setTeamOverload] = useState(existing?.teamOverload ?? true);

  const [assistentialIncident, setAssistentialIncident] = useState(
    existing?.assistentialIncident || false
  );
  const [incidentDescription, setIncidentDescription] = useState(
    existing?.incidentDescription || ''
  );

  const [nspNotification, setNspNotification] = useState(existing?.nspNotification || false);

  const handleSave = () => {
    const assessment: AssistentialImpactAssessment = {
      assistentialImpact,
      reducedOperationalCapacity,
      capacityReductionDetails: reducedOperationalCapacity ? capacityReductionDetails : undefined,
      patientRedistribution,
      patientRedistributionDetails: patientRedistribution ? patientRedistributionDetails : undefined,
      careDelay,
      careDelayDetails: careDelay ? careDelayDetails : undefined,
      patientSecurityRisk,
      securityRiskDetails: patientSecurityRisk ? securityRiskDetails : undefined,
      bedRestriction,
      restrictedBedsCount: bedRestriction ? restrictedBedsCount : 0,
      teamOverload,
      assistentialIncident,
      incidentDescription: assistentialIncident ? incidentDescription : undefined,
      nspNotification,
      assessedBy: currentUser.name,
      assessedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    const updated: DeficitRequest = {
      ...request,
      impactAssessment: assessment,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...request.timeline,
        {
          id: `tl-imp-${Date.now()}`,
          timestamp: new Date().toTimeString().slice(0, 5),
          title: `Avaliação de Impacto Assistencial: ${assistentialImpact.toUpperCase()}`,
          description: `Impacto registrado por ${currentUser.name}. Risco à segurança: ${
            patientSecurityRisk ? 'Sim' : 'Não'
          }. Notificação NSP: ${nspNotification ? 'Sim' : 'Não'}.`,
          user: currentUser.name,
          userRole: currentUser.roleTitle,
          type: 'impact',
        },
      ],
      auditTrail: [
        ...request.auditTrail,
        {
          id: `aud-imp-${Date.now()}`,
          requestId: request.id,
          protocol: request.protocol,
          user: currentUser.name,
          action: 'Avaliação de Impacto e Riscos Assistenciais',
          fieldAffected: 'impactAssessment',
          oldValue: existing ? existing.assistentialImpact : 'Nenhuma',
          newValue: assistentialImpact,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      ],
    };

    onSaveImpact(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2D2A]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E8E6D9] overflow-hidden animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-[#9E5A4E] to-[#7D3F35] text-white px-6 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#F5DFDC]">
                Gestão da Qualidade • Alçada: Coordenação & Diretoria
              </span>
              <h3 className="font-serif text-base font-bold">
                Avaliação de Impacto Assistencial — {request.protocol}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[#F5DFDC] hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Identificação da Chefia Avaliadora */}
          <div className="p-3 bg-[#F9F7F2] border border-[#E8E6D9] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-[#7D7D72] uppercase font-bold block">
                Avaliador Responsável (Coordenação / Diretoria):
              </span>
              <p className="font-bold text-[#2D2D2A] text-xs">
                {currentUser.name} <span className="text-[#7D7D72] font-normal">({currentUser.roleTitle})</span>
              </p>
            </div>
            {request.status === 'encerrada' ? (
              <span className="px-2.5 py-1 rounded-full bg-[#8C9C82]/20 text-[#3E4D36] border border-[#8C9C82]/30 text-[10px] font-bold self-start sm:self-auto">
                Auditoria Pós-Encerramento
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-bold self-start sm:self-auto">
                Avaliação em Aberto
              </span>
            )}
          </div>

          {/* Gravidade Geral */}
          <div>
            <label className="block font-bold text-[#2D2D2A] mb-1.5">
              Classificação Geral do Impacto Assistencial *
            </label>
            <div className="grid grid-cols-4 gap-2 text-center font-bold">
              {(['leve', 'moderado', 'alto', 'critico'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setAssistentialImpact(lvl)}
                  className={`p-2.5 rounded-xl border text-xs uppercase tracking-wider transition-all ${
                    assistentialImpact === lvl
                      ? lvl === 'critico'
                        ? 'bg-[#9E5A4E] text-white border-[#7D3F35]'
                        : lvl === 'alto'
                        ? 'bg-[#D1A661] text-[#2D2D2A] border-[#BA8F4D]'
                        : lvl === 'moderado'
                        ? 'bg-[#D1A661]/25 text-[#7A581E] border-[#D1A661]/40'
                        : 'bg-[#8C9C82]/20 text-[#3E4D36] border-[#8C9C82]/30'
                      : 'bg-[#F9F7F2] text-[#7D7D72] border-[#E8E6D9] hover:bg-[#F0EFEC]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist of Impacts */}
          <div className="space-y-3 pt-2.5 border-t border-[#E8E6D9]">
            <h4 className="font-serif font-bold text-[#2D2D2A] text-xs uppercase tracking-wider">
              Desdobramentos na Operação e no Cuidado:
            </h4>

            {/* Redução de capacidade */}
            <div className="p-3.5 rounded-2xl border border-[#E8E6D9] bg-[#F9F7F2] space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#2D2D2A]">
                <input
                  type="checkbox"
                  checked={reducedOperationalCapacity}
                  onChange={(e) => setReducedOperationalCapacity(e.target.checked)}
                  className="rounded text-[#5A5A40] focus:ring-[#8C9C82] w-4 h-4"
                />
                <span>Houve redução da capacidade operacional do setor?</span>
              </label>
              {reducedOperationalCapacity && (
                <input
                  type="text"
                  placeholder="Especifique: ex. diminuição no ritmo de admissões / banhos"
                  value={capacityReductionDetails}
                  onChange={(e) => setCapacityReductionDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                />
              )}
            </div>

            {/* Redistribuição interna de pacientes */}
            <div className="p-3.5 rounded-2xl border border-[#E8E6D9] bg-[#F9F7F2] space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#2D2D2A]">
                <input
                  type="checkbox"
                  checked={patientRedistribution}
                  onChange={(e) => setPatientRedistribution(e.target.checked)}
                  className="rounded text-[#5A5A40] focus:ring-[#8C9C82] w-4 h-4"
                />
                <span>Houve redistribuição de pacientes entre leitos/alas?</span>
              </label>
              {patientRedistribution && (
                <input
                  type="text"
                  placeholder="Descreva a dinâmica de transferência interna realizada"
                  value={patientRedistributionDetails}
                  onChange={(e) => setPatientRedistributionDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                />
              )}
            </div>

            {/* Atraso de cuidados */}
            <div className="p-3.5 rounded-2xl border border-[#E8E6D9] bg-[#F9F7F2] space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#2D2D2A]">
                <input
                  type="checkbox"
                  checked={careDelay}
                  onChange={(e) => setCareDelay(e.target.checked)}
                  className="rounded text-[#5A5A40] focus:ring-[#8C9C82] w-4 h-4"
                />
                <span>Houve atraso em procedimentos, medicações ou cuidados?</span>
              </label>
              {careDelay && (
                <input
                  type="text"
                  placeholder="Quais procedimentos ou horários de medicação foram impactados?"
                  value={careDelayDetails}
                  onChange={(e) => setCareDelayDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                />
              )}
            </div>

            {/* Risco à segurança */}
            <div className="p-3.5 rounded-2xl border border-[#9E5A4E]/30 bg-[#9E5A4E]/5 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#9E5A4E]">
                <input
                  type="checkbox"
                  checked={patientSecurityRisk}
                  onChange={(e) => setPatientSecurityRisk(e.target.checked)}
                  className="rounded text-[#9E5A4E] focus:ring-[#9E5A4E] w-4 h-4"
                />
                <span>Houve risco imediato ou potencial à segurança do paciente?</span>
              </label>
              {patientSecurityRisk && (
                <input
                  type="text"
                  placeholder="Descreva a vulnerabilidade assistencial identificada"
                  value={securityRiskDetails}
                  onChange={(e) => setSecurityRiskDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#9E5A4E]/40 bg-white text-[#2D2D2A] focus:border-[#9E5A4E] focus:ring-[#9E5A4E]/50"
                />
              )}
            </div>

            {/* Bloqueio de Leitos */}
            <div className="p-3.5 rounded-2xl border border-[#E8E6D9] bg-[#F9F7F2] space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#2D2D2A]">
                <input
                  type="checkbox"
                  checked={bedRestriction}
                  onChange={(e) => setBedRestriction(e.target.checked)}
                  className="rounded text-[#5A5A40] focus:ring-[#8C9C82] w-4 h-4"
                />
                <span>Necessitou bloqueio ou restrição de leitos?</span>
              </label>
              {bedRestriction && (
                <div className="flex items-center gap-2">
                  <span className="text-[#7D7D72]">Qtd de leitos bloqueados:</span>
                  <input
                    type="number"
                    min="1"
                    value={restrictedBedsCount}
                    onChange={(e) => setRestrictedBedsCount(parseInt(e.target.value, 10) || 0)}
                    className="w-24 p-2 rounded-xl border border-[#E8E6D9] bg-white font-mono font-bold text-[#2D2D2A] focus:border-[#5A5A40] focus:ring-[#8C9C82]"
                  />
                </div>
              )}
            </div>

            {/* Notificação NSP */}
            <div className="p-3.5 rounded-2xl border border-[#D1A661]/40 bg-[#D1A661]/10">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-[#7A581E]">
                <input
                  type="checkbox"
                  checked={nspNotification}
                  onChange={(e) => setNspNotification(e.target.checked)}
                  className="rounded text-[#D1A661] focus:ring-[#D1A661] w-4 h-4"
                />
                <span>Notificado ao Núcleo de Segurança do Paciente (NSP / Qualidade)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#F9F7F2] px-6 py-3.5 border-t border-[#E8E6D9] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E6D9] bg-white hover:bg-[#F9F7F2] text-[#2D2D2A] font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold shadow-xs transition-colors"
          >
            Salvar Avaliação de Impacto
          </button>
        </div>
      </div>
    </div>
  );
};
