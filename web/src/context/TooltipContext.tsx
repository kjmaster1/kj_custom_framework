import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ItemDefinition } from '../types';

interface TooltipCoords {
  x: number;
  y: number;
}

interface TooltipContextType {
  item: ItemDefinition | null;
  coords: TooltipCoords | null;
  showTooltip: (item: ItemDefinition, coords: TooltipCoords) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [item, setItem] = useState<ItemDefinition | null>(null);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const showTooltip = (newItem: ItemDefinition, newCoords: TooltipCoords) => {
    setItem(newItem);
    setCoords(newCoords);
  };

  const hideTooltip = () => {
    setItem(null);
    setCoords(null);
  };

  return (
    <TooltipContext.Provider value={{ item, coords, showTooltip, hideTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};
