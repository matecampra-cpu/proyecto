/**
 * COMPONENTE: MODAL DE SOLICITUD DE TURNO ONLINE (SolicitarTurnoModal.jsx)
 * ------------------------------------------------------------------------
 * Permite a cualquier cliente reservar un turno de servicio sin necesidad
 * de registrarse o recordar contraseñas.
 * 
 * Flujo funcional:
 * 1. El cliente completa sus datos personales, del vehículo y servicio deseado.
 * 2. El sistema valida los campos mínimos requeridos (nombre, teléfono, patente, fecha).
 * 3. Se genera un código correlativo único (ej: TRN-1003).
 * 4. Se guarda en la colección 'turnos' del DataManager con estado 'Pendiente'.
 * 5. Se presenta una pantalla de confirmación con la opción de notificar de inmediato
 *    al taller por WhatsApp con los datos ya formateados.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Phone, 
  Mail, 
  Wrench, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight 
} from 'lucide-react';
import { dataManager } from '../../firebase';

// Lista de servicios habituales ofrecidos por el taller
const SERVICIOS_DISPONIBLES = [
  'Service Periódico (Aceite y Filtros)',
  'Frenos (Pastillas / Discos / Líquido)',
  'Diagnóstico Computarizado / Check Engine',
  'Distribución y Bomba de Agua',
  'Tren Delantero y Suspensión',
  'Embrague y Transmisión',
  'Electricidad y Baterías',
  'Alineación y Balanceo',
  'Revisión General Pre-Viaje / ITV',
  'Otro Servicio / Reparación Específica'
];

export default function SolicitarTurnoModal({ isOpen, onClose }) {
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    patente: '',
    vehiculo_modelo: '',
    anio: '',
    servicio_solicitado: SERVICIOS_DISPONIBLES[0],
    fecha_solicitada: '',
    franja_horaria: 'Mañana (08:30 - 12:30)',
    motivo_detalle: ''
  });

  // Estado de procesamiento y pantalla de éxito
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnoGenerado, setTurnoGenerado] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Si el modal no está activo, no renderiza nada en el DOM
  if (!isOpen) return null;

  /**
   * Controlador de cambios en los inputs del formulario
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // Forzar mayúsculas en la patente para consistencia técnica
      [name]: name === 'patente' ? value.toUpperCase().replace(/\s+/g, '') : value
    }));
  };

  /**
   * Envío y procesamiento de la solicitud de turno
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validaciones mínimas de integridad
    if (!formData.cliente_nombre.trim() || formData.cliente_nombre.trim().length < 3) {
      setErrorMsg('Por favor ingrese su nombre y apellido completo.');
      return;
    }
    if (!formData.cliente_telefono.trim() || formData.cliente_telefono.trim().length < 8) {
      setErrorMsg('Por favor ingrese un número de teléfono / WhatsApp de contacto válido.');
      return;
    }
    if (!formData.patente.trim() || formData.patente.trim().length < 6) {
      setErrorMsg('Por favor ingrese una patente válida (ej: AA123BB o AB123CD).');
      return;
    }
    if (!formData.vehiculo_modelo.trim()) {
      setErrorMsg('Por favor indique la marca y modelo del vehículo (ej: Toyota Corolla).');
      return;
    }
    if (!formData.fecha_solicitada) {
      setErrorMsg('Por favor seleccione la fecha deseada para el turno.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Obtener la lista actual de turnos para calcular el correlativo de forma segura
      const turnosActuales = dataManager.getLocal('turnos');
      const safeTurnos = Array.isArray(turnosActuales) ? turnosActuales : [];
      const nuevoNumero = 1000 + safeTurnos.length + 1;
      const codigoAsignado = `TRN-${nuevoNumero}`;

      // 2. Estructurar el objeto del turno
      const nuevoTurno = {
        codigo: codigoAsignado,
        cliente_nombre: formData.cliente_nombre.trim(),
        cliente_telefono: formData.cliente_telefono.trim(),
        cliente_email: (formData.cliente_email || '').trim(),
        patente: formData.patente.trim().toUpperCase(),
        vehiculo_modelo: formData.vehiculo_modelo.trim(),
        anio: formData.anio ? parseInt(formData.anio, 10) : '',
        servicio_solicitado: formData.servicio_solicitado || SERVICIOS_DISPONIBLES[0],
        fecha_solicitada: formData.fecha_solicitada,
        franja_horaria: formData.franja_horaria || 'Mañana (08:30 - 12:30)',
        motivo_detalle: (formData.motivo_detalle || '').trim(),
        estado: 'Pendiente', // Estados: Pendiente, Confirmado, En Proceso, Completado, Cancelado
        fecha_creacion: new Date().toLocaleString('es-AR')
      };

      // 3. Guardar en el DataManager (Firestore y LocalStorage)
      const turnoGuardado = await dataManager.add('turnos', nuevoTurno);

      // 4. Mostrar vista de confirmación al usuario
      setTurnoGenerado(turnoGuardado || nuevoTurno);
    } catch (err) {
      console.error('Error al registrar turno:', err);
      setErrorMsg('Ocurrió un inconveniente al registrar su solicitud. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Genera el enlace dinámico de WhatsApp para notificar directamente al taller
   */
  const handleAbrirWhatsApp = () => {
    if (!turnoGenerado) return;
    const configTaller = dataManager.getConfig();
    const telefonoTaller = (configTaller?.telefono || '5491112345678').replace(/[^0-9]/g, '');
    
    // Mensaje preformateado y limpio
    const mensaje = `Hola! Acabo de solicitar un turno online para mi vehiculo con los siguientes datos:\n\n` +
      `*Codigo de Turno:* ${turnoGenerado.codigo}\n` +
      `*Cliente:* ${turnoGenerado.cliente_nombre}\n` +
      `*Vehiculo:* ${turnoGenerado.vehiculo_modelo} (Patente: ${turnoGenerado.patente})\n` +
      `*Servicio:* ${turnoGenerado.servicio_solicitado}\n` +
      `*Fecha solicitada:* ${turnoGenerado.fecha_solicitada} - ${turnoGenerado.franja_horaria}\n\n` +
      `Quedo a la espera de su confirmacion. Muchas gracias!`;

    const url = `https://wa.me/${telefonoTaller}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  /**
   * Reinicia el formulario para agendar otro turno o cerrar
   */
  const handleReiniciar = () => {
    setTurnoGenerado(null);
    setFormData({
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_email: '',
      patente: '',
      vehiculo_modelo: '',
      anio: '',
      servicio_solicitado: SERVICIOS_DISPONIBLES[0],
      fecha_solicitada: '',
      franja_horaria: 'Mañana (08:30 - 12:30)',
      motivo_detalle: ''
    });
    onClose();
  };

  // Fecha mínima permitida calculada en base a la zona horaria local del navegador (evita desfases UTC)
  const fechaHoyLocal = new Date();
  const fechaMinima = `${fechaHoyLocal.getFullYear()}-${String(fechaHoyLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaHoyLocal.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-8"
      >
        {/* Botón de cierre en la esquina superior derecha */}
        <button 
          onClick={handleReiniciar}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ------------------------------------------------------------------ */}
        {/* VISTA 1: CONFIRMACIÓN DE TURNO GENERADO EXITOSAMENTE               */}
        {/* ------------------------------------------------------------------ */}
        {turnoGenerado ? (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">Solicitud Recibida</span>
              <h2 className="text-2xl font-black text-white">Turno Agendado con Exito</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hemos registrado su solicitud en nuestro sistema. El equipo del taller revisará la disponibilidad para confirmar su cita.
              </p>
            </div>

            {/* Ficha resumen del turno */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">Código de Turno:</span>
                <span className="text-sm font-black text-rose-400 font-mono tracking-wider">{turnoGenerado.codigo}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Titular:</span>
                  <span className="text-slate-200 font-medium">{turnoGenerado.cliente_nombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehículo / Patente:</span>
                  <span className="text-slate-200 font-medium">{turnoGenerado.vehiculo_modelo} ({turnoGenerado.patente})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha Solicitada:</span>
                  <span className="text-slate-200 font-medium">{turnoGenerado.fecha_solicitada}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Franja Horaria:</span>
                  <span className="text-slate-200 font-medium">{turnoGenerado.franja_horaria}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[11px]">Servicio Solicitado:</span>
                <span className="text-xs text-slate-200 font-semibold">{turnoGenerado.servicio_solicitado}</span>
              </div>
            </div>

            {/* Acciones directas post-solicitud */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={handleAbrirWhatsApp}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notificar por WhatsApp al Taller</span>
              </button>

              <button
                type="button"
                onClick={handleReiniciar}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Finalizar y Salir
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------ */
          /* VISTA 2: FORMULARIO DE SOLICITUD DE TURNO                          */
          /* ------------------------------------------------------------------ */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cabecera del modal */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Solicitar Turno Online</h2>
                <p className="text-xs text-slate-400">Complete los datos de su vehículo para agendar una cita en el taller.</p>
              </div>
            </div>

            {/* Mensaje de error si falla la validación */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>1. Datos de Contacto</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    name="cliente_nombre"
                    value={formData.cliente_nombre}
                    onChange={handleChange}
                    placeholder="ej: Lucas Martínez"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    name="cliente_telefono"
                    value={formData.cliente_telefono}
                    onChange={handleChange}
                    placeholder="ej: 11 5544-3322"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Correo Electrónico (opcional)</label>
                  <input
                    type="email"
                    name="cliente_email"
                    value={formData.cliente_email}
                    onChange={handleChange}
                    placeholder="lucas@correo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL VEHÍCULO */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>2. Datos del Vehículo</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Patente / Dominio *</label>
                  <input
                    type="text"
                    name="patente"
                    value={formData.patente}
                    onChange={handleChange}
                    placeholder="ej: AF123ZZ o AC456XX"
                    required
                    maxLength={9}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marca y Modelo *</label>
                  <input
                    type="text"
                    name="vehiculo_modelo"
                    value={formData.vehiculo_modelo}
                    onChange={handleChange}
                    placeholder="ej: Ford Focus 2.0"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Año (Aproximado)</label>
                  <input
                    type="number"
                    name="anio"
                    value={formData.anio}
                    onChange={handleChange}
                    placeholder="ej: 2018"
                    min={1980}
                    max={2030}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: SERVICIO Y FECHA DESEADA */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Preferencia de Fecha y Tipo de Servicio</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Servicio Solicitado *</label>
                  <select
                    name="servicio_solicitado"
                    value={formData.servicio_solicitado}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {SERVICIOS_DISPONIBLES.map((servicio, idx) => (
                      <option key={idx} value={servicio} className="bg-slate-900 text-white">
                        {servicio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fecha Sugerida *</label>
                  <input
                    type="date"
                    name="fecha_solicitada"
                    value={formData.fecha_solicitada}
                    onChange={handleChange}
                    min={fechaMinima}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Franja Horaria *</label>
                  <select
                    name="franja_horaria"
                    value={formData.franja_horaria}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Mañana (08:30 - 12:30)" className="bg-slate-900 text-white">Mañana (08:30 - 12:30)</option>
                    <option value="Tarde (14:00 - 18:30)" className="bg-slate-900 text-white">Tarde (14:00 - 18:30)</option>
                    <option value="Día Completo / A convenir" className="bg-slate-900 text-white">Día Completo / A convenir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Descripción de fallas, síntomas o notas adicionales
                </label>
                <textarea
                  name="motivo_detalle"
                  value={formData.motivo_detalle}
                  onChange={handleChange}
                  rows={2}
                  placeholder="ej: Siento una vibración al frenar a más de 80 km/h y hace ruido en empedrado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            {/* Botones de acción del formulario */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                    <span>Procesando solicitud...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Solicitud de Turno</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
