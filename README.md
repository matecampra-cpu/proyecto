# TallerPro Web - Sistema de Gestión de Taller Mecánico

Construido con el stack solicitado: **React 19**, **Vite**, **Tailwind CSS v4 (Dark Boutique)**, **Framer Motion**, **Lucide React**, **Firebase Firestore (NoSQL en tiempo real)** y **Firebase Authentication**.

---

## Características Tecnológicas

- **React 19 & Vite**: Interfaz Single Page Application (SPA) ultrarrápida sin recargas con lazy-loading modular.
- **Tailwind CSS v4 & Dark Boutique Aesthetic**: Paleta visual moderna `#020617`, acentos ámbar y azul acero, tipografía *Plus Jakarta Sans*.
- **Framer Motion**: Animaciones de modales, alertas y transiciones fluidas de estados.
- **Lucide React**: Iconos limpios y minimalistas.
- **Firebase Firestore (NoSQL en tiempo real)**: Sincronización instantánea de órdenes, autos y stock entre todos los dispositivos (computadora de recepción, celulares o tablets en el taller) sin tener que refrescar la página.
- **Firebase Auth**: Control de sesión y roles.

---

## Cómo Iniciar el Sistema en Desarrollo Local

1. Haz doble clic en el archivo:
   ```
   iniciar_desarrollo_local.bat
   ```
2. O ejecuta en la terminal:
   ```bash
   npm run dev
   ```
3. Se abrirá en tu navegador en:
   ```
   http://localhost:5173
   ```

*(Cuentas autorizadas: Administrador `quienotro` / `912129mat` y Mecánico `mecanico` / `mecanico123`)*.

---

## Acceso Web en Producción (Firebase Hosting)

- **URL Oficial del Taller:**
  ```
  https://tallerpro.web.app
  ```

---

## Cómo Desplegar a Firebase Hosting en Producción

1. Para autorizar la subida a tu cuenta de Google por primera vez:
   ```bash
   npx firebase-tools login
   ```
2. Luego haz doble clic en:
   ```
   desplegar_firebase.bat
   ```
3. O ejecuta en tu terminal:
   ```bash
   npm run deploy
   ```

---

## Módulos del Sistema

1. **Tablero Operativo (Kanban en Vivo)**: Visualización en columnas de cada auto en el taller (*Ingresado*, *En Diagnóstico*, *Esperando Repuestos*, *En Reparación*, *Listo para Entrega*, *Entregado*).
2. **Recepción y Órdenes de Trabajo (OT)**:
   - Checklist de combustible (*Reserva*, *1/4*, *1/2*, *3/4*, *Lleno*).
   - Control de auxilio, gato, papeles y estéreo.
   - Registro de rayones y abolladuras previas.
   - Asignación de mano de obra y repuestos con **descuento automático de stock**.
   - Botón directo de **Aviso por WhatsApp** al cliente con el estado y saldo del vehículo.
   - Impresión de **Comprobante A4** con membrete, liquidación, garantía y firmas.
3. **Presupuestos y Cotizaciones**: Creación de presupuestos con validez y botón de **"Aprobar y Convertir a OT"** en 1 clic.
4. **Clientes y Vehículos**: Historial clínico automotor por patente con trazabilidad de todas las reparaciones y repuestos instalados a lo largo del tiempo.
5. **Inventario de Repuestos**: Control de stock actual y stock mínimo con alertas visuales automáticas, valorización (costo vs. venta) y botones rápidos de ajuste (+/-).
6. **Caja y Finanzas**: Control de cobros (señas y liquidaciones) y registro de gastos generales del taller (servicios, alquiler, herramientas).
7. **Configuración y Respaldo**: Personalización de datos comerciales y botón de descarga de copia de seguridad completa en archivo JSON.
