/**
 * GESTIÓN DE PRESUPUESTOS Y COTIZACIONES (Presupuestos.jsx)
 * ---------------------------------------------------------
 * Módulo de cotizaciones comerciales para clientes del taller:
 * 1. Confección de presupuestos con validez en días (mano de obra + repuestos).
 * 2. Visualización dividida: Listado de presupuestos a la izquierda y panel de detalle a la derecha.
 * 3. Incorporación dinámica de ítems con autocompletado del catálogo de repuestos.
 * 4. FUNCIÓN ESTRELLA: "Aprobar y Convertir a OT":
 *    - Con un solo clic transforma la cotización aprobada en una Orden de Trabajo activa.
 *    - Descuenta automáticamente las piezas presupuestadas del stock de repuestos.
 *    - Cambia el estado del presupuesto a 'Aprobado' y deja el vehículo 'En Reparación'.
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  Trash2, 
  Printer, 
  ChevronRight, 
  Wrench, 
  Package, 
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

export default function Presupuestos() {
  const { isAdmin } = useAuth();

  // Redirección segura si no es administrador (módulo financiero y de cotización)
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const { confirm } = useConfirm();

  // Colecciones reactivas
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Estados del modal de nueva cotización
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [validez, setValidez] = useState('15');
  const [notas, setNotas] = useState('');

  // Presupuesto seleccionado para visualizar o editar ítems
  const [presupuestoSel, setPresupuestoSel] = useState(null);

  // Estados para agregar ítems de repuesto o mano de obra
  const [tipoItem, setTipoItem] = useState('REPUESTO');
  const [descItem, setDescItem] = useState('');
  const [cantItem, setCantItem] = useState(1);
  const [precioItem, setPrecioItem] = useState('');
  const [repuestoSelId, setRepuestoSelId] = useState('');

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción en tiempo real a presupuestos, clientes, autos y stock
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubP = dataManager.subscribe('presupuestos', (data) => {
      setPresupuestos(data);
      if (presupuestoSel) {
        const updated = data.find(p => p.id === presupuestoSel.id);
        if (updated) setPresupuestoSel(updated);
      }
    });

    const unsubC = dataManager.subscribe('clientes', setClientes);
    const unsubV = dataManager.subscribe('vehiculos', setVehiculos);
    const unsubR = dataManager.subscribe('repuestos', setRepuestos);

    return () => {
      unsubP();
      unsubC();
      unsubV();
      unsubR();
    };
  }, [presupuestoSel?.id]);

  const handleClienteChange = (cId) => {
    setClienteId(cId);
    const autos = vehiculos.filter(v => v.cliente_id === cId);
    setVehiculoId(autos.length > 0 ? autos[0].id : '');
  };

  const crearPresupuesto = async (e) => {
    e.preventDefault();
    const cliente = clientes.find(c => c.id === clienteId);
    const auto = vehiculos.find(v => v.id === vehiculoId);

    const proximoNum = `PRES-${(presupuestos.length + 1).toString().padStart(4, '0')}`;

    const nuevo = {
      numero_presupuesto: proximoNum,
      cliente_id: clienteId,
      cliente_nombre: cliente?.nombre || 'Cliente',
      cliente_telefono: cliente?.telefono || '',
      vehiculo_id: vehiculoId,
      patente: auto?.patente || '',
      marca: auto?.marca || '',
      modelo: auto?.modelo || '',
      fecha: new Date().toISOString().slice(0, 10),
      validez_dias: Number(validez) || 15,
      motivo: motivo.trim(),
      estado: 'Pendiente',
      total_mano_obra: 0,
      total_repuestos: 0,
      total: 0,
      notas: notas.trim(),
      items: []
    };

    const guardado = await dataManager.add('presupuestos', nuevo);
    setMostrarModalNuevo(false);
    setPresupuestoSel(guardado);
    setMotivo('');
  };

  const handleSelectRepuesto = (rId) => {
    setRepuestoSelId(rId);
    const r = repuestos.find(item => item.id === rId);
    if (r) {
      setDescItem(r.nombre);
      setPrecioItem(r.precio_venta || 0);
    }
  };

  const agregarItem = async (e) => {
    e.preventDefault();
    if (!presupuestoSel || !descItem.trim() || Number(precioItem) <= 0) return;

    const cant = Number(cantItem) || 1;
    const precio = Number(precioItem) || 0;
    const subtotal = cant * precio;

    const nuevoItem = {
      id: 'pit_' + Date.now(),
      tipo: tipoItem,
      repuesto_id: tipoItem === 'REPUESTO' ? repuestoSelId : null,
      descripcion: descItem.trim(),
      cantidad: cant,
      precio_unitario: precio,
      subtotal
    };

    const itemsActualizados = [...(presupuestoSel.items || []), nuevoItem];
    const mo = itemsActualizados.filter(i => i.tipo === 'MANO_OBRA').reduce((s, i) => s + i.subtotal, 0);
    const rep = itemsActualizados.filter(i => i.tipo === 'REPUESTO').reduce((s, i) => s + i.subtotal, 0);
    const total = mo + rep;

    await dataManager.update('presupuestos', presupuestoSel.id, {
      items: itemsActualizados,
      total_mano_obra: mo,
      total_repuestos: rep,
      total
    });

    setDescItem('');
    setPrecioItem('');
    setCantItem(1);
    setRepuestoSelId('');
  };

  const eliminarItem = async (itemId) => {
    if (!presupuestoSel) return;
    const itemsActualizados = (presupuestoSel.items || []).filter(i => i.id !== itemId);
    const mo = itemsActualizados.filter(i => i.tipo === 'MANO_OBRA').reduce((s, i) => s + i.subtotal, 0);
    const rep = itemsActualizados.filter(i => i.tipo === 'REPUESTO').reduce((s, i) => s + i.subtotal, 0);
    const total = mo + rep;

    await dataManager.update('presupuestos', presupuestoSel.id, {
      items: itemsActualizados,
      total_mano_obra: mo,
      total_repuestos: rep,
      total
    });
  };

  // Convertir Presupuesto A Orden de Trabajo
  const convertirAOrden = async () => {
    if (!presupuestoSel) return;
    const ok = await confirm({
      title: '¿Aprobar Presupuesto y Crear OT?',
      message: 'Se creará la Orden de Trabajo activa en el taller y se descontará automáticamente el stock de repuestos presupuestados.',
      confirmText: 'Aprobar y Convertir',
      cancelText: 'Cancelar',
      variant: 'emerald',
      iconType: 'check'
    });
    if (!ok) return;

    const todasLasOrdenes = dataManager.getLocal('ordenes');
    const numOT = `OT-${(todasLasOrdenes.length + 1).toString().padStart(4, '0')}`;

    // Descontar stock de repuestos incluidos
    for (const it of (presupuestoSel.items || [])) {
      if (it.tipo === 'REPUESTO' && it.repuesto_id) {
        const rep = repuestos.find(r => r.id === it.repuesto_id);
        if (rep) {
          const nuevoStock = Math.max(0, (rep.stock_actual || 0) - Number(it.cantidad));
          await dataManager.update('repuestos', it.repuesto_id, { stock_actual: nuevoStock });
        }
      }
    }

    const nuevaOT = {
      numero_orden: numOT,
      cliente_id: presupuestoSel.cliente_id,
      cliente_nombre: presupuestoSel.cliente_nombre,
      cliente_telefono: presupuestoSel.cliente_telefono,
      vehiculo_id: presupuestoSel.vehiculo_id,
      patente: presupuestoSel.patente,
      marca: presupuestoSel.marca,
      modelo: presupuestoSel.modelo,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      fecha_prometida: '',
      kilometraje_ingreso: 0,
      nivel_combustible: '1/2',
      checklist: { auxilio: true, gato: true, papeles: true, stereo: true },
      danos_previos: '',
      motivo_ingreso: presupuestoSel.motivo,
      diagnostico: 'Presupuesto aprobado y en ejecución',
      estado: 'En Reparación',
      mecanico_asignado: '',
      total_mano_obra: presupuestoSel.total_mano_obra,
      total_repuestos: presupuestoSel.total_repuestos,
      descuento: 0,
      total: presupuestoSel.total,
      total_pagado: 0,
      saldo_pendiente: presupuestoSel.total,
      items: presupuestoSel.items || [],
      pagos: []
    };

    await dataManager.add('ordenes', nuevaOT);
    await dataManager.update('presupuestos', presupuestoSel.id, { estado: 'Convertido a OT' });

    setFeedbackMsg(`Presupuesto aprobado con éxito. Se ha generado la ${numOT}.`);
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  // Compartir cotización detallada por WhatsApp
  const compartirWhatsApp = () => {
    if (!presupuestoSel) return;
    const tel = (presupuestoSel.cliente_telefono || '').replace(/\D/g, '');
    const itemsList = (presupuestoSel.items || [])
      .map(i => `• ${i.descripcion} (x${i.cantidad}): $${Number(i.subtotal || 0).toLocaleString('es-AR')}`)
      .join('\n');
    const config = dataManager.getConfig();
    const nombreTaller = config?.nombre_taller || 'Taller Mecánico';
    const mensaje = `Hola ${presupuestoSel.cliente_nombre}, le enviamos la cotización ${presupuestoSel.numero_presupuesto} de *${nombreTaller}*:\n\n` +
      `*Vehículo:* ${presupuestoSel.marca} ${presupuestoSel.modelo} [${presupuestoSel.patente}]\n` +
      `*Trabajo presupuestado:* ${presupuestoSel.motivo}\n\n` +
      `*Detalle de Trabajos y Repuestos:*\n${itemsList || 'Sin ítems cargados aún'}\n\n` +
      `*Total Estimado:* $${Number(presupuestoSel.total || 0).toLocaleString('es-AR')}\n` +
      `*Validez:* ${presupuestoSel.validez_dias} días corridos.\n\n` +
      `Quedamos a su disposición ante cualquier consulta.`;
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Imprimir presupuesto en formato limpio
  const imprimirPresupuesto = () => {
    window.print();
  };

  // Eliminar presupuesto
  const eliminarPresupuesto = async (id) => {
    const ok = await confirm({
      title: '¿Eliminar Cotización?',
      message: 'Esta cotización se eliminará permanentemente del historial del taller.',
      confirmText: 'Eliminar Cotización',
      cancelText: 'Cancelar',
      variant: 'rose',
      iconType: 'trash'
    });
    if (!ok) return;

    await dataManager.delete('presupuestos', id);
    if (presupuestoSel?.id === id) setPresupuestoSel(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-400" />
            <span>Presupuestos y Cotizaciones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cotizaciones previas con conversión en 1 clic a Orden de Trabajo activa
          </p>
        </div>

        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Presupuestos (Columna izquierda) */}
        <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Cotizaciones</h3>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {presupuestos.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">No hay presupuestos emitidos.</p>
            ) : (
              presupuestos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPresupuestoSel(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    presupuestoSel?.id === p.id 
                      ? 'bg-slate-800 border-rose-600/60 shadow-md' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-rose-400 text-xs">{p.numero_presupuesto}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.estado === 'Convertido a OT' 
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                    }`}>
                      {p.estado}
                    </span>
                  </div>

                  <p className="font-bold text-white text-xs truncate">{p.cliente_nombre}</p>
                  <p className="text-[11px] text-slate-400 truncate">{p.marca} {p.modelo} [{p.patente}]</p>
                  <div className="mt-2 flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-500 text-[10px]">{p.fecha}</span>
                    <span className="font-black text-white">${(p.total || 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalle del Presupuesto Seleccionado (Columna derecha) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          {!presupuestoSel ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
              <FileText className="w-8 h-8 mb-2 text-slate-600" />
              <span>Selecciona un presupuesto de la lista para ver su detalle o crea uno nuevo</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Header Detalle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-rose-400 text-lg">{presupuestoSel.numero_presupuesto}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-white font-bold border border-slate-700">
                      {presupuestoSel.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {presupuestoSel.cliente_nombre} &bull; {presupuestoSel.marca} {presupuestoSel.modelo} [{presupuestoSel.patente}]
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={compartirWhatsApp}
                    title="Enviar detalle por WhatsApp"
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={imprimirPresupuesto}
                    title="Imprimir comprobante de cotización"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => eliminarPresupuesto(presupuestoSel.id)}
                    title="Eliminar cotización"
                    className="bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 font-bold text-xs px-2.5 py-2 rounded-xl flex items-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {presupuestoSel.estado !== 'Convertido a OT' && (
                    <button
                      onClick={convertirAOrden}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-600/10 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar y Convertir a OT</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200">
                <span className="text-rose-400 font-bold uppercase text-[10px] block mb-1">Trabajo Solicitado:</span>
                {presupuestoSel.motivo}
              </div>

              {/* Formulario Agregar Ítems */}
              {presupuestoSel.estado !== 'Convertido a OT' && (
                <form onSubmit={agregarItem} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">Tipo:</span>
                    <button
                      type="button"
                      onClick={() => { setTipoItem('REPUESTO'); setDescItem(''); setPrecioItem(''); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        tipoItem === 'REPUESTO' ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white border-rose-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Repuesto
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoItem('MANO_OBRA'); setRepuestoSelId(''); setDescItem(''); setPrecioItem(''); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        tipoItem === 'MANO_OBRA' ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white border-rose-600' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Mano de Obra
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {tipoItem === 'REPUESTO' && (
                      <div className="sm:col-span-2">
                        <select
                          value={repuestoSelId}
                          onChange={(e) => handleSelectRepuesto(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">-- Elegir de Stock --</option>
                          {repuestos.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.nombre} (Stock: {r.stock_actual}) - ${r.precio_venta}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className={tipoItem === 'REPUESTO' ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <input
                        type="text"
                        value={descItem}
                        onChange={(e) => setDescItem(e.target.value)}
                        placeholder="Descripción..."
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={cantItem}
                        onChange={(e) => setCantItem(e.target.value)}
                        placeholder="Cant."
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="any"
                        value={precioItem}
                        onChange={(e) => setPrecioItem(e.target.value)}
                        placeholder="Precio $"
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-rose-950/40"
                    >
                      + Agregar al Presupuesto
                    </button>
                  </div>
                </form>
              )}

              {/* Tabla de Ítems */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {(!presupuestoSel.items || presupuestoSel.items.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500 italic">No hay ítems cargados aún.</td>
                      </tr>
                    ) : (
                      presupuestoSel.items.map(it => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {it.tipo === 'REPUESTO' ? 'Repuesto' : 'M. Obra'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{it.descripcion}</td>
                          <td className="py-2.5 px-3 text-center">{it.cantidad}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">${(it.precio_unitario || 0).toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">${(it.subtotal || 0).toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-center">
                            {presupuestoSel.estado !== 'Convertido a OT' && (
                              <button onClick={() => eliminarItem(it.id)} className="text-slate-500 hover:text-rose-400 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Presupuesto */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Validez: {presupuestoSel.validez_dias} días</span>
                <div className="text-right">
                  <span className="text-xs text-slate-400 mr-2">Total Estimado:</span>
                  <span className="font-black text-xl text-rose-400">
                    ${(presupuestoSel.total || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Modal Nuevo Presupuesto */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Crear Nueva Cotización</h3>

            <form onSubmit={crearPresupuesto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehículo *</label>
                <select
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.filter(v => v.cliente_id === clienteId).map(v => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} [{v.patente}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo / Reparación Solicitada *</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  rows="2"
                  placeholder="ej: Presupuesto embrague y cambio de distribución..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-rose-950/40"
                >
                  Crear y Cargar Ítems
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
