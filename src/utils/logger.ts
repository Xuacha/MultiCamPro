/**
 * Logger utility para loguear mensajes en desarrollo
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[LOG] ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  info: (message: string, data?: any) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, data || '');
    }
  },

  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },
};
