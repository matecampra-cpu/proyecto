/**
 * COMPONENTE PRINCIPAL Y ENRUTADOR (App.jsx)
 * -----------------------------------------
 * Gestiona:
 * 1. El proveedor de autenticación global (AuthProvider).
 * 2. El enrutamiento de la aplicación (React Router DOM v7).
 * 3. Las rutas públicas (Login) y privadas (Dashboard, Órdenes, etc.).
 * 4. La plantilla visual compartida (LayoutWithNavbar).
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Carga perezosa (Lazy loading) de vistas para máxima velocidad y segmentación óptima de paquetes
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Ordenes = lazy(() => import('./pages/Ordenes'));
const Turnos = lazy(() => import('./pages/Turnos'));
const OrdenNueva = lazy(() => import('./pages/OrdenNueva'));
const OrdenDetalle = lazy(() => import('./pages/OrdenDetalle'));
const OrdenImprimir = lazy(() => import('./pages/OrdenImprimir'));
const Presupuestos = lazy(() => import('./pages/Presupuestos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const ClienteDetalle = lazy(() => import('./pages/ClienteDetalle'));
const Vehiculos = lazy(() => import('./pages/Vehiculos'));
const VehiculoDetalle = lazy(() => import('./pages/VehiculoDetalle'));
const Repuestos = lazy(() => import('./pages/Repuestos'));
const Caja = lazy(() => import('./pages/Caja'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

/**
 * Indicador de transición minimalista entre rutas
 */
function RouteLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-slate-500">
      <div className="w-8 h-8 rounded-full border-2 border-rose-600/20 border-t-rose-500 animate-spin mb-3"></div>
      <span className="text-xs font-medium tracking-wide">Cargando vista...</span>
    </div>
  );
}

/**
 * Plantilla de diseño con barra lateral (Navbar persistente) y contenedor dinámico.
 * Mantiene la barra de navegación activa para evitar parpadeos o pantallas negras.
 */
function LayoutWithNavbar() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0b0407] text-slate-100">
      {/* Barra de navegación lateral (escritorio) y superior/inferior (móvil) */}
      <Navbar />
      {/* Contenedor dinámico donde se renderiza cada vista protegida */}
      <main className="flex-1 min-w-0 pb-16 md:pb-8 overflow-y-auto">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

/**
 * Configuración central de rutas y contextos globales
 */
export default function App() {
  return (
    <ErrorBoundary>
      {/* Contexto de autenticación para que cualquier componente conozca al usuario logueado */}
      <AuthProvider>
        {/* Contexto de confirmación modal profesional para sustituir confirm() nativo */}
        <ConfirmProvider>
          {/* Enrutador basado en historial del navegador */}
          <BrowserRouter>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                {/* RUTA PÚBLICA: Pantalla de inicio de sesión y portal clientes */}
                <Route path="/login" element={<Login />} />
                
                {/* RUTA LIMPIA PARA IMPRESIÓN: Formato A4 sin menús ni botones que estorben */}
                <Route path="/ordenes/:id/imprimir" element={<OrdenImprimir />} />

                {/* RUTAS DEL SISTEMA: Protegidas por sesión y envueltas en el diseño con Navbar */}
                <Route element={<PrivateRoute />}>
                  <Route element={<LayoutWithNavbar />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/ordenes" element={<Ordenes />} />
                    <Route path="/turnos" element={<Turnos />} />
                    <Route path="/ordenes/nueva" element={<OrdenNueva />} />
                    <Route path="/ordenes/:id" element={<OrdenDetalle />} />
                    <Route path="/presupuestos" element={<Presupuestos />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/:id" element={<ClienteDetalle />} />
                    <Route path="/vehiculos" element={<Vehiculos />} />
                    <Route path="/vehiculos/:id" element={<VehiculoDetalle />} />
                    <Route path="/repuestos" element={<Repuestos />} />
                    <Route path="/caja" element={<Caja />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                  </Route>
                </Route>

                {/* Redirección por defecto para cualquier ruta no encontrada */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfirmProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
