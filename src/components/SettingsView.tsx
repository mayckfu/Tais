import React, { useState } from 'react';
import { SystemSettings, User } from '../types';
import { Settings, Save, RotateCcw, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: User;
  onSaveSettings: (updatedSettings: SystemSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSaveSettings,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [newSector, setNewSector] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const isDENFOrAdmin =
    currentUser.role === 'denf' || currentUser.role === 'admin' || currentUser.role === 'coordenador';

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

  return (
    <div id="settings-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Parametrização Institucional
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Configurações do Sistema</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastros de setores, categorias, pesos do algoritmo de priorização e parâmetros hospitalares.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-100 text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Demo</span>
          </button>
          {isDENFOrAdmin && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Parâmetros</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-lg flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas e aplicadas com sucesso!</span>
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Setores */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
            Setores Hospitalares Ativos ({formData.sectors.length})
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Novo setor (ex: Hemodinâmica)"
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-300"
              disabled={!isDENFOrAdmin}
            />
            <button
              onClick={handleAddSector}
              disabled={!isDENFOrAdmin || !newSector.trim()}
              className="px-3 py-2 rounded-lg bg-teal-600 text-white font-bold disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.sectors.map((sec) => (
              <span
                key={sec}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium"
              >
                <span>{sec}</span>
                {isDENFOrAdmin && (
                  <button
                    onClick={() => handleRemoveSector(sec)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Categorias Profissionais */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
          <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
            Categorias Profissionais ({formData.professionalCategories.length})
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-300"
              disabled={!isDENFOrAdmin}
            />
            <button
              onClick={handleAddCategory}
              disabled={!isDENFOrAdmin || !newCategory.trim()}
              className="px-3 py-2 rounded-lg bg-teal-600 text-white font-bold disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {formData.professionalCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium"
              >
                <span>{cat}</span>
                {isDENFOrAdmin && (
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Regras de Validação & Alertas */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3 col-span-full">
          <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">
            Regras de Alerta & Prevenção de Duplicidade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-700 block">Janela de Bloqueio por Duplicidade</span>
              <p className="text-[11px] text-slate-500">
                Impede que o mesmo setor registre pedidos repetidos para a mesma categoria e plantão num raio de 12 horas.
              </p>
              <span className="font-bold text-teal-800 block mt-1">12 horas ativas</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-700 block">Pesos do Score de Prioridade</span>
              <p className="text-[11px] text-slate-500">
                Crítica: 40 pts • Alta: 25 pts • Moderada: 15 pts • Baixa: 5 pts + Fatores de Risco.
              </p>
              <span className="font-bold text-teal-800 block mt-1">Algoritmo Ativo</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-700 block">Trilha de Auditoria</span>
              <p className="text-[11px] text-slate-500">
                Todas as alterações de status, aprovações de remanejamento e cancelamentos são registradas de forma imutável.
              </p>
              <span className="font-bold text-teal-800 block mt-1">Auditoria 100% Conforme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
