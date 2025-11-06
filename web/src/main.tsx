import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {ItemDefinitionsProvider} from "./context/ItemDefinitionsContext";
import {TooltipProvider} from "./context/TooltipContext";
import {DndProvider} from "react-dnd"
import {HTML5Backend} from 'react-dnd-html5-backend';
import {ContextMenuProvider} from "./context/ContextMenuContext";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
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
