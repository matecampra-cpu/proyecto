/**
 * GESTIÓN Y DETALLE DE ORDEN DE TRABAJO (OrdenDetalle.jsx)
 * ---------------------------------------------------------
 * El corazón operativo del taller:
 * 1. Control de Estados: Avanza la orden entre las distintas etapas técnicas.
 * 2. Carga de Ítems (Mano de Obra y Repuestos):
 *    - Al añadir un repuesto del catálogo, DESCUENTA automáticamente el stock en Firestore.
 *    - Si se remueve un repuesto, DEVUELVE las unidades al inventario.
 *    - Recalcula automáticamente subtotales, descuentos y saldo pendiente.
 * 3. Módulo de Cobros: Registra pagos (efectivo, transferencia, tarjeta) y los envía a Caja.
 * 4. Notificaciones por WhatsApp: Genera enlaces con mensajes preformateados para el cliente.
 * 5. Impresión: Acceso a la orden de reparación en hoja membretada A4.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Printer, 
  Phone, 
  Car, 
  User, 
  Wrench, 
  Package, 
  Trash2, 
  Plus, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Clock,
  Fuel,
  ShieldCheck
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

export default function OrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { isAdmin } = useAuth();

  // Estados de la orden actual y repuestos disponibles
  const [orden, setOrden] = useState(null);
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para notificaciones en pantalla
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const mostrarAviso = (msg, esError = false) => {
    if (esError) {
      setFeedbackError(msg);
      setTimeout(() => setFeedbackError(''), 4000);
    } else {
      setFeedbackMsg(msg);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Estados para el formulario de agregar repuestos o mano de obra
  const [tipoItem, setTipoItem] = useState('REPUESTO');
  const [repuestoSelId, setRepuestoSelId] = useState('');
  const [descripcionItem, setDescripcionItem] = useState('');
  const [cantidadItem, setCantidadItem] = useState(1);
  const [precioItem, setPrecioItem] = useState('');
  const [mostrarFormItem, setMostrarFormItem] = useState(false);

  // Estados para el registro de pagos/abonos
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [conceptoPago, setConceptoPago] = useState('Cobro de orden');

  // Diagnóstico y descuento comercial
  const [diagnostico, setDiagnostico] = useState('');
  const [mecanico, setMecanico] = useState('');
  const [descuento, setDescuento] = useState(0);

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción en tiempo real a la orden y a la lista de repuestos
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubOrdenes = dataManager.subscribe('ordenes', (todas) => {
      const encontrada = todas.find(o => o.id === id);
      if (encontrada) {
        setOrden(encontrada);
        setDiagnostico(encontrada.diagnostico || '');
        setMecanico(encontrada.mecanico_asignado || '');
        setDescuento(encontrada.descuento || 0);
      }
      setLoading(false);
    });

    const unsubRepuestos = dataManager.subscribe('repuestos', setRepuestos);

    return () => {
      unsubOrdenes();
      unsubRepuestos();
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-xs">Cargando orden...</div>;
  }

  if (!orden) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-400 text-sm">Orden de trabajo no encontrada.</p>
        <Link to="/ordenes" className="text-rose-400 font-bold text-xs underline">Volver a órdenes</Link>
      </div>
    );
  }

  const cambiarEstado = async (nuevoEstado) => {
    const updates = { estado: nuevoEstado };
    if (nuevoEstado === 'Entregado') {
      updates.fecha_entrega = new Date().toISOString().slice(0, 10);
    }
    await dataManager.update('ordenes', id, updates);
  };

  const getEstadoBadgeStyles = (estado) => {
    switch (estado) {
      case 'Ingresado': 
        return { pill: 'bg-slate-800 text-slate-200 border-slate-700', dot: 'bg-slate-400' };
      case 'En Diagnóstico': 
        return { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' };
      case 'Esperando Repuestos': 
        return { pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' };
      case 'En Reparación': 
        return { pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400' };
      case 'Listo para Entrega': 
        return { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' };
      case 'Entregado': 
        return { pill: 'bg-slate-900 text-slate-400 border-slate-800', dot: 'bg-slate-500' };
      default: 
        return { pill: 'bg-slate-800 text-slate-300 border-slate-700', dot: 'bg-slate-400' };
    }
  };

  const handleSelectRepuesto = (rId) => {
    setRepuestoSelId(rId);
    const r = repuestos.find(item => item.id === rId);
    if (r) {
      setDescripcionItem(r.nombre);
      setPrecioItem(r.precio_venta || 0);
    }
  };

  const agregarItem = async (e) => {
    e.preventDefault();
    if (!descripcionItem.trim()) {
      mostrarAviso('Ingrese una descripción válida para la tarea o repuesto.', true);
      return;
    }

    if (isAdmin && (!precioItem || Number(precioItem) < 0)) {
      mostrarAviso('Ingrese un precio unitario válido.', true);
      return;
    }

    const cant = Number(cantidadItem) || 1;
    // Administrador usa el precio cargado; mecánico toma automáticamente el del catálogo sin ver precios
    let precio = 0;
    if (isAdmin) {
      precio = Number(precioItem) || 0;
    } else if (tipoItem === 'REPUESTO' && repuestoSelId) {
      const repObj = repuestos.find(r => r.id === repuestoSelId);
      precio = Number(repObj?.precio_venta) || 0;
    }
    const subtotal = cant * precio;

    const nuevoItem = {
      id: 'it_' + Date.now(),
      tipo: tipoItem,
      repuesto_id: tipoItem === 'REPUESTO' ? repuestoSelId : null,
      descripcion: descripcionItem.trim(),
      cantidad: cant,
      precio_unitario: precio,
      subtotal
    };

    // Si es repuesto con stock, descontar de Firestore
    if (tipoItem === 'REPUESTO' && repuestoSelId) {
      const repObj = repuestos.find(r => r.id === repuestoSelId);
      if (repObj) {
        const nuevoStock = Math.max(0, (repObj.stock_actual || 0) - cant);
        await dataManager.update('repuestos', repuestoSelId, { stock_actual: nuevoStock });
      }
    }

    const itemsActuales = orden.items || [];
    const itemsActualizados = [...itemsActuales, nuevoItem];

    // Recalcular totales
    const mo = itemsActualizados.filter(i => i.tipo === 'MANO_OBRA').reduce((s, i) => s + i.subtotal, 0);
    const rep = itemsActualizados.filter(i => i.tipo === 'REPUESTO').reduce((s, i) => s + i.subtotal, 0);
    const desc = Number(orden.descuento) || 0;
    const totalGral = Math.max(0, mo + rep - desc);
    const totalPag = (orden.pagos || []).reduce((s, p) => s + Number(p.monto), 0);
    const saldo = Math.max(0, totalGral - totalPag);

    await dataManager.update('ordenes', id, {
      items: itemsActualizados,
      total_mano_obra: mo,
      total_repuestos: rep,
      total: totalGral,
      saldo_pendiente: saldo
    });

    // Reset form
    setDescripcionItem('');
    setPrecioItem('');
    setCantidadItem(1);
    setRepuestoSelId('');
    setMostrarFormItem(false);
  };

  const eliminarItem = async (itemId) => {
    const itemAEliminar = (orden.items || []).find(i => i.id === itemId);
    if (!itemAEliminar) return;

    const ok = await confirm({
      title: '¿Quitar ítem de la orden?',
      message: `Se quitará "${itemAEliminar.descripcion}" de la liquidación y se reajustará el stock de repuestos si corresponde.`,
      confirmText: 'Quitar Ítem',
      cancelText: 'Cancelar',
      variant: 'rose',
      iconType: 'trash'
    });
    if (!ok) return;

    // Si era repuesto, devolver stock
    if (itemAEliminar.tipo === 'REPUESTO' && itemAEliminar.repuesto_id) {
      const repObj = repuestos.find(r => r.id === itemAEliminar.repuesto_id);
      if (repObj) {
        await dataManager.update('repuestos', itemAEliminar.repuesto_id, {
          stock_actual: (repObj.stock_actual || 0) + Number(itemAEliminar.cantidad)
        });
      }
    }

    const itemsActualizados = (orden.items || []).filter(i => i.id !== itemId);
    const mo = itemsActualizados.filter(i => i.tipo === 'MANO_OBRA').reduce((s, i) => s + i.subtotal, 0);
    const rep = itemsActualizados.filter(i => i.tipo === 'REPUESTO').reduce((s, i) => s + i.subtotal, 0);
    const desc = Number(orden.descuento) || 0;
    const totalGral = Math.max(0, mo + rep - desc);
    const totalPag = (orden.pagos || []).reduce((s, p) => s + Number(p.monto), 0);
    const saldo = Math.max(0, totalGral - totalPag);

    await dataManager.update('ordenes', id, {
      items: itemsActualizados,
      total_mano_obra: mo,
      total_repuestos: rep,
      total: totalGral,
      saldo_pendiente: saldo
    });
  };

  const guardarDatosTecnicos = async () => {
    const descNum = Number(descuento) || 0;
    const totalGral = Math.max(0, (orden.total_mano_obra || 0) + (orden.total_repuestos || 0) - descNum);
    const totalPag = (orden.pagos || []).reduce((s, p) => s + Number(p.monto), 0);
    const saldo = Math.max(0, totalGral - totalPag);

    await dataManager.update('ordenes', id, {
      diagnostico,
      mecanico_asignado: mecanico,
      descuento: descNum,
      total: totalGral,
      saldo_pendiente: saldo
    });
    mostrarAviso('Diagnóstico y descuentos actualizados correctamente.');
  };

  const registrarCobro = async (e) => {
    e.preventDefault();
    const montoNum = Number(montoPago);
    if (!montoNum || montoNum <= 0) {
      mostrarAviso('Ingrese un monto de cobro mayor a 0.', true);
      return;
    }

    const nuevoPago = {
      id: 'p_' + Date.now(),
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      metodo: metodoPago,
      monto: montoNum,
      concepto: conceptoPago
    };

    const pagosActuales = orden.pagos || [];
    const pagosActualizados = [...pagosActuales, nuevoPago];
    const totalPag = pagosActualizados.reduce((s, p) => s + Number(p.monto), 0);
    const saldo = Math.max(0, (orden.total || 0) - totalPag);

    await dataManager.update('ordenes', id, {
      pagos: pagosActualizados,
      total_pagado: totalPag,
      saldo_pendiente: saldo
    });

    // Registrar en caja
    await dataManager.add('movimientos_caja', {
      tipo: 'INGRESO',
      categoria: 'Cobro OT',
      concepto: `${conceptoPago} (${orden.numero_orden} - ${orden.cliente_nombre})`,
      metodo_pago: metodoPago,
      monto: montoNum,
      orden_id: id,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    setMontoPago('');
  };

  // WhatsApp template (sin saldo para mecánicos)
  const config = dataManager.getConfig();
  const detalleSaldo = isAdmin ? ` Saldo pendiente: $${(orden.saldo_pendiente || 0).toLocaleString('es-AR')}.` : '';
  const mensajeWhatsApp = `Hola ${orden.cliente_nombre}! Te informamos desde ${config.nombre_taller || 'el Taller'} que tu ${orden.marca} ${orden.modelo} (patente ${orden.patente}) se encuentra en estado: *${orden.estado}*.${detalleSaldo} Saludos!`;
  const urlWhatsApp = `https://wa.me/${(orden.cliente_telefono || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Barra de Navegación y Estados */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <Link to="/ordenes" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-rose-400 text-lg">{orden.numero_orden}</span>
              <span className="font-mono font-black text-white bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                {orden.patente}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{orden.marca} {orden.modelo} &bull; {orden.cliente_nombre}</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {orden.cliente_telefono && (
            <a
              href={urlWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Avisar por WhatsApp</span>
            </a>
          )}

          <Link
            to={`/ordenes/${orden.id}/imprimir`}
            target="_blank"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Factura A4' : 'Hoja Técnica'}</span>
          </Link>

          <button
            onClick={eliminarOrden}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Eliminar orden"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alertas de retroalimentación de operaciones */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* Selector de Estado Operativo */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Actual:</span>
          {(() => {
            const { pill, dot } = getEstadoBadgeStyles(orden.estado);
            return (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap shadow-sm ${pill}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span>{orden.estado}</span>
              </span>
            );
          })()}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['Ingresado', 'En Diagnóstico', 'Esperando Repuestos', 'En Reparación', 'Listo para Entrega', 'Entregado'].map(st => (
            <button
              key={st}
              onClick={() => cambiarEstado(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap ${
                orden.estado === st 
                  ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white border-rose-600 shadow-sm shadow-rose-950/40' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ficha Resumen de Recepción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Vehículo</span>
          <p className="font-bold text-white text-sm">{orden.marca} {orden.modelo}</p>
          <div className="text-slate-400 space-y-1">
            <p>Odómetro al ingreso: <b className="text-white">{(orden.kilometraje_ingreso || 0).toLocaleString('es-AR')} km</b></p>
            <p>Nivel Combustible: <b className="text-rose-400">{orden.nivel_combustible}</b></p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Cliente</span>
          <p className="font-bold text-white text-sm">{orden.cliente_nombre}</p>
          <div className="text-slate-400 space-y-1">
            <p className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{orden.cliente_telefono || 'Sin teléfono'}</span>
            </p>
            <p>Fecha Ingreso: <b className="text-white">{orden.fecha_ingreso}</b></p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Checklist de Elementos</span>
          <div className="flex flex-wrap gap-1.5">
            {orden.checklist && Object.entries(orden.checklist).map(([k, val]) => (
              <span key={k} className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${val ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-600 line-through'}`}>
                {k}
              </span>
            ))}
          </div>
          {orden.danos_previos && (
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="text-rose-400 font-semibold">Daños previos:</span> {orden.danos_previos}
            </p>
          )}
        </div>

      </div>

      {/* Motivo de Ingreso y Diagnóstico */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              Motivo del Ingreso / Falla Declarada
            </label>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-medium">
              {orden.motivo_ingreso}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5">
              Diagnóstico e Informe Técnico
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows="2"
              placeholder="Describa el diagnóstico, componentes revisados y notas del taller..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800 gap-3 text-xs">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-semibold">Mecánico:</span>
              <input
                type="text"
                value={mecanico}
                onChange={(e) => setMecanico(e.target.value)}
                placeholder="Nombre mecánico"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 font-semibold">Descuento ($):</span>
                <input
                  type="number"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-rose-400 font-bold"
                />
              </div>
            )}
          </div>

          <button
            onClick={guardarDatosTecnicos}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-xl transition-colors"
          >
            {isAdmin ? 'Guardar Diagnóstico y Descuento' : 'Guardar Diagnóstico Técnico'}
          </button>
        </div>
      </div>

      {/* Ítems: Mano de Obra y Repuestos Utilizados */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-rose-400" />
              <span>Mano de Obra y Repuestos Utilizados</span>
            </h3>
            <p className="text-[11px] text-slate-400">Los repuestos de stock se descuentan automáticamente en tiempo real</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setTipoItem('REPUESTO'); setMostrarFormItem(true); }}
              className="bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 border border-rose-800/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5" />
              <span>+ Repuesto de Stock</span>
            </button>

            <button
              onClick={() => { setTipoItem('MANO_OBRA'); setMostrarFormItem(true); setRepuestoSelId(''); setDescripcionItem(''); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>+ Mano de Obra</span>
            </button>
          </div>
        </div>

        {/* Formulario Agregar Ítem */}
        {mostrarFormItem && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={agregarItem}
            className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {tipoItem === 'REPUESTO' ? 'Agregar Repuesto del Inventario' : 'Agregar Mano de Obra / Servicio'}
              </span>
              <button 
                type="button" 
                onClick={() => setMostrarFormItem(false)} 
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
              {tipoItem === 'REPUESTO' && (
                <div className={isAdmin ? 'md:col-span-2' : 'md:col-span-1'}>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Catálogo de Repuestos</label>
                  <select
                    value={repuestoSelId}
                    onChange={(e) => handleSelectRepuesto(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">-- Seleccionar repuesto o escribir manual --</option>
                    {repuestos.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} (Stock: {r.stock_actual}){isAdmin ? ` - $${(r.precio_venta || 0).toLocaleString('es-AR')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={tipoItem === 'REPUESTO' ? (isAdmin ? 'md:col-span-2' : 'md:col-span-1') : (isAdmin ? 'md:col-span-2' : 'md:col-span-2')}>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción de la Tarea o Pieza *</label>
                <input
                  type="text"
                  value={descripcionItem}
                  onChange={(e) => setDescripcionItem(e.target.value)}
                  required
                  placeholder="ej: Juego de pastillas de freno / Rectificación"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cantidad</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={cantidadItem}
                  onChange={(e) => setCantidadItem(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={precioItem}
                    onChange={(e) => setPrecioItem(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-black focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-black text-xs px-4 py-1.5 rounded-lg shadow-md shadow-rose-950/40 transition-all"
              >
                Agregar a la Orden
              </button>
            </div>
          </motion.form>
        )}

        {/* Tabla de ítems */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descripción</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Precio Unit.</th>}
                {isAdmin && <th className="py-2.5 px-3 text-right">Subtotal</th>}
                <th className="py-2.5 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {(!orden.items || orden.items.length === 0) ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="py-8 text-center text-slate-500 italic">
                    Aún no se han imputado repuestos ni mano de obra a esta orden.
                  </td>
                </tr>
              ) : (
                orden.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        it.tipo === 'REPUESTO' 
                          ? 'bg-rose-950/50 text-rose-300 border-rose-800/40' 
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}>
                        {it.tipo === 'REPUESTO' ? 'Repuesto' : 'Mano de Obra'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{it.descripcion}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-300">{it.cantidad}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right text-slate-400">${(it.precio_unitario || 0).toLocaleString('es-AR')}</td>
                    )}
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right font-black text-white">${(it.subtotal || 0).toLocaleString('es-AR')}</td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        onClick={() => eliminarItem(it.id)} 
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Sección Inferior: Liquidación y Cobros (Solo Administrador) / Panel Operativo Técnico (Mecánicos) */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Registro de Cobros */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Historial de Cobros y Señas</span>
              </h4>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Abonado: ${(orden.total_pagado || 0).toLocaleString('es-AR')}
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto divide-y divide-slate-800/50">
              {(!orden.pagos || orden.pagos.length === 0) ? (
                <p className="text-xs text-slate-500 italic py-2">No se han registrado cobros todavía.</p>
              ) : (
                orden.pagos.map((p) => (
                  <div key={p.id} className="py-1.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{p.metodo}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">({p.fecha})</span>
                    </div>
                    <span className="font-black text-emerald-400">+${(Number(p.monto) || 0).toLocaleString('es-AR')}</span>
                  </div>
                ))
              )}
            </div>

            {/* Formulario Registrar Pago */}
            <form onSubmit={registrarCobro} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registrar Cobro / Saldo</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Monto ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    placeholder={orden.saldo_pendiente > 0 ? String(orden.saldo_pendiente) : '0'}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Método</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta Débito">Tarjeta Débito</option>
                    <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                    <option value="MercadoPago/QR">MercadoPago/QR</option>
                  </select>
                </div>
              </div>

              <input
                type="text"
                value={conceptoPago}
                onChange={(e) => setConceptoPago(e.target.value)}
                placeholder="Concepto del cobro"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
              />

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-1.5 rounded-lg shadow transition-colors"
              >
                Registrar Cobro en Caja
              </button>
            </form>
          </div>

          {/* Resumen Financiero Total */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
                Liquidación de la Orden
              </h4>

              <div className="space-y-2 py-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Mano de Obra:</span>
                  <span className="font-bold text-white">${(orden.total_mano_obra || 0).toLocaleString('es-AR')}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Total Repuestos e Insumos:</span>
                  <span className="font-bold text-white">${(orden.total_repuestos || 0).toLocaleString('es-AR')}</span>
                </div>

                {Number(orden.descuento) > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Descuento Otorgado:</span>
                    <span>-${Number(orden.descuento).toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-between font-black text-base text-white">
                  <span>TOTAL GENERAL:</span>
                  <span className="text-rose-400">${(orden.total || 0).toLocaleString('es-AR')}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                  <span>Total Pagado:</span>
                  <span>${(orden.total_pagado || 0).toLocaleString('es-AR')}</span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-800 flex justify-between font-black text-sm">
                  <span className={orden.saldo_pendiente > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    SALDO RESTANTE:
                  </span>
                  <span className={orden.saldo_pendiente > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    ${(orden.saldo_pendiente || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <Link
                to={`/ordenes/${orden.id}/imprimir`}
                target="_blank"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Ver Comprobante de Entrega / Factura A4</span>
              </Link>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Control Operativo Técnico</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Unidad en proceso técnico. Los importes, liquidación y cobranzas son administrados por el sector comercial.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/ordenes/${orden.id}/imprimir`}
              target="_blank"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Ver Hoja Técnica de Taller</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
