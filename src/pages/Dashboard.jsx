/**
 * TABLERO GENERAL / DASHBOARD (Dashboard.jsx)
 * -------------------------------------------
 * Vista principal de monitoreo en tiempo real del taller:
 * 1. Tarjetas de métricas rápidas (KPIs):
 *    - Autos en proceso en el taller.
 *    - Vehículos listos para entrega / retiro.
 *    - Cobros totales del mes en tiempo real.
 *    - Alertas de repuestos críticos bajo stock mínimo.
 * 2. Tablero visual tipo Kanban con estados del auto:
 *    - Ingresado -> En Diagnóstico -> Esperando Repuestos -> En Reparación -> Listo -> Entregado.
 * 3. Listado de repuestos críticos y últimos ingresos/egresos de caja.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  DollarSign, 
  AlertTriangle, 
  PlusCircle, 
  ChevronRight, 
  Clock, 
  User, 
  Wrench, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Columnas y colores de identificación del flujo de trabajo
const ESTADOS_KANBAN = [
  { id: 'Ingresado', label: 'Ingresado', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'En Diagnóstico', label: 'En Diagnóstico', color: 'border-purple-500/30 bg-purple-950/20 text-purple-300' },
  { id: 'Esperando Repuestos', label: 'Esperando Rep.', color: 'border-rose-500/30 bg-rose-950/30 text-rose-300' },
  { id: 'En Reparación', label: 'En Reparación', color: 'border-sky-500/30 bg-sky-950/20 text-sky-300' },
  { id: 'Listo para Entrega', label: 'Listo Entrega', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' },
  { id: 'Entregado', label: 'Entregado', color: 'border-slate-800 bg-slate-900/20 text-slate-500' }
];

export default function Dashboard() {
  const { isAdmin } = useAuth();

  // Estados para órdenes, repuestos y caja
  const [ordenes, setOrdenes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción triple en tiempo real a las tres fuentes de datos
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubOrdenes = dataManager.subscribe('ordenes', (data) => {
      setOrdenes(data);
      setLoading(false);
    });

    const unsubRepuestos = dataManager.subscribe('repuestos', (data) => {
      setRepuestos(data);
    });

    const unsubCaja = dataManager.subscribe('movimientos_caja', (data) => {
      setMovimientos(data);
    });

    return () => {
      unsubOrdenes();
      unsubRepuestos();
      unsubCaja();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // CÁLCULO DE INDICADORES (MÉTRICAS DEL TALLER)
  // ---------------------------------------------------------------------------
  // Unidades activas que ocupan un puesto en el taller
  const enTaller = ordenes.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado').length;
  // Autos listos para entregar al cliente
  const listos = ordenes.filter(o => o.estado === 'Listo para Entrega').length;
  // Dinero cobrado en el período
  const ingresosMes = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);
  // Repuestos que requieren reposición urgente a proveedores
  const repuestosCriticos = repuestos.filter(r => r.stock_actual <= r.stock_minimo);

  /**
   * Permite actualizar rápidamente el estado de una orden desde el tablero
   */
  const cambiarEstadoRapido = async (ordenId, nuevoEstado) => {
    await dataManager.update('ordenes', ordenId, { estado: nuevoEstado });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Tablero Operativo del Taller</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sincronización en tiempo real &bull; Monitoreo de reparaciones e inventario
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/ordenes/nueva"
            className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/40 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recepción de Unidad</span>
          </Link>
        </div>
      </div>

      {/* Métricas Rápidas (Estilo Minimalista Ejecutivo) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        
        {/* Autos en Taller */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Autos en Taller</span>
            <span className="w-2 h-2 rounded-full bg-sky-400 ring-4 ring-sky-400/10" title="En proceso" />
          </div>
          <div className="text-3xl font-black text-white mt-3 tracking-tight">{enTaller}</div>
          <p className="text-[11px] text-sky-400/90 font-medium mt-1">En proceso o diagnóstico</p>
        </motion.div>

        {/* Listos para Retiro */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.04 }}
          className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Listos para Retiro</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" title="Listos" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3 tracking-tight">{listos}</div>
          <p className="text-[11px] text-emerald-400/80 font-medium mt-1">Avisar a clientes</p>
        </motion.div>

        {/* Cobros Registrados (Solo visible para administradores) */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08 }}
            className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cobros Registrados</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 ring-4 ring-rose-400/10" title="Caja" />
            </div>
            <div className="text-3xl font-black text-white mt-3 tracking-tight">${ingresosMes.toLocaleString('es-AR')}</div>
            <p className="text-[11px] text-rose-400/90 font-medium mt-1">Caja en tiempo real</p>
          </motion.div>
        )}

        {/* Stock Crítico */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.12 }}
          className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm transition-all shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Crítico</span>
            <span className={`w-2 h-2 rounded-full ring-4 ${repuestosCriticos.length > 0 ? 'bg-rose-400 ring-rose-400/10' : 'bg-slate-600 ring-slate-600/10'}`} title="Stock" />
          </div>
          <div className={`text-3xl font-black mt-3 tracking-tight ${repuestosCriticos.length > 0 ? 'text-rose-400' : 'text-white'}`}>
            {repuestosCriticos.length}
          </div>
          {repuestosCriticos.length > 0 ? (
            <Link to="/repuestos" className="text-[11px] text-rose-400 font-medium hover:underline mt-1 inline-flex items-center gap-1">
              <span>Ver piezas a reponer</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          ) : (
            <p className="text-[11px] text-slate-500 font-medium mt-1">Inventario en orden</p>
          )}
        </motion.div>

      </div>

      {/* Tablero Kanban */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-rose-400" />
              <span>Flujo de Trabajo (Kanban en Vivo)</span>
            </h2>
            <p className="text-xs text-slate-400">Haz clic en el estado de una orden para avanzar el trabajo</p>
          </div>
          <Link to="/ordenes" className="text-xs text-rose-400 hover:text-rose-300 font-semibold">
            Ver todas las órdenes &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-2">
          {ESTADOS_KANBAN.map((estado) => {
            const ordenesEnEstado = ordenes.filter(o => o.estado === estado.id);
            return (
              <div key={estado.id} className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/70 flex flex-col min-w-[200px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{estado.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${estado.color}`}>
                    {ordenesEnEstado.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                  {ordenesEnEstado.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-xs italic">
                      Sin unidades
                    </div>
                  ) : (
                    ordenesEnEstado.map((o) => (
                      <motion.div
                        key={o.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 hover:border-rose-900/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-800/40">
                            {o.numero_orden}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {o.patente}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white truncate">
                          {o.marca} {o.modelo}
                        </p>

                        <p className="text-[11px] text-slate-400 truncate flex items-center mt-0.5">
                          <User className="w-3 h-3 mr-1 text-slate-500" />
                          {o.cliente_nombre}
                        </p>

                        <div className="mt-2 text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 line-clamp-2">
                          {o.motivo_ingreso}
                        </div>

                        {o.mecanico_asignado && (
                          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                            <Wrench className="w-3 h-3 text-slate-500" />
                            <span>Mecánico: {o.mecanico_asignado}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800 text-[11px]">
                          {isAdmin && (
                            <span className="font-extrabold text-white">
                              ${(o.total || 0).toLocaleString('es-AR')}
                            </span>
                          )}

                          <Link 
                            to={`/ordenes/${o.id}`}
                            className={`text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform ${!isAdmin ? 'w-full justify-end' : ''}`}
                          >
                            <span>Gestionar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección Inferior: Repuestos Críticos y Últimos Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Repuestos en alerta */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Repuestos con Stock Crítico</span>
            </h3>
            <Link to="/repuestos" className="text-xs text-rose-400 hover:underline">Ver catálogo</Link>
          </div>

          {repuestosCriticos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
              <span>Inventario abastecido. No hay piezas por debajo del stock mínimo.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {repuestosCriticos.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-400">{r.codigo}</span>
                      <span className="font-bold text-white">{r.nombre}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{r.categoria} &bull; {r.ubicacion}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Stock: {r.stock_actual} (Mín: {r.stock_minimo})
                    </span>
                    {isAdmin && (
                      <p className="text-[11px] text-slate-400 mt-0.5">${(r.precio_venta || 0).toLocaleString('es-AR')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos Movimientos de Caja (Solo administradores) */}
        {isAdmin && (
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Últimos Movimientos de Caja</span>
              </h3>
              <Link to="/caja" className="text-xs text-rose-400 hover:underline">Ver libro diario</Link>
            </div>

            {movimientos.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay movimientos de caja registrados recientemente.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {movimientos.slice(0, 5).map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border ${
                        m.tipo === 'INGRESO' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {m.tipo === 'INGRESO' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{m.concepto}</p>
                        <p className="text-[10px] text-slate-500">{m.metodo_pago} &bull; {m.fecha}</p>
                      </div>
                    </div>

                    <span className={`font-black text-sm ${m.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.tipo === 'INGRESO' ? '+' : '-'}${(Number(m.monto) || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
