import React, { useState } from 'react';
import { DeficitRequest, User } from '../types';
import { RequestStatusBadge, CriticalityBadge, ClassificationBadge } from './StatusBadge';
import { PriorityScoreBadge } from './PriorityBadge';
import {
  Building,
  Clock,
  UserCheck,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Stethoscope,
} from 'lucide-react';

interface MobileProtocolCardProps {
  request: DeficitRequest;
  currentUser: User;
  onSelectRequest: (req: DeficitRequest) => void;
  onOpenDecisionModal?: (req: DeficitRequest) => void;
  onOpenArrivalModal?: (req: DeficitRequest) => void;
  onOpenClosureModal?: (req: DeficitRequest) => void;
  onOpenCancelModal?: (req: DeficitRequest) => void;
  onOpenImpactModal?: (req: DeficitRequest) => void;
  isQueueView?: boolean;
}

export const MobileProtocolCard: React.FC<MobileProtocolCardProps> = ({
  request,
  currentUser,
  onSelectRequest,
  onOpenDecisionModal,
  onOpenArrivalModal,
  onOpenClosureModal,
  onOpenCancelModal,
  onOpenImpactModal,
  isQueueView = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyProtocol = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(request.protocol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCritical = request.criticality === 'critica';
  const isEmergency = request.classification === 'emergencial';
  const hasSecurityRisk = request.impactAssessment?.patientSafetyRisk;
  const isPendingDecision =
    request.status === 'aberta' ||
    request.status === 'aguardando_analise' ||
    request.status === 'em_analise_denf';

  const canDeliberate =
    (currentUser.role === 'denf' || currentUser.role === 'coordenador') &&
    onOpenDecisionModal;

  const canAudit = currentUser.role === 'admin' && onSelectRequest;

  const hasRelocationInProgress =
    request.relocations.some((r) => r.status === 'em_deslocamento') &&
    onOpenArrivalModal;

  const canCancel =
    currentUser.role === 'solicitante' &&
    request.solicitorName === currentUser.name &&
    request.status === 'aberta' &&
    onOpenCancelModal;

  return (
    <div
      id={`mobile-protocol-card-${request.id}`}
      className={`bg-white rounded-2xl p-4 shadow-xs border transition-all space-y-3.5 ${
        isCritical
          ? 'border-rose-300 bg-gradient-to-br from-rose-50/20 to-white'
          : isEmergency
          ? 'border-amber-300 bg-gradient-to-br from-amber-50/15 to-white'
          : 'border-[#E8E6D9] hover:border-[#8C9C82]'
      }`}
    >
      {/* Header: Protocol Tag + Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E8E6D9]/70 pb-2.5">
        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopyProtocol}
              title="Copiar Protocolo"
              className="font-mono font-black text-xs sm:text-sm text-[#2D2D2A] bg-[#F9F7F2] border border-[#E8E6D9] px-2 py-0.5 rounded-lg flex items-center gap-1 hover:bg-[#E8E6D9] transition-colors shrink-0"
            >
              <span>{request.protocol}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-[#7D7D72]" />
              )}
            </button>
            {request.criticality === 'critica' && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white tracking-wider animate-pulse whitespace-nowrap shrink-0">
                Crítico
              </span>
            )}
            {request.classification === 'emergencial' && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-600 text-white tracking-wider whitespace-nowrap shrink-0">
                Emergencial
              </span>
            )}
          </div>
          <div className="sm:hidden shrink-0">
            <PriorityScoreBadge
              level={request.priorityLevel}
              score={request.priorityScore}
            />
          </div>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-[11px] text-[#7D7D72] shrink-0">
            <Clock className="w-3 h-3 text-[#8C9C82] shrink-0" />
            <span className="whitespace-nowrap">
              {request.requestDate} às {request.requestTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <RequestStatusBadge status={request.status} />
            <div className="hidden sm:block shrink-0">
              <PriorityScoreBadge
                level={request.priorityLevel}
                score={request.priorityScore}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Clinical Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Sector & Solicitor */}
        <div className="p-2.5 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#7D7D72]">
            <Building className="w-3 h-3 text-[#5A5A40] shrink-0" />
            <span>Setor Solicitante</span>
          </div>
          <p className="font-bold text-xs text-[#2D2D2A] break-words">
            {request.solicitorSector}
          </p>
          <p className="text-[11px] text-[#7D7D72] break-words">
            Por: <span className="font-semibold text-[#2D2D2A]">{request.solicitorName}</span>
          </p>
        </div>

        {/* Deficit Category & Shift */}
        <div className="p-2.5 rounded-xl bg-[#F9F7F2] border border-[#E8E6D9] space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#7D7D72]">
            <Stethoscope className="w-3 h-3 text-[#5A5A40] shrink-0" />
            <span>Déficit Clínico</span>
          </div>
          <p className="font-bold text-xs text-[#2D2D2A] break-words">
            {request.absentQuantity}x {request.absentCategory}
          </p>
          <p className="text-[11px] text-[#7D7D72] break-words">
            Plantão: <strong>{request.affectedShift}</strong> ({request.deficitStartTime})
          </p>
        </div>
      </div>

      {/* Cause and Relocation Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="px-2 py-1 rounded-lg bg-[#E8E6D9]/60 text-[#5A5A40] font-medium break-words">
          Motivo: <strong className="capitalize">{request.absenceReason.replace('_', ' ')}</strong>
        </span>

        {request.needsRelocation ? (
          <span className="px-2 py-1 rounded-lg bg-[#D1A661]/20 text-[#7A581E] font-bold border border-[#D1A661]/40 flex items-center gap-1 break-words">
            <ArrowRightLeft className="w-3 h-3 text-[#BA8F4D] shrink-0" />
            <span>Remanejamento Solicitado ({request.requestedRelocationQuantity || request.absentQuantity})</span>
          </span>
        ) : (
          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1 whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Solução Interna</span>
          </span>
        )}

        {hasSecurityRisk && (
          <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold border border-rose-300 flex items-center gap-1 whitespace-nowrap shrink-0">
            <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Risco Assistencial</span>
          </span>
        )}
      </div>

      {/* Mobile-Adapted Action Buttons (Touch Target >= 44px) */}
      <div className="pt-2 border-t border-[#E8E6D9] flex flex-wrap items-center gap-2">
        {/* Primary View Details Button */}
        <button
          onClick={() => onSelectRequest(request)}
          className="flex-1 min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-[#F9F7F2] hover:bg-[#E8E6D9] text-[#2D2D2A] border border-[#E8E6D9] flex items-center justify-center gap-1.5 transition-colors active:scale-98"
        >
          <Eye className="w-4 h-4 text-[#5A5A40]" />
          <span>Ver Protocolo</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#7D7D72] ml-auto" />
        </button>

        {/* Role-Specific Actions */}
        {canDeliberate && isPendingDecision && (
          <button
            onClick={() => onOpenDecisionModal!(request)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A35] text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
          >
            <UserCheck className="w-4 h-4 text-[#D1A661]" />
            <span>{currentUser.role === 'denf' ? 'Deliberar' : 'Parecer'}</span>
          </button>
        )}

        {hasRelocationInProgress && (
          <button
            onClick={() => onOpenArrivalModal!(request)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Chegada</span>
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => onOpenCancelModal!(request)}
            className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
