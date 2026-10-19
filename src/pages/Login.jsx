/**
 * PANTALLA PRINCIPAL DE ACCESO HÍBRIDO (Login.jsx)
 * -------------------------------------------------
 * Estructura de doble propósito orientada a:
 * 1. PORTAL CLIENTES:
 *    - Solicitud de turnos online sin registro previo.
 *    - Consulta de estado de reparación de vehículo en tiempo real por patente.
 *    - Información de horarios y canal directo a WhatsApp.
 * 2. EQUIPO DEL TALLER:
 *    - Acceso seguro para personal (Dueño/Admin y Mecánicos).
 *    - Validación criptográfica SHA-256 con salt.
 *    - Protección activa anti-fuerza bruta (bloqueo temporal con timer).
 *    - Selector rápido de perfiles autorizados para pruebas.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  Search, 
  Car, 
  Clock, 
  Phone, 
  MapPin, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataManager } from '../firebase';
import SolicitarTurnoModal from '../components/portal/SolicitarTurnoModal';
import ConsultarEstadoModal from '../components/portal/ConsultarEstadoModal';

export default function Login() {
  const navigate = useNavigate();
  const { login, getLockoutRemaining } = useAuth();
  
  // Pestaña activa: 'clientes' o 'taller'
  const [tabActiva, setTabActiva] = useState('clientes');

  // Modales interactivos del portal de clientes
  const [modalTurnoAbierto, setModalTurnoAbierto] = useState(false);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [patenteExpress, setPatenteExpress] = useState('');

  // Estados del formulario de acceso del personal
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Configuración comercial del taller (teléfono, dirección, etc.)
  const configTaller = dataManager.getConfig();

  /**
   * Monitor continuo de bloqueo anti-fuerza bruta
   */
  useEffect(() => {
    const checkLockout = () => {
      const remaining = getLockoutRemaining();
      setLockoutSeconds(remaining);
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [getLockoutRemaining]);

  /**
   * Procesamiento de inicio de sesión para el equipo del taller
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (lockoutSeconds > 0) {
      setError(`Acceso temporalmente bloqueado por seguridad. Reintente en ${lockoutSeconds} segundos.`);
      return;
    }

    if (username.trim().length < 3) {
      setError('El usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setLockoutSeconds(getLockoutRemaining());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Redirección a WhatsApp general del taller
   */
  const handleWhatsAppGeneral = () => {
    const telefono = (configTaller?.telefono || '5491112345678').replace(/[^0-9]/g, '');
    const mensaje = 'Hola! Me comunico desde la web del taller para hacer una consulta.';
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const isFormBlocked = loading || lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-[#0a0407] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-700/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* CONTENEDOR PRINCIPAL */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-[#13070d]/90 border border-rose-950/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6"
      >
        {/* CABECERA GENERAL DE LA MARCA */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-800 via-rose-700 to-rose-600 flex items-center justify-center text-white font-black mx-auto shadow-xl shadow-rose-950/60">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {configTaller?.nombre_taller || 'TallerPro Web'}
          </h1>
          <p className="text-xs text-slate-400">
            {configTaller?.lema || 'Sistema Integral de Gestión & Atención a Clientes'}
          </p>
        </div>

        {/* SELECTOR SUPERIOR DE PESTAÑAS (TABS) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/50 border border-rose-950/80">
          <button
            type="button"
            onClick={() => setTabActiva('clientes')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabActiva === 'clientes'
                ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Portal Clientes</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('taller')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tabActiva === 'taller'
                ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Equipo del Taller</span>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PESTAÑA 1: PORTAL CLIENTES                                         */}
        {/* ------------------------------------------------------------------ */}
        {tabActiva === 'clientes' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Tarjeta de Acción 1: Sacar Turno Online */}
            <div 
              onClick={() => setModalTurnoAbierto(true)}
              className="p-4 rounded-2xl bg-slate-950/70 border border-rose-950/60 hover:border-rose-600/50 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-300 group-hover:bg-rose-700 group-hover:text-white transition-all shadow-inner">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                      Solicitar Turno Online
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Elija día, franja horaria y servicio para su vehículo sin demoras.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta de Acción 2: Seguimiento de Vehículo */}
            <div 
              onClick={() => setModalEstadoAbierto(true)}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all">
                  <Search className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                      Estado de mi Reparación
                    </h3>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Consulte el avance técnico, informe de repuestos y saldo por patente.
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha de Información del Taller */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/50">
                  <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Lun a Vie: 08:00 - 18:30</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/50">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{configTaller?.direccion || 'Av. Principal 1234'}</span>
                </div>
              </div>

              {/* Botón directo de WhatsApp con el Taller */}
              <button
                type="button"
                onClick={handleWhatsAppGeneral}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-400 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>¿Dudas inmediatas? Escríbanos por WhatsApp</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PESTAÑA 2: EQUIPO DEL TALLER (ACCESO ADMINISTRATIVO Y OPERATIVO)  */}
        {/* ------------------------------------------------------------------ */}
        {tabActiva === 'taller' && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Alerta de Bloqueo por Fuerza Bruta */}
            {lockoutSeconds > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2.5 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
                <span>Acceso temporalmente bloqueado por seguridad. Reintente en <strong>{lockoutSeconds}s</strong>.</span>
              </div>
            )}

            {/* Alerta de Error de Credenciales */}
            {error && lockoutSeconds === 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Formulario de Login del Personal */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Usuario / Operador</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isFormBlocked}
                    placeholder="Ingrese su usuario"
                    autoComplete="username"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isFormBlocked}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isFormBlocked}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema de Gestión</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>

      {/* MODALES DEL PORTAL DE CLIENTES */}
      <SolicitarTurnoModal 
        isOpen={modalTurnoAbierto} 
        onClose={() => setModalTurnoAbierto(false)} 
      />

      <ConsultarEstadoModal 
        isOpen={modalEstadoAbierto} 
        onClose={() => setModalEstadoAbierto(false)} 
      />

    </div>
  );
}
