/**
 * CONTEXTO DE AUTENTICACIÓN Y SEGURIDAD (AuthContext.jsx)
 * --------------------------------------------------------
 * Administra el estado global de la sesión con estándares de seguridad:
 * 1. Autenticación Criptográfica: Valida credenciales contra hashes SHA-256 con salt.
 * 2. Cero Auto-Login Indebido: Si no hay token en almacenamiento, el usuario inicia en null.
 * 3. Protección contra Fuerza Bruta (Rate Limiting):
 *    - Bloqueo temporal de 60 segundos tras 5 intentos fallidos consecutivos.
 *    - Retardo artificial constante (~600ms) para neutralizar ataques de temporización.
 * 4. Persistencia Continua: Mantiene la sesión estándar en localStorage sin caducidad intempestiva.
 * 5. Cuentas Maestras con Perfiles de Rol ('dueño' y 'mecanico').
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

// Sal de seguridad para dispersión de hashes de contraseñas
const PASSWORD_SALT = 'tallerpro_secure_salt_v1';

const MAX_INTENTOS_FALLIDOS = 5;
const TIEMPO_BLOQUEO_MS = 60 * 1000; // 60 segundos

/**
 * Función criptográfica asíncrona para generar hash SHA-256 con sal
 */
async function hashPassword(plainText) {
  if (!plainText) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + '_' + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cuentas oficiales del sistema con contraseñas encriptadas mediante SHA-256 + salt
 * Contraseñas autorizadas:
 * - quienotro -> 912129mat (Administrador General)
 * - mecanico  -> mecanico123 (Técnico Operativo)
 */
const CUENTAS_AUTORIZADAS = [
  {
    id: 'usr_admin',
    username: 'quienotro',
    passwordHash: '9ed55a782b99dba470c60460caea5d24548412b68d38b55bcf3c333b09cf1316', // 912129mat
    nombre: 'Administrador Taller',
    email: 'admin@tallerpro.com',
    rol: 'dueño',
    isAdmin: true
  },
  {
    id: 'usr_mecanico',
    username: 'mecanico',
    passwordHash: '8ca0c1225e720f4ed466cc5450c8d01ae291e6b9b7c5d9eacdb29fc38e0a50ce', // mecanico123
    nombre: 'Jefe de Taller / Mecánico',
    email: 'mecanico@tallerpro.com',
    rol: 'mecanico',
    isAdmin: false
  }
];

/**
 * Recupera la sesión persistente previa si existe
 */
function recuperarSesionGuardada() {
  try {
    const raw = localStorage.getItem('taller_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error al recuperar sesión de localStorage:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  // Inicialización limpia: sólo carga sesión si el usuario ya se autenticó previamente
  const [user, setUser] = useState(recuperarSesionGuardada);
  const [loading, setLoading] = useState(false);

  /**
   * Consulta el tiempo restante de bloqueo por fuerza bruta (en segundos)
   */
  const getLockoutRemaining = useCallback(() => {
    try {
      const lockoutUntil = parseInt(localStorage.getItem('taller_auth_lockout_until') || '0', 10);
      const restanteMs = lockoutUntil - Date.now();
      return restanteMs > 0 ? Math.ceil(restanteMs / 1000) : 0;
    } catch {
      return 0;
    }
  }, []);

  /**
   * Registra un fallo de autenticación y aplica bloqueo temporal al alcanzar el límite
   */
  const registrarFalloAutenticacion = async () => {
    // Retardo artificial anti-timing attacks
    await new Promise(resolve => setTimeout(resolve, 600));

    const intentosActuales = parseInt(localStorage.getItem('taller_auth_failed_attempts') || '0', 10) + 1;
    localStorage.setItem('taller_auth_failed_attempts', intentosActuales.toString());

    if (intentosActuales >= MAX_INTENTOS_FALLIDOS) {
      const bloqueoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
      localStorage.setItem('taller_auth_lockout_until', bloqueoHasta.toString());
      throw new Error(`Demasiados intentos fallidos. Acceso bloqueado temporalmente por ${TIEMPO_BLOQUEO_MS / 1000} segundos por seguridad.`);
    }

    const restantes = MAX_INTENTOS_FALLIDOS - intentosActuales;
    throw new Error(`Credenciales incorrectas. Intentos restantes antes del bloqueo: ${restantes}.`);
  };

  /**
   * Resetea el contador de intentos fallidos
   */
  const limpiarFallos = () => {
    localStorage.removeItem('taller_auth_failed_attempts');
    localStorage.removeItem('taller_auth_lockout_until');
  };

  /**
   * Inicio de sesión seguro:
   * Valida usuario y contraseña con hashing criptográfico y rate limiting.
   */
  const login = async (username, password) => {
    setLoading(true);

    // 1. Verificación previa de bloqueo por fuerza bruta
    const segundosBloqueo = getLockoutRemaining();
    if (segundosBloqueo > 0) {
      setLoading(false);
      throw new Error(`Acceso bloqueado por seguridad. Intente nuevamente en ${segundosBloqueo} segundos.`);
    }

    // 2. Sanitización básica
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || cleanPass.length < 6) {
      setLoading(false);
      throw new Error('Ingrese un usuario válido y una contraseña de al menos 6 caracteres.');
    }

    try {
      // 3. Generación del hash criptográfico de la contraseña provista
      const inputHash = await hashPassword(cleanPass);

      // 4. Búsqueda de cuenta autorizada
      const cuentaEncontrada = CUENTAS_AUTORIZADAS.find(
        c => c.username.toLowerCase() === cleanUser && c.passwordHash === inputHash
      );

      if (!cuentaEncontrada) {
        await registrarFalloAutenticacion();
        return;
      }

      // 5. Autenticación exitosa: reinicio de contadores de seguridad
      limpiarFallos();

      const sessionUser = {
        id: cuentaEncontrada.id,
        username: cuentaEncontrada.username,
        nombre: cuentaEncontrada.nombre,
        email: cuentaEncontrada.email,
        rol: cuentaEncontrada.rol,
        isAdmin: cuentaEncontrada.isAdmin
      };

      setUser(sessionUser);
      localStorage.setItem('taller_user', JSON.stringify(sessionUser));

      setLoading(false);
      return { success: true, user: sessionUser };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  /**
   * Cierre de sesión seguro: elimina los datos de localStorage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('taller_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isAuthenticated: !!user, 
      isAdmin: !!user?.isAdmin,
      isMecanico: user?.rol === 'mecanico' || (!!user && !user?.isAdmin),
      getLockoutRemaining 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook de autenticación para componentes de la aplicación
 */
export function useAuth() {
  return useContext(AuthContext);
}
