import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  SystemSettings,
  SectorShiftData,
  ShiftStaffMember,
  ShiftPresenceStatus,
  AbsenceReason,
} from '../types';
import {
  getStoredShiftData,
  saveStoredShiftData,
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
} from 'lucide-react';

interface MyShiftViewProps {
  currentUser: User;
  settings: SystemSettings;
}

export const MyShiftView: React.FC<MyShiftViewProps> = ({
  currentUser,
  settings,
}) => {
  // Setor inicial
  const initialSector =
    currentUser.sector &&
    currentUser.sector !== 'Outro' &&
    currentUser.sector !== 'DENF / Diretoria'
      ? currentUser.sector
      : 'UTI';

  const [selectedSector, setSelectedSector] = useState<string>(initialSector);
  const [shiftData, setShiftData] = useState<SectorShiftData>(() =>
    getStoredShiftData(initialSector)
  );
  const [activeTabFilter, setActiveTabFilter] = useState<
    'todos' | 'presentes' | 'ausentes' | 'trocas'
  >('todos');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal para registrar ausência
  const [absenceModalStaff, setAbsenceModalStaff] = useState<ShiftStaffMember | null>(null);
  const [absenceModalReason, setAbsenceModalReason] =
    useState<AbsenceReason>('falta_injustificada');
  const [absenceModalNotes, setAbsenceModalNotes] = useState<string>('');

  // Modal de Troca / Extra
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffCategory, setNewStaffCategory] = useState<string>(
    'Técnico de enfermagem'
  );
  const [newStaffRegistration, setNewStaffRegistration] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<string>('');

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

  // Salvar alterações e persistir
  const handlePersistShiftData = (updated: SectorShiftData, toastMsg?: string) => {
    setShiftData(updated);
    saveStoredShiftData(updated);
    if (toastMsg) {
      setSuccessToast(toastMsg);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Ajuste rápido de leitos ocupados (+ / -)
  const handleQuickAdjustBeds = (delta: number) => {
    const nextVal = Math.max(0, Math.min(shiftData.totalBeds, shiftData.occupiedBeds + delta));
    const updated = { ...shiftData, occupiedBeds: nextVal };
    handlePersistShiftData(updated);
  };

  // Alteração direta do número de leitos ocupados
  const handleInlineOccupiedChange = (valStr: string) => {
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

  // Adicionar Troca / Extra
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newMember: ShiftStaffMember = {
      id: `stf-custom-${Date.now()}`,
      name: newStaffName.trim(),
      category: newStaffCategory,
      registration: newStaffRegistration.trim() || 'COREN-SP',
      scheduledRole: newStaffRole.trim() || 'Troca / Cobertura de Plantão',
      scheduledHours: '07:00 - 19:00',
      status: 'presente',
      checkInTime: new Date().toTimeString().slice(0, 5),
      isReinforcement: true,
    };

    const updatedData = {
      ...shiftData,
      staff: [...shiftData.staff, newMember],
    };
    handlePersistShiftData(
      updatedData,
      `${newMember.name} incorporado à escala (Troca/Extra).`
    );
    setIsAddStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffRegistration('');
    setNewStaffRole('');
    playHospitalChime('success');
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

        {/* Seletor de Setor & Botão Troca/Extra */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9]">
            <Building className="w-3.5 h-3.5 text-[#5A5A40]" />
            <select
              id="select-shift-sector"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#2D2D2A] focus:outline-hidden cursor-pointer"
            >
              {availableSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} {sec === currentUser.sector ? '(Meu Setor)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-add-staff-modal"
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Registrar profissional de troca ou hora-extra"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#D1A661]" />
            <span>+ Troca / Extra</span>
          </button>
        </div>
      </div>

      {/* ORIENTAÇÕES COFEN & DIMENSIONAMENTO (PREENCHIMENTO MANUAL DO CENSO) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Censo de Leitos (Preenchimento Manual) */}
        <div id="card-shift-census" className="bg-white rounded-2xl p-4 border border-[#E8E6D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D7D72] flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-[#5A5A40]" />
              Censo do Setor
            </span>
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
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center gap-1.5">
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
            Preenchimento manual • Base direta para o cálculo COFEN
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
        {/* Barra de Filtros */}
        <div className="p-3 sm:p-4 border-b border-[#E8E6D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FCFAF6]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#5A5A40]" />
            <h2 className="font-serif font-bold text-sm sm:text-base text-[#2D2D2A]">
              Escala Prevista do Plantão
            </h2>
            <span className="text-xs text-[#7D7D72]">
              ({metrics.presentNursesCount + metrics.presentTechsCount} presentes de {shiftData.staff.length} previstos)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTabFilter('todos')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'todos'
                  ? 'bg-[#5A5A40] text-white shadow-2xs'
                  : 'text-[#7D7D72] hover:bg-white'
              }`}
            >
              Todos ({shiftData.staff.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('presentes')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'presentes'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-[#7D7D72] hover:bg-white'
              }`}
            >
              Presentes ({metrics.presentNursesCount + metrics.presentTechsCount})
            </button>
            <button
              onClick={() => setActiveTabFilter('ausentes')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'ausentes'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-[#7D7D72] hover:bg-white'
              }`}
            >
              Ausentes ({metrics.allAbsent.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('trocas')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'trocas'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-[#7D7D72] hover:bg-white'
              }`}
            >
              Trocas/Extras ({metrics.allTrocas.length})
            </button>
          </div>
        </div>

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
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Presente {member.checkInTime ? `(${member.checkInTime})` : ''}
                    </span>
                  )}
                  {isAbsent && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Faltou
                    </span>
                  )}
                  {isLate && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Atrasado
                    </span>
                  )}

                  {/* Ações de 1 Clique */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E8E6D9]">
                    <button
                      onClick={() => handleMarkPresent(member.id)}
                      className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
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
                      className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
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
                      className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
                        isLate
                          ? 'bg-amber-500 text-white'
                          : 'text-[#7D7D72] hover:bg-amber-50 hover:text-amber-700'
                      }`}
                      title="Marcar como atrasado"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

      {/* MODAL SIMPLES: TROCA / EXTRA */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStaffMember}
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-[#E8E6D9] space-y-3 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-2">
              <div className="flex items-center gap-2 text-[#5A5A40] font-bold text-sm">
                <Plus className="w-4 h-4 text-[#D1A661]" />
                <span>Adicionar Troca ou Extra</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-[#7D7D72] hover:text-[#2D2D2A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1">
                  Nome do Profissional:
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ex: Téc. Rodrigo da Silva"
                  className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newStaffCategory}
                    onChange={(e) => setNewStaffCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                  >
                    <option value="Enfermeiro">Enfermeiro</option>
                    <option value="Técnico de enfermagem">Técnico de enfermagem</option>
                    <option value="Auxiliar de enfermagem">Auxiliar de enfermagem</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">
                    COREN:
                  </label>
                  <input
                    type="text"
                    value={newStaffRegistration}
                    onChange={(e) => setNewStaffRegistration(e.target.value)}
                    placeholder="COREN-12345"
                    className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#2D2D2A] block mb-1">
                  Atribuição / Posto no Plantão:
                </label>
                <input
                  type="text"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  placeholder="Ex: Apoio Leitos 11 a 15 / Troca com Juliana"
                  className="w-full p-2 rounded-lg border border-[#E8E6D9] bg-[#F9F7F2] text-[#2D2D2A] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E6D9]">
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7D7D72] hover:bg-[#F9F7F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white"
              >
                Salvar na Escala
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
