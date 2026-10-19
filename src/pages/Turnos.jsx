/**
 * VISTA DE GESTIÓN DE TURNOS (Turnos.jsx)
 * ----------------------------------------
 * Panel interno para el equipo del taller que permite:
 * 1. Monitorear las solicitudes de turnos ingresadas online por los clientes.
 * 2. Filtrar por estado (Pendiente, Confirmado, En Proceso, Completado, Cancelado) y buscar por patente o nombre.
 * 3. Confirmar o reprogramar turnos con un clic.
 * 4. Notificar confirmaciones o recordatorios directamente por WhatsApp.
 * 5. Convertir un turno en una Orden de Trabajo (OT) real sin tener que volver a tipear los datos.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Phone, 
  Search, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ArrowRight, 
  Plus, 
  Filter, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';
import SolicitarTurnoModal from '../components/portal/SolicitarTurnoModal';

export default function Turnos() {
  const navigate = useNavigate();
  const { confirmar } = useConfirm();

  // Lista reactiva de turnos
  const [turnos, setTurnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal para agregar turnos manualmente desde la administración
  const [modalNuevoTurno, setModalNuevoTurno] = useState(false);

  /**
   * Suscripción en tiempo real a la colección de 'turnos'
   */
  useEffect(() => {
    const unsubscribe = dataManager.subscribe('turnos', (listaActualizada) => {
      setTurnos(listaActualizada || []);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Cambio rápido de estado de un turno (ej: Confirmar o Cancelar)
   */
  const handleCambiarEstado = async (turno, nuevoEstado) => {
    try {
      await dataManager.update('turnos', turno.id, {
        estado: nuevoEstado,
        fecha_modificacion: new Date().toLocaleString('es-AR')
      });
    } catch (error) {
      console.error('Error actualizando estado del turno:', error);
    }
  };

  /**
   * Cancelación con diálogo de confirmación profesional
   */
  const handleCancelarTurno = async (turno) => {
    const confirmado = await confirmar({
      titulo: '¿Cancelar este turno?',
      mensaje: `Está a punto de cancelar el turno ${turno.codigo} correspondiente a ${turno.cliente_nombre} (${turno.patente}).`,
      tipo: 'peligro',
      textoConfirmar: 'Sí, cancelar turno',
      textoCancelar: 'Volver'
    });

    if (confirmado) {
      handleCambiarEstado(turno, 'Cancelado');
    }
  };

  /**
   * Notificación directa por WhatsApp al cliente
   */
  const handleEnviarWhatsApp = (turno) => {
    const tel = (turno.cliente_telefono || '').replace(/[^0-9]/g, '');
    if (!tel) return;

    // Mensaje formal y claro
    const mensaje = `Hola ${turno.cliente_nombre}! Te escribimos desde el taller para informarte sobre tu turno *${turno.codigo}*.\n\n` +
      `*Vehículo:* ${turno.vehiculo_modelo} (${turno.patente})\n` +
      `*Servicio:* ${turno.servicio_solicitado}\n` +
      `*Fecha:* ${turno.fecha_solicitada} (${turno.franja_horaria})\n` +
      `*Estado:* ${turno.estado}\n\n` +
      `Te esperamos en nuestro taller. Por cualquier consulta estamos a tu disposición!`;

    const url = `https://wa.me/${tel.startsWith('54') ? tel : '549' + tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  /**
   * Convierte el turno en una Orden de Trabajo oficial
   * Redirige a /ordenes/nueva pasando los datos precargados
   */
  const handleConvertirEnOT = async (turno) => {
    const confirmado = await confirmar({
      titulo: 'Convertir Turno en Orden de Trabajo',
      mensaje: `¿Desea crear una nueva Orden de Trabajo para el cliente ${turno.cliente_nombre} con el vehículo ${turno.patente}?`,
      tipo: 'primario',
      textoConfirmar: 'Crear Orden',
      textoCancelar: 'Cancelar'
    });

    if (confirmado) {
      // Marcar turno como 'En Proceso'
      await handleCambiarEstado(turno, 'En Proceso');

      // Redirigir a OrdenNueva pasando el estado con los datos del turno
      navigate('/ordenes/nueva', {
        state: {
          turnoOrigenId: turno.id,
          cliente_nombre: turno.cliente_nombre,
          cliente_telefono: turno.cliente_telefono,
          cliente_email: turno.cliente_email,
          patente: turno.patente,
          vehiculo_modelo: turno.vehiculo_modelo,
          motivo_ingreso: `${turno.servicio_solicitado}. ${turno.motivo_detalle || ''}`
        }
      });
    }
  };

  /**
   * Filtrado dinámico por texto y estado
   */
  const turnosFiltrados = turnos.filter((t) => {
    const coincideEstado = filtroEstado === 'Todos' || t.estado === filtroEstado;
    const q = busqueda.toLowerCase().trim();
    const coincideTexto = 
      !q ||
      (t.cliente_nombre || '').toLowerCase().includes(q) ||
      (t.patente || '').toLowerCase().includes(q) ||
      (t.codigo || '').toLowerCase().includes(q) ||
      (t.vehiculo_modelo || '').toLowerCase().includes(q);
    return coincideEstado && coincideTexto;
  });

  // Estadísticas rápidas
  const totalPendientes = turnos.filter(t => t.estado === 'Pendiente').length;
  const totalConfirmados = turnos.filter(t => t.estado === 'Confirmado').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* CABECERA DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400">Módulo de Atención</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">Solicitudes Web y Mostrador</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-rose-400" />
            <span>Gestión de Turnos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revise los turnos solicitados online, confirme citas por WhatsApp y transfórmelos en Órdenes de Trabajo.
          </p>
        </div>

        {/* Botón de acción: Agendar Turno Manual */}
        <button
          onClick={() => setModalNuevoTurno(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Turno Manual</span>
        </button>
      </div>

      {/* TARJETAS DE RESUMEN METRICO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Turnos</span>
            <span className="text-2xl font-black text-white">{turnos.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Pendientes de Confirmar</span>
            <span className="text-2xl font-black text-amber-400">{totalPendientes}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Confirmados</span>
            <span className="text-2xl font-black text-emerald-400">{totalConfirmados}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRO */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, patente (ej: AE123CD), código (TRN-1001) o modelo..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
          />
        </div>

        {/* Filtro por estado */}
        <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
          {['Todos', 'Pendiente', 'Confirmado', 'En Proceso', 'Completado', 'Cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filtroEstado === st
                  ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE TARJETAS DE TURNOS */}
      {turnosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No se encontraron turnos con los filtros actuales</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Puede cambiar el término de búsqueda o agendar un nuevo turno manual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turnosFiltrados.map((t) => {
            const esPendiente = t.estado === 'Pendiente';
            const esConfirmado = t.estado === 'Confirmado';
            const esEnProceso = t.estado === 'En Proceso';
            const esCancelado = t.estado === 'Cancelado';

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Cabecera de la tarjeta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono tracking-wider text-rose-400">
                      {t.codigo}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      esPendiente 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : esConfirmado 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : esEnProceso
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                        : esCancelado
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {t.estado}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.cliente_nombre}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{t.cliente_telefono}</span>
                    </div>
                  </div>
                </div>

                {/* Datos del vehículo y fecha */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium truncate">{t.vehiculo_modelo}</span>
                    <span className="font-mono uppercase font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      {t.patente}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px] pt-1 border-t border-slate-800/60">
                    <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{t.fecha_solicitada} &bull; {t.franja_horaria}</span>
                  </div>

                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
                    <strong className="text-slate-400 block mb-0.5">Servicio:</strong>
                    <span>{t.servicio_solicitado}</span>
                    {t.motivo_detalle && (
                      <p className="text-[10px] text-slate-400 italic mt-1 bg-slate-900/60 p-1.5 rounded">
                        "{t.motivo_detalle}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de acciones operativas */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Botón Confirmar */}
                    {esPendiente && (
                      <button
                        type="button"
                        onClick={() => handleCambiarEstado(t, 'Confirmado')}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                    )}

                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleEnviarWhatsApp(t)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Botón Cancelar */}
                    {!esCancelado && (
                      <button
                        type="button"
                        onClick={() => handleCancelarTurno(t)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  {/* Botón Principal: Convertir en Orden de Trabajo (OT) */}
                  {!esCancelado && (
                    <button
                      type="button"
                      onClick={() => handleConvertirEnOT(t)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-950/50 border border-rose-800/40 hover:bg-rose-700 hover:text-white text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Convertir en Orden de Trabajo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal para agendar turno manual desde la vista del taller */}
      <SolicitarTurnoModal
        isOpen={modalNuevoTurno}
        onClose={() => setModalNuevoTurno(false)}
      />

    </div>
  );
}
