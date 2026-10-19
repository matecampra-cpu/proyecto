/**
 * CONFIGURACIÓN DEL TALLER Y COPIAS DE SEGURIDAD (Configuracion.jsx)
 * -------------------------------------------------------------------
 * Panel de ajustes institucionales y administración de datos:
 * 1. Personalización del membrete comercial (Nombre del Taller, Lema, CUIT, Teléfono, Dirección).
 * 2. Redacción de términos legales y cláusulas de garantía impresas al pie de los comprobantes A4.
 * 3. EXPORTACIÓN DE BACKUP COMPLETO (JSON):
 *    - Descarga en 1 clic un archivo con todas las colecciones (clientes, vehículos, órdenes, repuestos, caja).
 *    - Garantiza la soberanía y seguridad de la información del taller ante cualquier eventualidad.
 * 4. Monitor de estado de conexión a Google Firebase Firestore.
 */
import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Upload,
  Save, 
  Flame, 
  CheckCircle2, 
  Database,
  AlertTriangle 
} from 'lucide-react';
import { dataManager, firebaseConfig } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';

export default function Configuracion() {
  const { confirm } = useConfirm();
  const [config, setConfig] = useState(() => dataManager.getConfig());
  const [mensaje, setMensaje] = useState('');
  const [errorBackup, setErrorBackup] = useState('');

  /**
   * Guarda los cambios de nombre, dirección, teléfono y garantía del taller
   */
  const handleGuardar = (e) => {
    e.preventDefault();
    dataManager.saveConfig(config);
    setMensaje('Configuración guardada exitosamente.');
    setTimeout(() => setMensaje(''), 3000);
  };

  /**
   * Genera y descarga un archivo JSON con toda la base de datos íntegra del taller
   */
  const exportarBackupJSON = () => {
    const backup = {
      version: '1.0',
      fecha: new Date().toISOString(),
      clientes: dataManager.getLocal('clientes'),
      vehiculos: dataManager.getLocal('vehiculos'),
      ordenes: dataManager.getLocal('ordenes'),
      repuestos: dataManager.getLocal('repuestos'),
      presupuestos: dataManager.getLocal('presupuestos'),
      movimientos_caja: dataManager.getLocal('movimientos_caja'),
      configuracion: dataManager.getConfig()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_taller_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Importa y restaura una copia de seguridad JSON previamente exportada
   */
  const handleImportarJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await confirm({
      title: '¿Restaurar Copia de Seguridad?',
      message: 'Se reemplazarán los datos locales de clientes, vehículos, órdenes y repuestos por los contenidos en el archivo seleccionado.',
      confirmText: 'Restaurar Datos',
      cancelText: 'Cancelar',
      variant: 'amber',
      iconType: 'warning'
    });

    if (!ok) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.clientes) dataManager.setLocal('clientes', data.clientes);
        if (data.vehiculos) dataManager.setLocal('vehiculos', data.vehiculos);
        if (data.ordenes) dataManager.setLocal('ordenes', data.ordenes);
        if (data.repuestos) dataManager.setLocal('repuestos', data.repuestos);
        if (data.presupuestos) dataManager.setLocal('presupuestos', data.presupuestos);
        if (data.movimientos_caja) dataManager.setLocal('movimientos_caja', data.movimientos_caja);
        if (data.configuracion) {
          dataManager.saveConfig(data.configuracion);
          setConfig(data.configuracion);
        }
        setMensaje('Copia de seguridad restaurada exitosamente.');
        setErrorBackup('');
        setTimeout(() => setMensaje(''), 4000);
      } catch (err) {
        setErrorBackup('El archivo seleccionado no tiene un formato de copia de seguridad JSON válido.');
        setTimeout(() => setErrorBackup(''), 4000);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-rose-400" />
          <span>Configuración del Taller y Base de Datos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Personaliza los datos impresos en comprobantes y realiza copias de seguridad
        </p>
      </div>

      {mensaje && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {errorBackup && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorBackup}</span>
        </div>
      )}

      {/* Formulario de Configuración */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 pb-2 border-b border-slate-800">
          <span>Datos Comerciales y Membrete</span>
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial *</label>
              <input
                type="text"
                value={config.nombre_taller || ''}
                onChange={(e) => setConfig({ ...config, nombre_taller: e.target.value })}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lema o Especialidad</label>
              <input
                type="text"
                value={config.lema || ''}
                onChange={(e) => setConfig({ ...config, lema: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={config.telefono || ''}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CUIT / Identificación Fiscal</label>
              <input
                type="text"
                value={config.cuit || ''}
                onChange={(e) => setConfig({ ...config, cuit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección del Taller</label>
            <input
              type="text"
              value={config.direccion || ''}
              onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Texto de Garantía en Comprobantes</label>
            <textarea
              value={config.garantia_texto || ''}
              onChange={(e) => setConfig({ ...config, garantia_texto: e.target.value })}
              rows="2"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>

      {/* Respaldo y Base de Datos */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-sm space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 pb-2 border-b border-slate-800">
          <Database className="w-4 h-4" />
          <span>Copia de Seguridad y Respaldo Completo</span>
        </h2>

        {/* Descargar Backup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <p className="text-xs font-bold text-white">Descargar respaldo de base de datos en archivo JSON</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera un archivo descargable con todas las órdenes de trabajo, clientes, vehículos, stock de repuestos y movimientos de caja.
            </p>
          </div>

          <button
            onClick={exportarBackupJSON}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia JSON</span>
          </button>
        </div>

        {/* Restaurar Backup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">Restaurar base de datos desde copia JSON</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Carga un archivo de respaldo previamente exportado para recuperar clientes, vehículos, órdenes y catálogo.
            </p>
          </div>

          <div>
            <input
              type="file"
              id="import-backup-input"
              accept=".json"
              onChange={handleImportarJSON}
              className="hidden"
            />
            <label
              htmlFor="import-backup-input"
              className="cursor-pointer bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 hover:border-rose-600 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all whitespace-nowrap shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar Copia JSON</span>
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}
