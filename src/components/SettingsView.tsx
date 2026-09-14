import React, { useState } from 'react';
import { SystemSettings, User, UserRole, RegisteredProfessional } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Building2,
  UserPlus,
  Lock,
  Check,
  X,
  UserCheck,
  Briefcase,
  Search,
  Filter,
} from 'lucide-react';
import {
  getStoredUsers,
  addUser,
  deleteUser,
  toggleUserStatus,
  getStoredRegisteredProfessionals,
  saveRegisteredProfessional,
  deleteRegisteredProfessional,
  toggleRegisteredProfessionalStatus,
} from '../services/storage';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: User;
  onSaveSettings: (updatedSettings: SystemSettings) => void;
  onResetDemoData: () => void;
  onSwitchUser?: (user: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onResetDemoData,
  onSwitchUser,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isDiretorDENF = currentUser.role === 'denf';
  const isCoordenador = currentUser.role === 'coordenador';
  const isEnfermeiro = currentUser.role === 'solicitante';

  const [activeTab, setActiveTab] = useState<'staff_registry' | 'users' | 'slas' | 'catalogs' | 'matrix' | 'maintenance'>('staff_registry');
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [usersList, setUsersList] = useState<User[]>(() => getStoredUsers());
  const [professionalsList, setProfessionalsList] = useState<RegisteredProfessional[]>(() =>
    getStoredRegisteredProfessionals()
  );

  // Filtro de profissionais
  const [profSearch, setProfSearch] = useState('');
  const [profSectorFilter, setProfSectorFilter] = useState<string>(
    isCoordenador ? currentUser.sector : 'TODOS'
  );

  // Form de Novo Profissional de Enfermagem
  const [showAddProfModal, setShowAddProfModal] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfCategory, setNewProfCategory] = useState<'Enfermeiro' | 'Técnico de enfermagem' | 'Auxiliar de enfermagem'>('Técnico de enfermagem');
  const [newProfReg, setNewProfReg] = useState('');
  const [newProfRole, setNewProfRole] = useState('Assistencial');
  const [newProfSector, setNewProfSector] = useState(isCoordenador ? currentUser.sector : 'UTI');
  const [newProfHours, setNewProfHours] = useState('07:00 - 19:00');
  const [newProfPhone, setNewProfPhone] = useState('');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('solicitante');
  const [newUserRoleTitle, setNewUserRoleTitle] = useState('Enfermeiro de Plantão');
  const [newUserSector, setNewUserSector] = useState(isCoordenador ? currentUser.sector : 'UTI');
  const [newUserReg, setNewUserReg] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  // Catalog inputs
  const [newSector, setNewSector] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(false);

  const refreshUsers = () => {
    setUsersList(getStoredUsers());
  };

  const refreshProfessionals = () => {
    setProfessionalsList(getStoredRegisteredProfessionals());
  };

  const handleCreateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim()) return;

    const targetSector = isCoordenador ? currentUser.sector : newProfSector;

    saveRegisteredProfessional({
      name: newProfName.trim(),
      category: newProfCategory,
      registration: newProfReg.trim() || 'COREN-SP',
      defaultRole: newProfRole.trim() || 'Assistencial',
      sector: targetSector,
      defaultHours: newProfHours.trim() || '07:00 - 19:00',
      phone: newProfPhone.trim() || '(11) 98000-0000',
      status: 'ativo',
    });

    refreshProfessionals();
    setShowAddProfModal(false);
    setNewProfName('');
    setNewProfReg('');
    setNewProfRole('Assistencial');
    setNewProfPhone('');
  };

  const handleDeleteProfessional = (id: string) => {
    if (confirm('Tem certeza que deseja remover este profissional do banco hospitalar?')) {
      deleteRegisteredProfessional(id);
      refreshProfessionals();
    }
  };

  const handleToggleProfStatus = (id: string) => {
    toggleRegisteredProfessionalStatus(id);
    refreshProfessionals();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      roleTitle:
        newUserRoleTitle.trim() ||
        (newUserRole === 'solicitante'
          ? 'Enfermeiro de Plantão'
          : newUserRole === 'coordenador'
          ? 'Coordenador de Enfermagem'
          : newUserRole === 'denf'
          ? 'Diretoria de Enfermagem (RT)'
          : 'Administrador de TI'),
      sector: newUserSector.trim(),
      registrationNumber: newUserReg.trim() || (newUserRole === 'admin' ? 'ADM-NOVO' : 'COREN-NOVO'),
      phone: newUserPhone.trim() || '(11) 99999-0000',
      status: 'ativo',
    });

    refreshUsers();
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserReg('');
    setNewUserPhone('');
  };

  const handleToggleStatus = (userId: string) => {
    toggleUserStatus(userId);
    refreshUsers();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Não é permitido excluir o usuário atualmente conectado.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este usuário do sistema?')) {
      deleteUser(userId);
      refreshUsers();
    }
  };

  const handleResetWithFeedback = () => {
    if (confirm('Atenção: Todos os dados demonstrativos serão redefinidos para os padrões de fábrica. Continuar?')) {
      onResetDemoData();
      refreshUsers();
      setResetSuccessMsg(true);
      setTimeout(() => setResetSuccessMsg(false), 4000);
    }
  };

  const handleAddSector = () => {
    if (!newSector.trim() || formData.sectors.includes(newSector.trim())) return;
    setFormData({
      ...formData,
      sectors: [...formData.sectors, newSector.trim()],
    });
    setNewSector('');
  };

  const handleRemoveSector = (sector: string) => {
    setFormData({
      ...formData,
      sectors: formData.sectors.filter((s) => s !== sector),
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || formData.professionalCategories.includes(newCategory.trim())) return;
    setFormData({
      ...formData,
      professionalCategories: [...formData.professionalCategories, newCategory.trim()],
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      professionalCategories: formData.professionalCategories.filter((c) => c !== cat),
    });
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Se o usuário logado for Enfermeiro de Plantão (solicitante), mostramos o bloqueio com explicação de governança
  if (isEnfermeiro) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#F9F7F2] border border-[#E8E6D9] rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-[#9E5A4E]/15 text-[#9E5A4E] rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif text-2xl font-bold text-[#2D2D2A]">
              Governança & Cadastro Institucional
            </h2>
            <p className="text-xs sm:text-sm text-[#7D7D72] leading-relaxed">
              Você está conectado como <strong>{currentUser.name}</strong> ({currentUser.roleTitle}).
              O cadastro permanente de funcionários e a parametrização do hospital competem à <strong>Diretoria de Enfermagem (DENF)</strong>, aos <strong>Coordenadores de Setor</strong> e ao <strong>Administrador do Sistema</strong>.
            </p>
            <p className="text-xs text-[#5A5A40] font-medium">
              Como Enfermeiro de Plantão, você tem autonomia na aba <strong>Meu Plantão Agora</strong> para compor o turno, apontar presenças e registrar trocas/extras.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8E6D9] flex flex-wrap justify-center gap-3">
            {onSwitchUser && (
              <>
                <button
                  onClick={() => {
                    const coord = usersList.find((u) => u.role === 'coordenador');
                    if (coord) onSwitchUser(coord);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#D1A661]/20 text-[#7A581E] hover:bg-[#D1A661]/30 border border-[#D1A661]/40 transition-all inline-flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4 text-[#7A581E]" />
                  <span>Alternar para Coordenador (Roberto Almeida)</span>
                </button>
                <button
                  onClick={() => {
                    const denf = usersList.find((u) => u.role === 'denf');
                    if (denf) onSwitchUser(denf);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white transition-all inline-flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>Alternar para Diretora DENF (Dra. Patrícia)</span>
                </button>
                <button
                  onClick={() => {
                    const adminUser = usersList.find((u) => u.role === 'admin') || getStoredUsers().find((u) => u.role === 'admin');
                    if (adminUser) onSwitchUser(adminUser);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2D2D2A] hover:bg-[#1A1A18] text-white shadow-xs transition-all inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D1A661]" />
                  <span>Alternar para Administrador (Carlos Eduardo)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="settings-view" className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E6D9] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2D2D2A] text-white uppercase tracking-wider">
              {isAdmin ? 'Governança & TI' : isDiretorDENF ? 'Diretoria de Enfermagem' : 'Coordenação de Setor'}
            </span>
            <span className="text-xs text-[#7D7D72]">
              {isAdmin ? 'Sustentação da Plataforma' : 'Gestão do Quadro de Enfermagem'}
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl tracking-tight text-[#2D2D2A] mt-1">
            {isAdmin ? 'Painel de Administração, Usuários & Equipes' : 'Gestão do Banco de Profissionais & Equipes'}
          </h2>
          <p className="text-xs text-[#7D7D72] mt-0.5">
            {isAdmin
              ? 'Gestão integral de acessos, segregação de funções, cadastro de colaboradores e parametrização hospitalar.'
              : isDiretorDENF
              ? 'Controle central do cadastro institucional de Enfermeiros, Técnicos e Auxiliares em todos os setores hospitalares.'
              : `Gestão dos colaboradores e escala base lotados no setor ${currentUser.sector}.`}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5A5A40] font-bold px-3 py-1.5 rounded-xl bg-[#8C9C82]/20 border border-[#8C9C82]/30 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Parâmetros Salvos
              </span>
            )}
            <button
              id="btn-save-settings"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E6D9] pb-3">
        {/* ABA PRINCIPAL: BANCO DE PROFISSIONAIS (Acessível a DENF, Coord e Admin) */}
        <button
          onClick={() => setActiveTab('staff_registry')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
            activeTab === 'staff_registry'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Banco de Profissionais ({professionalsList.length})</span>
        </button>

        {/* ABA USUÁRIOS (Admin e DENF) */}
        {(isAdmin || isDiretorDENF) && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contas de Acesso ({usersList.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Matriz de Papéis (RBAC)</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('slas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
                activeTab === 'slas'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>SLA & Prazos Clínicos</span>
            </button>

            <button
              onClick={() => setActiveTab('catalogs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
                activeTab === 'catalogs'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Setores & Categorias</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
                activeTab === 'maintenance'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Manutenção & Banco</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 0: BANCO DE PROFISSIONAIS DE ENFERMAGEM */}
      {activeTab === 'staff_registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E8E6D9]">
            <div>
              <h3 className="font-bold text-sm text-[#2D2D2A] flex items-center gap-2">
                <span>Cadastro Institucional de Profissionais de Enfermagem</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8E6D9] text-[#5A5A40] font-normal">
                  {professionalsList.length} cadastrados
                </span>
              </h3>
              <p className="text-xs text-[#7D7D72]">
                {isCoordenador && !isAdmin && !isDiretorDENF
                  ? `Colaboradores do setor ${currentUser.sector}. Eles ficam disponíveis para escalação pelo Enfermeiro de Plantão.`
                  : 'Quadro homologado de Enfermeiros, Técnicos e Auxiliares disponíveis para os setores hospitalares.'}
              </p>
            </div>

            <button
              id="btn-add-staff-member"
              onClick={() => setShowAddProfModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Colaborador</span>
            </button>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-[#E8E6D9]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7D7D72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profSearch}
                onChange={(e) => setProfSearch(e.target.value)}
                placeholder="Buscar por nome, COREN ou função..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E6D9] text-xs bg-[#F9F7F2]/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>

            {(isAdmin || isDiretorDENF) && (
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#7D7D72]" />
                <span className="text-xs text-[#7D7D72]">Setor:</span>
                <select
                  value={profSectorFilter}
                  onChange={(e) => setProfSectorFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E8E6D9] text-xs font-bold bg-white text-[#2D2D2A]"
                >
                  <option value="TODOS">Todos os Setores</option>
                  {formData.sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Modal / Adicionar Novo Profissional */}
          {showAddProfModal && (
            <div className="p-5 bg-white rounded-2xl border-2 border-[#5A5A40]/40 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#E8E6D9] pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#5A5A40]" />
                  <h4 className="font-bold text-sm text-[#2D2D2A]">
                    Cadastrar Colaborador no Banco do Hospital
                  </h4>
                </div>
                <button
                  onClick={() => setShowAddProfModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-[#F0EFEC] flex items-center justify-center text-[#7D7D72]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProfessional} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Téc. João Marcos Silva"
                      value={newProfName}
                      onChange={(e) => setNewProfName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Categoria Profissional *</label>
                    <select
                      value={newProfCategory}
                      onChange={(e) =>
                        setNewProfCategory(
                          e.target.value as 'Enfermeiro' | 'Técnico de enfermagem' | 'Auxiliar de enfermagem'
                        )
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-medium"
                    >
                      <option value="Enfermeiro">Enfermeiro (Nível Superior)</option>
                      <option value="Técnico de enfermagem">Técnico de enfermagem</option>
                      <option value="Auxiliar de enfermagem">Auxiliar de enfermagem</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Registro COREN *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: COREN-SP 89412"
                      value={newProfReg}
                      onChange={(e) => setNewProfReg(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Setor de Lotação *</label>
                    {isCoordenador && !isAdmin && !isDiretorDENF ? (
                      <input
                        type="text"
                        disabled
                        value={currentUser.sector}
                        className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-slate-100 font-bold text-[#5A5A40]"
                      />
                    ) : (
                      <select
                        value={newProfSector}
                        onChange={(e) => setNewProfSector(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white font-medium"
                      >
                        {formData.sectors.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Função / Posto de Trabalho</label>
                    <input
                      type="text"
                      placeholder="Ex: Leitos 1 a 10 / Cuidados Intensivos"
                      value={newProfRole}
                      onChange={(e) => setNewProfRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Jornada Típica</label>
                    <input
                      type="text"
                      placeholder="Ex: 07:00 - 19:00 (12h)"
                      value={newProfHours}
                      onChange={(e) => setNewProfHours(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#2D2D2A] block mb-1">Telefone / Contato</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98765-4321"
                      value={newProfPhone}
                      onChange={(e) => setNewProfPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E6D9] bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6D9]">
                  <button
                    type="button"
                    onClick={() => setShowAddProfModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D7D72] hover:bg-[#F9F7F2] border border-[#E8E6D9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs"
                  >
                    Salvar no Banco Hospitalar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabela de Profissionais */}
          <div className="bg-white rounded-2xl border border-[#E8E6D9] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F7F2] text-[#7D7D72] border-b border-[#E8E6D9] font-medium">
                  <tr>
                    <th className="p-3 pl-4">Colaborador</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">COREN</th>
                    <th className="p-3">Setor Lotação</th>
                    <th className="p-3">Função Padrão</th>
                    <th className="p-3">Jornada</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6D9]">
                  {professionalsList
                    .filter((p) => {
                      if (isCoordenador && !isAdmin && !isDiretorDENF) {
                        if (p.sector.toLowerCase() !== currentUser.sector.toLowerCase()) return false;
                      } else if (profSectorFilter !== 'TODOS') {
                        if (p.sector.toLowerCase() !== profSectorFilter.toLowerCase()) return false;
                      }
                      if (profSearch.trim()) {
                        const q = profSearch.toLowerCase();
                        const mName = p.name.toLowerCase().includes(q);
                        const mReg = p.registration.toLowerCase().includes(q);
                        const mRole = p.defaultRole?.toLowerCase().includes(q);
                        const mCat = p.category.toLowerCase().includes(q);
                        if (!mName && !mReg && !mRole && !mCat) return false;
                      }
                      return true;
                    })
                    .map((prof) => {
                      const isInactive = prof.status === 'inativo';
                      const isNurse = prof.category.toLowerCase().includes('enferm');

                      return (
                        <tr key={prof.id} className={`hover:bg-[#F9F7F2]/60 ${isInactive ? 'opacity-50' : ''}`}>
                          <td className="p-3 pl-4 font-bold text-[#2D2D2A]">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-serif text-[11px] font-bold ${
                                  isNurse ? 'bg-[#5A5A40] text-white' : 'bg-[#D1A661]/30 text-[#7A581E]'
                                }`}
                              >
                                {prof.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <span>{prof.name}</span>
                                {prof.phone && (
                                  <div className="text-[10px] text-[#7D7D72] font-normal">{prof.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isNurse
                                  ? 'bg-[#5A5A40]/15 text-[#5A5A40]'
                                  : 'bg-[#D1A661]/25 text-[#7A581E]'
                              }`}
                            >
                              {prof.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#2D2D2A]">{prof.registration}</td>
                          <td className="p-3 font-bold text-[#2D2D2A]">{prof.sector}</td>
                          <td className="p-3 text-[#7D7D72]">{prof.defaultRole || 'Assistencial'}</td>
                          <td className="p-3 text-[#7D7D72]">{prof.defaultHours || '07:00 - 19:00'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isInactive
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isInactive ? 'Inativo' : 'Ativo'}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleProfStatus(prof.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                isInactive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              }`}
                            >
                              {isInactive ? 'Reativar' : 'Inativar'}
                            </button>
                            {(isAdmin || isDiretorDENF) && (
                              <button
                                onClick={() => handleDeleteProfessional(prof.id)}
                                className="p-1 rounded-lg text-[#7D7D72] hover:text-rose-600 hover:bg-rose-50"
                                title="Remover profissional"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: GESTÃO DE USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E8E6D9]">
            <div>
              <h3 className="font-bold text-sm text-[#2D2D2A]">Usuários Cadastrados no Hospital</h3>
              <p className="text-xs text-[#7D7D72]">
                Controle de operadores, setores de lotação e perfis de permissão legal.
              </p>
            </div>
            <button
              id="btn-add-user"
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {/* Modal / Formulário de Novo Usuário */}
          {showAddUserModal && (
            <form
              onSubmit={handleCreateUser}
              className="bg-white border-2 border-[#5A5A40]/40 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E6D9]">
                <h4 className="font-serif font-bold text-base text-[#2D2D2A] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#5A5A40]" />
                  Cadastrar Novo Usuário
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg text-[#7D7D72] hover:bg-[#F9F7F2]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Enfª. Camila Rodrigues"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">E-mail Institucional</label>
                  <input
                    type="email"
                    required
                    placeholder="camila.rodrigues@hospital.org.br"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">Perfil de Acesso (Papel)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewUserRole(r);
                      if (r === 'solicitante') setNewUserRoleTitle('Enfermeiro de Plantão');
                      else if (r === 'coordenador') setNewUserRoleTitle('Coordenador de Enfermagem');
                      else if (r === 'denf') setNewUserRoleTitle('Diretoria de Enfermagem (DENF / RT)');
                      else if (r === 'admin') setNewUserRoleTitle('Administrador de TI & Governança');
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40] bg-white"
                  >
                    <option value="solicitante">Enfermeiro (Solicitante / Assistência)</option>
                    <option value="coordenador">Coordenador de Enfermagem (Setorial)</option>
                    <option value="denf">Diretor de Enfermagem (DENF / RT)</option>
                    <option value="admin">Administrador (TI / Governança)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">Cargo / Função Exibida</label>
                  <input
                    type="text"
                    value={newUserRoleTitle}
                    onChange={(e) => setNewUserRoleTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">Setor de Lotação</label>
                  <select
                    value={newUserSector}
                    onChange={(e) => setNewUserSector(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40] bg-white"
                  >
                    {formData.sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2D2D2A] block mb-1">Registro Profissional (COREN / Matrícula)</label>
                  <input
                    type="text"
                    placeholder="Ex: COREN-SP 123456"
                    value={newUserReg}
                    onChange={(e) => setNewUserReg(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E6D9] focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[#E8E6D9] hover:bg-[#F9F7F2] text-[#7D7D72]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Usuários */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] overflow-hidden">
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#F9F7F2] text-[#7D7D72] font-bold border-b border-[#E8E6D9] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Profissional</th>
                    <th className="py-3 px-4">Papel & Função</th>
                    <th className="py-3 px-4">Setor</th>
                    <th className="py-3 px-4">Registro</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6D9]">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-[#F9F7F2]/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#2D2D2A]">
                        <div className="font-bold">{usr.name}</div>
                        <div className="text-[11px] text-[#7D7D72]">{usr.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            usr.role === 'admin'
                              ? 'bg-[#2D2D2A] text-white'
                              : usr.role === 'denf'
                              ? 'bg-[#5A5A40] text-white'
                              : usr.role === 'coordenador'
                              ? 'bg-[#D1A661]/30 text-[#7A581E]'
                              : 'bg-[#E8E6D9] text-[#5A5A40]'
                          }`}
                        >
                          {usr.role === 'admin'
                            ? 'Admin TI'
                            : usr.role === 'denf'
                            ? 'Diretoria DENF'
                            : usr.role === 'coordenador'
                            ? 'Coordenador'
                            : 'Enfermeiro'}
                        </span>
                        <div className="text-[11px] text-[#7D7D72] mt-0.5">{usr.roleTitle}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2D2A] font-medium">{usr.sector}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#7D7D72]">{usr.registrationNumber}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            usr.status === 'inativo'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {usr.status === 'inativo' ? 'Inativo' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleToggleStatus(usr.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            usr.status === 'inativo'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          {usr.status === 'inativo' ? 'Reativar' : 'Inativar'}
                        </button>
                        {usr.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            className="p-1.5 rounded-lg text-[#7D7D72] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE PAPÉIS & COMPETÊNCIAS (RBAC) */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          <div className="bg-[#F9F7F2] p-5 rounded-2xl border border-[#E8E6D9] space-y-2">
            <h3 className="font-serif font-bold text-lg text-[#2D2D2A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#5A5A40]" />
              Matriz de Segregação Legal de Funções (RBAC Hospitalar)
            </h3>
            <p className="text-xs text-[#7D7D72] leading-relaxed">
              Em conformidade com a <strong>Lei Federal nº 7.498/86</strong> (Regulamentação da Enfermagem),
              <strong>Decreto nº 94.406/87</strong> e boas práticas de Governança Hospitalar, as
              competências clínicas e de tecnologia da informação são rigorosamente separadas para evitar conflitos de interesse
              e desvios ético-profissionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Enfermeiro de Plantão */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E6D9] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8E6D9] text-[#5A5A40] uppercase">
                  1. Enfermeiro de Plantão
                </span>
                <span className="text-[11px] text-[#7D7D72]">Ponta / Assistência</span>
              </div>
              <h4 className="font-bold text-sm text-[#2D2D2A]">Prerrogativas do Plantonista</h4>
              <ul className="text-xs text-[#7D7D72] space-y-1.5 list-disc pl-4">
                <li>Abertura formal de Solicitação de Déficit com checklist de impacto assistencial.</li>
                <li>Visualização de solicitações abertas e remanejamentos com destino ao seu setor.</li>
                <li>Confirmação da apresentação física do profissional remanejado no posto.</li>
                <li>Registro do desfecho do plantão e avaliação de segurança do paciente.</li>
              </ul>
              <div className="pt-2 border-t border-[#E8E6D9] text-[11px] text-rose-700 font-medium">
                ⛔ Vedado: Decidir alocação de outros setores ou alterar parâmetros do sistema.
              </div>
            </div>

            {/* Card 2: Coordenador de Enfermagem */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E6D9] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D1A661]/30 text-[#7A581E] uppercase">
                  2. Coordenador de Enfermagem
                </span>
                <span className="text-[11px] text-[#7D7D72]">Gestão de Bloco / Área</span>
              </div>
              <h4 className="font-bold text-sm text-[#2D2D2A]">Prerrogativas da Coordenação</h4>
              <ul className="text-xs text-[#7D7D72] space-y-1.5 list-disc pl-4">
                <li>Emissão de Parecer Técnico setorial sobre solicitações de sua área.</li>
                <li>Deliberação e autorização de remanejamentos internos da sua unidade de cuidado.</li>
                <li>Acompanhamento gerencial das pendências de confirmação física do turno.</li>
                <li>Monitoramento do mapa de demanda e taxa de ocupação dos leitos da área.</li>
              </ul>
              <div className="pt-2 border-t border-[#E8E6D9] text-[11px] text-amber-800 font-medium">
                ⚠️ Competência: Deliberação restrita à sua área de abrangência ou por delegação da DENF.
              </div>
            </div>

            {/* Card 3: Diretor de Enfermagem (DENF) */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#5A5A40]/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#5A5A40] text-white uppercase">
                  3. Diretoria de Enfermagem (DENF / RT)
                </span>
                <span className="text-[11px] text-[#5A5A40] font-bold">Autoridade Máxima Assistencial</span>
              </div>
              <h4 className="font-bold text-sm text-[#2D2D2A]">Prerrogativas da Diretoria</h4>
              <ul className="text-xs text-[#7D7D72] space-y-1.5 list-disc pl-4">
                <li>Triagem e deliberação prioritária na Fila Central DENF.</li>
                <li>Autorização e homologação de remanejamentos inter-setoriais e contratações extras.</li>
                <li>Acionamento de sobreaviso, banco de horas e planos de contingência institucional.</li>
                <li>Acesso pleno aos relatórios de dimensionamento, rankings e indicadores de absenteísmo.</li>
              </ul>
              <div className="pt-2 border-t border-[#E8E6D9] text-[11px] text-[#5A5A40] font-bold">
                ⭐ Responsabilidade Técnica (RT) perante o Conselho Regional de Enfermagem (COREN).
              </div>
            </div>

            {/* Card 4: Administrador de TI & Governança */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#2D2D2A]/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2D2D2A] text-white uppercase">
                  4. Administrador de TI & Governança
                </span>
                <span className="text-[11px] text-[#7D7D72]">Sustentação Tecnológica</span>
              </div>
              <h4 className="font-bold text-sm text-[#2D2D2A]">Prerrogativas do Administrador</h4>
              <ul className="text-xs text-[#7D7D72] space-y-1.5 list-disc pl-4">
                <li>Gestão de contas, ativação/inativação de usuários e auditoria de acessos.</li>
                <li>Parametrização dos prazos de SLA (crítico, alto, tolerância).</li>
                <li>Manutenção do catálogo de setores, leitos e categorias profissionais.</li>
                <li>Sincronização de base de dados, logs de auditoria técnica e integridade.</li>
              </ul>
              <div className="pt-2 border-t border-[#E8E6D9] text-[11px] text-rose-700 font-bold">
                ⛔ Proibição Estrita: O Administrador NÃO toma decisões de alocação clínica assistencial.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SLA & PRAZOS CLÍNICOS */}
      {activeTab === 'slas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-6 space-y-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#2D2D2A]">
                Prazos de Resposta Preconizados (SLA Clínico)
              </h3>
              <p className="text-xs text-[#7D7D72] mt-0.5">
                Definição do tempo máximo para triagem e deliberação da Diretoria de Enfermagem para cada nível de criticidade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl space-y-2">
                <label className="font-bold text-[#9E5A4E] block">
                  SLA Criticidade Crítica (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.alertTimes.criticalAnalysisMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertTimes: {
                        ...formData.alertTimes,
                        criticalAnalysisMinutes: parseInt(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] font-bold text-sm bg-white"
                />
                <span className="text-[11px] text-[#7D7D72] block">
                  Padrão atual: 10 minutos (UTI e Emergência)
                </span>
              </div>

              <div className="p-4 bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl space-y-2">
                <label className="font-bold text-[#D1A661] block">
                  SLA Criticidade Alta (minutos)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={formData.alertTimes.highAnalysisMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertTimes: {
                        ...formData.alertTimes,
                        highAnalysisMinutes: parseInt(e.target.value) || 20,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] font-bold text-sm bg-white"
                />
                <span className="text-[11px] text-[#7D7D72] block">
                  Padrão atual: 20 minutos (Unidades de Internação)
                </span>
              </div>

              <div className="p-4 bg-[#F9F7F2] border border-[#E8E6D9] rounded-xl space-y-2">
                <label className="font-bold text-[#7D7D72] block">
                  Tolerância para Alerta de Atraso (minutos)
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={formData.alertTimes.overdueAnalysisMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertTimes: {
                        ...formData.alertTimes,
                        overdueAnalysisMinutes: parseInt(e.target.value) || 45,
                      },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-[#E8E6D9] font-bold text-sm bg-white"
                />
                <span className="text-[11px] text-[#7D7D72] block">
                  Padrão atual: 45 minutos para acionamento
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETORES & CATEGORIAS */}
      {activeTab === 'catalogs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Setores */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 space-y-3">
            <h3 className="font-bold text-sm text-[#2D2D2A] flex items-center justify-between">
              <span>Setores Hospitalares Ativos</span>
              <span className="text-xs text-[#7D7D72]">{formData.sectors.length} setores</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Novo setor (ex: Hemodiálise)"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#E8E6D9]"
              />
              <button
                onClick={handleAddSector}
                disabled={!newSector.trim()}
                className="px-3 py-2.5 rounded-xl bg-[#5A5A40] text-white font-bold disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 max-h-60 overflow-y-auto">
              {formData.sectors.map((sector) => (
                <span
                  key={sector}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] text-[#2D2D2A] font-medium"
                >
                  <span>{sector}</span>
                  <button
                    onClick={() => handleRemoveSector(sector)}
                    className="text-[#8E8E80] hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Categorias Profissionais */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#E8E6D9] p-5 space-y-3">
            <h3 className="font-bold text-sm text-[#2D2D2A] flex items-center justify-between">
              <span>Categorias Profissionais de Enfermagem</span>
              <span className="text-xs text-[#7D7D72]">{formData.professionalCategories.length} cadastradas</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nova categoria (ex: Perfusionista)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#E8E6D9]"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
                className="px-3 py-2.5 rounded-xl bg-[#5A5A40] text-white font-bold disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.professionalCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] text-[#2D2D2A] font-medium"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-[#8E8E80] hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MANUTENÇÃO & REDEFINIÇÃO */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-rose-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-rose-900">
                  Zona de Manutenção & Sincronização da Base
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Esta operação restaura os dados de solicitações, remanejamentos, registros de acompanhamento e usuários para o estado de homologação original do hospital.
                </p>
              </div>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                Base de dados redefinida com sucesso!
              </div>
            )}

            <div className="pt-3 border-t border-rose-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#7D7D72]">
                Chaves ativas: hospital_deficit_requests_v5, hospital_deficit_users_v5
              </span>
              <button
                id="btn-reset-demo-data"
                onClick={handleResetWithFeedback}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Base de Homologação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
