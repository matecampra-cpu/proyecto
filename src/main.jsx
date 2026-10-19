/**
 * PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN (main.jsx)
 * ----------------------------------------------------
 * Este archivo inicializa el árbol de React en el DOM del navegador.
 * Importa los estilos globales (Tailwind CSS v4) y monta el componente raíz <App />.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Monta la aplicación en el elemento HTML con id="root" asegurando modo estricto para buenas prácticas
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

