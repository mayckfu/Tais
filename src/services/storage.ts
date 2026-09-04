import {
  DeficitRequest,
  User,
  SystemSettings,
  ManagementFollowUp,
  SystemAlert,
  AuditLogEntry,
  TimelineEvent,
  RelocationMovement,
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-001',
    name: 'Enfª. Mariana Costa',
    email: 'mariana.costa@hospital.org.br',
    role: 'solicitante',
    roleTitle: 'Enfermeira de Plantão',
    sector: 'UTI',
    registrationNumber: 'COREN-142857',
  },
  {
    id: 'usr-002',
    name: 'Enf. Roberto Almeida',
    email: 'roberto.almeida@hospital.org.br',
    role: 'coordenador',
    roleTitle: 'Coordenador de Enfermagem',
    sector: 'Centro Cirúrgico',
    registrationNumber: 'COREN-098231',
  },
  {
    id: 'usr-003',
    name: 'Dra. Patrícia Valente',
    email: 'patricia.valente@hospital.org.br',
    role: 'denf',
    roleTitle: 'Diretoria de Enfermagem (DENF)',
    sector: 'DENF / Diretoria',
    registrationNumber: 'COREN-041590',
  },
  {
    id: 'usr-004',
    name: 'Carlos Eduardo Mendes',
    email: 'admin@hospital.org.br',
    role: 'admin',
    roleTitle: 'Administrador do Sistema',
    sector: 'Gestão da Qualidade & TI',
    registrationNumber: 'ADM-00194',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  alertTimes: {
    criticalAnalysisMinutes: 10,
    highAnalysisMinutes: 20,
    overdueAnalysisMinutes: 45,
  },
  priorityWeights: {
    criticality: {
      baixa: 1,
      moderada: 2,
      alta: 4,
      critica: 8,
    },
    classification: {
      programada: 0,
      nao_programada: 2,
      emergencial: 5,
    },
    riskSafety: 5,
    impact: {
      nao: 0,
      baixo: 1,
      moderado: 2,
      alto: 4,
      critico: 6,
    },
  },
  sectors: [
    'UTI',
    'Centro Cirúrgico',
    'CME',
    'CLM',
    'CLC',
    'Pediatria',
    'EIXO',
    'Comissão de Pele',
    'Azul',
    'Pronto Atendimento',
    'Maternidade',
    'Hemodiálise',
  ],
  professionalCategories: [
    'Enfermeiro',
    'Técnico de enfermagem',
    'Médico',
    'Fisioterapeuta',
    'Farmacêutico',
    'Nutricionista',
    'Psicólogo',
    'Assistente administrativo',
    'Higienização',
  ],
  shifts: ['Manhã', 'Tarde', 'Noite', '12 horas', '24 horas'],
  absenceReasons: [
    { key: 'atestado', label: 'Atestado médico' },
    { key: 'afastamento', label: 'Afastamento' },
    { key: 'falta_injustificada', label: 'Falta não justificada' },
    { key: 'falta_justificada', label: 'Falta justificada' },
    { key: 'licenca', label: 'Licença' },
    { key: 'acidente_trabalho', label: 'Acidente de trabalho' },
    { key: 'desligamento', label: 'Demissão / desligamento' },
    { key: 'ferias', label: 'Férias' },
    { key: 'folga_programada', label: 'Folga previamente programada' },
    { key: 'erro_escala', label: 'Erro / alteração de escala' },
    { key: 'convocacao', label: 'Convocação para outra atividade' },
    { key: 'treinamento', label: 'Treinamento / capacitação' },
    { key: 'atraso', label: 'Atraso' },
    { key: 'abandono', label: 'Abandono / saída durante plantão' },
    { key: 'outro', label: 'Outro' },
  ],
  conductOptions: [
    { key: 'remanejamento_interno', label: 'Remanejamento interno' },
    { key: 'sobreaviso', label: 'Sobreaviso' },
    { key: 'cobertura_proprio_setor', label: 'Cobertura pelo próprio setor' },
    { key: 'troca_plantao', label: 'Troca de plantão' },
    { key: 'convocacao', label: 'Convocação' },
    { key: 'redistribuicao_profissionais', label: 'Redistribuição de profissionais' },
    { key: 'contratacao_externa', label: 'Contratação / cobertura externa' },
    { key: 'nao_realizado', label: 'Não realizado remanejamento' },
    { key: 'outra', label: 'Outra conduta' },
  ],
};

export function calculatePriorityScore(
  criticality: string,
  classification: string,
  riskSafety: boolean,
  impact: string,
  settings: SystemSettings = INITIAL_SETTINGS
): { score: number; level: 'normal' | 'atencao' | 'alta' | 'imediata' } {
  const critW =
    settings.priorityWeights.criticality[criticality as keyof typeof settings.priorityWeights.criticality] || 1;
  const classW =
    settings.priorityWeights.classification[
      classification as keyof typeof settings.priorityWeights.classification
    ] || 0;
  const riskW = riskSafety ? settings.priorityWeights.riskSafety : 0;
  const impW =
    settings.priorityWeights.impact[impact as keyof typeof settings.priorityWeights.impact] || 0;

  const score = critW + classW + riskW + impW;

  let level: 'normal' | 'atencao' | 'alta' | 'imediata' = 'normal';
  if (score >= 12 || criticality === 'critica') {
    level = 'imediata';
  } else if (score >= 8 || criticality === 'alta' || classification === 'emergencial') {
    level = 'alta';
  } else if (score >= 4 || criticality === 'moderada') {
    level = 'atencao';
  }

  return { score, level };
}

export function calculateMinutesDifference(
  startDateStr: string,
  startTimeStr: string,
  endDateStr: string,
  endTimeStr: string
): number {
  try {
    const start = new Date(`${startDateStr}T${startTimeStr}:00`);
    const end = new Date(`${endDateStr}T${endTimeStr}:00`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / 60000);
  } catch {
    return 0;
  }
}

// Initial realistic dataset
const TODAY = new Date().toISOString().split('T')[0];

export const INITIAL_REQUESTS: DeficitRequest[] = [
  {
    id: 'req-125',
    protocol: 'DEF-2026-000125',
    createdAt: `${TODAY}T07:10:00Z`,
    updatedAt: `${TODAY}T07:35:00Z`,
    status: 'remanejamento_em_andamento',
    requestDate: TODAY,
    requestTime: '07:10',
    solicitorSector: 'UTI',
    solicitorName: 'Enfª. Mariana Costa',
    solicitorRole: 'Enfermeiro',
    solicitorUserId: 'usr-001',
    absentCategory: 'Técnico de enfermagem',
    absentQuantity: 2,
    affectedShift: '12 horas',
    affectedShiftDate: TODAY,
    deficitStartTime: '07:00',
    absenceReason: 'atestado',
    isPredictable: false,
    communicatedInAdvance: false,
    antecedenceOption: 'menos_1h',
    calculatedAntecedenceMinutes: -10,
    lateCommunicationReason: 'Ausência inesperada',
    classification: 'emergencial',
    criticality: 'critica',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['reorganizacao_escala', 'troca_plantao'],
    internalFailureReason:
      'Todos os técnicos do plantão anterior já cumpriram 12h contínuas e os do sobreaviso não atenderam chamada.',
    needsRelocation: true,
    requestedRelocationQuantity: 2,
    requestedCategory: 'Técnico de enfermagem',
    destinationSector: 'UTI',
    coverageStartTime: '07:30',
    coverageEndTime: '19:30',
    estimatedRelocationDuration: '12–24 horas',
    denfDecision: {
      conduct: 'remanejamento_interno',
      decidedBy: 'Dra. Patrícia Valente',
      decidedRole: 'Diretoria de Enfermagem (DENF)',
      decidedAt: '07:18',
      originSector: 'CME',
      quantityApproved: 2,
      nominalProfessionalName: 'Téc. Carla Regina / Téc. Sandra Mara',
      decisionNotes: 'Autorizado remanejamento emergencial de 2 técnicos do CME para UTI Geral.',
    },
    relocations: [
      {
        id: 'rel-001',
        requestId: 'req-125',
        protocol: 'DEF-2026-000125',
        professionalCategory: 'Técnico de enfermagem',
        originSector: 'CME',
        destinationSector: 'UTI',
        professionalName: 'Téc. Carla Regina',
        professionalRegistration: 'COREN-SP 482103',
        quantityDispatched: 1,
        startTime: '07:30',
        endTime: '19:30',
        startDate: TODAY,
        durationEstimated: '12 horas',
        actualDurationMinutes: 120,
        status: 'em_cobertura',
        authorizedBy: 'Dra. Patrícia Valente',
        authorizedRole: 'DENF',
        authorizedAt: '07:18',
        notes: 'Profissional em cobertura direta dos leitos 05 a 08.',
      },
      {
        id: 'rel-002',
        requestId: 'req-125',
        protocol: 'DEF-2026-000125',
        professionalCategory: 'Técnico de enfermagem',
        originSector: 'CME',
        destinationSector: 'UTI',
        professionalName: 'Téc. Sandra Mara',
        professionalRegistration: 'COREN-SP 519204',
        quantityDispatched: 1,
        startTime: '07:32',
        endTime: '19:30',
        startDate: TODAY,
        durationEstimated: '12 horas',
        actualDurationMinutes: 118,
        status: 'em_cobertura',
        authorizedBy: 'Dra. Patrícia Valente',
        authorizedRole: 'DENF',
        authorizedAt: '07:18',
        notes: 'Profissional em cobertura dos leitos 09 a 12.',
      },
    ],
    impactAssessment: {
      assistentialImpact: 'moderado',
      reducedOperationalCapacity: false,
      patientRedistribution: false,
      careDelay: false,
      patientSecurityRisk: true,
      notes: 'Cobertura imediata pelo CME evitou bloqueio de 4 leitos de terapia intensiva.',
      evaluatedBy: 'Dra. Patrícia Valente',
      evaluatedAt: '08:00',
    },
    priorityScore: 18,
    priorityLevel: 'imediata',
    coveragePercentage: 100,
    timeline: [
      {
        id: 'tl-1',
        timestamp: '07:10',
        title: 'Solicitação criada',
        description: 'Solicitação registrada por Enfª. Mariana Costa via sistema.',
        user: 'Enfª. Mariana Costa',
        type: 'create',
      },
      {
        id: 'tl-2',
        timestamp: '07:12',
        title: 'Solicitação enviada para análise',
        description: 'Enviada com criticidade CRÍTICA e classificação EMERGENCIAL.',
        user: 'Enfª. Mariana Costa',
        type: 'status',
      },
      {
        id: 'tl-3',
        timestamp: '07:14',
        title: 'DENF iniciou análise',
        description: 'Fila priorizada em primeiro nível de atendimento.',
        user: 'Dra. Patrícia Valente',
        type: 'status',
      },
      {
        id: 'tl-4',
        timestamp: '07:18',
        title: 'Remanejamento autorizado',
        description: 'Autorizada cessão de 2 Técnicos de Enfermagem originários do CME.',
        user: 'Dra. Patrícia Valente',
        type: 'decision',
      },
      {
        id: 'tl-5',
        timestamp: '07:25',
        title: 'Profissionais localizados no setor de origem',
        description: 'Contato com a supervisão do CME confirmado.',
        user: 'Dra. Patrícia Valente',
        type: 'relocation',
      },
      {
        id: 'tl-6',
        timestamp: '07:30',
        title: 'Remanejamento iniciado (Em cobertura)',
        description: 'Téc. Carla Regina e Téc. Sandra Mara assumiram posto na UTI.',
        user: 'Enfª. Mariana Costa',
        type: 'relocation',
      },
    ],
    auditTrail: [
      {
        id: 'aud-1',
        requestId: 'req-125',
        protocol: 'DEF-2026-000125',
        user: 'Enfª. Mariana Costa',
        action: 'Criação da Solicitação',
        timestamp: `${TODAY} 07:10:22`,
        ipAddress: '10.20.1.42',
      },
      {
        id: 'aud-2',
        requestId: 'req-125',
        protocol: 'DEF-2026-000125',
        user: 'Dra. Patrícia Valente',
        action: 'Aprovação de Remanejamento',
        fieldAffected: 'status',
        oldValue: 'aguardando_analise',
        newValue: 'remanejamento_em_andamento',
        timestamp: `${TODAY} 07:18:45`,
        ipAddress: '10.20.0.12',
      },
    ],
  },
  {
    id: 'req-126',
    protocol: 'DEF-2026-000126',
    createdAt: `${TODAY}T06:30:00Z`,
    updatedAt: `${TODAY}T07:05:00Z`,
    status: 'aguardando_analise',
    requestDate: TODAY,
    requestTime: '06:30',
    solicitorSector: 'CLM',
    solicitorName: 'Enf. Thiago Santos',
    solicitorRole: 'Enfermeiro',
    solicitorUserId: 'usr-001',
    absentCategory: 'Enfermeiro',
    absentQuantity: 1,
    affectedShift: 'Manhã',
    affectedShiftDate: TODAY,
    deficitStartTime: '07:00',
    absenceReason: 'falta_injustificada',
    isPredictable: false,
    communicatedInAdvance: true,
    antecedenceOption: 'menos_1h',
    calculatedAntecedenceMinutes: 30,
    lateCommunicationReason: 'Informação recebida tardiamente',
    classification: 'emergencial',
    criticality: 'alta',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['reorganizacao_escala', 'banco_horas'],
    internalFailureReason: 'Plantão com taxa de ocupação em 96% e medicação de alta complexidade.',
    needsRelocation: true,
    requestedRelocationQuantity: 1,
    requestedCategory: 'Enfermeiro',
    destinationSector: 'CLM',
    coverageStartTime: '07:00',
    coverageEndTime: '13:00',
    estimatedRelocationDuration: '6–12 horas',
    priorityScore: 11,
    priorityLevel: 'alta',
    relocations: [],
    timeline: [
      {
        id: 'tl-7',
        timestamp: '06:30',
        title: 'Solicitação criada e enviada',
        description: 'Déficit de 1 Enfermeiro para o plantão da manhã.',
        user: 'Enf. Thiago Santos',
        type: 'create',
      },
    ],
    auditTrail: [
      {
        id: 'aud-3',
        requestId: 'req-126',
        protocol: 'DEF-2026-000126',
        user: 'Enf. Thiago Santos',
        action: 'Criação da Solicitação',
        timestamp: `${TODAY} 06:30:11`,
        ipAddress: '10.20.2.19',
      },
    ],
  },
  {
    id: 'req-124',
    protocol: 'DEF-2026-000124',
    createdAt: `${TODAY}T05:45:00Z`,
    updatedAt: `${TODAY}T08:15:00Z`,
    status: 'resolvida',
    requestDate: TODAY,
    requestTime: '05:45',
    solicitorSector: 'Centro Cirúrgico',
    solicitorName: 'Enf. Roberto Almeida',
    solicitorRole: 'Coordenador',
    solicitorUserId: 'usr-002',
    absentCategory: 'Técnico de enfermagem',
    absentQuantity: 3,
    affectedShift: 'Manhã',
    affectedShiftDate: TODAY,
    deficitStartTime: '07:00',
    absenceReason: 'atestado',
    isPredictable: false,
    communicatedInAdvance: true,
    antecedenceOption: '1a3h',
    calculatedAntecedenceMinutes: 75,
    classification: 'emergencial',
    criticality: 'alta',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['redistribuicao_interna', 'reorganizacao_escala'],
    internalFailureReason: '12 cirurgias eletivas e 2 de urgência agendadas.',
    needsRelocation: true,
    requestedRelocationQuantity: 2,
    requestedCategory: 'Técnico de enfermagem',
    destinationSector: 'Centro Cirúrgico',
    coverageStartTime: '07:00',
    coverageEndTime: '13:00',
    estimatedRelocationDuration: '6–12 horas',
    denfDecision: {
      conduct: 'remanejamento_interno',
      decidedBy: 'Dra. Patrícia Valente',
      decidedRole: 'DENF',
      decidedAt: '06:15',
      originSector: 'CME',
      quantityApproved: 2,
      decisionNotes: 'Remanejamento de 2 técnicos do CME para atendimento das salas cirúrgicas.',
    },
    relocations: [
      {
        id: 'rel-003',
        requestId: 'req-124',
        protocol: 'DEF-2026-000124',
        professionalCategory: 'Técnico de enfermagem',
        originSector: 'CME',
        destinationSector: 'Centro Cirúrgico',
        professionalName: 'Téc. Lucas Silva',
        quantityDispatched: 2,
        startTime: '07:00',
        endTime: '13:00',
        startDate: TODAY,
        durationEstimated: '6 horas',
        actualDurationMinutes: 360,
        status: 'finalizado',
        authorizedBy: 'Dra. Patrícia Valente',
        authorizedRole: 'DENF',
        authorizedAt: '06:15',
      },
    ],
    impactAssessment: {
      assistentialImpact: 'baixo',
      reducedOperationalCapacity: false,
      patientRedistribution: false,
      careDelay: false,
      patientSecurityRisk: false,
      notes: 'Cirurgias realizadas conforme escala sem suspensão de procedimentos.',
      evaluatedBy: 'Enf. Roberto Almeida',
      evaluatedAt: '08:00',
    },
    closure: {
      resolutionType: 'solucionado_remanejamento',
      resolvedStatus: 'sim',
      totalResolutionMinutes: 30,
      resolutionTimeCategory: 'ate_30m',
      needsManagementFollowUp: false,
      finalNotes: 'Déficit solucionado com remanejamento ágil pelo CME.',
      closedBy: 'Dra. Patrícia Valente',
      closedAt: `${TODAY} 08:15`,
    },
    priorityScore: 9,
    priorityLevel: 'alta',
    coveragePercentage: 100,
    timeline: [
      {
        id: 'tl-8',
        timestamp: '05:45',
        title: 'Solicitação criada',
        description: 'Déficit comunicado 1h15 antes do plantão.',
        user: 'Enf. Roberto Almeida',
        type: 'create',
      },
      {
        id: 'tl-9',
        timestamp: '06:15',
        title: 'Remanejamento autorizado',
        description: '2 profissionais liberados do CME.',
        user: 'Dra. Patrícia Valente',
        type: 'decision',
      },
      {
        id: 'tl-10',
        timestamp: '08:15',
        title: 'Ocorrência encerrada com sucesso',
        description: 'Necessidade integralmente resolvida.',
        user: 'Dra. Patrícia Valente',
        type: 'closure',
      },
    ],
    auditTrail: [
      {
        id: 'aud-4',
        requestId: 'req-124',
        protocol: 'DEF-2026-000124',
        user: 'Enf. Roberto Almeida',
        action: 'Abertura',
        timestamp: `${TODAY} 05:45:10`,
      },
      {
        id: 'aud-5',
        requestId: 'req-124',
        protocol: 'DEF-2026-000124',
        user: 'Dra. Patrícia Valente',
        action: 'Encerramento',
        fieldAffected: 'status',
        oldValue: 'remanejamento_em_andamento',
        newValue: 'resolvida',
        timestamp: `${TODAY} 08:15:02`,
      },
    ],
  },
  {
    id: 'req-123',
    protocol: 'DEF-2026-000123',
    createdAt: `${TODAY}T04:00:00Z`,
    updatedAt: `${TODAY}T07:45:00Z`,
    status: 'cobertura_parcial',
    requestDate: TODAY,
    requestTime: '04:00',
    solicitorSector: 'Pediatria',
    solicitorName: 'Enfª. Juliana Prado',
    solicitorRole: 'Enfermeiro',
    solicitorUserId: 'usr-001',
    absentCategory: 'Técnico de enfermagem',
    absentQuantity: 3,
    affectedShift: 'Manhã',
    affectedShiftDate: TODAY,
    deficitStartTime: '07:00',
    absenceReason: 'afastamento',
    isPredictable: true,
    communicatedInAdvance: true,
    antecedenceOption: '3a6h',
    calculatedAntecedenceMinutes: 180,
    classification: 'nao_programada',
    criticality: 'critica',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['reorganizacao_escala', 'troca_plantao'],
    internalFailureReason: 'Surto de bronquiolite infantil gerou 100% de ocupação dos berços.',
    needsRelocation: true,
    requestedRelocationQuantity: 3,
    requestedCategory: 'Técnico de enfermagem',
    destinationSector: 'Pediatria',
    coverageStartTime: '07:00',
    coverageEndTime: '13:00',
    estimatedRelocationDuration: '6–12 horas',
    denfDecision: {
      conduct: 'remanejamento_interno',
      decidedBy: 'Dra. Patrícia Valente',
      decidedRole: 'DENF',
      decidedAt: '06:00',
      originSector: 'CLC',
      quantityApproved: 1,
      decisionNotes: 'CLC só pôde ceder 1 técnico devido à sua própria demanda interna.',
    },
    relocations: [
      {
        id: 'rel-004',
        requestId: 'req-123',
        protocol: 'DEF-2026-000123',
        professionalCategory: 'Técnico de enfermagem',
        originSector: 'CLC',
        destinationSector: 'Pediatria',
        professionalName: 'Téc. Fernando Ramos',
        quantityDispatched: 1,
        startTime: '07:00',
        endTime: '13:00',
        startDate: TODAY,
        durationEstimated: '6 horas',
        actualDurationMinutes: 140,
        status: 'em_cobertura',
        authorizedBy: 'Dra. Patrícia Valente',
        authorizedRole: 'DENF',
        authorizedAt: '06:00',
      },
    ],
    impactAssessment: {
      assistentialImpact: 'alto',
      reducedOperationalCapacity: true,
      patientRedistribution: true,
      careDelay: true,
      patientSecurityRisk: true,
      notes: 'Solicitados 3, cedido apenas 1. Houve sobrecarga da equipe da pediatria.',
      evaluatedBy: 'Enfª. Juliana Prado',
      evaluatedAt: '07:30',
    },
    closure: {
      resolutionType: 'parcialmente_solucionado',
      resolvedStatus: 'parcialmente',
      totalResolutionMinutes: 120,
      resolutionTimeCategory: '1h_2h',
      needsManagementFollowUp: true,
      followUpReason: 'Absenteísmo crônico por afastamento no setor de Pediatria durante sazonalidade.',
      followUpResponsible: 'Coordenação da Pediatria & Recursos Humanos',
      followUpDeadline: `${TODAY}`,
      followUpActionRequired: 'Revisão da escala com banco de talentos e contratação temporária emergencial.',
      finalNotes: 'Necessita acompanhamento gerencial urgente pela DENF e Diretoria Médica.',
      closedBy: 'Dra. Patrícia Valente',
      closedAt: `${TODAY} 07:45`,
    },
    priorityScore: 19,
    priorityLevel: 'imediata',
    coveragePercentage: 33.3,
    timeline: [
      {
        id: 'tl-11',
        timestamp: '04:00',
        title: 'Solicitação criada',
        description: 'Solicitados 3 profissionais para o plantão da manhã.',
        user: 'Enfª. Juliana Prado',
        type: 'create',
      },
      {
        id: 'tl-12',
        timestamp: '06:00',
        title: 'Cobertura Parcial Autorizada',
        description: 'Apenas 1 técnico disponível no CLC para cessão.',
        user: 'Dra. Patrícia Valente',
        type: 'decision',
      },
      {
        id: 'tl-13',
        timestamp: '07:45',
        title: 'Acompanhamento Gerencial Gerado',
        description: 'Encaminhado para resolução estrutural com RH.',
        user: 'Dra. Patrícia Valente',
        type: 'alert',
      },
    ],
    auditTrail: [
      {
        id: 'aud-6',
        requestId: 'req-123',
        protocol: 'DEF-2026-000123',
        user: 'Enfª. Juliana Prado',
        action: 'Abertura',
        timestamp: `${TODAY} 04:00:15`,
      },
    ],
  },
  {
    id: 'req-122',
    protocol: 'DEF-2026-000122',
    createdAt: `${TODAY}T02:15:00Z`,
    updatedAt: `${TODAY}T03:00:00Z`,
    status: 'solucao_interna',
    requestDate: TODAY,
    requestTime: '02:15',
    solicitorSector: 'EIXO',
    solicitorName: 'Enf. Bruno Castro',
    solicitorRole: 'Enfermeiro',
    solicitorUserId: 'usr-001',
    absentCategory: 'Fisioterapeuta',
    absentQuantity: 1,
    affectedShift: 'Manhã',
    affectedShiftDate: TODAY,
    deficitStartTime: '07:00',
    absenceReason: 'erro_escala',
    isPredictable: true,
    communicatedInAdvance: true,
    antecedenceOption: '3a6h',
    calculatedAntecedenceMinutes: 285,
    classification: 'programada',
    criticality: 'baixa',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['troca_plantao', 'reorganizacao_escala'],
    internalFailureReason: 'Resolvido internamente com troca voluntária acordada entre profissionais.',
    needsRelocation: false,
    relocations: [],
    priorityScore: 2,
    priorityLevel: 'normal',
    timeline: [
      {
        id: 'tl-14',
        timestamp: '02:15',
        title: 'Solicitação registrada',
        description: 'Identificado erro de escala.',
        user: 'Enf. Bruno Castro',
        type: 'create',
      },
      {
        id: 'tl-15',
        timestamp: '03:00',
        title: 'Solução Interna Concluída',
        description: 'Plantão assumido pelo Fisioterapeuta de sobreaviso da escala.',
        user: 'Enf. Bruno Castro',
        type: 'closure',
      },
    ],
    auditTrail: [
      {
        id: 'aud-7',
        requestId: 'req-122',
        protocol: 'DEF-2026-000122',
        user: 'Enf. Bruno Castro',
        action: 'Abertura e Solução Interna',
        timestamp: `${TODAY} 02:15:00`,
      },
    ],
  },
  {
    id: 'req-121',
    protocol: 'DEF-2026-000121',
    createdAt: `${TODAY}T01:30:00Z`,
    updatedAt: `${TODAY}T02:00:00Z`,
    status: 'aguardando_analise',
    requestDate: TODAY,
    requestTime: '01:30',
    solicitorSector: 'CLC',
    solicitorName: 'Enfª. Renata Lima',
    solicitorRole: 'Supervisor',
    solicitorUserId: 'usr-002',
    absentCategory: 'Técnico de enfermagem',
    absentQuantity: 1,
    affectedShift: 'Tarde',
    affectedShiftDate: TODAY,
    deficitStartTime: '13:00',
    absenceReason: 'licenca',
    isPredictable: true,
    communicatedInAdvance: true,
    antecedenceOption: 'mais_6h',
    calculatedAntecedenceMinutes: 690,
    classification: 'programada',
    criticality: 'moderada',
    hasInternalAttempt: true,
    internalAlternativesEvaluated: ['banco_horas'],
    internalFailureReason: 'Necessidade de cobertura para o banho de leito dos pacientes acamados.',
    needsRelocation: true,
    requestedRelocationQuantity: 1,
    requestedCategory: 'Técnico de enfermagem',
    destinationSector: 'CLC',
    coverageStartTime: '13:00',
    coverageEndTime: '19:00',
    estimatedRelocationDuration: '2–6 horas',
    priorityScore: 3,
    priorityLevel: 'normal',
    relocations: [],
    timeline: [
      {
        id: 'tl-16',
        timestamp: '01:30',
        title: 'Solicitação registrada com ampla antecedência',
        description: 'Plantão da tarde do mesmo dia.',
        user: 'Enfª. Renata Lima',
        type: 'create',
      },
    ],
    auditTrail: [
      {
        id: 'aud-8',
        requestId: 'req-121',
        protocol: 'DEF-2026-000121',
        user: 'Enfª. Renata Lima',
        action: 'Abertura da Solicitação',
        timestamp: `${TODAY} 01:30:45`,
      },
    ],
  },
];

export const INITIAL_FOLLOWUPS: ManagementFollowUp[] = [
  {
    id: 'fup-001',
    requestId: 'req-123',
    protocol: 'DEF-2026-000123',
    sector: 'Pediatria',
    reason: 'Absenteísmo crônico por afastamento no setor de Pediatria durante período de alta demanda.',
    criticality: 'critica',
    impact: 'alto',
    responsibleName: 'Coordenação da Pediatria & Recursos Humanos',
    deadline: TODAY,
    providencias: 'Reunião de alinhamento com RH para convocação de banco de concursados e readequação de escala.',
    situationNotes: 'Cobertura parcial deixou setor vulnerável com alta taxa de bronquiolite.',
    status: 'em_acompanhamento',
    createdAt: `${TODAY} 07:45`,
    updatedAt: `${TODAY} 08:30`,
  },
  {
    id: 'fup-002',
    requestId: 'req-120',
    protocol: 'DEF-2026-000120',
    sector: 'CLM',
    reason: 'Falta recorrente não justificada de escala de final de semana.',
    criticality: 'alta',
    impact: 'moderado',
    responsibleName: 'Dra. Patrícia Valente (DENF)',
    deadline: `${TODAY}`,
    providencias: 'Auditoria de pontualidade e aplicação de advertência administrativa via RH.',
    situationNotes: 'Colaborador com 3 ausências não programadas nos últimos 60 dias.',
    status: 'aguardando_acao',
    createdAt: `${TODAY} 06:10`,
    updatedAt: `${TODAY} 06:10`,
  },
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-001',
    requestId: 'req-125',
    protocol: 'DEF-2026-000125',
    title: 'OCORRÊNCIA CRÍTICA: UTI',
    message: 'Déficit de 2 Técnicos de Enfermagem na UTI com risco imediato de segurança.',
    severity: 'critical',
    timestamp: '07:10',
    read: false,
  },
  {
    id: 'alt-002',
    requestId: 'req-126',
    protocol: 'DEF-2026-000126',
    title: 'SOLICITAÇÃO EMERGENCIAL: CLM',
    message: 'Déficit de 1 Enfermeiro aguardando análise há mais de 30 minutos.',
    severity: 'warning',
    timestamp: '06:30',
    read: false,
  },
  {
    id: 'alt-003',
    requestId: 'req-123',
    protocol: 'DEF-2026-000123',
    title: 'ACOMPANHAMENTO GERENCIAL VENCENDO',
    message: 'Ocorrência DEF-2026-000123 na Pediatria necessita providência imediata.',
    severity: 'warning',
    timestamp: '07:45',
    read: false,
  },
];

const STORAGE_KEYS = {
  REQUESTS: 'hospital_deficit_requests_v2',
  SETTINGS: 'hospital_deficit_settings_v2',
  USERS: 'hospital_deficit_users_v2',
  FOLLOWUPS: 'hospital_deficit_followups_v2',
  ALERTS: 'hospital_deficit_alerts_v2',
  ACTIVE_USER: 'hospital_deficit_active_user_v2',
};

export function getStoredRequests(): DeficitRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function saveStoredRequests(requests: DeficitRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save requests:', err);
  }
}

export function getStoredSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

export function getStoredFollowups(): ManagementFollowUp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLLOWUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(INITIAL_FOLLOWUPS));
      return INITIAL_FOLLOWUPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FOLLOWUPS;
  }
}

export function saveStoredFollowups(followups: ManagementFollowUp[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(followups));
  } catch (err) {
    console.error('Failed to save followups:', err);
  }
}

export function getStoredAlerts(): SystemAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
      return INITIAL_ALERTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ALERTS;
  }
}

export function saveStoredAlerts(alerts: SystemAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  } catch (err) {
    console.error('Failed to save alerts:', err);
  }
}

export function getActiveUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (!raw) {
      return INITIAL_USERS[2]; // Default to DENF for rich management review
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS[2];
  }
}

export function setActiveUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to set active user:', err);
  }
}

// Generate Protocol DEF-YYYY-NNNNNN
export function generateProtocol(existingRequests: DeficitRequest[]): string {
  const year = new Date().getFullYear();
  const maxNumber = existingRequests.reduce((max, req) => {
    const parts = req.protocol.split('-');
    if (parts.length === 3 && parts[1] === String(year)) {
      const num = parseInt(parts[2], 10);
      return !isNaN(num) && num > max ? num : max;
    }
    return max;
  }, 126);
  const nextNum = String(maxNumber + 1).padStart(6, '0');
  return `DEF-${year}-${nextNum}`;
}

// Check for potential duplicate requests
export function checkDuplicateRequest(
  sector: string,
  category: string,
  shiftDate: string,
  shiftType: string,
  existingRequests: DeficitRequest[]
): DeficitRequest | null {
  const match = existingRequests.find((r) => {
    if (r.status === 'resolvida' || r.status === 'encerrada' || r.status === 'cancelada') {
      return false;
    }
    return (
      r.solicitorSector.toLowerCase() === sector.toLowerCase() &&
      r.absentCategory.toLowerCase() === category.toLowerCase() &&
      r.affectedShiftDate === shiftDate &&
      r.affectedShift === shiftType
    );
  });
  return match || null;
}

export function resetStorageToDefaults(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(INITIAL_FOLLOWUPS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(INITIAL_USERS[2]));
  } catch (err) {
    console.error('Failed to reset storage:', err);
  }
}
