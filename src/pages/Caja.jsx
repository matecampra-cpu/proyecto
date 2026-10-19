/**
 * GESTIÓN DE CAJA Y FINANZAS (Caja.jsx)
 * --------------------------------------
 * Libro diario de tesorería del taller:
 * 1. Monitoreo del flujo de dinero:
 *    - Total de Ingresos (cobros de órdenes y señas).
 *    - Total de Egresos (gastos operativos, repuestos, herramientas, servicios).
 *    - Balance Neto en tiempo real.
 * 2. Registro manual de entradas o salidas de dinero con método de pago (Efectivo, Transferencia, Tarjeta).
 * 3. Historial cronológico con badge diferenciador verde (+) o rojo (-).
 */
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Wallet, 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  Scale,
  Trash2 
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';

export default function Caja() {
  const { isAdmin } = useAuth();

  // Redirección inmediata si el usuario no es administrador (área reservada)
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const { confirm } = useConfirm();
  const [movimientos, setMovimientos] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState('');

  // Estados para modal de nuevo movimiento de dinero
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipo, setTipo] = useState('EGRESO');
  const [categoria, setCategoria] = useState('Compra Repuestos');
  const [concepto, setConcepto] = useState('');
  const [metodo, setMetodo] = useState('Efectivo');
  const [monto, setMonto] = useState('');

  // Suscripción reactiva al libro diario de caja
  useEffect(() => {
    const unsub = dataManager.subscribe('movimientos_caja', setMovimientos);
    return () => unsub();
  }, []);

  // Filtrado por tipo de flujo (todos, solo ingresos, solo egresos)
  const filtrados = movimientos.filter(m => !tipoFiltro || m.tipo === tipoFiltro);

  // ---------------------------------------------------------------------------
  // CÁLCULOS FINANCIEROS AUTOMÁTICOS
  // ---------------------------------------------------------------------------
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((s, m) => s + (Number(m.monto) || 0), 0);

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((s, m) => s + (Number(m.monto) || 0), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const registrarMovimiento = async (e) => {
    e.preventDefault();
    if (!concepto.trim() || Number(monto) <= 0) return;

    await dataManager.add('movimientos_caja', {
      tipo,
      categoria,
      concepto: concepto.trim(),
      metodo_pago: metodo,
      monto: Number(monto),
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    setConcepto('');
    setMonto('');
    setMostrarModal(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-400" />
            <span>Caja Diaria y Finanzas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de ingresos por servicios y egresos del taller</p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      {/* Tarjetas de Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ingresos</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">+${totalIngresos.toLocaleString('es-AR')}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Cobros de OTs y servicios</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Egresos</span>
          <h3 className="text-2xl font-black text-rose-400 mt-1">-${totalEgresos.toLocaleString('es-AR')}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Gastos operativos y repuestos</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Balance Neto</span>
          <h3 className={`text-2xl font-black mt-1 ${balanceNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${balanceNeto.toLocaleString('es-AR')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Resultado de caja</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm flex items-center space-x-3">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
        >
          <option value="">Todos los Movimientos</option>
          <option value="INGRESO">Solo Ingresos (+)</option>
          <option value="EGRESO">Solo Egresos (-)</option>
        </select>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">Concepto</th>
                <th className="px-5 py-3.5">Método de Pago</th>
                <th className="px-5 py-3.5 text-right">Monto</th>
                <th className="px-5 py-3.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500 italic">
                    No se encontraron movimientos registrados.
                  </td>
                </tr>
              ) : (
                filtrados.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">{m.fecha}</td>
                    
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.tipo === 'INGRESO' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {m.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-300">{m.categoria}</td>
                    <td className="px-5 py-3.5 font-bold text-white">{m.concepto}</td>
                    <td className="px-5 py-3.5 text-slate-400">{m.metodo_pago}</td>

                    <td className={`px-5 py-3.5 text-right font-black text-sm ${
                      m.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {m.tipo === 'INGRESO' ? '+' : '-'}${(Number(m.monto) || 0).toLocaleString('es-AR')}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: '¿Eliminar Movimiento de Caja?',
                            message: `Se anulará el registro "${m.concepto}" de $${(Number(m.monto) || 0).toLocaleString('es-AR')}.`,
                            confirmText: 'Eliminar Movimiento',
                            cancelText: 'Cancelar',
                            variant: 'rose',
                            iconType: 'trash'
                          });
                          if (ok) {
                            await dataManager.delete('movimientos_caja', m.id);
                          }
                        }}
                        title="Eliminar movimiento"
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Movimiento */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Registrar Movimiento de Caja</h3>

            <form onSubmit={registrarMovimiento} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="EGRESO">Egreso / Gasto (-)</option>
                    <option value="INGRESO">Ingreso (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Compra Repuestos">Compra Repuestos</option>
                    <option value="Herramientas">Herramientas / Insumos</option>
                    <option value="Servicios Taller">Servicios (Luz, Alquiler)</option>
                    <option value="Sueldos">Sueldos / Mano de Obra</option>
                    <option value="Venta Directa">Venta Directa Repuesto</option>
                    <option value="Otro">Otro Gasto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Concepto / Detalle *</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                  placeholder="ej: Compra de garrafa de refrigerante, pago de luz..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    step="any"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Pago</label>
                  <select
                    value={metodo}
                    onChange={(e) => setMetodo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta Débito">Tarjeta Débito</option>
                    <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                    <option value="MercadoPago/QR">MercadoPago/QR</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-rose-950/40"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
