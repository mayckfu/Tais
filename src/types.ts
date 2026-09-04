export type UserRole = 'solicitante' | 'coordenador' | 'denf' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string; // e.g., 'Enfermeiro Assistencial', 'Coordenador de UTI', 'Gerente DENF', 'Administrador'
  sector: string;
  registrationNumber: string; // Matrícula
}

export type RequestStatus =
  | 'rascunho'
  | 'enviada'
  | 'aguardando_analise'
  | 'em_analise'
  | 'aguardando_informacao'
  | 'solucao_interna'
  | 'remanejamento_autorizado'
  | 'remanejamento_em_andamento'
  | 'cobertura_parcial'
  | 'resolvida'
  | 'nao_resolvida'
  | 'encerrada'
  | 'cancelada';

export type RelocationStatus =
  | 'aguardando_inicio'
  | 'em_deslocamento'
  | 'em_cobertura'
  | 'finalizado'
  | 'cancelado';

export type Criticality = 'baixa' | 'moderada' | 'alta' | 'critica';

export type NeedClassification = 'programada' | 'nao_programada' | 'emergencial';

export type ShiftType =
  | 'manha'
  | 'tarde'
  | 'noite'
  | '12h'
  | '24h'
  | 'outro'
  | 'Manhã'
  | 'Tarde'
  | 'Noite'
  | '12 horas'
  | '24 horas'
  | string;

export type AbsenceReason =
  | 'atestado'
  | 'afastamento'
  | 'falta_injustificada'
  | 'falta_justificada'
  | 'licenca'
  | 'acidente_trabalho'
  | 'desligamento'
  | 'ferias'
  | 'folga_programada'
  | 'erro_escala'
  | 'convocacao'
  | 'treinamento'
  | 'atraso'
  | 'abandono'
  | 'outro';

export type InternalSolutionAlternative =
  | 'reorganizacao_escala'
  | 'cobertura_proprio_setor'
  | 'troca_plantao'
  | 'banco_horas'
  | 'sobreaviso'
  | 'convocacao_previa'
  | 'redistribuicao_interna'
  | 'nenhuma';

export type DENFConduct =
  | 'remanejamento_interno'
  | 'sobreaviso'
  | 'cobertura_proprio_setor'
  | 'troca_plantao'
  | 'convocacao'
  | 'redistribuicao_profissionais'
  | 'contratacao_externa'
  | 'nao_realizado'
  | 'outra';

export type AssistentialImpact = 'nao' | 'baixo' | 'moderado' | 'alto' | 'critico';

export type ResolutionStatus = 'sim' | 'parcialmente' | 'nao';

export type ManagementFollowUpStatus = 'aberto' | 'em_acompanhamento' | 'aguardando_acao' | 'concluido';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO string or HH:mm
  title: string;
  description: string;
  user: string;
  userRole?: string;
  type: 'create' | 'status' | 'decision' | 'relocation' | 'impact' | 'closure' | 'alert' | 'note';
}

export interface AuditLogEntry {
  id: string;
  requestId: string;
  protocol: string;
  user: string;
  action: string;
  fieldAffected?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ManagementFollowUp {
  id: string;
  requestId: string;
  protocol: string;
  sector: string;
  date?: string;
  reason: string;
  criticality: Criticality;
  impact: AssistentialImpact;
  responsibleName: string;
  deadline: string; // YYYY-MM-DD
  providencias: string;
  situationNotes: string;
  status: ManagementFollowUpStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AssistentialImpactAssessment {
  assistentialImpact: AssistentialImpact;
  reducedOperationalCapacity: boolean;
  capacityReductionDetails?: string;
  patientRedistribution: boolean;
  patientRedistributionDetails?: string;
  careDelay: boolean;
  careDelayDetails?: string;
  patientSecurityRisk: boolean;
  securityRiskDetails?: string;
  bedRestriction?: boolean;
  restrictedBedsCount?: number;
  teamOverload?: boolean;
  assistentialIncident?: boolean;
  incidentDescription?: string;
  nspNotification?: boolean;
  assessedBy?: string;
  assessedAt?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  notes?: string;
}

export type ClosureResolutionType =
  | 'solucionado_remanejamento'
  | 'solucionado_internamente'
  | 'parcialmente_solucionado'
  | 'nao_solucionado'
  | 'cancelado';

export interface RequestClosureInfo {
  resolutionType: ClosureResolutionType;
  resolvedStatus?: ResolutionStatus;
  totalResolutionMinutes: number;
  resolutionTimeCategory?: 'ate_30m' | '30m_1h' | '1h_2h' | '2h_4h' | 'mais_4h';
  conductEffectiveness?: 'eficaz' | 'parcialmente_eficaz' | 'ineficaz';
  needsManagementFollowUp: boolean;
  followUpReason?: string;
  followUpResponsible?: string;
  followUpDeadline?: string;
  followUpActionRequired?: string;
  closureNotes?: string;
  finalNotes?: string;
  closedBy: string;
  closedRole?: string;
  closedAt: string;
}

export interface RelocationMovement {
  id: string;
  requestId: string;
  protocol: string;
  professionalCategory: string;
  originSector: string;
  destinationSector: string;
  professionalName?: string; // Nominal opcional
  professionalRegistration?: string; // Matrícula opcional
  quantityDispatched: number;
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  durationEstimated: string;
  actualDurationMinutes?: number;
  status: RelocationStatus;
  authorizedBy: string;
  authorizedRole: string;
  authorizedAt: string;
  notes?: string;
}

export interface DeficitRequest {
  id: string;
  protocol: string; // e.g. DEF-2026-000125
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: RequestStatus;

  // Etapa 1: Identificação
  requestDate: string; // YYYY-MM-DD
  requestTime: string; // HH:mm
  solicitorSector: string;
  solicitorSectorCustom?: string;
  solicitorName: string;
  solicitorRole: string;
  solicitorRoleCustom?: string;
  solicitorUserId: string;

  // Etapa 2: Caracterização do Déficit
  absentCategory: string;
  absentCategoryCustom?: string;
  absentQuantity: number;
  affectedShift: ShiftType;
  affectedShiftCustom?: string;
  affectedShiftDate: string; // YYYY-MM-DD
  deficitStartTime: string; // HH:mm

  // Etapa 3: Motivo da Ausência (Administrativo, sem diagnóstico sensível)
  absenceReason: AbsenceReason;
  absenceReasonCustom?: string;

  // Etapa 4: Previsibilidade
  isPredictable: boolean;
  communicatedInAdvance: boolean;
  antecedenceOption: 'menos_1h' | '1a3h' | '3a6h' | 'mais_6h' | 'mais_24h' | 'nao_se_aplica';
  calculatedAntecedenceMinutes: number; // calculated between request time and deficit start
  lateCommunicationReason?: string;
  lateCommunicationReasonCustom?: string;

  // Etapa 5: Classificação da Necessidade
  classification: NeedClassification;

  // Etapa 6: Grau de Criticidade
  criticality: Criticality;

  // Etapa 7: Tentativas de Solução Interna
  hasInternalAttempt: boolean;
  internalAttemptJustification?: string; // Obrigatório se hasInternalAttempt === false
  internalAlternativesEvaluated: InternalSolutionAlternative[];
  internalFailureReason: string; // Obrigatório se solicitar remanejamento

  // Etapa 8: Solicitação de Remanejamento
  needsRelocation: boolean;
  requestedRelocationQuantity?: number;
  requestedCategory?: string;
  destinationSector?: string;
  coverageStartTime?: string;
  coverageEndTime?: string;
  estimatedRelocationDuration?: string; // 'Ate 2h', '2-6h', '6-12h', '12-24h', 'Mais de 24h'

  // Decisão DENF / Gestão
  denfDecision?: {
    conduct: DENFConduct;
    conductCustom?: string;
    denialJustification?: string; // Obrigatório se não realizado
    decisionNotes?: string;
    decidedBy: string;
    decidedRole: string;
    decidedAt: string;
    originSector?: string;
    quantityApproved?: number;
    nominalProfessionalName?: string;
    nominalProfessionalMatricula?: string;
  };

  // Movimentações de remanejamento vinculadas
  relocations: RelocationMovement[];

  // Avaliação de Impacto Assistencial
  impactAssessment?: AssistentialImpactAssessment;

  // Encerramento
  closure?: RequestClosureInfo;

  // Cancelamento
  cancellation?: {
    cancelledBy: string;
    cancelledAt: string;
    reason: string;
  };
  cancellationReason?: string;
  needsManagementFollowUp?: boolean;
  managementFollowUpId?: string;

  // Cálculos Gerenciais e Prioridade
  priorityScore: number;
  priorityLevel: 'normal' | 'atencao' | 'alta' | 'imediata';
  coveragePercentage?: number; // 100% se atendido total, ex: 66.7% se atendido parcial

  // Histórico e Auditoria
  timeline: TimelineEvent[];
  auditTrail: AuditLogEntry[];
}

export interface SystemAlert {
  id: string;
  requestId: string;
  protocol: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
}

export interface SystemSettings {
  alertTimes: {
    criticalAnalysisMinutes: number; // default: 10 min
    highAnalysisMinutes: number; // default: 20 min
    overdueAnalysisMinutes: number; // default: 45 min
  };
  priorityWeights: {
    criticality: {
      baixa: number;
      moderada: number;
      alta: number;
      critica: number;
    };
    classification: {
      programada: number;
      nao_programada: number;
      emergencial: number;
    };
    riskSafety: number; // default 5
    impact: {
      nao: number;
      baixo: number;
      moderado: number;
      alto: number;
      critico: number;
    };
  };
  sectors: string[];
  professionalCategories: string[];
  shifts: string[];
  absenceReasons: { key: AbsenceReason; label: string }[];
  conductOptions: { key: DENFConduct; label: string }[];
}
