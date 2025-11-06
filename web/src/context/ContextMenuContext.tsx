import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ItemSlot, ItemDefinition } from '../types';

interface Coords { x: number; y: number; }

export interface ContextMenuData {
  item: ItemSlot;
  definition: ItemDefinition;
  slotNumber: number;
  inventoryId: string;
}

interface ContextMenuState {
  visible: boolean;
  position: Coords;
  data: ContextMenuData | null;
}

interface ContextMenuContextProps {
  showContextMenu: (data: ContextMenuData, position: Coords) => void;
  hideContextMenu: () => void;
  contextMenu: ContextMenuState;
}

const ContextMenuContext = createContext<ContextMenuContextProps | undefined>(undefined);

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    data: null,
  });

  const showContextMenu = (data: ContextMenuData, position: Coords) => {
    setContextMenu({ visible: true, position, data });
  };

  const hideContextMenu = () => {
    // Keep position data to prevent flicker, just hide
    setContextMenu((prev) => ({ ...prev, visible: false, data: null }));
  };

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, contextMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};
