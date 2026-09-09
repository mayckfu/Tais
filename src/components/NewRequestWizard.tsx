import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  DeficitRequest,
  SystemSettings,
  NeedClassification,
  Criticality,
  ShiftType,
  AbsenceReason,
  InternalSolutionAlternative,
} from '../types';
import {
  calculatePriorityScore,
  calculateMinutesDifference,
  generateProtocol,
  checkDuplicateRequest,
} from '../services/storage';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
  ArrowRight,
  Building,
  RotateCcw,
} from 'lucide-react';
import { CriticalityBadge, ClassificationBadge } from './StatusBadge';

interface NewRequestWizardProps {
  currentUser: User;
  settings: SystemSettings;
  existingRequests: DeficitRequest[];
  onSaveRequest: (newReq: DeficitRequest) => void;
  onCancel: () => void;
  onNavigateToRequest: (reqId: string) => void;
}

export const NewRequestWizard: React.FC<NewRequestWizardProps> = ({
  currentUser,
  settings,
  existingRequests,
  onSaveRequest,
  onCancel,
  onNavigateToRequest,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  // Etapa 1: Identificação
  const [requestDate, setRequestDate] = useState<string>(today);
  const [requestTime, setRequestTime] = useState<string>(currentTime);
  const [solicitorSector, setSolicitorSector] = useState<string>(
    currentUser.sector || 'UTI'
  );
  const [solicitorSectorCustom, setSolicitorSectorCustom] = useState<string>('');
  const [solicitorName, setSolicitorName] = useState<string>(currentUser.name);
  const [solicitorRole, setSolicitorRole] = useState<string>(
    currentUser.role === 'coordenador'
      ? 'Coordenador'
      : currentUser.role === 'denf'
      ? 'Gestor'
      : 'Enfermeiro'
  );
  const [solicitorRoleCustom, setSolicitorRoleCustom] = useState<string>('');

  // Etapa 2: Caracterização do Déficit
  const [absentCategory, setAbsentCategory] = useState<string>('Técnico de enfermagem');
  const [absentCategoryCustom, setAbsentCategoryCustom] = useState<string>('');
  const [absentQuantity, setAbsentQuantity] = useState<number>(1);
  const [affectedShift, setAffectedShift] = useState<ShiftType>('Manhã');
  const [affectedShiftCustom, setAffectedShiftCustom] = useState<string>('');
  const [affectedShiftDate, setAffectedShiftDate] = useState<string>(today);
  const [deficitStartTime, setDeficitStartTime] = useState<string>('07:00');

  // Etapa 3: Motivo da Ausência
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('atestado');
  const [absenceReasonCustom, setAbsenceReasonCustom] = useState<string>('');

  // Etapa 4: Previsibilidade
  const [isPredictable, setIsPredictable] = useState<boolean>(false);
  const [communicatedInAdvance, setCommunicatedInAdvance] = useState<boolean>(true);
  const [antecedenceOption, setAntecedenceOption] = useState<
    'menos_1h' | '1a3h' | '3a6h' | 'mais_6h' | 'mais_24h' | 'nao_se_aplica'
  >('1a3h');
  const [lateCommunicationReason, setLateCommunicationReason] = useState<string>('Ausência inesperada');
  const [lateCommunicationReasonCustom, setLateCommunicationReasonCustom] = useState<string>('');

  // Etapa 5: Classificação da Necessidade
  const [classification, setClassification] = useState<NeedClassification>('nao_programada');

  // Etapa 6: Grau de Criticidade
  const [criticality, setCriticality] = useState<Criticality>('moderada');

  // Etapa 7: Tentativas de Solução Interna
  const [hasInternalAttempt, setHasInternalAttempt] = useState<boolean>(true);
  const [internalAttemptJustification, setInternalAttemptJustification] = useState<string>('');
  const [internalAlternatives, setInternalAlternatives] = useState<InternalSolutionAlternative[]>([
    'reorganizacao_escala',
  ]);
  const [internalFailureReason, setInternalFailureReason] = useState<string>('');

  // Etapa 8: Solicitação de Remanejamento
  const [needsRelocation, setNeedsRelocation] = useState<boolean>(true);
  const [requestedRelocationQuantity, setRequestedRelocationQuantity] = useState<number>(1);
  const [requestedCategory, setRequestedCategory] = useState<string>('Técnico de enfermagem');
  const [destinationSector, setDestinationSector] = useState<string>(
    currentUser.sector || 'UTI'
  );
  const [coverageStartTime, setCoverageStartTime] = useState<string>('07:00');
  const [coverageEndTime, setCoverageEndTime] = useState<string>('19:00');
  const [estimatedRelocationDuration, setEstimatedRelocationDuration] = useState<string>('6–12 horas');

  // Show summary modal before final confirmation
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DeficitRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-calculated antecedence
  const calculatedAntecedenceMinutes = useMemo(() => {
    return calculateMinutesDifference(
      requestDate,
      requestTime,
      affectedShiftDate,
      deficitStartTime
    );
  }, [requestDate, requestTime, affectedShiftDate, deficitStartTime]);

  // Keep destination sector synced to solicitor sector if not touched
  useEffect(() => {
    if (!destinationSector) {
      setDestinationSector(solicitorSector === 'Outro' ? solicitorSectorCustom : solicitorSector);
    }
  }, [solicitorSector, solicitorSectorCustom, destinationSector]);

  // Duplicate check when step changes
  useEffect(() => {
    const finalSector = solicitorSector === 'Outro' ? solicitorSectorCustom : solicitorSector;
    const finalCategory = absentCategory === 'Outro' ? absentCategoryCustom : absentCategory;
    if (finalSector && finalCategory) {
      const dup = checkDuplicateRequest(
        finalSector,
        finalCategory,
        affectedShiftDate,
        affectedShift,
        existingRequests
      );
      setDuplicateWarning(dup);
    }
  }, [solicitorSector, solicitorSectorCustom, absentCategory, absentCategoryCustom, affectedShiftDate, affectedShift, existingRequests]);

  const toggleAlternative = (alt: InternalSolutionAlternative) => {
    if (alt === 'nenhuma') {
      setInternalAlternatives(['nenhuma']);
      return;
    }
    const filtered = internalAlternatives.filter((a) => a !== 'nenhuma');
    if (filtered.includes(alt)) {
      setInternalAlternatives(filtered.filter((a) => a !== alt));
    } else {
      setInternalAlternatives([...filtered, alt]);
    }
  };

  // Step validation
  const validateCurrentStep = (): boolean => {
    setFormError(null);

    if (currentStep === 1) {
      if (solicitorSector === 'Outro' && !solicitorSectorCustom.trim()) {
        setFormError('Por favor, informe o nome do setor.');
        return false;
      }
      if (!solicitorName.trim()) {
        setFormError('Informe o nome do solicitante.');
        return false;
      }
      if (solicitorRole === 'Outro' && !solicitorRoleCustom.trim()) {
        setFormError('Informe o cargo ou função do solicitante.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (absentCategory === 'Outro' && !absentCategoryCustom.trim()) {
        setFormError('Por favor, informe a categoria profissional.');
        return false;
      }
      if (!absentQuantity || absentQuantity <= 0) {
        setFormError('A quantidade de profissionais ausentes deve ser maior que zero.');
        return false;
      }
      if (!affectedShiftDate) {
        setFormError('Informe a data do plantão afetado.');
        return false;
      }
    }

    if (currentStep === 3) {
      if (absenceReason === 'outro' && !absenceReasonCustom.trim()) {
        setFormError('Por favor, especifique o motivo da ausência.');
        return false;
      }
    }

    if (currentStep === 4) {
      if (!communicatedInAdvance && !lateCommunicationReason.trim()) {
        setFormError('Informe o motivo pelo qual a necessidade não foi comunicada anteriormente.');
        return false;
      }
    }

    if (currentStep === 7) {
      if (!hasInternalAttempt && !internalAttemptJustification.trim()) {
        setFormError('Você informou que não houve tentativa de solução interna. Justifique obrigatoriamente antes de continuar.');
        return false;
      }
      if (needsRelocation && !internalFailureReason.trim()) {
        setFormError('Por que não foi possível solucionar internamente? Campo obrigatório para solicitar remanejamento.');
        return false;
      }
    }

    if (currentStep === 8) {
      if (needsRelocation) {
        if (!requestedRelocationQuantity || requestedRelocationQuantity <= 0) {
          setFormError('Informe a quantidade de profissionais necessários para remanejamento.');
          return false;
        }
        if (!coverageStartTime || !coverageEndTime) {
          setFormError('Informe os horários necessários de cobertura (início e término).');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsReviewing(true);
      }
    }
  };

  const handlePrev = () => {
    setFormError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const finalSector = solicitorSector === 'Outro' ? solicitorSectorCustom : solicitorSector;
    const finalCategory = absentCategory === 'Outro' ? absentCategoryCustom : absentCategory;
    const protocol = generateProtocol(existingRequests);

    const { score, level } = calculatePriorityScore(
      criticality,
      classification,
      criticality === 'critica' || classification === 'emergencial',
      'nao',
      settings
    );

    const newRequest: DeficitRequest = {
      id: `req-${Date.now()}`,
      protocol,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'aguardando_analise',
      requestDate,
      requestTime,
      solicitorSector: finalSector,
      solicitorSectorCustom: solicitorSector === 'Outro' ? solicitorSectorCustom : undefined,
      solicitorName,
      solicitorRole,
      solicitorRoleCustom: solicitorRole === 'Outro' ? solicitorRoleCustom : undefined,
      solicitorUserId: currentUser.id,
      absentCategory: finalCategory,
      absentCategoryCustom: absentCategory === 'Outro' ? absentCategoryCustom : undefined,
      absentQuantity,
      affectedShift,
      affectedShiftCustom: affectedShift === 'outro' ? affectedShiftCustom : undefined,
      affectedShiftDate,
      deficitStartTime,
      absenceReason,
      absenceReasonCustom: absenceReason === 'outro' ? absenceReasonCustom : undefined,
      isPredictable,
      communicatedInAdvance,
      antecedenceOption,
      calculatedAntecedenceMinutes,
      lateCommunicationReason: !communicatedInAdvance ? lateCommunicationReason : undefined,
      lateCommunicationReasonCustom:
        lateCommunicationReason === 'Outro' ? lateCommunicationReasonCustom : undefined,
      classification,
      criticality,
      hasInternalAttempt,
      internalAttemptJustification: !hasInternalAttempt ? internalAttemptJustification : undefined,
      internalAlternativesEvaluated: internalAlternatives,
      internalFailureReason,
      needsRelocation,
      requestedRelocationQuantity: needsRelocation ? requestedRelocationQuantity : undefined,
      requestedCategory: needsRelocation ? requestedCategory : undefined,
      destinationSector: needsRelocation ? destinationSector : undefined,
      coverageStartTime: needsRelocation ? coverageStartTime : undefined,
      coverageEndTime: needsRelocation ? coverageEndTime : undefined,
      estimatedRelocationDuration: needsRelocation ? estimatedRelocationDuration : undefined,
      relocations: [],
      priorityScore: score,
      priorityLevel: level,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp: requestTime,
          title: 'Solicitação criada',
          description: `Registrada por ${solicitorName} (${solicitorRole}) para o setor ${finalSector}.`,
          user: solicitorName,
          type: 'create',
        },
        {
          id: `tl-${Date.now()}-2`,
          timestamp: requestTime,
          title: 'Solicitação enviada para análise da DENF',
          description: `Classificação: ${classification.toUpperCase()} | Criticidade: ${criticality.toUpperCase()}.`,
          user: solicitorName,
          type: 'status',
        },
      ],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          requestId: `req-${Date.now()}`,
          protocol,
          user: currentUser.name,
          action: 'Criação e Envio da Solicitação',
          timestamp: `${requestDate} ${requestTime}:00`,
          ipAddress: '10.20.0.104',
        },
      ],
    };

    onSaveRequest(newRequest);
  };

  const stepsLabels = [
    'Identificação',
    'Caracterização',
    'Motivo Ausência',
    'Previsibilidade',
    'Classificação',
    'Criticidade',
    'Solução Interna',
    'Remanejamento',
  ];

  return (
    <div id="new-request-wizard-container" className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header & Progress Indicator */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E6D9] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#8C9C82] uppercase tracking-widest">
              Fluxo Guiado de Comunicação
            </span>
            <h2 className="font-serif font-bold text-xl text-[#2D2D2A] mt-0.5">
              Nova Solicitação de Déficit Profissional
            </h2>
            <p className="text-xs text-[#7D7D72] mt-1">
              Etapa {currentStep} de {totalSteps} — {stepsLabels[currentStep - 1]}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-[#7D7D72] hover:text-[#2D2D2A] px-3.5 py-1.5 rounded-xl border border-[#E8E6D9] hover:bg-[#F9F7F2] transition-colors"
          >
            Cancelar e Voltar
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-[#E8E6D9]/50 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#5A5A40] h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          {/* Mobile Step Indicator */}
          <div className="md:hidden mt-3 p-2.5 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] flex items-center justify-between text-xs">
            <span className="font-bold text-[#5A5A40] shrink-0">
              Etapa {currentStep} de {totalSteps}:
            </span>
            <span className="font-semibold text-[#2D2D2A] text-right truncate ml-2">
              {stepsLabels[currentStep - 1]}
            </span>
          </div>

          {/* Desktop Step Pill Badges */}
          <div className="hidden md:grid md:grid-cols-8 gap-2 mt-3 text-[11px] font-medium text-center">
            {stepsLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <div
                  key={label}
                  className={`py-1 px-1 rounded-lg truncate transition-colors text-[10px] ${
                    isCurrent
                      ? 'bg-[#5A5A40] text-white font-bold shadow-xs'
                      : isDone
                      ? 'text-[#3E4D36] bg-[#8C9C82]/20 font-semibold'
                      : 'text-[#8E8E80] bg-[#F9F7F2]'
                  }`}
                >
                  <span className="mr-1">{stepNum}.</span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Duplicate Alert Notice if found */}
      {duplicateWarning && (
        <div
          id="alert-duplicate-warning"
          className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-900 animate-in fade-in"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-sm">
              Possível solicitação semelhante já em aberto ({duplicateWarning.protocol})
            </p>
            <p className="mt-0.5 text-amber-800">
              Já existe um déficit para o setor <strong>{duplicateWarning.solicitorSector}</strong>{' '}
              da categoria <strong>{duplicateWarning.absentCategory}</strong> para o plantão de{' '}
              <strong>{duplicateWarning.affectedShiftDate} ({duplicateWarning.affectedShift})</strong> com status{' '}
              <strong>{duplicateWarning.status}</strong>.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateToRequest(duplicateWarning.id)}
                className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-md"
              >
                Consultar Solicitação Existente
              </button>
              <span className="text-[11px] text-amber-700">
                Você pode continuar caso se trate de uma segunda ausência independente.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {formError && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-800 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* FORM STEPS CONTENT */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
        <div>
          {/* ==================== ETAPA 1 ==================== */}
          {currentStep === 1 && (
            <div id="step-1-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-teal-600" />
                  Etapa 1 — Identificação da Solicitação
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informações da unidade solicitante e do responsável pela comunicação.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Solicitação
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Preenchida automaticamente com a data atual.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário da Solicitação
                  </label>
                  <input
                    type="time"
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Preenchido automaticamente com o horário atual.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Setor Solicitante *
                  </label>
                  <select
                    value={solicitorSector}
                    onChange={(e) => setSolicitorSector(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {settings.sectors.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                    <option value="Outro">Outro (especificar)</option>
                  </select>

                  {solicitorSector === 'Outro' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Informe o setor *
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do setor não listado"
                        value={solicitorSectorCustom}
                        onChange={(e) => setSolicitorSectorCustom(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Responsável pela Solicitação *
                  </label>
                  <input
                    type="text"
                    value={solicitorName}
                    onChange={(e) => setSolicitorName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Preenchido automaticamente com o usuário autenticado.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cargo / Função do Solicitante *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['Enfermeiro', 'Coordenador', 'Supervisor', 'Gestor', 'Outro'].map((roleOpt) => (
                    <button
                      key={roleOpt}
                      type="button"
                      onClick={() => setSolicitorRole(roleOpt)}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all text-center ${
                        solicitorRole === roleOpt
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {roleOpt}
                    </button>
                  ))}
                </div>

                {solicitorRole === 'Outro' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Especifique o cargo / função"
                      value={solicitorRoleCustom}
                      onChange={(e) => setSolicitorRoleCustom(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 2 ==================== */}
          {currentStep === 2 && (
            <div id="step-2-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 2 — Caracterização do Déficit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Qual profissional está ausente, quantidade e detalhes do plantão impactado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Qual profissional está ausente? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {settings.professionalCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAbsentCategory(cat)}
                      className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                        absentCategory === cat
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAbsentCategory('Outro')}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      absentCategory === 'Outro'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Outro (especificar)
                  </button>
                </div>

                {absentCategory === 'Outro' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Informe a categoria profissional"
                      value={absentCategoryCustom}
                      onChange={(e) => setAbsentCategoryCustom(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade de Profissionais Ausentes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={absentQuantity}
                    onChange={(e) => setAbsentQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Não permitido zero ou valor negativo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data do Plantão Afetado *
                  </label>
                  <input
                    type="date"
                    value={affectedShiftDate}
                    onChange={(e) => setAffectedShiftDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário de Início do Déficit *
                  </label>
                  <input
                    type="time"
                    value={deficitStartTime}
                    onChange={(e) => setDeficitStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno Afetado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {settings.shifts.map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setAffectedShift(sh as ShiftType)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        affectedShift === sh
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAffectedShift('outro')}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      affectedShift === 'outro'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Outro
                  </button>
                </div>

                {affectedShift === 'outro' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Especifique o turno"
                      value={affectedShiftCustom}
                      onChange={(e) => setAffectedShiftCustom(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-amber-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 3 ==================== */}
          {currentStep === 3 && (
            <div id="step-3-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 3 — Motivo da Ausência
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Qual o motivo administrativo da ausência do colaborador?
                </p>
              </div>

              {/* LGPD Safety Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5 text-blue-900 text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Diretriz de Privacidade & LGPD:</span> Não solicite
                  informações médicas sensíveis, CID ou diagnóstico do colaborador. Registre somente
                  o motivo administrativo necessário à gestão hospitalar.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {settings.absenceReasons.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAbsenceReason(item.key)}
                    className={`p-3 rounded-lg text-xs font-medium border text-left transition-all ${
                      absenceReason === item.key
                        ? 'bg-teal-50 border-teal-600 text-teal-950 font-bold ring-1 ring-teal-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {absenceReason === 'outro' && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especifique o motivo administrativo *
                  </label>
                  <input
                    type="text"
                    placeholder="Descrição administrativa do motivo"
                    value={absenceReasonCustom}
                    onChange={(e) => setAbsenceReasonCustom(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* ==================== ETAPA 4 ==================== */}
          {currentStep === 4 && (
            <div id="step-4-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 4 — Previsibilidade da Necessidade
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Avaliação da antecedência e planejamento da comunicação.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Previsível */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    O déficit era previsível?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPredictable(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        isPredictable
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPredictable(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        !isPredictable
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Comunicado com antecedência */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    A unidade comunicou com antecedência?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCommunicatedInAdvance(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        communicatedInAdvance
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommunicatedInAdvance(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        !communicatedInAdvance
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Não (Tardia)
                    </button>
                  </div>
                </div>
              </div>

              {/* Antecedência em Horas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantas horas antes da necessidade ocorreu a solicitação?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'menos_1h', label: 'Menos de 1 hora' },
                    { key: '1a3h', label: '1 a 3 horas' },
                    { key: '3a6h', label: '3 a 6 horas' },
                    { key: 'mais_6h', label: 'Mais de 6 horas' },
                    { key: 'mais_24h', label: 'Mais de 24 horas' },
                    { key: 'nao_se_aplica', label: 'Não se aplica' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAntecedenceOption(opt.key as any)}
                      className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        antecedenceOption === opt.key
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Automatic calculation preview */}
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Cálculo automático de antecedência:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {calculatedAntecedenceMinutes >= 0
                      ? `${Math.floor(calculatedAntecedenceMinutes / 60)}h ${Math.abs(calculatedAntecedenceMinutes % 60)}min de antecedência`
                      : `${Math.abs(Math.floor(calculatedAntecedenceMinutes / 60))}h após o início do plantão (Tardia)`}
                  </span>
                </div>
              </div>

              {/* Justificativa para comunicação tardia */}
              {!communicatedInAdvance && (
                <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Por que a necessidade não foi comunicada anteriormente? *
                  </label>
                  <select
                    value={lateCommunicationReason}
                    onChange={(e) => setLateCommunicationReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white"
                  >
                    <option value="Ausência inesperada">Ausência inesperada</option>
                    <option value="Informação recebida tardiamente">Informação recebida tardiamente</option>
                    <option value="Falha de comunicação">Falha de comunicação</option>
                    <option value="Falha de planejamento da escala">Falha de planejamento da escala</option>
                    <option value="Alteração da demanda assistencial">Alteração da demanda assistencial</option>
                    <option value="Outro">Outro (especificar)</option>
                  </select>

                  {lateCommunicationReason === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Justifique o motivo do aviso tardio"
                      value={lateCommunicationReasonCustom}
                      onChange={(e) => setLateCommunicationReasonCustom(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== ETAPA 5 ==================== */}
          {currentStep === 5 && (
            <div id="step-5-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 5 — Classificação da Necessidade
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione a classificação adequada. Observe a explicação abaixo de cada uma para evitar erros.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'programada',
                    title: 'PROGRAMADA',
                    desc: 'Necessidade conhecida previamente e passível de planejamento prévio.',
                    badge: 'bg-slate-100 text-slate-800 border-slate-300',
                  },
                  {
                    key: 'nao_programada',
                    title: 'NÃO PROGRAMADA',
                    desc: 'Necessidade identificada sem previsão suficiente para o planejamento habitual.',
                    badge: 'bg-amber-50 text-amber-900 border-amber-300',
                  },
                  {
                    key: 'emergencial',
                    title: 'EMERGENCIAL',
                    desc: 'Situação que exige intervenção imediata para garantir continuidade e segurança da assistência/operação.',
                    badge: 'bg-rose-100 text-rose-950 border-rose-400 font-black',
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setClassification(item.key as NeedClassification)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-4 ${
                      classification === item.key
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{item.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badge}`}>
                          {item.key}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                    </div>
                    {classification === item.key && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 6 ==================== */}
          {currentStep === 6 && (
            <div id="step-6-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 6 — Grau de Criticidade
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Impacto do déficit no funcionamento essencial e na segurança do paciente.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'baixa',
                    title: '🟢 BAIXA',
                    desc: 'Déficit que não compromete imediatamente a assistência ou funcionamento do setor.',
                    color: 'hover:border-emerald-300',
                    active: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400',
                  },
                  {
                    key: 'moderada',
                    title: '🟡 MODERADA',
                    desc: 'Déficit que gera necessidade de reorganização da equipe, mas pode ser administrado internamente.',
                    color: 'hover:border-amber-300',
                    active: 'border-amber-500 bg-amber-50 ring-2 ring-amber-400',
                  },
                  {
                    key: 'alta',
                    title: '🟠 ALTA',
                    desc: 'Déficit com potencial de comprometer o funcionamento do setor ou a assistência, necessitando intervenção da gestão.',
                    color: 'hover:border-orange-300',
                    active: 'border-orange-500 bg-orange-50 ring-2 ring-orange-400',
                  },
                  {
                    key: 'critica',
                    title: '🔴 CRÍTICA',
                    desc: 'Déficit que pode comprometer imediatamente: segurança do paciente, continuidade da assistência, funcionamento essencial do setor.',
                    color: 'hover:border-red-400',
                    active: 'border-red-600 bg-red-100/80 ring-2 ring-red-500 shadow-md',
                  },
                ].map((crit) => (
                  <button
                    key={crit.key}
                    type="button"
                    onClick={() => setCriticality(crit.key as Criticality)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-4 ${
                      criticality === crit.key ? crit.active : `border-slate-200 ${crit.color}`
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm text-slate-900">{crit.title}</span>
                      <p className="text-xs text-slate-600 mt-1">{crit.desc}</p>
                    </div>
                    {criticality === crit.key && (
                      <CheckCircle2 className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>

              {/* Automatic Highlight Notice for CRITICAL */}
              {criticality === 'critica' && (
                <div
                  id="notice-critical-highlight"
                  className="p-4 bg-red-100 border border-red-400 rounded-xl flex items-start gap-3 text-red-950 animate-pulse"
                >
                  <ShieldAlert className="w-6 h-6 text-red-700 shrink-0" />
                  <div className="text-xs">
                    <p className="font-black text-sm">ATENÇÃO: SOLICITAÇÃO CRÍTICA</p>
                    <p className="mt-0.5 font-medium">
                      Esta solicitação foi classificada como <strong>CRÍTICA</strong> e será destacada
                      com prioridade imediata no painel e fila de atendimento da DENF.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== ETAPA 7 ==================== */}
          {currentStep === 7 && (
            <div id="step-7-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 7 — Tentativas de Solução pelo Próprio Setor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Obrigatório para evitar que a DENF seja utilizada como primeiro recurso antes de esgotadas alternativas da unidade.
                </p>
              </div>

              {/* Question: Tentativa interna? */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Antes de solicitar remanejamento, foram realizadas tentativas de solução interna? *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHasInternalAttempt(true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
                      hasInternalAttempt
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasInternalAttempt(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
                      !hasInternalAttempt
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* If Não: Justificativa obrigatória */}
              {!hasInternalAttempt && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-rose-900">
                    Justificativa obrigatória para não realizar tentativa interna *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explique detalhadamente por que nenhuma alternativa interna foi tentada..."
                    value={internalAttemptJustification}
                    onChange={(e) => setInternalAttemptJustification(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-rose-300 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Alternativas avaliadas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Quais alternativas foram avaliadas? (Múltipla seleção)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'reorganizacao_escala', label: 'Reorganização da escala interna' },
                    { key: 'cobertura_proprio_setor', label: 'Cobertura por profissional do próprio setor' },
                    { key: 'troca_plantao', label: 'Troca de plantão' },
                    { key: 'banco_horas', label: 'Banco de horas' },
                    { key: 'sobreaviso', label: 'Sobreaviso' },
                    { key: 'convocacao_previa', label: 'Convocação de profissional previamente definido' },
                    { key: 'redistribuicao_interna', label: 'Redistribuição interna de atividades' },
                    { key: 'nenhuma', label: 'Nenhuma alternativa disponível' },
                  ].map((alt) => {
                    const isChecked = internalAlternatives.includes(alt.key as any);
                    return (
                      <button
                        key={alt.key}
                        type="button"
                        onClick={() => toggleAlternative(alt.key as any)}
                        className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{alt.label}</span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Por que não foi possível solucionar internamente? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Por que não foi possível solucionar internamente? *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Todos os profissionais da folga já excederam a carga horária semanal máxima, sobreaviso indisponível..."
                  value={internalFailureReason}
                  onChange={(e) => setInternalFailureReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Obrigatório quando houver solicitação de remanejamento.
                </span>
              </div>
            </div>
          )}

          {/* ==================== ETAPA 8 ==================== */}
          {currentStep === 8 && (
            <div id="step-8-container" className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  Etapa 8 — Solicitação de Remanejamento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Definição dos requisitos de remanejamento externo ao setor.
                </p>
              </div>

              {/* Question: É necessário remanejamento? */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  É necessário remanejamento? *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNeedsRelocation(true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
                      needsRelocation
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedsRelocation(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold border transition-all ${
                      !needsRelocation
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Não (Apenas Registrar Ocorrência)
                  </button>
                </div>
              </div>

              {/* Conditionally opened fields if needsRelocation === true */}
              {needsRelocation ? (
                <div className="space-y-4 p-5 bg-teal-50/40 border border-teal-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantos profissionais são necessários? *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={requestedRelocationQuantity}
                        onChange={(e) =>
                          setRequestedRelocationQuantity(
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        className="w-full text-sm font-bold p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Qual categoria profissional? *
                      </label>
                      <select
                        value={requestedCategory}
                        onChange={(e) => setRequestedCategory(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      >
                        {settings.professionalCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Para qual setor o profissional será remanejado (Destino)? *
                    </label>
                    <select
                      value={destinationSector}
                      onChange={(e) => setDestinationSector(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      {settings.sectors.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Preenchido preferencialmente com o setor solicitante.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Horário de Início da Cobertura *
                      </label>
                      <input
                        type="time"
                        value={coverageStartTime}
                        onChange={(e) => setCoverageStartTime(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Horário de Término da Cobertura *
                      </label>
                      <input
                        type="time"
                        value={coverageEndTime}
                        onChange={(e) => setCoverageEndTime(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Duração Prevista do Remanejamento
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {['Até 2 horas', '2–6 horas', '6–12 horas', '12–24 horas', 'Mais de 24 horas'].map(
                        (dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setEstimatedRelocationDuration(dur)}
                            className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                              estimatedRelocationDuration === dur
                                ? 'bg-teal-700 text-white font-bold border-teal-700'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {dur}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <p>
                    A ausência será registrada como ocorrência documental sem abertura de requisição
                    para transferência de equipe.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Controls */}
        <div className="border-t border-slate-200 pt-5 mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              currentStep === 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
          >
            {currentStep === totalSteps ? (
              <>
                <span>Revisar e Enviar</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Próxima Etapa</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==================== RESUMO E ENVIO FINAL (MODAL / OVERLAY) ==================== */}
      {isReviewing && (
        <div
          id="modal-review-request"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold">
                  Resumo da Solicitação
                </span>
                <h3 className="text-lg font-extrabold">Confirmação de Envio</h3>
              </div>
              <div className="text-right">
                <span className="text-xs bg-teal-800/80 px-2.5 py-1 rounded-md text-teal-100 font-mono">
                  {requestDate} • {requestTime}
                </span>
              </div>
            </div>

            {/* Summary Data */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Setor Solicitante</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {solicitorSector === 'Outro' ? solicitorSectorCustom : solicitorSector}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsável</span>
                  <span className="font-bold text-slate-800">
                    {solicitorName} ({solicitorRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Profissional Ausente</span>
                  <span className="font-bold text-slate-800">
                    {absentQuantity}x {absentCategory === 'Outro' ? absentCategoryCustom : absentCategory}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Plantão Afetado</span>
                  <span className="font-bold text-slate-800">
                    {affectedShiftDate} ({affectedShift}) às {deficitStartTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Classificação</span>
                  <div className="mt-1">
                    <ClassificationBadge classification={classification} />
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Criticidade</span>
                  <div className="mt-1">
                    <CriticalityBadge criticality={criticality} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Motivo da Ausência</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {absenceReason === 'outro' ? absenceReasonCustom : absenceReason.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tentativa de Solução Interna</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {hasInternalAttempt ? 'Sim, tentativas realizadas' : 'Não foram realizadas tentativas'}
                </p>
                {internalFailureReason && (
                  <p className="text-slate-600 mt-1 italic">
                    "{internalFailureReason}"
                  </p>
                )}
              </div>

              {needsRelocation && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <span className="text-teal-900 block text-[11px] uppercase font-bold">
                    Remanejamento Solicitado
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-teal-700">Qtd Solicitada</span>
                      <p className="font-extrabold text-teal-950 text-sm">{requestedRelocationQuantity} profissional(is)</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700">Setor Destino</span>
                      <p className="font-extrabold text-teal-950 text-sm">{destinationSector}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700">Horário Cobertura</span>
                      <p className="font-extrabold text-teal-950 text-sm">{coverageStartTime} às {coverageEndTime}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg">
                Ao enviar, o sistema gerará um número de protocolo único (ex: <strong>DEF-{new Date().getFullYear()}-000...</strong>), registrará a trilha de auditoria e notificará a DENF.
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
              >
                Voltar e Editar
              </button>

              <button
                type="button"
                id="btn-confirm-send-request"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
