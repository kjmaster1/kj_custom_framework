import React, { createContext, useState, useContext, ReactNode } from 'react';
import {ItemDefinition, ItemSlot} from '../types';

interface TooltipCoords {
  x: number;
  y: number;
}

interface TooltipContextType {
  itemSlot: ItemSlot | null;
  item: ItemDefinition | null;
  coords: TooltipCoords | null;
  showTooltip: (itemSlot: ItemSlot, item: ItemDefinition, coords: TooltipCoords) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [itemSlot, setItemSlot] = useState<ItemSlot | null>(null);
  const [item, setItem] = useState<ItemDefinition | null>(null);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const showTooltip = (newItemSlot: ItemSlot, newItem: ItemDefinition, newCoords: TooltipCoords) => {
    setItemSlot(newItemSlot);
    setItem(newItem);
    setCoords(newCoords);
  };

  const hideTooltip = () => {
    setItemSlot(null);
    setItem(null);
    setCoords(null);
  };

  return (
    <TooltipContext.Provider value={{itemSlot, item, coords, showTooltip, hideTooltip }}>
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
