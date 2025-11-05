import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {ItemDefinitionsProvider} from "./context/ItemDefinitionsContext";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ItemDefinitionsProvider>
      <App/>
    </ItemDefinitionsProvider>
  </React.StrictMode>,
);
