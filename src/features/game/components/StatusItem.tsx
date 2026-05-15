import React from 'react';
import { motion } from 'motion/react';
import type { StatusItemProps } from '@/lib/types';

/** Single stat bar with animated fill and critical state pulsing. */
const StatusItem = React.memo(function StatusItem({
  icon,
  label,
  value,
  isCritical,
  color = 'bg-emerald-500',
}: StatusItemProps) {
  return (
    <div className="space-y-1">
      <div
        className={`flex justify-between text-[10px] font-bold ${
          isCritical ? 'text-red-500 animate-pulse' : 'opacity-70'
        }`}
      >
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-emerald-950/50 rounded-full overflow-hidden border border-emerald-900/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${isCritical ? 'bg-red-600' : color}`}
        />
      </div>
    </div>
  );
});

export default StatusItem;
