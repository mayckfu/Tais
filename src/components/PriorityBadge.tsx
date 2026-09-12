import React from 'react';

export const PriorityScoreBadge: React.FC<{ score?: number; level: 'normal' | 'atencao' | 'alta' | 'imediata' }> = ({
  level,
}) => {
  switch (level) {
    case 'imediata':
      return (
        <span
          id="badge-priority-imediata"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#9E5A4E] text-white shadow-xs whitespace-nowrap shrink-0"
          title="Prioridade Imediata"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
          IMEDIATA
        </span>
      );
    case 'alta':
      return (
        <span
          id="badge-priority-alta"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1A661] text-[#2D2D2A] border border-[#BA8F4D] whitespace-nowrap shrink-0"
          title="Alta Prioridade"
        >
          ALTA
        </span>
      );
    case 'atencao':
      return (
        <span
          id="badge-priority-atencao"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D1A661]/20 text-[#7A581E] border border-[#D1A661]/40 whitespace-nowrap shrink-0"
          title="Atenção"
        >
          ATENÇÃO
        </span>
      );
    default:
      return (
        <span
          id="badge-priority-normal"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0EFEC] text-[#7D7D72] border border-[#E8E6D9] whitespace-nowrap shrink-0"
          title="Normal"
        >
          NORMAL
        </span>
      );
  }
};

export const PriorityBadge = PriorityScoreBadge;

