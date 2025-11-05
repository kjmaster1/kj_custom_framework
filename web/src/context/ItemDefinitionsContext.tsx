import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ItemDefinition } from '../types';

// Define the shape of the context data
interface ItemDefinitionsContextType {
  definitions: Record<string, ItemDefinition>;
  setDefinitions: (definitions: Record<string, ItemDefinition>) => void;
}

// Create the context with a default value
const ItemDefinitionsContext = createContext<ItemDefinitionsContextType | undefined>(undefined);

// Create a "Provider" component that will wrap our App
export const ItemDefinitionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [definitions, setDefinitions] = useState<Record<string, ItemDefinition>>({});

  return (
    <ItemDefinitionsContext.Provider value={{ definitions, setDefinitions }}>
      {children}
    </ItemDefinitionsContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useItemDefinitions = () => {
  const context = useContext(ItemDefinitionsContext);
  if (context === undefined) {
    throw new Error('useItemDefinitions must be used within an ItemDefinitionsProvider');
  }
  return context;
};
