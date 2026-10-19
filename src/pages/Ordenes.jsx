/**
 * LISTADO Y BÚSQUEDA DE ÓRDENES DE TRABAJO (Ordenes.jsx)
 * -------------------------------------------------------
 * Vista tabular y móvil de todas las reparaciones:
 * 1. Buscador global multi-criterio: busca en vivo por Nº de OT, Patente, Cliente o Falla.
 * 2. Filtro por etapa de trabajo (Ingresado, Diagnóstico, Esperando Repuestos, En Reparación, Listo, Entregado).
 * 3. Badges con código de colores según el estado técnico de cada auto.
 * 4. Resumen financiero visible (Total, Pagado y Saldo Pendiente destacado).
 * 5. Acceso directo a imprimir comprobante o entrar al detalle completo.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Search, 
  PlusCircle, 
  Printer, 
  ChevronRight, 
  Wrench, 
  Phone,
  Car
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Ordenes() {
  const { isAdmin } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Sincronización en tiempo real con las órdenes de trabajo
  useEffect(() => {
    const unsub = dataManager.subscribe('ordenes', (data) => {
      setOrdenes(data);
    });
    return () => unsub();
  }, []);

  // Lógica de filtrado reactivo simultáneo por texto y estado
  const ordenesFiltradas = ordenes.filter(o => {
    const matchEstado = !filtroEstado || o.estado === filtroEstado;
    const term = busqueda.toLowerCase().trim();
    const matchBusqueda = !term || 
      (o.numero_orden && o.numero_orden.toLowerCase().includes(term)) ||
      (o.patente && o.patente.toLowerCase().includes(term)) ||
      (o.cliente_nombre && o.cliente_nombre.toLowerCase().includes(term)) ||
      (o.motivo_ingreso && o.motivo_ingreso.toLowerCase().includes(term));
    return matchEstado && matchBusqueda;
  });

  // Asignación de estilos visuales boutique y punto indicador por estado
  const getBadgeStyles = (estado) => {
    switch (estado) {
      case 'Ingresado': 
        return {
          pill: 'bg-slate-800/90 text-slate-200 border-slate-700/80 shadow-slate-950/40',
          dot: 'bg-slate-400'
        };
      case 'En Diagnóstico': 
        return {
          pill: 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-purple-950/20',
          dot: 'bg-purple-400'
        };
      case 'Esperando Repuestos': 
        return {
          pill: 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-rose-950/20',
          dot: 'bg-rose-400'
        };
      case 'En Reparación': 
        return {
          pill: 'bg-sky-500/10 text-sky-300 border-sky-500/30 shadow-sky-950/20',
          dot: 'bg-sky-400'
        };
      case 'Listo para Entrega': 
        return {
          pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-emerald-950/20',
          dot: 'bg-emerald-400'
        };
      case 'Entregado': 
        return {
          pill: 'bg-slate-900 text-slate-400 border-slate-800 shadow-none',
          dot: 'bg-slate-500'
        };
      default: 
        return {
          pill: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400'
        };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-rose-400" />
            <span>Órdenes de Trabajo (OT)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de reparaciones, servicios y entregas</p>
        </div>

        <Link
          to="/ordenes/nueva"
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/40 transition-all transform hover:-translate-y-0.5 w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Orden de Trabajo</span>
        </Link>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por patente, cliente o N° OT..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
        >
          <option value="">Todos los Estados</option>
          <option value="Ingresado">Ingresado</option>
          <option value="En Diagnóstico">En Diagnóstico</option>
          <option value="Esperando Repuestos">Esperando Repuestos</option>
          <option value="En Reparación">En Reparación</option>
          <option value="Listo para Entrega">Listo para Entrega</option>
          <option value="Entregado">Entregado</option>
        </select>

        {(busqueda || filtroEstado) && (
          <button
            onClick={() => { setBusqueda(''); setFiltroEstado(''); }}
            className="text-xs text-slate-400 hover:text-rose-400 underline px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">N° Orden</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Vehículo</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Cliente</th>
                <th className="px-5 py-3.5 min-w-[200px]">Motivo / Falla</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Mecánico</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Estado</th>
                {isAdmin && <th className="px-5 py-3.5 text-right whitespace-nowrap">Total</th>}
                {isAdmin && <th className="px-5 py-3.5 text-right whitespace-nowrap">Saldo</th>}
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 7} className="px-5 py-12 text-center text-slate-500">
                    No se encontraron órdenes de trabajo registradas.
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/ordenes/${o.id}`} className="font-mono font-bold text-rose-400 hover:underline">
                        {o.numero_orden}
                      </Link>
                      <div className="text-[10px] text-slate-500">{o.fecha_ingreso}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-black text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-[11px]">
                        {o.patente}
                      </span>
                      <div className="font-semibold text-slate-300 mt-0.5">{o.marca} {o.modelo}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-white">{o.cliente_nombre}</div>
                      {o.cliente_telefono && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{o.cliente_telefono}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-400" title={o.motivo_ingreso}>
                      {o.motivo_ingreso}
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 font-medium whitespace-nowrap">
                      {o.mecanico_asignado || 'Sin asignar'}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {(() => {
                        const { pill, dot } = getBadgeStyles(o.estado);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border shadow-sm whitespace-nowrap select-none ${pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                            <span>{o.estado}</span>
                          </span>
                        );
                      })()}
                    </td>

                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right font-black text-white">
                        ${(o.total || 0).toLocaleString('es-AR')}
                      </td>
                    )}

                    {isAdmin && (
                      <td className={`px-5 py-3.5 text-right font-black ${o.saldo_pendiente > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ${(o.saldo_pendiente || 0).toLocaleString('es-AR')}
                      </td>
                    )}

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link 
                          to={`/ordenes/${o.id}`}
                          title="Gestionar orden"
                          className="p-1.5 bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 rounded-lg border border-rose-800/40 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/ordenes/${o.id}/imprimir`}
                          target="_blank"
                          title="Imprimir"
                          className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
