/**
 * Modelo de Dispositivos - Server
 * 
 * Interfaz para persistencia en Firebase Realtime Database
 * Actualmente usa Maps en memoria como fallback
 */

const admin = require('firebase-admin');

class DeviceModel {
  constructor() {
    this.db = null;
    this.useFirebase = false;

    // Fallback en memoria
    this.devices = new Map();
    this.userDevices = new Map();

    this.initFirebase();
  }

  /**
   * Inicializar Firebase
   */
  initFirebase() {
    try {
      if (process.env.FIREBASE_DATABASE_URL) {
        this.db = admin.database();
        this.useFirebase = true;
        console.log('[DB] Firebase Database inicializado');
      } else {
        console.log('[DB] Firebase no configurado, usando memoria');
      }
    } catch (error) {
      console.error('[DB] Error inicializando Firebase:', error.message);
      console.log('[DB] Usando almacenamiento en memoria como fallback');
    }
  }

  /**
   * Guardar dispositivo
   */
  async saveDevice(deviceId, deviceData) {
    try {
      // Guardar en memoria
      this.devices.set(deviceId, {
        ...deviceData,
        updatedAt: new Date().toISOString(),
      });

      // Actualizar mapeo de usuario
      const currentDevices = this.userDevices.get(deviceData.ownerUid) || [];
      if (!currentDevices.includes(deviceId)) {
        currentDevices.push(deviceId);
        this.userDevices.set(deviceData.ownerUid, currentDevices);
      }

      // Guardar en Firebase si disponible
      if (this.useFirebase && this.db) {
        await this.db
          .ref(`devices/${deviceId}`)
          .set({
            ...deviceData,
            updatedAt: new Date().toISOString(),
          });
      }

      return true;
    } catch (error) {
      console.error('[DB] Error saving device:', error);
      return false;
    }
  }

  /**
   * Obtener dispositivo
   */
  async getDevice(deviceId) {
    try {
      // Intentar Firebase primero
      if (this.useFirebase && this.db) {
        const snapshot = await this.db.ref(`devices/${deviceId}`).once('value');
        if (snapshot.exists()) {
          return snapshot.val();
        }
      }

      // Fallback a memoria
      return this.devices.get(deviceId) || null;
    } catch (error) {
      console.error('[DB] Error getting device:', error);
      return this.devices.get(deviceId) || null;
    }
  }

  /**
   * Obtener todos los dispositivos de un usuario
   */
  async getUserDevices(userId) {
    try {
      const deviceIds = this.userDevices.get(userId) || [];
      const devices = [];

      for (const deviceId of deviceIds) {
        const device = await this.getDevice(deviceId);
        if (device) {
          devices.push(device);
        }
      }

      return devices;
    } catch (error) {
      console.error('[DB] Error getting user devices:', error);
      return [];
    }
  }

  /**
   * Actualizar dispositivo
   */
  async updateDevice(deviceId, updates) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return false;
      }

      const updated = {
        ...device,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.devices.set(deviceId, updated);

      // Actualizar en Firebase si disponible
      if (this.useFirebase && this.db) {
        await this.db.ref(`devices/${deviceId}`).update(updates);
      }

      return true;
    } catch (error) {
      console.error('[DB] Error updating device:', error);
      return false;
    }
  }

  /**
   * Eliminar dispositivo
   */
  async deleteDevice(deviceId) {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        return false;
      }

      // Remover de memoria
      this.devices.delete(deviceId);

      // Remover del mapeo de usuario
      const deviceIds = this.userDevices.get(device.ownerUid) || [];
      this.userDevices.set(
        device.ownerUid,
        deviceIds.filter((id) => id !== deviceId)
      );

      // Remover de Firebase si disponible
      if (this.useFirebase && this.db) {
        await this.db.ref(`devices/${deviceId}`).remove();
      }

      return true;
    } catch (error) {
      console.error('[DB] Error deleting device:', error);
      return false;
    }
  }

  /**
   * Guardar comando en cola
   */
  async queueCommand(deviceId, commandData) {
    try {
      const key = this.db ? this.db.ref().push().key : `cmd-${Date.now()}`;

      if (this.useFirebase && this.db) {
        await this.db
          .ref(`command-queues/${deviceId}/${key}`)
          .set({
            ...commandData,
            queuedAt: new Date().toISOString(),
          });
      }

      return key;
    } catch (error) {
      console.error('[DB] Error queueing command:', error);
      return null;
    }
  }

  /**
   * Obtener comandos en cola
   */
  async getQueuedCommands(deviceId) {
    try {
      if (!this.useFirebase || !this.db) {
        return [];
      }

      const snapshot = await this.db
        .ref(`command-queues/${deviceId}`)
        .once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const commands = [];
      snapshot.forEach((child) => {
        commands.push({
          id: child.key,
          ...child.val(),
        });
      });

      return commands;
    } catch (error) {
      console.error('[DB] Error getting queued commands:', error);
      return [];
    }
  }

  /**
   * Limpiar comandos procesados
   */
  async clearQueuedCommands(deviceId) {
    try {
      if (this.useFirebase && this.db) {
        await this.db.ref(`command-queues/${deviceId}`).remove();
      }
      return true;
    } catch (error) {
      console.error('[DB] Error clearing queue:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      totalDevices: this.devices.size,
      totalUsers: this.userDevices.size,
      usingFirebase: this.useFirebase,
      devices: Array.from(this.devices.values()).map((d) => ({
        id: d.id,
        type: d.type,
        status: d.status,
      })),
    };
  }
}

// Singleton
let instance = null;

function getDeviceModel() {
  if (!instance) {
    instance = new DeviceModel();
  }
  return instance;
}

module.exports = {
  DeviceModel,
  getDeviceModel,
};
