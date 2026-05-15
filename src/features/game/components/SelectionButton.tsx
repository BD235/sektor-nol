import React from 'react';
import { Info } from 'lucide-react';
import type { SelectionButtonProps } from '@/lib/types';

/**
 * Unified selection button used for both planet and difficulty choices.
 * Replaces the old duplicate PlanetButton/DifficultyButton components.
 */
const SelectionButton = React.memo(function SelectionButton({
  isActive,
  onClick,
  icon,
  name,
  description,
  onInfoClick,
}: SelectionButtonProps) {
  return (
    <div
      className={`flex items-center justify-between border rounded transition-all ${
        isActive
          ? 'bg-emerald-500/10 border-emerald-500'
          : 'border-emerald-900/30 hover:border-emerald-700'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 p-3 text-left flex items-center gap-3"
      >
        <div className={isActive ? 'text-emerald-500' : 'text-emerald-900'}>{icon}</div>
        <div className={isActive ? 'text-emerald-400' : 'text-emerald-900'}>
          <div className="text-xs font-bold uppercase">{name}</div>
          <div className="text-[10px] opacity-70">{description}</div>
        </div>
      </button>
      
      {onInfoClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInfoClick();
          }}
          className="p-3 text-emerald-900 hover:text-emerald-500 transition-all shrink-0 active:scale-90"
          title="Info Detail"
        >
          <Info className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

export default SelectionButton;
