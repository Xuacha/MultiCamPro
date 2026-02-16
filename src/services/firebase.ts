/**
 * Servicios de Firebase para autenticación, base de datos y almacenamiento
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, firestore, storage } from '@/config/firebase';
import { User, Project, Video, Camera } from '@/types';
import { logger } from '@/utils/logger';

// ============= Authentication Services =============

export const authService = {
  // Crear cuenta
  async createAccount(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.log('Account created successfully', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      logger.error('Error creating account', error);
      throw error;
    }
  },

  // Iniciar sesión
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.log('Sign in successful', userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      logger.error('Error signing in', error);
      throw error;
    }
  },

  // Cerrar sesión
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      logger.log('Sign out successful');
    } catch (error) {
      logger.error('Error signing out', error);
      throw error;
    }
  },

  // Obtener usuario actual
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};

// ============= User Services =============

export const userService = {
  // Crear usuario en Firestore
  async createUser(uid: string, userData: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.log('User created in Firestore', uid);
    } catch (error) {
      logger.error('Error creating user in Firestore', error);
      throw error;
    }
  },

  // Obtener usuario
  async getUser(uid: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(firestore, 'users', uid));
      return docSnap.exists() ? (docSnap.data() as User) : null;
    } catch (error) {
      logger.error('Error getting user', error);
      throw error;
    }
  },

  // Actualizar usuario
  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        ...data,
        updatedAt: new Date(),
      });
      logger.log('User updated', uid);
    } catch (error) {
      logger.error('Error updating user', error);
      throw error;
    }
  },
};

// ============= Project Services =============

export const projectService = {
  // Crear proyecto
  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'projects'), {
        ...projectData,
        ownerId: userId,
        collaborators: [userId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.log('Project created', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error creating project', error);
      throw error;
    }
  },

  // Obtener proyectos del usuario
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('collaborators', 'array-contains', userId),
      ];
      const q = query(collection(firestore, 'projects'), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Project));
    } catch (error) {
      logger.error('Error getting user projects', error);
      throw error;
    }
  },

  // Obtener proyecto por ID
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const docSnap = await getDoc(doc(firestore, 'projects', projectId));
      return docSnap.exists() ? ({ id: projectId, ...docSnap.data() } as Project) : null;
    } catch (error) {
      logger.error('Error getting project', error);
      throw error;
    }
  },

  // Actualizar proyecto
  async updateProject(projectId: string, data: Partial<Project>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'projects', projectId), {
        ...data,
        updatedAt: new Date(),
      });
      logger.log('Project updated', projectId);
    } catch (error) {
      logger.error('Error updating project', error);
      throw error;
    }
  },

  // Eliminar proyecto
  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, 'projects', projectId));
      logger.log('Project deleted', projectId);
    } catch (error) {
      logger.error('Error deleting project', error);
      throw error;
    }
  },
};

// ============= Video Services =============

export const videoService = {
  // Guardar metadatos de video
  async saveVideoMetadata(video: Partial<Video>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'videos'), {
        ...video,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.log('Video metadata saved', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Error saving video metadata', error);
      throw error;
    }
  },

  // Obtener videos del proyecto
  async getProjectVideos(projectId: string): Promise<Video[]> {
    try {
      const constraints: QueryConstraint[] = [where('projectId', '==', projectId)];
      const q = query(collection(firestore, 'videos'), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Video));
    } catch (error) {
      logger.error('Error getting project videos', error);
      throw error;
    }
  },

  // Actualizar video
  async updateVideo(videoId: string, data: Partial<Video>): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'videos', videoId), {
        ...data,
        updatedAt: new Date(),
      });
      logger.log('Video updated', videoId);
    } catch (error) {
      logger.error('Error updating video', error);
      throw error;
    }
  },

  // Eliminar video
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, 'videos', videoId));
      logger.log('Video deleted', videoId);
    } catch (error) {
      logger.error('Error deleting video', error);
      throw error;
    }
  },
};

// ============= Storage Services =============

export const storageService = {
  // Subir archivo
  async uploadFile(path: string, file: Blob): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      logger.log('File uploaded', path);
      return url;
    } catch (error) {
      logger.error('Error uploading file', error);
      throw error;
    }
  },

  // Descargar URL de archivo
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      logger.error('Error getting download URL', error);
      throw error;
    }
  },

  // Eliminar archivo
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      logger.log('File deleted', path);
    } catch (error) {
      logger.error('Error deleting file', error);
      throw error;
    }
  },
};
