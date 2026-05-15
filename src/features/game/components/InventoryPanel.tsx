import React from 'react';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';

interface InventoryPanelProps {
  items: string[];
}

/** Displays the player's inventory with animated item entries. */
const InventoryPanel = React.memo(function InventoryPanel({ items }: InventoryPanelProps) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold opacity-70 mb-3 flex items-center gap-2">
        <Package className="w-4 h-4" /> INVENTORY
      </h2>
      <ul className="text-xs space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
        {items.length === 0 ? (
          <li className="italic opacity-50">Kosong</li>
        ) : (
          items.map((item, i) => (
            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={`${item}-${i}`}
              className="flex items-center gap-2 before:content-['>'] before:text-emerald-700"
            >
              {item}
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
});

export default InventoryPanel;
