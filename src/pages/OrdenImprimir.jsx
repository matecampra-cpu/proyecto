/**
 * VISTA DE IMPRESIÓN A4 / COMPROBANTE DE ORDEN (OrdenImprimir.jsx)
 * -----------------------------------------------------------------
 * Hoja de formato imprimible optimizada para papel A4:
 * 1. Membrete oficial del taller (nombre comercial, lema, CUIT, teléfono, dirección).
 * 2. Datos del cliente y vehículo (patente destacada, kilometraje, combustible).
 * 3. Detalle de repuestos provistos y mano de obra realizada.
 * 4. Resumen financiero: total de trabajos, pagos recibidos y saldo pendiente.
 * 5. Términos legales de garantía y líneas de firma para conformidad del cliente.
 * 6. Soporte de estilos `@media print` que ocultan botones al mandar a imprimir.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function OrdenImprimir() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const [orden, setOrden] = useState(null);
  const config = dataManager.getConfig();

  useEffect(() => {
    const ordenes = dataManager.getLocal('ordenes');
    const ord = ordenes.find(o => o.id === id);
    if (ord) setOrden(ord);
  }, [id]);

  if (!orden) return <div className="p-8 text-center text-slate-800">Cargando comprobante...</div>;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 p-4 sm:p-8">
      
      {/* Barra de control en pantalla */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link 
          to={`/ordenes/${orden.id}`}
          className="bg-white border border-slate-300 text-slate-700 hover:text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Orden</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>{isAdmin ? 'Imprimir Comprobante A4' : 'Imprimir Hoja Técnica de Taller'}</span>
        </button>
      </div>

      {/* Hoja A4 Imprimible */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-200">
        
        {/* Encabezado con Membrete */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wide">
              {config.nombre_taller || 'TALLER MECÁNICO'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{config.lema || 'Diagnóstico y Mecánica Integral'}</p>
            <div className="mt-3 text-xs text-slate-600 space-y-0.5">
              <p>{config.direccion}</p>
              <p>Tel: {config.telefono}</p>
              <p>CUIT / RUT: {config.cuit || '-'}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-950 text-rose-400 px-4 py-2 rounded-xl font-mono font-black text-lg shadow-sm">
              {orden.numero_orden}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-right mt-1">
              {isAdmin ? 'Orden de Servicio' : 'Hoja de Taller'}
            </div>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              <p><span className="font-semibold text-slate-700">Fecha Ingreso:</span> {orden.fecha_ingreso}</p>
              {orden.fecha_entrega && (
                <p><span className="font-semibold text-slate-700">Fecha Entrega:</span> {orden.fecha_entrega}</p>
              )}
              <p><span className="font-semibold text-slate-700">Estado:</span> {orden.estado}</p>
            </div>
          </div>
        </div>

        {/* Ficha Cliente & Vehículo */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
          <div>
            <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Datos del Cliente</h3>
            <p><span className="font-semibold text-slate-500">Nombre:</span> <b className="text-slate-900">{orden.cliente_nombre}</b></p>
            <p><span className="font-semibold text-slate-500">Teléfono:</span> {orden.cliente_telefono || 'S/D'}</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Datos del Vehículo</h3>
            <p><span className="font-semibold text-slate-500">Patente:</span> <b className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900">{orden.patente}</b></p>
            <p><span className="font-semibold text-slate-500">Unidad:</span> {orden.marca} {orden.modelo}</p>
            <p><span className="font-semibold text-slate-500">Odómetro:</span> {(orden.kilometraje_ingreso || 0).toLocaleString('es-AR')} km &bull; Combustible: {orden.nivel_combustible}</p>
          </div>
        </div>

        {/* Motivo y Diagnóstico */}
        <div className="space-y-3 mb-6 text-xs">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-700 uppercase">Motivo del Ingreso / Síntomas:</span>
            <p className="text-slate-800 mt-1 font-medium">{orden.motivo_ingreso}</p>
          </div>

          {orden.diagnostico && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-700 uppercase">Diagnóstico e Informe Técnico:</span>
              <p className="text-slate-800 mt-1">{orden.diagnostico}</p>
            </div>
          )}
        </div>

        {/* Tabla de Trabajos */}
        <div className="mb-6">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-2.5">Tipo</th>
                <th className="p-2.5">Detalle de Mano de Obra o Repuesto</th>
                <th className="p-2.5 text-center">Cant.</th>
                {isAdmin && (
                  <>
                    <th className="p-2.5 text-right">Precio Unit.</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!orden.items || orden.items.length === 0) ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 3} className="p-4 text-center text-slate-400 italic">No hay ítems registrados.</td>
                </tr>
              ) : (
                orden.items.map(it => (
                  <tr key={it.id}>
                    <td className="p-2.5 text-slate-500 font-semibold">{it.tipo === 'REPUESTO' ? 'Repuesto' : 'M. Obra'}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{it.descripcion}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{it.cantidad}</td>
                    {isAdmin && (
                      <>
                        <td className="p-2.5 text-right text-slate-600">${(it.precio_unitario || 0).toLocaleString('es-AR')}</td>
                        <td className="p-2.5 text-right font-black text-slate-950">${(it.subtotal || 0).toLocaleString('es-AR')}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Liquidación Económica (Solo Administrador / Dueño) */}
        {isAdmin && (
          <div className="flex justify-end mb-8 text-xs">
            <div className="w-64 space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Mano de Obra:</span>
                <span>${(orden.total_mano_obra || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Repuestos e Insumos:</span>
                <span>${(orden.total_repuestos || 0).toLocaleString('es-AR')}</span>
              </div>
              {Number(orden.descuento) > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Descuento:</span>
                  <span>-${Number(orden.descuento).toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-950">
                <span>TOTAL:</span>
                <span>${(orden.total || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Total Abonado:</span>
                <span>${(orden.total_pagado || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between font-black text-slate-950 pt-1 border-t border-dashed border-slate-300">
                <span>Saldo Restante:</span>
                <span>${(orden.saldo_pendiente || 0).toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Garantía */}
        <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 leading-relaxed mb-12">
          <p className="font-bold text-slate-700 mb-0.5">TÉRMINOS DE GARANTÍA:</p>
          <p>{config.garantia_texto || 'Garantía legal sobre reparaciones realizadas.'}</p>
          <p className="mt-1">{config.pie_pagina || 'Gracias por confiar en nuestros servicios.'}</p>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-16 pt-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              Firma y Sello del Taller
            </div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
              Conformidad del Cliente
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
