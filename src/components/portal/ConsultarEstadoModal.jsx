/**
 * COMPONENTE: MODAL DE CONSULTA DE ESTADO DE VEHÍCULO (ConsultarEstadoModal.jsx)
 * -------------------------------------------------------------------------------
 * Permite a los clientes conocer en tiempo real la situación operativa de su
 * vehículo ingresando únicamente la Patente o el Número de Orden de Trabajo (OT).
 * 
 * Capacidades:
 * 1. Búsqueda reactiva contra las colecciones 'ordenes' y 'turnos'.
 * 2. Visualizador de barra de progreso con etapas estandarizadas:
 *    - Recepción -> Diagnóstico -> En Reparación -> Listo para Entrega -> Entregado.
 * 3. Transparencia técnica: Muestra diagnóstico del mecánico y estado del vehículo.
 * 4. Transparencia económica: Informa saldo pendiente o cancelación total.
 * 5. Canal directo a WhatsApp para resolver dudas sobre la orden consultada.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Search, 
  Car, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  DollarSign, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { dataManager } from '../../firebase';

// Definición de las 4 etapas principales de seguimiento de una orden
const ETAPAS_ORDEN = [
  { clave: 'Ingresado', etiqueta: '1. Recepción', desc: 'Vehículo recibido en taller' },
  { clave: 'En Diagnóstico', etiqueta: '2. Diagnóstico', desc: 'Evaluación técnica inicial' },
  { clave: 'En Reparación', etiqueta: '3. En Reparación', desc: 'Trabajos mecánicos en curso' },
  { clave: 'Listo para Entrega', etiqueta: '4. Listo para Retirar', desc: 'Trabajo finalizado y probado' }
];

export default function ConsultarEstadoModal({ isOpen, onClose }) {
  // Parámetro de búsqueda ingresado por el cliente
  const [criterioBusqueda, setCriterioBusqueda] = useState('');
  
  // Resultados encontrados
  const [ordenEncontrada, setOrdenEncontrada] = useState(null);
  const [turnoEncontrado, setTurnoEncontrado] = useState(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  /**
   * Ejecuta la búsqueda en las órdenes activas y turnos registrados
   */
  const handleBuscar = (e) => {
    e.preventDefault();
    const query = criterioBusqueda.trim().toUpperCase().replace(/\s+/g, '');
    if (!query) return;

    setCargando(true);
    setBusquedaRealizada(true);

    try {
      // 1. Consultar órdenes de trabajo
      const ordenesRaw = dataManager.getLocal('ordenes');
      const todasLasOrdenes = Array.isArray(ordenesRaw) ? ordenesRaw : [];
      const ordenMatch = todasLasOrdenes.find(o => 
        (o.patente && o.patente.toUpperCase().replace(/\s+/g, '') === query) ||
        (o.numero_orden && o.numero_orden.toUpperCase().replace(/\s+/g, '') === query)
      );

      // 2. Si no hay orden, o para complementar, consultar si tiene turno agendado
      const turnosRaw = dataManager.getLocal('turnos');
      const todosLosTurnos = Array.isArray(turnosRaw) ? turnosRaw : [];
      const turnoMatch = todosLosTurnos.find(t => 
        (t.patente && t.patente.toUpperCase().replace(/\s+/g, '') === query) ||
        (t.codigo && t.codigo.toUpperCase().replace(/\s+/g, '') === query)
      );

      setOrdenEncontrada(ordenMatch || null);
      setTurnoEncontrado(turnoMatch || null);
    } catch (err) {
      console.error('Error al consultar estado:', err);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Determina el índice de avance de la orden según su estado
   */
  const obtenerIndiceEtapa = (estado) => {
    switch (estado) {
      case 'Ingresado': return 0;
      case 'En Diagnóstico': return 1;
      case 'Esperando Repuestos': 
      case 'En Reparación': return 2;
      case 'Listo para Entrega': 
      case 'Entregado': return 3;
      default: return 0;
    }
  };

  /**
   * Redirección a WhatsApp para consultar sobre la orden específica
   */
  const handleConsultarWhatsApp = () => {
    const configTaller = dataManager.getConfig();
    const telefonoTaller = (configTaller?.telefono || '5491112345678').replace(/[^0-9]/g, '');
    
    let mensaje = '';
    if (ordenEncontrada) {
      mensaje = `Hola! Quería consultar sobre el avance de mi vehículo con patente *${ordenEncontrada.patente}* (Orden: *${ordenEncontrada.numero_orden}*). Muchas gracias!`;
    } else if (turnoEncontrado) {
      mensaje = `Hola! Quería consultar sobre mi turno con código *${turnoEncontrado.codigo}* para la patente *${turnoEncontrado.patente}*. Muchas gracias!`;
    } else {
      mensaje = `Hola! Quería consultar sobre el estado de mi vehículo con patente *${criterioBusqueda.toUpperCase()}*. Muchas gracias!`;
    }

    const url = `https://wa.me/${telefonoTaller}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const indiceActual = ordenEncontrada ? obtenerIndiceEtapa(ordenEncontrada.estado) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-8"
      >
        {/* Botón de cierre */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del modal */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Estado de mi Vehículo</h2>
            <p className="text-xs text-slate-400">Ingrese su patente o número de orden para consultar el avance en tiempo real.</p>
          </div>
        </div>

        {/* Formulario de búsqueda rápida */}
        <form onSubmit={handleBuscar} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Car className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={criterioBusqueda}
                onChange={(e) => setCriterioBusqueda(e.target.value.toUpperCase())}
                placeholder="Ingrese Patente (ej: AE123CD) o Nro de Orden (OT-0001)"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>Consultar</span>
            </button>
          </div>
        </form>

        {/* ------------------------------------------------------------------ */}
        {/* RESULTADO 1: ORDEN DE TRABAJO ACTIVA ENCONTRADA                    */}
        {/* ------------------------------------------------------------------ */}
        {ordenEncontrada && (
          <div className="space-y-6">
            {/* Cabecera de la ficha encontrada */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-rose-400 font-mono tracking-wider">{ordenEncontrada.numero_orden}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-xs font-bold text-white uppercase font-mono px-2 py-0.5 rounded bg-slate-800">
                    {ordenEncontrada.patente}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {ordenEncontrada.vehiculo_modelo || `${ordenEncontrada.marca || ''} ${ordenEncontrada.modelo || ''}`}
                </h3>
                <p className="text-[11px] text-slate-400">Titular: {ordenEncontrada.cliente_nombre}</p>
              </div>

              {/* Insignia de estado */}
              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
                  Estado Actual
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  ordenEncontrada.estado === 'Listo para Entrega' || ordenEncontrada.estado === 'Entregado'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : ordenEncontrada.estado === 'Esperando Repuestos'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {ordenEncontrada.estado}
                </span>
              </div>
            </div>

            {/* Barra de progreso visual de etapas */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Progreso del Servicio
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ETAPAS_ORDEN.map((etapa, idx) => {
                  const completada = idx <= indiceActual;
                  const actual = idx === indiceActual;
                  return (
                    <div 
                      key={etapa.clave}
                      className={`p-2.5 rounded-xl border transition-all text-center ${
                        actual 
                          ? 'bg-rose-950/50 border-rose-800/40 text-rose-300' 
                          : completada 
                          ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      <div className="flex justify-center mb-1">
                        {completada ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold block truncate">{etapa.etiqueta}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ficha técnica resumida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-rose-400" />
                  <span>Motivo de Ingreso & Diagnóstico</span>
                </span>
                <p className="text-slate-300 text-xs">
                  {ordenEncontrada.motivo_ingreso || 'Revisión mecánica general.'}
                </p>
                {ordenEncontrada.diagnostico && (
                  <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                    <strong>Informe técnico:</strong> {ordenEncontrada.diagnostico}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Estado de Cuenta</span>
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Presupuestado:</span>
                    <span className="text-white font-medium">${(ordenEncontrada.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Abonado / Seña:</span>
                    <span className="text-emerald-400 font-medium">${(ordenEncontrada.total_pagado || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                    <span className="text-slate-300">Saldo a Abonar:</span>
                    <span className={ordenEncontrada.saldo_pendiente > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      ${(ordenEncontrada.saldo_pendiente || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acción de contacto por WhatsApp */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleConsultarWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consultar Dudas por WhatsApp con el Taller</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* RESULTADO 2: SE ENCONTRÓ UN TURNO AGENDADO (SIN OT ACTIVA AÚN)    */}
        {/* ------------------------------------------------------------------ */}
        {!ordenEncontrada && turnoEncontrado && (
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Calendar className="w-5 h-5" />
              <h3 className="text-sm font-bold">Turno Agendado Registrado</h3>
            </div>
            
            <p className="text-xs text-slate-300">
              Su vehículo aún no ha ingresado al taller para reparación activa, pero cuenta con un turno registrado:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Código:</span>
                <span className="text-rose-400 font-mono font-bold">{turnoEncontrado.codigo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estado del Turno:</span>
                <span className="text-emerald-400 font-semibold">{turnoEncontrado.estado}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha Solicitada:</span>
                <span className="text-slate-200">{turnoEncontrado.fecha_solicitada} ({turnoEncontrado.franja_horaria})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Servicio:</span>
                <span className="text-slate-200 font-medium">{turnoEncontrado.servicio_solicitado}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleConsultarWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Confirmar Turno por WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* RESULTADO 3: NADA ENCONTRADO                                       */}
        {/* ------------------------------------------------------------------ */}
        {busquedaRealizada && !ordenEncontrada && !turnoEncontrado && !cargando && (
          <div className="text-center py-6 space-y-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No se encontraron registros activos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No figura ninguna orden en curso ni turno pendiente para el valor ingresado ({criterioBusqueda}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleConsultarWhatsApp}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contactar al Taller por WhatsApp</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
