/**
 * SERVICIO DE BASE DE DATOS Y SINCRONIZACIÓN EN TIEMPO REAL (firebase.js)
 * ------------------------------------------------------------------------
 * Arquitectura híbrida serverless:
 * 1. Inicializa Firebase Firestore (NoSQL) y Firebase Authentication.
 * 2. Provee un `DataManager` con patrón reactivo (Pub-Sub / Observable).
 * 3. Si Firebase está configurado y conectado, sincroniza en tiempo real con la nube.
 * 4. Si la red cae o se inicia en modo local, mantiene los datos en LocalStorage reactivo
 *    para que la aplicación NUNCA se detenga y funcione al 100% sin esperas.
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// -----------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE CONEXIÓN A GOOGLE FIREBASE
// -----------------------------------------------------------------------------
const DEFAULT_FIREBASE_CONFIG = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "taller-47c21",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "taller-47c21.firebasestorage.app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "taller-47c21.firebaseapp.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""
};

// Permite sobreescribir las credenciales desde la pantalla de Configuración del taller
const savedConfig = localStorage.getItem('taller_firebase_config');
export const firebaseConfig = savedConfig ? JSON.parse(savedConfig) : DEFAULT_FIREBASE_CONFIG;

// Instancias de los servicios
let appInstance = null;
let dbInstance = null;
let authInstance = null;
let isFirebaseOnline = false;

// Inicialización segura con control de errores para no romper la ejecución
try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    isFirebaseOnline = true;
  } else {
    console.warn('Firebase no inicializado: falta VITE_FIREBASE_API_KEY en variables de entorno o configuración. Iniciando modo reactivo local.');
  }
} catch (error) {
  console.warn('Iniciando modo de almacenamiento reactivo local (Firebase no inicializado aún):', error);
}

// Exportación de las instancias para uso directo si se requiere
export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;

// -----------------------------------------------------------------------------
// 2. DATOS INICIALES DE DEMOSTRACIÓN (Para arranque inmediato sin configuración)
// -----------------------------------------------------------------------------
// Estos datos precargan clientes, vehículos con patentes, stock de repuestos,
// órdenes de trabajo (OTs), presupuestos y movimientos de caja para que el taller
// tenga contenido realista desde el primer segundo de uso.
const SEED_DATA = {
  clientes: [
    { id: 'cli_1', nombre: 'Carlos Gómez', telefono: '1155443322', email: 'carlos.gomez@gmail.com', documento: '32145678', direccion: 'Av. San Martín 842', notas: 'Cliente frecuente. Prefiere repuestos originales.' },
    { id: 'cli_2', nombre: 'Mariana López', telefono: '1144332211', email: 'mlopez@hotmail.com', documento: '35987654', direccion: 'Calle Belgrano 1250', notas: 'Atender por la mañana.' },
    { id: 'cli_3', nombre: 'Transportes Norte S.R.L.', telefono: '1133221100', email: 'logistica@transnorte.com', documento: '30-71234567-8', direccion: 'Ruta 8 Km 45', notas: 'Flota de utilitarios.' }
  ],
  vehiculos: [
    { id: 'veh_1', cliente_id: 'cli_1', cliente_nombre: 'Carlos Gómez', patente: 'AE123CD', marca: 'Toyota', modelo: 'Corolla 1.8 XEI', anio: 2021, kilometraje: 62500, color: 'Gris Plata', combustible: 'Nafta', motor: '2ZR-FE', notas: '' },
    { id: 'veh_2', cliente_id: 'cli_2', cliente_nombre: 'Mariana López', patente: 'AA987ZZ', marca: 'Ford', modelo: 'Fiesta Kinetic 1.6', anio: 2017, kilometraje: 98400, color: 'Azul Eléctrico', combustible: 'Nafta', motor: 'Sigma 1.6', notas: '' },
    { id: 'veh_3', cliente_id: 'cli_3', cliente_nombre: 'Transportes Norte S.R.L.', patente: 'AF456GH', marca: 'Renault', modelo: 'Kangoo Stepway 1.6', anio: 2022, kilometraje: 45000, color: 'Blanco Glaciar', combustible: 'Nafta/GNC', motor: 'HR16DE', notas: '' }
  ],
  repuestos: [
    { id: 'rep_1', codigo: 'ACE-5W30', nombre: 'Aceite Sintético 5W-30 (Bidón 4L)', categoria: 'Filtros y Lubricantes', marca: 'Castrol', stock_actual: 8, stock_minimo: 3, precio_costo: 22000, precio_venta: 35000, ubicacion: 'Estante A1' },
    { id: 'rep_2', codigo: 'ACE-10W40', nombre: 'Aceite Semi-Sintético 10W-40 (4L)', categoria: 'Filtros y Lubricantes', marca: 'Total', stock_actual: 12, stock_minimo: 4, precio_costo: 18000, precio_venta: 28000, ubicacion: 'Estante A2' },
    { id: 'rep_3', codigo: 'FIL-ACE-01', nombre: 'Filtro de Aceite Universal W712', categoria: 'Filtros y Lubricantes', marca: 'Mann Filter', stock_actual: 15, stock_minimo: 5, precio_costo: 4500, precio_venta: 8500, ubicacion: 'Estante A3' },
    { id: 'rep_4', codigo: 'FIL-AIRE-02', nombre: 'Filtro de Aire Motor', categoria: 'Filtros y Lubricantes', marca: 'Bosch', stock_actual: 6, stock_minimo: 3, precio_costo: 6000, precio_venta: 11000, ubicacion: 'Estante A4' },
    { id: 'rep_5', codigo: 'PAS-FR-DEL', nombre: 'Juego Pastillas de Freno Delanteras', categoria: 'Frenos', marca: 'Fras-le', stock_actual: 5, stock_minimo: 2, precio_costo: 16000, precio_venta: 29000, ubicacion: 'Estante B1' },
    { id: 'rep_6', codigo: 'DIS-FR-DEL', nombre: 'Discos de Freno Ventilados (Par)', categoria: 'Frenos', marca: 'Fremax', stock_actual: 3, stock_minimo: 2, precio_costo: 38000, precio_venta: 62000, ubicacion: 'Estante B2' },
    { id: 'rep_7', codigo: 'BUJ-NGK-4', nombre: 'Juego de Bujías de Encendido (x4)', categoria: 'Encendido y Motor', marca: 'NGK', stock_actual: 2, stock_minimo: 3, precio_costo: 12000, precio_venta: 21000, ubicacion: 'Estante C1' },
    { id: 'rep_8', codigo: 'AMO-DEL-G', nombre: 'Amortiguadores Delanteros (Par)', categoria: 'Suspensión', marca: 'Monroe', stock_actual: 1, stock_minimo: 2, precio_costo: 70000, precio_venta: 115000, ubicacion: 'Estante D1' }
  ],
  ordenes: [
    {
      id: 'ot_1',
      numero_orden: 'OT-0001',
      cliente_id: 'cli_1',
      cliente_nombre: 'Carlos Gómez',
      cliente_telefono: '1155443322',
      vehiculo_id: 'veh_1',
      patente: 'AE123CD',
      marca: 'Toyota',
      modelo: 'Corolla 1.8 XEI',
      fecha_ingreso: '2026-09-13',
      fecha_prometida: '2026-09-16',
      kilometraje_ingreso: 62500,
      nivel_combustible: '3/4',
      checklist: { auxilio: true, gato: true, papeles: true, stereo: true },
      danos_previos: 'Paragolpe delantero con leve raspón izquierdo',
      motivo_ingreso: 'Service programado de 60.000 km y ruido al frenar',
      diagnostico: 'Pastillas delanteras desgastadas al 15%. Cambio de aceite y filtros necesario.',
      estado: 'En Reparación',
      mecanico_asignado: 'Martín',
      total_mano_obra: 35000,
      total_repuestos: 72500,
      descuento: 0,
      total: 107500,
      total_pagado: 50000,
      saldo_pendiente: 57500,
      items: [
        { id: 'it_1', tipo: 'REPUESTO', repuesto_id: 'rep_1', descripcion: 'Aceite Sintético 5W-30 (Bidón 4L)', cantidad: 1, precio_unitario: 35000, subtotal: 35000 },
        { id: 'it_2', tipo: 'REPUESTO', repuesto_id: 'rep_3', descripcion: 'Filtro de Aceite Universal W712', cantidad: 1, precio_unitario: 8500, subtotal: 8500 },
        { id: 'it_3', tipo: 'REPUESTO', repuesto_id: 'rep_5', descripcion: 'Juego Pastillas de Freno Delanteras', cantidad: 1, precio_unitario: 29000, subtotal: 29000 },
        { id: 'it_4', tipo: 'MANO_OBRA', descripcion: 'Mano de obra service completo y recambio de pastillas', cantidad: 1, precio_unitario: 35000, subtotal: 35000 }
      ],
      pagos: [
        { id: 'p_1', fecha: '2026-09-13 10:30', metodo: 'Transferencia', monto: 50000, concepto: 'Seña de ingreso' }
      ]
    },
    {
      id: 'ot_2',
      numero_orden: 'OT-0002',
      cliente_id: 'cli_2',
      cliente_nombre: 'Mariana López',
      cliente_telefono: '1144332211',
      vehiculo_id: 'veh_2',
      patente: 'AA987ZZ',
      marca: 'Ford',
      modelo: 'Fiesta Kinetic 1.6',
      fecha_ingreso: '2026-09-14',
      fecha_prometida: '2026-09-15',
      kilometraje_ingreso: 98400,
      nivel_combustible: '1/4',
      checklist: { auxilio: true, gato: true, papeles: true, stereo: true },
      danos_previos: '',
      motivo_ingreso: 'Luz de Check Engine encendida y tironeo en baja',
      diagnostico: 'Falla de encendido en cilindro 3. Se realizó recambio de bujías y escaneo.',
      estado: 'Listo para Entrega',
      mecanico_asignado: 'Alejandro',
      total_mano_obra: 28000,
      total_repuestos: 21000,
      descuento: 2000,
      total: 47000,
      total_pagado: 47000,
      saldo_pendiente: 0,
      items: [
        { id: 'it_5', tipo: 'REPUESTO', repuesto_id: 'rep_7', descripcion: 'Juego de Bujías de Encendido (x4)', cantidad: 1, precio_unitario: 21000, subtotal: 21000 },
        { id: 'it_6', tipo: 'MANO_OBRA', descripcion: 'Diagnóstico con escáner y afinación', cantidad: 1, precio_unitario: 28000, subtotal: 28000 }
      ],
      pagos: [
        { id: 'p_2', fecha: '2026-09-15 11:00', metodo: 'Efectivo', monto: 47000, concepto: 'Cancelación total' }
      ]
    }
  ],
  presupuestos: [
    {
      id: 'pres_1',
      numero_presupuesto: 'PRES-0001',
      cliente_id: 'cli_3',
      cliente_nombre: 'Transportes Norte S.R.L.',
      cliente_telefono: '1133221100',
      vehiculo_id: 'veh_3',
      patente: 'AF456GH',
      marca: 'Renault',
      modelo: 'Kangoo Stepway 1.6',
      fecha: '2026-09-15',
      validez_dias: 15,
      motivo: 'Presupuesto cambio de kit de distribución y bomba de agua',
      estado: 'Pendiente',
      total_mano_obra: 45000,
      total_repuestos: 92000,
      total: 137000,
      notas: 'Incluye repuestos originales con garantía de colocación.',
      items: [
        { id: 'pit_1', tipo: 'REPUESTO', descripcion: 'Kit de Distribución con Bomba Gates', cantidad: 1, precio_unitario: 92000, subtotal: 92000 },
        { id: 'pit_2', tipo: 'MANO_OBRA', descripcion: 'Mano de obra puesta a punto y desarme', cantidad: 1, precio_unitario: 45000, subtotal: 45000 }
      ]
    }
  ],
  turnos: [
    {
      id: 'trn_1',
      codigo: 'TRN-1001',
      cliente_nombre: 'Martín Rodríguez',
      cliente_telefono: '1166778899',
      cliente_email: 'martin.rodriguez@gmail.com',
      patente: 'AD345EF',
      vehiculo_modelo: 'Volkswagen Gol Trend 1.6',
      anio: 2019,
      servicio_solicitado: 'Service Periódico (Aceite y Filtros)',
      fecha_solicitada: '2026-09-18',
      franja_horaria: 'Mañana (08:30 - 12:30)',
      motivo_detalle: 'Corresponde service de los 50.000 km. Revisar también pastillas de freno.',
      estado: 'Pendiente',
      fecha_creacion: '2026-09-16 10:15'
    },
    {
      id: 'trn_2',
      codigo: 'TRN-1002',
      cliente_nombre: 'Valeria Benítez',
      cliente_telefono: '1122334455',
      cliente_email: 'valeria.b@outlook.com',
      patente: 'AC789JK',
      vehiculo_modelo: 'Peugeot 208 1.6 Allure',
      anio: 2020,
      servicio_solicitado: 'Diagnóstico / Luz Check Engine',
      fecha_solicitada: '2026-09-19',
      franja_horaria: 'Tarde (14:00 - 18:30)',
      motivo_detalle: 'Se encendió testigo en tablero y hace un ruido al regular.',
      estado: 'Confirmado',
      fecha_creacion: '2026-09-16 11:30'
    }
  ],
  movimientos_caja: [
    { id: 'mov_1', tipo: 'INGRESO', categoria: 'Cobro OT', concepto: 'Seña OT-0001 (Carlos Gómez)', metodo_pago: 'Transferencia', monto: 50000, fecha: '2026-09-13 10:30' },
    { id: 'mov_2', tipo: 'INGRESO', categoria: 'Cobro OT', concepto: 'Cancelación OT-0002 (Mariana López)', metodo_pago: 'Efectivo', monto: 47000, fecha: '2026-09-15 11:00' },
    { id: 'mov_3', tipo: 'EGRESO', categoria: 'Herramientas', concepto: 'Juego de tubos Torx para tren delantero', metodo_pago: 'Transferencia', monto: 35000, fecha: '2026-09-14 16:20' }
  ],
  configuracion: {
    nombre_taller: 'Taller Mecánico Especializado',
    lema: 'Diagnóstico Computarizado & Mecánica Integral',
    telefono: '+54 9 11 1234-5678',
    email: 'contacto@mitaller.com',
    direccion: 'Av. Principal 1234',
    cuit: '30-12345678-9',
    moneda_simbolo: '$',
    garantia_texto: 'Garantía de 90 días o 3.000 km en mano de obra y repuestos provistos por el taller.',
    pie_pagina: 'Gracias por confiar en nuestro servicio profesional.'
  }
};

// Auto-inicialización del almacenamiento local la primera vez que se visita el sistema
Object.keys(SEED_DATA).forEach(key => {
  const stored = localStorage.getItem(`taller_${key}`);
  if (!stored) {
    localStorage.setItem(`taller_${key}`, JSON.stringify(SEED_DATA[key]));
  }
});

// -----------------------------------------------------------------------------
// 3. CLASE DataManager (PATRÓN OBSERVABLE / SINCRONIZADOR EN TIEMPO REAL)
// -----------------------------------------------------------------------------
// Esta clase centraliza todas las consultas de la aplicación.
// Implementa suscripciones tipo onSnapshot para que cualquier vista (ej: Stock o Kanban)
// se actualice de inmediato en la pantalla sin tener que recargar el navegador.
class DataManager {
  constructor() {
    // Registro de escuchas (callbacks) asociados a cada colección
    this.listeners = {};
  }

  /**
   * Suscribe un componente de React a los cambios de una colección con ARQUITECTURA CACHE-FIRST:
   * 1. Entrega INMEDIATAMENTE los datos locales (0 milisegundos de latencia, cero pantalla negra o espera).
   * 2. Registra el callback en el bus local reactivo para que cualquier alta/baja/modificación se refleje al instante.
   * 3. En segundo plano (asíncrono sin bloquear la interfaz), sincroniza con Firestore si hay red.
   */
  subscribe(collectionName, callback) {
    // 1. ENTREGA INMEDIATA AL COMPONENTE (Cero demora)
    const localData = this.getLocal(collectionName);
    try {
      callback(localData);
    } catch (e) {
      console.error(`Error en callback inicial para [${collectionName}]:`, e);
    }

    // 2. REGISTRO EN EL BUS REACTIVO LOCAL
    if (!this.listeners[collectionName]) {
      this.listeners[collectionName] = [];
    }
    this.listeners[collectionName].push(callback);

    let firestoreUnsub = null;

    // 3. SINCRONIZACIÓN ASÍNCRONA EN SEGUNDO PLANO CON FIRESTORE
    if (dbInstance && isFirebaseOnline) {
      try {
        const colRef = collection(dbInstance, collectionName);
        const q = query(colRef);
        firestoreUnsub = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(`taller_${collectionName}`, JSON.stringify(data));
            callback(data);
          }
        }, (error) => {
          // No bloquea la aplicación si la red de Firebase es lenta o intermitente
          console.warn(`Sincronización en segundo plano Firestore [${collectionName}] no disponible, operando con cache local:`, error.message);
        });
      } catch (e) {
        console.warn(`Error al conectar con Firestore [${collectionName}]:`, e);
      }
    }

    // Retorna la función limpiadora para useEffect
    return () => {
      if (this.listeners[collectionName]) {
        this.listeners[collectionName] = this.listeners[collectionName].filter(cb => cb !== callback);
      }
      if (firestoreUnsub) {
        try {
          firestoreUnsub();
        } catch (_) {}
      }
    };
  }

  /**
   * Notifica a todos los componentes suscriptos que los datos de una colección cambiaron
   */
  notify(collectionName) {
    const data = this.getLocal(collectionName);
    if (this.listeners[collectionName]) {
      this.listeners[collectionName].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error al notificar suscriptor [${collectionName}]:`, err);
        }
      });
    }
  }

  /**
   * Lee la colección desde LocalStorage con control de errores y datos predeterminados
   */
  getLocal(collectionName) {
    try {
      const item = localStorage.getItem(`taller_${collectionName}`);
      if (!item) {
        const seed = SEED_DATA[collectionName];
        return Array.isArray(seed) ? [...seed] : (seed || []);
      }
      const parsed = JSON.parse(item);
      if (parsed === null || parsed === undefined) {
        const seed = SEED_DATA[collectionName];
        return Array.isArray(seed) ? [...seed] : (seed || []);
      }
      return parsed;
    } catch {
      const seed = SEED_DATA[collectionName];
      return Array.isArray(seed) ? [...seed] : (seed || []);
    }
  }

  /**
   * Guarda los datos en LocalStorage y dispara la notificación reactiva inmediata
   */
  setLocal(collectionName, data) {
    try {
      localStorage.setItem(`taller_${collectionName}`, JSON.stringify(data));
    } catch (storageErr) {
      console.warn(`Error al escribir en LocalStorage [${collectionName}]:`, storageErr);
    }
    this.notify(collectionName);
  }

  /**
   * Agrega un nuevo registro con respuesta optimista instantánea (0ms):
   * 1. Actualiza inmediatamente el almacenamiento local y la interfaz (sin esperas).
   * 2. Envía la persistencia a Firestore en segundo plano sin bloquear el hilo de ejecución.
   */
  async add(collectionName, item) {
    try {
      const id = item.id || ('id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
      const newItem = { ...item, id, createdAt: item.createdAt || new Date().toISOString() };

      // Actualización reactiva instantánea en el cliente (0 ms)
      const current = this.getLocal(collectionName);
      const safeCurrent = Array.isArray(current) ? current : [];
      const updated = [newItem, ...safeCurrent];
      this.setLocal(collectionName, updated);

      // Persistencia asíncrona no bloqueante en Firestore
      if (dbInstance && isFirebaseOnline) {
        try {
          addDoc(collection(dbInstance, collectionName), newItem).catch(e => {
            console.warn(`Firestore background save notice [${collectionName}]:`, e.message);
          });
        } catch (syncErr) {
          console.warn(`Firestore synchronous save notice [${collectionName}]:`, syncErr.message);
        }
      }

      return newItem;
    } catch (err) {
      console.error(`Error en DataManager.add [${collectionName}]:`, err);
      throw err;
    }
  }

  /**
   * Actualiza un registro existente con respuesta optimista instantánea (0ms):
   */
  async update(collectionName, id, updates) {
    try {
      // Actualización reactiva instantánea en el cliente (0 ms)
      const current = this.getLocal(collectionName);
      const safeCurrent = Array.isArray(current) ? current : [];
      const updated = safeCurrent.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item);
      this.setLocal(collectionName, updated);

      // Persistencia asíncrona no bloqueante en Firestore
      if (dbInstance && isFirebaseOnline) {
        try {
          updateDoc(doc(dbInstance, collectionName, id), updates).catch(e => {
            console.warn(`Firestore background update notice [${collectionName}]:`, e.message);
          });
        } catch (syncErr) {
          console.warn(`Firestore synchronous update notice [${collectionName}]:`, syncErr.message);
        }
      }
    } catch (err) {
      console.error(`Error en DataManager.update [${collectionName}]:`, err);
      throw err;
    }
  }

  /**
   * Elimina un registro con respuesta optimista instantánea (0ms):
   */
  async delete(collectionName, id) {
    try {
      // Actualización reactiva instantánea en el cliente (0 ms)
      const current = this.getLocal(collectionName);
      const safeCurrent = Array.isArray(current) ? current : [];
      const updated = safeCurrent.filter(item => item.id !== id);
      this.setLocal(collectionName, updated);

      // Persistencia asíncrona no bloqueante en Firestore
      if (dbInstance && isFirebaseOnline) {
        try {
          deleteDoc(doc(dbInstance, collectionName, id)).catch(e => {
            console.warn(`Firestore background delete notice [${collectionName}]:`, e.message);
          });
        } catch (syncErr) {
          console.warn(`Firestore synchronous delete notice [${collectionName}]:`, syncErr.message);
        }
      }
    } catch (err) {
      console.error(`Error en DataManager.delete [${collectionName}]:`, err);
      throw err;
    }
  }

  /**
   * Obtiene la configuración comercial del taller (membrete, teléfono, garantía, CUIT)
   */
  getConfig() {
    try {
      const c = localStorage.getItem('taller_configuracion');
      return c ? JSON.parse(c) : SEED_DATA.configuracion;
    } catch {
      return SEED_DATA.configuracion;
    }
  }

  /**
   * Guarda los cambios de configuración del taller y actualiza los membretes
   */
  saveConfig(newConfig) {
    localStorage.setItem('taller_configuracion', JSON.stringify(newConfig));
  }
}

// Instancia única (Singleton) compartida en toda la aplicación
export const dataManager = new DataManager();

