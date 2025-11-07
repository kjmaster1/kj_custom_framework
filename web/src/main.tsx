import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {ItemDefinitionsProvider} from "./context/ItemDefinitionsContext";
import {TooltipProvider} from "./context/TooltipContext";
import {DndProvider} from "react-dnd"
import { TouchBackend } from 'react-dnd-touch-backend';
import {ContextMenuProvider} from "./context/ContextMenuContext";

const dndOptions = {
  enableMouseEvents: true,
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DndProvider backend={TouchBackend} options={dndOptions}>
      <ContextMenuProvider>
        <TooltipProvider>
          <ItemDefinitionsProvider>
            <App/>
          </ItemDefinitionsProvider>
        </TooltipProvider>
      </ContextMenuProvider>
    </DndProvider>
  </React.StrictMode>,
);
