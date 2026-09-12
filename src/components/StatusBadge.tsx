import React from 'react';
import { RequestStatus, RelocationStatus, Criticality, NeedClassification } from '../types';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const RequestStatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  switch (status) {
    case 'rascunho':
      return (
        <span id="badge-status-rascunho" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0EFEC] text-[#7D7D72] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-[#8E8E80]" />
          Rascunho
        </span>
      );
    case 'enviada':
    case 'aguardando_analise':
      return (
        <span id="badge-status-aguardando" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1A661]/15 text-[#7A581E] border border-[#D1A661]/35 whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-[#BA8F4D] animate-pulse" />
          Aguardando Análise
        </span>
      );
    case 'em_analise':
      return (
        <span id="badge-status-em-analise" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#8C9C82]/20 text-[#3E4D36] border border-[#8C9C82]/40 whitespace-nowrap shrink-0">
          <Info className="w-3 h-3 text-[#5A6D50]" />
          Em Análise
        </span>
      );
    case 'aguardando_informacao':
      return (
        <span id="badge-status-aguardando-info" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8E6D9] text-[#5A5A40] border border-[#D8D6C9] whitespace-nowrap shrink-0">
          <AlertCircle className="w-3 h-3 text-[#5A5A40]" />
          Aguardando Informação
        </span>
      );
    case 'solucao_interna':
      return (
        <span id="badge-status-solucao-interna" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#8C9C82]/25 text-[#2E4228] border border-[#8C9C82]/50 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#5A6D50]" />
          Solução Interna
        </span>
      );
    case 'remanejamento_autorizado':
      return (
        <span id="badge-status-autorizado" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5A5A40] text-white border border-[#4A4A35] whitespace-nowrap shrink-0">
          <ArrowRightLeft className="w-3 h-3 text-white" />
          Remanejamento Autorizado
        </span>
      );
    case 'remanejamento_em_andamento':
      return (
        <span id="badge-status-em-andamento" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5A5A40]/15 text-[#3E3E32] border border-[#5A5A40]/30 whitespace-nowrap shrink-0">
          <RotateCcw className="w-3 h-3 text-[#5A5A40] animate-spin" />
          Remanejamento em Andamento
        </span>
      );
    case 'cobertura_parcial':
      return (
        <span id="badge-status-parcial" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1A661]/25 text-[#6B4B10] border border-[#D1A661]/50 whitespace-nowrap shrink-0">
          <AlertTriangle className="w-3 h-3 text-[#BA8F4D]" />
          Cobertura Parcial
        </span>
      );
    case 'resolvida':
      return (
        <span id="badge-status-resolvida" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#8C9C82]/30 text-[#2B3C26] border border-[#8C9C82]/60 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#3E5238]" />
          Resolvida
        </span>
      );
    case 'nao_resolvida':
      return (
        <span id="badge-status-nao-resolvida" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#9E5A4E]/20 text-[#73352B] border border-[#9E5A4E]/40 whitespace-nowrap shrink-0">
          <XCircle className="w-3 h-3 text-[#9E5A4E]" />
          Não Resolvida
        </span>
      );
    case 'encerrada':
      return (
        <span id="badge-status-encerrada" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0EFEC] text-[#55554E] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#7D7D72]" />
          Encerrada
        </span>
      );
    case 'cancelada':
      return (
        <span id="badge-status-cancelada" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0EFEC] text-[#8E8E80] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          <XCircle className="w-3 h-3 text-[#8E8E80]" />
          Cancelada
        </span>
      );
    default:
      return null;
  }
};

export const RelocationStatusBadge: React.FC<{ status: RelocationStatus }> = ({ status }) => {
  switch (status) {
    case 'aguardando_inicio':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1A661]/15 text-[#7A581E] border border-[#D1A661]/30 whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-[#BA8F4D]" />
          Aguardando Início
        </span>
      );
    case 'em_deslocamento':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8C9C82]/20 text-[#3E4D36] border border-[#8C9C82]/40 animate-pulse whitespace-nowrap shrink-0">
          <ArrowRightLeft className="w-3 h-3 text-[#5A6D50]" />
          Em Deslocamento
        </span>
      );
    case 'em_cobertura':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5A5A40] text-white border border-[#4A4A35] whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-white" />
          Em Cobertura
        </span>
      );
    case 'finalizado':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EFEC] text-[#55554E] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3 text-[#7D7D72]" />
          Finalizado
        </span>
      );
    case 'cancelado':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EFEC] text-[#8E8E80] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          <XCircle className="w-3 h-3 text-[#8E8E80]" />
          Cancelado
        </span>
      );
  }
};

export const CriticalityBadge: React.FC<{ criticality: Criticality; size?: 'sm' | 'md' }> = ({
  criticality,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  switch (criticality) {
    case 'baixa':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-[#8C9C82]/20 text-[#3E4D36] border border-[#8C9C82]/40 whitespace-nowrap shrink-0 ${padding}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#8C9C82]" />
          <span>BAIXA</span>
        </span>
      );
    case 'moderada':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-[#D1A661]/20 text-[#7A581E] border border-[#D1A661]/40 whitespace-nowrap shrink-0 ${padding}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D1A661]" />
          <span>MODERADA</span>
        </span>
      );
    case 'alta':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-[#C27E4B]/20 text-[#854519] border border-[#C27E4B]/40 whitespace-nowrap shrink-0 ${padding}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C27E4B]" />
          <span>ALTA</span>
        </span>
      );
    case 'critica':
      return (
        <span className={`inline-flex items-center gap-1.5 font-black rounded-full bg-[#9E5A4E] text-white border border-[#7D3F35] shadow-xs whitespace-nowrap shrink-0 ${padding}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>CRÍTICA</span>
        </span>
      );
  }
};

export const ClassificationBadge: React.FC<{ classification: NeedClassification }> = ({
  classification,
}) => {
  switch (classification) {
    case 'programada':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0EFEC] text-[#7D7D72] border border-[#E8E6D9] whitespace-nowrap shrink-0">
          Programada
        </span>
      );
    case 'nao_programada':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D1A661]/20 text-[#7A581E] border border-[#D1A661]/35 whitespace-nowrap shrink-0">
          Não Programada
        </span>
      );
    case 'emergencial':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#9E5A4E] text-white border border-[#7D3F35] whitespace-nowrap shrink-0">
          <AlertCircle className="w-3 h-3 text-white" />
          EMERGENCIAL
        </span>
      );
  }
};
