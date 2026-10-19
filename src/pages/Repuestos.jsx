/**
 * CONTROL DE INVENTARIO Y STOCK DE REPUESTOS (Repuestos.jsx)
 * -----------------------------------------------------------
 * Gestión de repuestos, lubricantes, filtros y consumibles:
 * 1. Valuación Económica en Tiempo Real:
 *    - Capital inmovilizado a costo.
 *    - Potencial de facturación a precio de venta al público.
 * 2. Alertas de Stock Mínimo: Destaca con bordes rojos y alertas las piezas a punto de agotarse.
 * 3. Ajustes Rápidos (+/-): Botones para sumar o restar unidades físicamente en 1 clic.
 * 4. Clasificación por categorías y ubicación en estantería (ej: "Estante B2").
 */
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  PlusCircle, 
  AlertTriangle, 
  Coins, 
  TrendingUp, 
  Plus, 
  Minus, 
  Edit3,
  Trash2 
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

export default function Repuestos() {
  const { isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [repuestos, setRepuestos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catSel, setCatSel] = useState('');
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  // Estados para modal de alta / edición de repuesto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [marca, setMarca] = useState('');
  const [stockActual, setStockActual] = useState(1);
  const [stockMinimo, setStockMinimo] = useState(2);
  const [precioCosto, setPrecioCosto] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  // Suscripción reactiva al catálogo de repuestos
  useEffect(() => {
    const unsub = dataManager.subscribe('repuestos', setRepuestos);
    return () => unsub();
  }, []);

  // Lista única de categorías para el selector de filtro
  const categoriasUnicas = Array.from(new Set(repuestos.map(r => r.categoria).filter(Boolean)));

  // Filtrado compuesto por categoría, condición de stock bajo y búsqueda por texto
  const filtrados = repuestos.filter(r => {
    const matchCat = !catSel || r.categoria === catSel;
    const matchBajo = !soloBajoStock || (r.stock_actual <= r.stock_minimo);
    const term = busqueda.toLowerCase().trim();
    const matchBusq = !term ||
      (r.codigo && r.codigo.toLowerCase().includes(term)) ||
      (r.nombre && r.nombre.toLowerCase().includes(term)) ||
      (r.marca && r.marca.toLowerCase().includes(term));
    return matchCat && matchBajo && matchBusq;
  });

  // Cálculo de valuación del inventario del depósito
  const valCosto = repuestos.reduce((sum, r) => sum + ((r.stock_actual || 0) * (Number(r.precio_costo) || 0)), 0);
  const valVenta = repuestos.reduce((sum, r) => sum + ((r.stock_actual || 0) * (Number(r.precio_venta) || 0)), 0);

  const guardarRepuesto = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (isAdmin && Number(precioVenta) <= 0) return;

    // Si el usuario no es admin, se preserva el precio existente en caso de edicion
    const repExistente = editId ? repuestos.find(r => r.id === editId) : null;

    const data = {
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      marca: marca.trim(),
      stock_actual: Number(stockActual) || 0,
      stock_minimo: Number(stockMinimo) || 2,
      precio_costo: isAdmin ? (Number(precioCosto) || 0) : (repExistente?.precio_costo || 0),
      precio_venta: isAdmin ? (Number(precioVenta) || 0) : (repExistente?.precio_venta || 0),
      ubicacion: ubicacion.trim()
    };

    if (editId) {
      await dataManager.update('repuestos', editId, data);
    } else {
      await dataManager.add('repuestos', data);
    }

    cerrarModal();
  };

  const abrirEditar = (r) => {
    setEditId(r.id);
    setCodigo(r.codigo || '');
    setNombre(r.nombre || '');
    setCategoria(r.categoria || 'General');
    setMarca(r.marca || '');
    setStockActual(r.stock_actual || 0);
    setStockMinimo(r.stock_minimo || 2);
    setPrecioCosto(r.precio_costo || '');
    setPrecioVenta(r.precio_venta || '');
    setUbicacion(r.ubicacion || '');
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setEditId(null);
    setCodigo('');
    setNombre('');
    setCategoria('General');
    setMarca('');
    setStockActual(1);
    setStockMinimo(2);
    setPrecioCosto('');
    setPrecioVenta('');
    setUbicacion('');
    setMostrarModal(false);
  };

  const ajusteRapido = async (id, delta) => {
    const rep = repuestos.find(r => r.id === id);
    if (!rep) return;
    const nuevo = Math.max(0, (rep.stock_actual || 0) + delta);
    await dataManager.update('repuestos', id, { stock_actual: nuevo });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-400" />
            <span>Inventario y Stock de Repuestos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de piezas, alertas de reposición y valorización</p>
        </div>

        <button
          onClick={() => { setEditId(null); setMostrarModal(true); }}
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Repuesto</span>
        </button>
      </div>

      {/* Metricas de Inventario y Valorizacion */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Artículos</span>
          <h3 className="text-2xl font-black text-white mt-1">{repuestos.length}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">En catálogo activo</p>
        </div>

        {isAdmin ? (
          <>
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Costo del Stock</span>
              <h3 className="text-2xl font-black text-rose-400 mt-1">${valCosto.toLocaleString('es-AR')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Capital invertido</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Venta Proyectada</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">${valVenta.toLocaleString('es-AR')}</h3>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">Recaudación estimada</p>
            </div>
          </>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Stock Crítico</span>
            <h3 className="text-2xl font-black text-rose-400 mt-1">
              {repuestos.filter(r => (r.stock_actual || 0) <= (r.stock_minimo || 2)).length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Piezas para reposición</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Código, nombre o marca..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={catSel}
          onChange={(e) => setCatSel(e.target.value)}
          className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
        >
          <option value="">Todas las Categorías</option>
          {categoriasUnicas.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={soloBajoStock}
            onChange={(e) => setSoloBajoStock(e.target.checked)}
            className="rounded text-rose-500 focus:ring-0 bg-slate-950 border-slate-800"
          />
          <span className="font-bold text-rose-400">Solo Stock Crítico</span>
        </label>
      </div>

      {/* Tabla de Repuestos */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Código</th>
                <th className="px-5 py-3.5">Repuesto / Pieza</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5 text-center">Stock</th>
                {isAdmin && (
                  <>
                    <th className="px-5 py-3.5 text-right">Costo</th>
                    <th className="px-5 py-3.5 text-right">Precio Venta</th>
                  </>
                )}
                <th className="px-5 py-3.5">Ubicación</th>
                <th className="px-5 py-3.5 text-center">Ajuste +/-</th>
                <th className="px-5 py-3.5 text-center">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 7} className="px-5 py-12 text-center text-slate-500 italic">
                    No se encontraron repuestos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtrados.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-400">{r.codigo || '-'}</td>
                    
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{r.nombre}</div>
                      <div className="text-[10px] text-slate-500">{r.marca || 'Sin marca'}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-700">
                        {r.categoria}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      {r.stock_actual <= 0 ? (
                        <span className="bg-rose-500/20 text-rose-400 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-rose-500/30 animate-pulse">
                          Agotado (0)
                        </span>
                      ) : r.stock_actual <= r.stock_minimo ? (
                        <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">
                          {r.stock_actual} (Mín: {r.stock_minimo})
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
                          {r.stock_actual}
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <>
                        <td className="px-5 py-3.5 text-right text-slate-400">${(r.precio_costo || 0).toLocaleString('es-AR')}</td>
                        <td className="px-5 py-3.5 text-right font-black text-white">${(r.precio_venta || 0).toLocaleString('es-AR')}</td>
                      </>
                    )}
                    <td className="px-5 py-3.5 text-slate-500">{r.ubicacion || '-'}</td>

                    {/* Ajuste rápido */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => ajusteRapido(r.id, -1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-bold flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => ajusteRapido(r.id, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 font-bold flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => abrirEditar(r)} className="p-1 text-slate-500 hover:text-rose-400">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo / Editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editId ? 'Modificar Repuesto' : 'Agregar Repuesto al Inventario'}
            </h3>

            <form onSubmit={guardarRepuesto} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="ej: FIL-012"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                    placeholder="Frenos, Filtros..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre / Descripción *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="ej: Pastillas de Freno Delanteras"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="ej: Bosch"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Estante A1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-bold"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Costo ($)</label>
                    <input
                      type="number"
                      value={precioCosto}
                      onChange={(e) => setPrecioCosto(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Venta ($) *</label>
                    <input
                      type="number"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      required={isAdmin}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-black"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: '¿Eliminar Repuesto del Inventario?',
                        message: `Se eliminará "${nombre || 'este repuesto'}" del stock y catálogo comercial.`,
                        confirmText: 'Eliminar Repuesto',
                        cancelText: 'Cancelar',
                        variant: 'rose',
                        iconType: 'trash'
                      });
                      if (ok) {
                        await dataManager.delete('repuestos', editId);
                        cerrarModal();
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Repuesto</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-rose-950/40"
                  >
                    Guardar en Inventario
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
