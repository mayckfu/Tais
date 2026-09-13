import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  SystemSettings,
  SectorShiftData,
  ShiftStaffMember,
  ShiftPresenceStatus,
  AbsenceReason,
  RegisteredProfessional,
} from '../types';
import {
  getStoredShiftData,
  saveStoredShiftData,
  getStoredRegisteredProfessionals,
  saveRegisteredProfessional,
} from '../services/storage';
import { playHospitalChime } from '../services/soundEngine';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Minus,
  Building,
  Check,
  X,
  Radio,
  UserPlus,
  FileSpreadsheet,
  Pencil,
  SlidersHorizontal,
  BedDouble,
  Sparkles,
  Trash2,
  Lock,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface MyShiftViewProps {
  currentUser: User;
  settings: SystemSettings;
}

export const MyShiftView: React.FC<MyShiftViewProps> = ({
  currentUser,
  settings,
}) => {
  // Regras de Governança e Papéis:
  // - Enfermeiro ('solicitante'): alocado obrigatoriamente no seu setor de cadastro, com autonomia para marcar presenças, faltas, trocas e censo
  // - Coordenador ('coordenador') e Diretor ('denf' / 'admin'): podem visualizar a escala do plantão de qualquer setor, mas SEM liberdade de modificar/marcar
  const isNurse = currentUser.role === 'solicitante';
  const isSupervisorOrDirector =
    currentUser.role === 'coordenador' ||
    currentUser.role === 'denf' ||
    currentUser.role === 'admin';

  const canEditShift = isNurse;

  // Setor de lotação cadastrado do enfermeiro
  const nurseAssignedSector =
    currentUser.sector &&
    currentUser.sector !== 'Outro' &&
    currentUser.sector !== 'DENF / Diretoria' &&
    currentUser.sector !== 'Gestão da Qualidade & TI'
      ? currentUser.sector
      : 'UTI';

  // Setor inicial
  const initialSector = isNurse ? nurseAssignedSector : (currentUser.sector || 'UTI');

  const [selectedSector, setSelectedSector] = useState<string>(initialSector);

  // Sincronizar o setor quando for Enfermeiro (sempre travado no setor cadastrado dele)
  useEffect(() => {
    if (isNurse) {
      setSelectedSector(nurseAssignedSector);
    }
  }, [isNurse, nurseAssignedSector]);

  const [shiftData, setShiftData] = useState<SectorShiftData>(() =>
    getStoredShiftData(initialSector)
  );
  const [activeTabFilter, setActiveTabFilter] = useState<
    'todos' | 'presentes' | 'ausentes' | 'trocas'
  >('todos');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Cadastro de profissionais do hospital
  const [registeredProfessionals, setRegisteredProfessionals] = useState<
    RegisteredProfessional[]
  >(() => getStoredRegisteredProfessionals());

  // Modal para registrar ausência
  const [absenceModalStaff, setAbsenceModalStaff] = useState<ShiftStaffMember | null>(null);
  const [absenceModalReason, setAbsenceModalReason] =
    useState<AbsenceReason>('falta_injustificada');
  const [absenceModalNotes, setAbsenceModalNotes] = useState<string>('');

  // Modal de Adicionar Profissional (Escala Prevista ou Troca/Extra)
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState<boolean>(false);
  const [addStaffMode, setAddStaffMode] = useState<'escala' | 'troca'>('escala');
  const [selectedRegisteredId, setSelectedRegisteredId] = useState<string>('');
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffCategory, setNewStaffCategory] = useState<string>(
    'Técnico de enfermagem'
  );
  const [newStaffRegistration, setNewStaffRegistration] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<string>('');
  const [newStaffHours, setNewStaffHours] = useState<string>('07:00 - 19:00');
  const [newStaffInitialStatus, setNewStaffInitialStatus] =
    useState<ShiftPresenceStatus>('presente');
  const [isAutoFilled, setIsAutoFilled] = useState<boolean>(false);
  const [autoFilledSector, setAutoFilledSector] = useState<string>('');
  const [shouldSaveToRegistry, setShouldSaveToRegistry] = useState<boolean>(false);

  // Modal de Ajuste do Censo e Parâmetros COFEN
  const [isEditCensusModalOpen, setIsEditCensusModalOpen] = useState<boolean>(false);
  const [censusInputOccupied, setCensusInputOccupied] = useState<number>(shiftData.occupiedBeds);
  const [censusInputTotal, setCensusInputTotal] = useState<number>(shiftData.totalBeds);
  const [cofenNurseTargetInput, setCofenNurseTargetInput] = useState<number>(shiftData.cofenRatioNurseTarget);
  const [cofenTechTargetInput, setCofenTechTargetInput] = useState<number>(shiftData.cofenRatioTechTarget);

  // Sincronizar inputs locais quando shiftData mudar
  useEffect(() => {
    setCensusInputOccupied(shiftData.occupiedBeds);
    setCensusInputTotal(shiftData.totalBeds);
    setCofenNurseTargetInput(shiftData.cofenRatioNurseTarget);
    setCofenTechTargetInput(shiftData.cofenRatioTechTarget);
  }, [shiftData]);

  // Relógio do posto
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toTimeString().slice(0, 5)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toTimeString().slice(0, 5));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Recarregar quando mudar setor
  useEffect(() => {
    const data = getStoredShiftData(selectedSector);
    setShiftData(data);
  }, [selectedSector]);

  // Lista de setores
  const availableSectors = useMemo(() => {
    return settings.sectors && settings.sectors.length > 0
      ? settings.sectors
      : ['UTI', 'Pronto Atendimento', 'Centro Cirúrgico', 'CLM', 'CLC', 'Pediatria'];
  }, [settings.sectors]);

  // Salvar alterações e persistir (Apenas permitido para o Enfermeiro do plantão)
  const handlePersistShiftData = (updated: SectorShiftData, toastMsg?: string) => {
    if (!canEditShift) return;
    setShiftData(updated);
    saveStoredShiftData(updated);
    if (toastMsg) {
      setSuccessToast(toastMsg);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Ajuste rápido de leitos ocupados (+ / -)
  const handleQuickAdjustBeds = (delta: number) => {
    if (!canEditShift) return;
    const nextVal = Math.max(0, Math.min(shiftData.totalBeds, shiftData.occupiedBeds + delta));
    const updated = { ...shiftData, occupiedBeds: nextVal };
    handlePersistShiftData(updated);
  };

  // Alteração direta do número de leitos ocupados
  const handleInlineOccupiedChange = (valStr: string) => {
    if (!canEditShift) return;
    if (valStr === '') {
      const updated = { ...shiftData, occupiedBeds: 0 };
      handlePersistShiftData(updated);
      return;
    }
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed)) return;
    const safeVal = Math.max(0, Math.min(shiftData.totalBeds, parsed));
    const updated = { ...shiftData, occupiedBeds: safeVal };
    handlePersistShiftData(updated);
  };

  // Alteração direta da capacidade total de leitos
  const handleInlineTotalChange = (valStr: string) => {
    if (!canEditShift) return;
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || parsed < 1) return;
    const safeTotal = Math.max(1, parsed);
    const safeOccupied = Math.min(safeTotal, shiftData.occupiedBeds);
    const updated = { ...shiftData, totalBeds: safeTotal, occupiedBeds: safeOccupied };
    handlePersistShiftData(updated);
  };

  // Salvar formulário do modal de censo e metas COFEN
  const handleSaveCensusModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditShift) return;
    const safeTotal = Math.max(1, censusInputTotal);
    const safeOccupied = Math.max(0, Math.min(safeTotal, censusInputOccupied));
    const safeNurseTarget = Math.max(1, cofenNurseTargetInput);
    const safeTechTarget = Math.max(1, cofenTechTargetInput);

    const updated: SectorShiftData = {
      ...shiftData,
      occupiedBeds: safeOccupied,
      totalBeds: safeTotal,
      cofenRatioNurseTarget: safeNurseTarget,
      cofenRatioTechTarget: safeTechTarget,
    };
    handlePersistShiftData(updated, 'Censo e parâmetros de dimensionamento atualizados.');
    setIsEditCensusModalOpen(false);
    playHospitalChime('success');
  };

  // Marcar Presença (Assumiu o Turno)
  const handleMarkPresent = (staffId: string) => {
    const checkIn = new Date().toTimeString().slice(0, 5);
    const updatedStaff = shiftData.staff.map((st) => {
      if (st.id === staffId) {
        return {
          ...st,
          status: 'presente' as ShiftPresenceStatus,
          checkInTime: checkIn,
          absenceReason: undefined,
          absenceNotes: undefined,
        };
      }
      return st;
    });

    const updatedData = { ...shiftData, staff: updatedStaff };
    handlePersistShiftData(updatedData, 'Presença registrada.');
    playHospitalChime('info');
  };

  // Confirmar Ausência
  const handleConfirmAbsence = () => {
    if (!absenceModalStaff) return;
    const updatedStaff = shiftData.staff.map((st) => {
      if (st.id === absenceModalStaff.id) {
        return {
          ...st,
          status: 'ausente' as ShiftPresenceStatus,
          checkInTime: undefined,
          absenceReason: absenceModalReason,
          absenceNotes: absenceModalNotes.trim() || undefined,
        };
      }
      return st;
    });

    const updatedData = { ...shiftData, staff: updatedStaff };
    handlePersistShiftData(updatedData, `Ausência de ${absenceModalStaff.name} registrada.`);
    setAbsenceModalStaff(null);
    setAbsenceModalNotes('');
    playHospitalChime('warning');
  };

  // Marcar como Atrasado
  const handleMarkLate = (staffId: string) => {
    const updatedStaff = shiftData.staff.map((st) => {
      if (st.id === staffId) {
        return {
          ...st,
          status: 'atrasado' as ShiftPresenceStatus,
          absenceNotes: 'Atrasado / A caminho',
        };
      }
      return st;
    });
    const updatedData = { ...shiftData, staff: updatedStaff };
    handlePersistShiftData(updatedData, 'Status atualizado: Atrasado.');
  };

  // Sugestões de profissionais cadastrados deste setor que ainda não estão escalados hoje
  const unassignedSectorProfessionals = useMemo(() => {
    const assignedNames = new Set(
      shiftData.staff.map((s) => s.name.trim().toLowerCase())
    );
    const assignedRegs = new Set(
      shiftData.staff.map((s) => s.registration.trim().toLowerCase())
    );

    return registeredProfessionals.filter(
      (p) =>
        p.sector.toLowerCase() === selectedSector.toLowerCase() &&
        !assignedNames.has(p.name.trim().toLowerCase()) &&
        !assignedRegs.has(p.registration.trim().toLowerCase())
    );
  }, [registeredProfessionals, selectedSector, shiftData.staff]);

  // Abertura do modal de inclusão (escala ou troca)
  const handleOpenAddStaffModal = (mode: 'escala' | 'troca' = 'escala') => {
    setAddStaffMode(mode);
    setSelectedRegisteredId('');
    setNewStaffName('');
    setNewStaffCategory('Técnico de enfermagem');
    setNewStaffRegistration('');
    setNewStaffRole('');
    setNewStaffHours(
      shiftData.shift.includes('12') || shiftData.shift === 'Manhã'
        ? '07:00 - 19:00'
        : '19:00 - 07:00'
    );
    setNewStaffInitialStatus('presente');
    setIsAutoFilled(false);
    setAutoFilledSector('');
    setShouldSaveToRegistry(false);
    setIsAddStaffModalOpen(true);
  };

  // Selecionar profissional cadastrado e preencher dados no automático
  const handleSelectRegisteredProfessional = (profId: string) => {
    setSelectedRegisteredId(profId);
    if (!profId) {
      setIsAutoFilled(false);
      setAutoFilledSector('');
      return;
    }
    const prof = registeredProfessionals.find((p) => p.id === profId);
    if (prof) {
      setNewStaffName(prof.name);
      setNewStaffCategory(prof.category);
      setNewStaffRegistration(prof.registration);
      setNewStaffRole(
        prof.defaultRole ||
          (prof.category === 'Enfermeiro'
            ? 'Enfermeiro Assistencial'
            : 'Técnico de Enfermagem')
      );
      setNewStaffHours(prof.defaultHours || '07:00 - 19:00');
      setIsAutoFilled(true);
      setAutoFilledSector(prof.sector);
    }
  };

  // Adicionar profissional à escala (automático ou manual)
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const isReinforcement = addStaffMode === 'troca';

    const newMember: ShiftStaffMember = {
      id: `stf-custom-${Date.now()}`,
      name: newStaffName.trim(),
      category: newStaffCategory,
      registration: newStaffRegistration.trim() || 'COREN-SP',
      scheduledRole:
        newStaffRole.trim() ||
        (isReinforcement ? 'Troca / Cobertura de Plantão' : 'Assistencial'),
      scheduledHours: newStaffHours.trim() || '07:00 - 19:00',
      status: newStaffInitialStatus,
      checkInTime:
        newStaffInitialStatus === 'presente'
          ? new Date().toTimeString().slice(0, 5)
          : undefined,
      isReinforcement: isReinforcement,
      originSector:
        isAutoFilled && autoFilledSector !== selectedSector
          ? autoFilledSector
          : undefined,
    };

    // Se optou por cadastrar novo profissional no hospital
    if (shouldSaveToRegistry && !isAutoFilled) {
      const saved = saveRegisteredProfessional({
        name: newStaffName.trim(),
        category: newStaffCategory,
        registration: newStaffRegistration.trim() || 'COREN-SP',
        defaultRole: newStaffRole.trim() || 'Assistencial',
        sector: selectedSector,
        defaultHours: newStaffHours.trim() || '07:00 - 19:00',
      });
      setRegisteredProfessionals((prev) => [saved, ...prev]);
    }

    const updatedData = {
      ...shiftData,
      staff: [...shiftData.staff, newMember],
    };
    handlePersistShiftData(
      updatedData,
      isReinforcement
        ? `${newMember.name} incorporado à escala (Troca/Extra).`
        : `${newMember.name} adicionado à escala prevista do plantão.`
    );
    setIsAddStaffModalOpen(false);
    playHospitalChime('success');
  };

  // Remover profissional da escala
  const handleRemoveStaff = (staffId: string) => {
    const target = shiftData.staff.find((s) => s.id === staffId);
    const updatedStaff = shiftData.staff.filter((s) => s.id !== staffId);
    const updatedData = { ...shiftData, staff: updatedStaff };
    handlePersistShiftData(
      updatedData,
      target
        ? `${target.name} removido da escala do plantão.`
        : 'Profissional removido da escala.'
    );
  };

  // Métricas do Dimensionamento & Orientações COFEN
  const metrics = useMemo(() => {
    const scheduledNurses = shiftData.staff.filter((s) =>
      s.category.toLowerCase().includes('enferm')
    );
    const presentNurses = shiftData.staff.filter(
      (s) =>
        s.category.toLowerCase().includes('enferm') &&
        (s.status === 'presente' || s.status === 'remanejado_recebido')
    );

    const scheduledTechs = shiftData.staff.filter(
      (s) =>
        s.category.toLowerCase().includes('téc') ||
        s.category.toLowerCase().includes('aux')
    );
    const presentTechs = shiftData.staff.filter(
      (s) =>
        (s.category.toLowerCase().includes('téc') ||
          s.category.toLowerCase().includes('aux')) &&
        (s.status === 'presente' || s.status === 'remanejado_recebido')
    );

    const allAbsent = shiftData.staff.filter((s) => s.status === 'ausente');
    const allLate = shiftData.staff.filter((s) => s.status === 'atrasado');
    const allTrocas = shiftData.staff.filter(
      (s) => s.isReinforcement || s.status === 'remanejado_recebido'
    );

    const occupancyRate =
      shiftData.totalBeds > 0
        ? Math.round((shiftData.occupiedBeds / shiftData.totalBeds) * 100)
        : 0;

    // Relações assistenciais
    const nurseRatioValue =
      presentNurses.length > 0
        ? (shiftData.occupiedBeds / presentNurses.length).toFixed(1)
        : '0.0';

    const techRatioValue =
      presentTechs.length > 0
        ? (shiftData.occupiedBeds / presentTechs.length).toFixed(1)
        : '0.0';

    const isNurseRatioOverloaded =
      presentNurses.length === 0 ||
      Number(nurseRatioValue) > shiftData.cofenRatioNurseTarget;

    const isTechRatioOverloaded =
      presentTechs.length === 0 ||
      Number(techRatioValue) > shiftData.cofenRatioTechTarget;

    return {
      scheduledNursesCount: scheduledNurses.length,
      presentNursesCount: presentNurses.length,
      scheduledTechsCount: scheduledTechs.length,
      presentTechsCount: presentTechs.length,
      allAbsent,
      allLate,
      allTrocas,
      occupancyRate,
      nurseRatioValue,
      techRatioValue,
      isNurseRatioOverloaded,
      isTechRatioOverloaded,
      hasDeficit: allAbsent.length > 0,
    };
  }, [shiftData]);

  // Filtragem da lista
  const filteredStaff = useMemo(() => {
    if (activeTabFilter === 'presentes') {
      return shiftData.staff.filter(
        (s) => s.status === 'presente' || s.status === 'remanejado_recebido'
      );
    }
    if (activeTabFilter === 'ausentes') {
      return shiftData.staff.filter((s) => s.status === 'ausente');
    }
    if (activeTabFilter === 'trocas') {
      return shiftData.staff.filter(
        (s) => s.isReinforcement || s.status === 'remanejado_recebido'
      );
    }
    return shiftData.staff;
  }, [shiftData.staff, activeTabFilter]);

  return (
    <div id="view-meu-plantao-agora" className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Toast de Notificação */}
      {successToast && (
        <div
          id="toast-shift-feedback"
          className="fixed bottom-6 right-6 z-50 bg-[#2D2D2A] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs border border-[#5A5A40]/40 animate-in fade-in slide-in-from-bottom-2"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* HEADER COMPACTO E DIRETO */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E6D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#D1A661]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg sm:text-xl text-[#2D2D2A]">
                Meu Plantão
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide border border-emerald-200">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-[#7D7D72] flex items-center gap-2 mt-0.5">
              <span>Turno {shiftData.shift}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#5A5A40]" />
                <strong className="font-mono text-[#2D2D2A]">{currentTime}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Seletor de Setor (Para Coordenador/Diretor) ou Lotação Travada (Para Enfermeiro) */}
        <div className="flex items-center gap-2">
          {isNurse ? (
            <div
              id="badge-nurse-locked-sector"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0EFEA] border border-[#E8E6D9] shadow-2xs"
              title={`Lotação cadastral vinculada ao seu perfil (${currentUser.registrationNumber})`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-[#D1A661]" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#7D7D72] block leading-none">
                  Setor Cadastrado
                </span>
                <span className="text-xs font-bold text-[#2D2D2A] flex items-center gap-1.5 mt-0.5">
                  {nurseAssignedSector}
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Seu Posto
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] shadow-2xs">
              <Building className="w-4 h-4 text-[#5A5A40] shrink-0" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#7D7D72] block leading-none">
                  Visualizar Escala do Setor:
                </span>
                <select
                  id="select-shift-sector"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#2D2D2A] focus:outline-hidden cursor-pointer mt-0.5"
                >
                  {availableSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Botão Troca / Extra: Exclusivo do Enfermeiro com autonomia operacional */}
          {canEditShift && (
            <button
              id="btn-add-staff-modal"
              onClick={() => handleOpenAddStaffModal('troca')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
              title="Registrar profissional de troca ou hora-extra"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D1A661]" />
              <span>+ Troca / Extra</span>
            </button>
          )}
        </div>
      </div>

      {/* BANNER DE GOVERNANÇA: MODO CONSULTA (COORDENADOR/DIRETOR) vs POSTO ATIVO (ENFERMEIRO) */}
      {!canEditShift ? (
        <div
          id="banner-supervisor-view-only"
          className="bg-[#F0F4F8] border border-[#D0DFEB] rounded-2xl p-3.5 text-xs text-[#1E3A5F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DCE7F3] text-[#1E3A5F] flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-[#1E3A5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-bold text-xs sm:text-sm text-[#0F2440]">
                  Visualização da Escala do Plantão ({currentUser.roleTitle})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#DCE7F3] text-[#0F2440] text-[10px] font-bold uppercase tracking-wider">
                  Modo Somente Leitura
                </span>
              </div>
              <p className="text-[11px] text-[#2C4D75] mt-0.5">
                Você pode alternar e auditar a escala em tempo real de qualquer unidade ({selectedSector}). Por governança assistencial, as marcações de presença, faltas, trocas e censo são executadas pelo Enfermeiro do posto.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D0DFEB] text-[11px] font-semibold text-[#1E3A5F] shrink-0 self-start sm:self-center shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-[#1E3A5F]" />
            <span>Marcações desabilitadas para coordenação</span>
          </div>
        </div>
      ) : (
        <div
          id="banner-nurse-active-shift"
          className="bg-[#FAF8F4] border border-[#E8E6D9] rounded-2xl p-3 text-xs text-[#2D2D2A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#2D2D2A]">
                Plantão Operacional do Posto: {selectedSector}
              </span>
              <p className="text-[11px] text-[#7D7D72]">
                Enfermeiro(a) Responsável: <strong className="text-[#2D2D2A]">{currentUser.name}</strong> ({currentUser.registrationNumber}). Você tem autonomia para confirmação de presenças, faltas e dimensionamento do turno.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase shrink-0">
            Autonomia do Posto
          </span>
        </div>
      )}

      {/* ORIENTAÇÕES COFEN & DIMENSIONAMENTO (PREENCHIMENTO MANUAL DO CENSO) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Censo de Leitos (Preenchimento Manual) */}
        <div id="card-shift-census" className="bg-white rounded-2xl p-4 border border-[#E8E6D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D7D72] flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-[#5A5A40]" />
              Censo do Setor
            </span>
            {canEditShift && (
              <button
                type="button"
                id="btn-open-census-modal"
                onClick={() => setIsEditCensusModalOpen(true)}
                className="text-[10px] font-bold text-[#5A5A40] hover:text-[#2D2D2A] hover:underline flex items-center gap-1 cursor-pointer"
                title="Abrir ajuste detalhado de censo e parâmetros"
              >
                <Pencil className="w-3 h-3" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center gap-1.5">
              {canEditShift ? (
                <>
                  {/* Stepper e Input de Pacientes Internados */}
                  <div className="flex items-center bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      id="btn-decrement-census-beds"
                      onClick={() => handleQuickAdjustBeds(-1)}
                      disabled={shiftData.occupiedBeds <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#5A5A40] font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer"
                      title="Diminuir 1 paciente"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      id="input-census-occupied-inline"
                      type="number"
                      min="0"
                      max={shiftData.totalBeds || 100}
                      value={shiftData.occupiedBeds}
                      onChange={(e) => handleInlineOccupiedChange(e.target.value)}
                      className="w-12 text-center font-serif font-bold text-2xl text-[#2D2D2A] bg-transparent focus:outline-hidden"
                      title="Digite o número real de pacientes internados no momento"
                    />
                    <button
                      type="button"
                      id="btn-increment-census-beds"
                      onClick={() => handleQuickAdjustBeds(1)}
                      disabled={shiftData.occupiedBeds >= shiftData.totalBeds}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-[#5A5A40] font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer"
                      title="Aumentar 1 paciente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs text-[#7D7D72] font-medium">/</span>

                  {/* Input de Capacidade Total de Leitos */}
                  <div className="flex items-center gap-1">
                    <input
                      id="input-census-total-inline"
                      type="number"
                      min="1"
                      max="200"
                      value={shiftData.totalBeds}
                      onChange={(e) => handleInlineTotalChange(e.target.value)}
                      className="w-10 text-center text-xs font-semibold text-[#7D7D72] bg-[#F9F7F2] border border-[#E8E6D9] rounded-lg py-1 focus:border-[#5A5A40] focus:outline-hidden"
                      title="Capacidade total de leitos do setor"
                    />
                    <span className="text-xs text-[#7D7D72]">leitos</span>
                  </div>
                </>
              ) : (
                /* Modo Visualização para Coordenador e Diretor */
                <div className="flex items-baseline gap-1.5 py-1">
                  <span className="font-serif font-bold text-2xl text-[#2D2D2A]">
                    {shiftData.occupiedBeds}
                  </span>
                  <span className="text-xs text-[#7D7D72] font-semibold">
                    / {shiftData.totalBeds} leitos ativos
                  </span>
                </div>
              )}
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                metrics.occupancyRate >= 85
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {metrics.occupancyRate}% Ocupação
            </span>
          </div>

          <div className="w-full bg-[#E8E6D9]/60 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                metrics.occupancyRate >= 85 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
            />
          </div>

          <span className="text-[10px] text-[#7D7D72] block mt-1.5">
            {canEditShift
              ? 'Preenchimento manual pelo enfermeiro • Base direta para o cálculo COFEN'
              : 'Alimentado em tempo real pelo Enfermeiro do Plantão (Modo Consulta)'}
          </span>
        </div>

        {/* Card 2: Relação COFEN Enfermeiro : Paciente */}
        <div
          id="card-shift-nurse-ratio"
          className={`rounded-2xl p-4 border shadow-2xs ${
            metrics.isNurseRatioOverloaded
              ? 'bg-amber-50/80 border-amber-300'
              : 'bg-white border-[#E8E6D9]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D7D72]">
              Enfermeiro : Paciente
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                metrics.isNurseRatioOverloaded
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {metrics.isNurseRatioOverloaded ? 'Atenção' : 'Conforme'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif font-bold text-2xl text-[#2D2D2A]">
              1 : {metrics.nurseRatioValue}
            </span>
            <span className="text-[11px] text-[#7D7D72]">
              {metrics.presentNursesCount} de {metrics.scheduledNursesCount} presentes
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#5A5A40] mt-2 pt-1.5 border-t border-[#E8E6D9]/60">
            <span>Parâmetro COFEN: <strong>até 1 : {shiftData.cofenRatioNurseTarget}</strong></span>
            <span className="text-[9px] text-[#7D7D72]">
              ({shiftData.occupiedBeds} pac. ÷ {metrics.presentNursesCount || 1} enf.)
            </span>
          </div>
        </div>

        {/* Card 3: Relação COFEN Técnico : Paciente */}
        <div
          id="card-shift-tech-ratio"
          className={`rounded-2xl p-4 border shadow-2xs ${
            metrics.isTechRatioOverloaded
              ? 'bg-red-50/80 border-red-300'
              : 'bg-white border-[#E8E6D9]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D7D72]">
              Técnico : Paciente
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                metrics.isTechRatioOverloaded
                  ? 'bg-red-200 text-red-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {metrics.isTechRatioOverloaded ? 'Sobrecarga' : 'Conforme'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`font-serif font-bold text-2xl ${
                metrics.isTechRatioOverloaded ? 'text-red-700' : 'text-[#2D2D2A]'
              }`}
            >
              1 : {metrics.techRatioValue}
            </span>
            <span className="text-[11px] text-[#7D7D72]">
              {metrics.presentTechsCount} de {metrics.scheduledTechsCount} presentes
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#5A5A40] mt-2 pt-1.5 border-t border-[#E8E6D9]/60">
            <span>Parâmetro COFEN: <strong>até 1 : {shiftData.cofenRatioTechTarget}</strong></span>
            <span className="text-[9px] text-[#7D7D72]">
              ({shiftData.occupiedBeds} pac. ÷ {metrics.presentTechsCount || 1} téc.)
            </span>
          </div>
        </div>
      </div>

      {/* ESCALA PREVISTA × REAL (FOCO PRINCIPAL E DIRETO) */}
      <div className="bg-white rounded-2xl border border-[#E8E6D9] shadow-xs overflow-hidden">
        {/* Barra de Filtros e Ações */}
        <div className="p-3 sm:p-4 border-b border-[#E8E6D9] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FCFAF6]">
          <div className="flex items-center gap-2 flex-wrap">
            <FileSpreadsheet className="w-4 h-4 text-[#5A5A40]" />
            <h2 className="font-serif font-bold text-sm sm:text-base text-[#2D2D2A]">
              Escala Prevista do Plantão
            </h2>
            <span className="text-xs text-[#7D7D72]">
              ({metrics.presentNursesCount + metrics.presentTechsCount} presentes de {shiftData.staff.length} previstos)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTabFilter('todos')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTabFilter === 'todos'
                    ? 'bg-[#5A5A40] text-white shadow-2xs'
                    : 'text-[#7D7D72] hover:bg-white'
                }`}
              >
                Todos ({shiftData.staff.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('presentes')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTabFilter === 'presentes'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#7D7D72] hover:bg-white'
                }`}
              >
                Presentes ({metrics.presentNursesCount + metrics.presentTechsCount})
              </button>
              <button
                onClick={() => setActiveTabFilter('ausentes')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTabFilter === 'ausentes'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-[#7D7D72] hover:bg-white'
                }`}
              >
                Ausentes ({metrics.allAbsent.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('trocas')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTabFilter === 'trocas'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-[#7D7D72] hover:bg-white'
                }`}
              >
                Trocas/Extras ({metrics.allTrocas.length})
              </button>
            </div>

            {/* BOTÃO PARA ADICIONAR PROFISSIONAL À ESCALA PREVISTA (Apenas Enfermeiro) */}
            {canEditShift && (
              <button
                id="btn-add-scheduled-staff"
                onClick={() => handleOpenAddStaffModal('escala')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                title="Adicionar profissional cadastrado à escala prevista deste turno"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D1A661]" />
                <span>+ Adicionar Profissional</span>
              </button>
            )}
          </div>
        </div>

        {/* Sugestões Rápidas: Profissionais Cadastrados deste Setor que ainda não estão escalados hoje (Apenas Enfermeiro) */}
        {canEditShift && unassignedSectorProfessionals.length > 0 && (
          <div className="px-3.5 py-2 bg-[#FBF9F4] border-b border-[#E8E6D9] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-[#5A5A40] flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#D1A661]" />
              Cadastrados de {selectedSector} prontos para incluir:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {unassignedSectorProfessionals.slice(0, 4).map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => {
                    handleOpenAddStaffModal('escala');
                    handleSelectRegisteredProfessional(prof.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F0EFEA] border border-[#E8E6D9] text-[#2D2D2A] text-[11px] font-medium transition-all shadow-2xs cursor-pointer"
                  title={`Clique para puxar ${prof.name} (${prof.category}) no automático`}
                >
                  <Plus className="w-3 h-3 text-[#5A5A40]" />
                  <span>{prof.name}</span>
                  <span className="text-[9px] text-[#7D7D72] font-mono">({prof.registration})</span>
                </button>
              ))}
              {unassignedSectorProfessionals.length > 4 && (
                <button
                  onClick={() => handleOpenAddStaffModal('escala')}
                  className="text-[11px] text-[#5A5A40] font-bold hover:underline ml-1 cursor-pointer"
                >
                  +{unassignedSectorProfessionals.length - 4} outros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista da Escala */}
        <div className="divide-y divide-[#E8E6D9]">
          {filteredStaff.map((member) => {
            const isPresent =
              member.status === 'presente' || member.status === 'remanejado_recebido';
            const isAbsent = member.status === 'ausente';
            const isLate = member.status === 'atrasado';

            return (
              <div
                key={member.id}
                className={`p-3 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  isAbsent
                    ? 'bg-red-50/40'
                    : isLate
                    ? 'bg-amber-50/30'
                    : member.isReinforcement
                    ? 'bg-blue-50/20'
                    : 'hover:bg-[#F9F7F2]/60'
                }`}
              >
                {/* Informações do Profissional */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAbsent
                        ? 'bg-red-100 text-red-700'
                        : isPresent
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#2D2D2A] truncate">
                        {member.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F0EFEA] text-[#5A5A40]">
                        {member.category}
                      </span>
                      {member.isReinforcement && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                          Troca / Extra
                        </span>
                      )}
                      <span className="text-[10px] text-[#7D7D72] font-mono">
                        {member.registration}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7D7D72] flex items-center gap-2 mt-0.5">
                      <span>Posto: <strong className="text-[#2D2D2A]">{member.scheduledRole}</strong></span>
                      {member.absenceNotes && (
                        <span className="text-red-700 font-medium">
                          • {member.absenceNotes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status e Ações Rápidas */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Badge */}
                  {isPresent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Presente {member.checkInTime ? `(${member.checkInTime})` : ''}
                    </span>
                  )}
                  {isAbsent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Faltou
                    </span>
                  )}
                  {isLate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Atrasado
                    </span>
                  )}
                  {!isPresent && !isAbsent && !isLate && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-[#F0EFEA] text-[#7D7D72] border border-[#E8E6D9]">
                      <Clock className="w-3 h-3 text-[#7D7D72]" />
                      Aguardando Check-in
                    </span>
                  )}

                  {/* Ações de 1 Clique: Apenas para o Enfermeiro (Posto Ativo) */}
                  {canEditShift ? (
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E8E6D9]">
                      <button
                        onClick={() => handleMarkPresent(member.id)}
                        className={`p-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'text-[#7D7D72] hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title="Marcar como presente"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setAbsenceModalStaff(member);
                          setAbsenceModalReason('falta_injustificada');
                          setAbsenceModalNotes('');
                        }}
                        className={`p-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          isAbsent
                            ? 'bg-red-600 text-white'
                            : 'text-[#7D7D72] hover:bg-red-50 hover:text-red-700'
                        }`}
                        title="Registrar falta / ausência"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMarkLate(member.id)}
                        className={`p-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                          isLate
                            ? 'bg-amber-500 text-white'
                            : 'text-[#7D7D72] hover:bg-amber-50 hover:text-amber-700'
                        }`}
                        title="Marcar como atrasado"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRemoveStaff(member.id)}
                        className="p-1.5 rounded-md text-xs font-bold text-[#7D7D72] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover profissional deste plantão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Indicador de Somente Leitura para Coordenador e Diretor */
                    <div
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] text-[#1E3A5F] bg-[#F0F4F8] border border-[#D0DFEB] font-medium"
                      title="Marcação de presença restrita ao enfermeiro de plantão"
                    >
                      <Lock className="w-3 h-3 text-[#1E3A5F]" />
                      <span>Somente Consulta</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL SIMPLES: REGISTRAR FALTA */}
      {absenceModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-[#E8E6D9] space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-2">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Registrar Falta na Escala</span>
              </div>
              <button
                onClick={() => setAbsenceModalStaff(null)}
                className="text-[#7D7D72] hover:text-[#2D2D2A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5A5A40]">
              Colaborador: <strong className="text-[#2D2D2A]">{absenceModalStaff.name}</strong> ({absenceModalStaff.category})
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1">
                  Motivo:
                </label>
                <select
                  value={absenceModalReason}
                  onChange={(e) => setAbsenceModalReason(e.target.value as AbsenceReason)}
                  className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                >
                  <option value="falta_injustificada">Falta Injustificada / Não compareceu</option>
                  <option value="atestado">Atestado Médico / Licença</option>
                  <option value="suspensao">Suspensão</option>
                  <option value="folga_nao_prevista">Folga não prevista</option>
                  <option value="outro">Outro motivo</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1">
                  Observação rápida (opcional):
                </label>
                <input
                  type="text"
                  value={absenceModalNotes}
                  onChange={(e) => setAbsenceModalNotes(e.target.value)}
                  placeholder="Ex: Avisou às 06:40 / Sem retorno"
                  className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E6D9]">
              <button
                onClick={() => setAbsenceModalStaff(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7D7D72] hover:bg-[#F9F7F2]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAbsence}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmar Falta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR PROFISSIONAL À ESCALA (AUTOMÁTICO DO CADASTRO OU MANUAL) */}
      {isAddStaffModalOpen && (
        <div
          id="modal-add-staff-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <form
            id="form-add-staff-schedule"
            onSubmit={handleAddStaffMember}
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-[#E8E6D9] space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F0EFEA] text-[#5A5A40] flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-[#5A5A40]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#2D2D2A]">
                    {addStaffMode === 'escala'
                      ? 'Adicionar Profissional à Escala Prevista'
                      : 'Adicionar Troca ou Hora-Extra de Cobertura'}
                  </h3>
                  <p className="text-[11px] text-[#7D7D72]">
                    Setor: <strong className="text-[#2D2D2A]">{selectedSector}</strong> • Turno {shiftData.shift}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-[#7D7D72] hover:text-[#2D2D2A] p-1.5 rounded-lg hover:bg-[#F9F7F2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alternância de Modo */}
            <div className="flex items-center p-1 bg-[#F9F7F2] rounded-xl border border-[#E8E6D9] text-xs">
              <button
                type="button"
                onClick={() => setAddStaffMode('escala')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  addStaffMode === 'escala'
                    ? 'bg-white text-[#2D2D2A] shadow-xs'
                    : 'text-[#7D7D72] hover:text-[#2D2D2A]'
                }`}
              >
                Escala Prevista do Setor
              </button>
              <button
                type="button"
                onClick={() => setAddStaffMode('troca')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  addStaffMode === 'troca'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-[#7D7D72] hover:text-[#2D2D2A]'
                }`}
              >
                Troca / Extra (Reforço)
              </button>
            </div>

            {/* SELEÇÃO DO PROFISSIONAL CADASTRADO (AUTOMÁTICO) */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E6D9] space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="select-registered-professional"
                  className="text-xs font-bold text-[#2D2D2A] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D1A661]" />
                  <span>Selecionar Profissional Cadastrado (Preenchimento Automático):</span>
                </label>
                <span className="text-[10px] text-[#5A5A40] font-semibold">
                  {registeredProfessionals.length} cadastrados
                </span>
              </div>

              <select
                id="select-registered-professional"
                value={selectedRegisteredId}
                onChange={(e) => handleSelectRegisteredProfessional(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white text-[#2D2D2A] text-xs font-medium focus:outline-hidden focus:border-[#5A5A40] cursor-pointer shadow-2xs"
              >
                <option value="">-- Escolha um profissional para preencher no automático --</option>
                
                {/* Grupo: Profissionais do Setor Atual */}
                <optgroup label={`--- Equipe Cadastrada de ${selectedSector} ---`}>
                  {registeredProfessionals
                    .filter((p) => p.sector.toLowerCase() === selectedSector.toLowerCase())
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.category} ({p.registration}) • {p.defaultRole}
                      </option>
                    ))}
                </optgroup>

                {/* Grupo: Demais Profissionais do Hospital */}
                <optgroup label="--- Profissionais de Outros Setores (Hospital) ---">
                  {registeredProfessionals
                    .filter((p) => p.sector.toLowerCase() !== selectedSector.toLowerCase())
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.category} ({p.registration}) [{p.sector}]
                      </option>
                    ))}
                </optgroup>
              </select>

              {/* Feedback visual de dados preenchidos no automático */}
              {isAutoFilled ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Dados preenchidos no automático!</strong> Profissional cadastrado em <strong>{autoFilledSector}</strong>.
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-[#7D7D72]">
                  Dica: Selecione acima para preencher Nome, Categoria, COREN e Posto instantaneamente.
                </p>
              )}
            </div>

            {/* CAMPOS DE DETALHES (PREENCHIDOS OU MANUAIS) */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1">
                  Nome do Profissional:
                </label>
                <input
                  id="input-new-staff-name"
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => {
                    setNewStaffName(e.target.value);
                    if (selectedRegisteredId) setSelectedRegisteredId('');
                  }}
                  placeholder="Ex: Téc. Beatriz Castro"
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] font-medium focus:bg-white focus:outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    Categoria Profissional:
                  </label>
                  <select
                    id="select-new-staff-category"
                    value={newStaffCategory}
                    onChange={(e) => setNewStaffCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:bg-white focus:outline-hidden focus:border-[#5A5A40] cursor-pointer"
                  >
                    <option value="Enfermeiro">Enfermeiro</option>
                    <option value="Técnico de enfermagem">Técnico de enfermagem</option>
                    <option value="Auxiliar de enfermagem">Auxiliar de enfermagem</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    COREN / Matrícula:
                  </label>
                  <input
                    id="input-new-staff-reg"
                    type="text"
                    required
                    value={newStaffRegistration}
                    onChange={(e) => setNewStaffRegistration(e.target.value)}
                    placeholder="COREN-SP 12345"
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] font-mono focus:bg-white focus:outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    Posto / Atribuição no Plantão:
                  </label>
                  <input
                    id="input-new-staff-role"
                    type="text"
                    required
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    placeholder="Ex: Leitos 01 a 04 / Assistência"
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:bg-white focus:outline-hidden focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    Horário da Escala:
                  </label>
                  <input
                    id="input-new-staff-hours"
                    type="text"
                    value={newStaffHours}
                    onChange={(e) => setNewStaffHours(e.target.value)}
                    placeholder="07:00 - 19:00"
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:bg-white focus:outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              {/* Status Inicial */}
              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1.5">
                  Status Inicial no Plantão:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="staffInitialStatus"
                      checked={newStaffInitialStatus === 'presente'}
                      onChange={() => setNewStaffInitialStatus('presente')}
                      className="accent-[#5A5A40]"
                    />
                    <span className="font-medium text-[#2D2D2A]">Presente (Já assumiu o posto)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="staffInitialStatus"
                      checked={newStaffInitialStatus === 'atrasado'}
                      onChange={() => setNewStaffInitialStatus('atrasado')}
                      className="accent-[#5A5A40]"
                    />
                    <span className="font-medium text-[#7D7D72]">A caminho / Atrasado</span>
                  </label>
                </div>
              </div>

              {/* Opção para salvar no cadastro permanente */}
              {!isAutoFilled && (
                <div className="pt-2 border-t border-[#E8E6D9]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#5A5A40]">
                    <input
                      type="checkbox"
                      checked={shouldSaveToRegistry}
                      onChange={(e) => setShouldSaveToRegistry(e.target.checked)}
                      className="rounded-sm accent-[#5A5A40]"
                    />
                    <span className="text-[11px] font-medium">
                      Salvar este profissional no cadastro institucional de {selectedSector} para futuros plantões
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Rodapé e Ações */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E6D9]">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#7D7D72] hover:bg-[#F9F7F2] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-confirm-add-staff"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#484833] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {addStaffMode === 'escala' ? 'Adicionar à Escala Prevista' : 'Adicionar Troca/Extra'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE PREENCHIMENTO MANUAL DO CENSO E PARÂMETROS COFEN */}
      {isEditCensusModalOpen && (
        <div
          id="modal-edit-census-overlay"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <form
            id="form-edit-census"
            onSubmit={handleSaveCensusModal}
            className="bg-white rounded-2xl p-5 max-w-md w-full border border-[#E8E6D9] shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E6D9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0EFEA] text-[#5A5A40] flex items-center justify-center">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#2D2D2A]">
                    Ajustar Censo do Setor ({selectedSector})
                  </h3>
                  <p className="text-[11px] text-[#7D7D72]">
                    Preencha os números reais para calibrar o dimensionamento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCensusModalOpen(false)}
                className="text-[#7D7D72] hover:text-[#2D2D2A] p-1 rounded-lg hover:bg-[#F9F7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F9F7F2] p-3 rounded-xl border border-[#E8E6D9]/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-2">
                  Dados de Ocupação da Unidade
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">
                      Pacientes Internados:
                    </label>
                    <input
                      id="modal-census-occupied-input"
                      type="number"
                      min="0"
                      max={censusInputTotal || 200}
                      required
                      value={censusInputOccupied}
                      onChange={(e) => setCensusInputOccupied(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-white text-[#2D2D2A] font-bold text-base text-center focus:outline-hidden focus:border-[#5A5A40]"
                    />
                    <span className="text-[10px] text-[#7D7D72] block mt-0.5">Leitos ocupados agora</span>
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">
                      Capacidade Total de Leitos:
                    </label>
                    <input
                      id="modal-census-total-input"
                      type="number"
                      min="1"
                      max="200"
                      required
                      value={censusInputTotal}
                      onChange={(e) => setCensusInputTotal(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-white text-[#2D2D2A] font-bold text-base text-center focus:outline-hidden focus:border-[#5A5A40]"
                    />
                    <span className="text-[10px] text-[#7D7D72] block mt-0.5">Leitos ativos no setor</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F9F7F2] p-3 rounded-xl border border-[#E8E6D9]/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-2">
                  Parâmetros de Referência COFEN
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">
                      Enfermeiro : Paciente
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#7D7D72]">1 :</span>
                      <input
                        id="modal-cofen-nurse-input"
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={cofenNurseTargetInput}
                        onChange={(e) => setCofenNurseTargetInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-white text-[#2D2D2A] font-bold text-sm text-center focus:outline-hidden focus:border-[#5A5A40]"
                      />
                    </div>
                    <span className="text-[10px] text-[#7D7D72] block mt-0.5">Ex: até 1:8 (semi) ou 1:12</span>
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">
                      Técnico : Paciente
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#7D7D72]">1 :</span>
                      <input
                        id="modal-cofen-tech-input"
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={cofenTechTargetInput}
                        onChange={(e) => setCofenTechTargetInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-white text-[#2D2D2A] font-bold text-sm text-center focus:outline-hidden focus:border-[#5A5A40]"
                      />
                    </div>
                    <span className="text-[10px] text-[#7D7D72] block mt-0.5">Ex: até 1:3 (semi) ou 1:4</span>
                  </div>
                </div>
              </div>

              {/* Simulação em tempo real */}
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                <span>Taxa resultante: <strong>{censusInputTotal > 0 ? Math.round((censusInputOccupied / censusInputTotal) * 100) : 0}% de ocupação</strong></span>
                <span>Base do cálculo: <strong>{censusInputOccupied} pacientes</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E6D9]">
              <button
                type="button"
                onClick={() => setIsEditCensusModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7D7D72] hover:bg-[#F9F7F2] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-submit-census-modal"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white cursor-pointer shadow-xs"
              >
                Salvar e Recalcular
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
