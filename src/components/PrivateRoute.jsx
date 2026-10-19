/**
 * PROTECTOR DE RUTAS PRIVADAS (PrivateRoute.jsx)
 * ---------------------------------------------
 * Componente guardián que evalúa si hay un usuario autenticado.
 * - Si está autenticado, renderiza las vistas hijas mediante `<Outlet />`.
 * - Si no está autenticado, redirige inmediatamente a la pantalla `/login`.
 * - Mientras verifica la sesión, muestra un spinner animado.
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Estado de carga mientras se verifica el usuario
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0407] text-rose-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Redirección segura si no hay sesión iniciada
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

