import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { COLORS, SIZES, FONT_SIZES } from '@/utils/constants';
import { projectService } from '@/services/firebase';
import { logger } from '@/utils/logger';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { projects, setProjects } = useProjects();

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  const loadProjects = async () => {
    try {
      if (user?.id) {
        const userProjects = await projectService.getUserProjects(user.id);
        setProjects(userProjects);
      }
    } catch (error) {
      logger.error('Error loading projects', error);
    }
  };

  const handleNewProject = () => {
    navigation.navigate('ProjectDetail', { projectId: 'new' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Proyectos</Text>
        <Text style={styles.subtitle}>Bienvenido {user?.displayName || 'Usuario'}</Text>
      </View>

      <View style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes proyectos aún</Text>
            <Text style={styles.emptySubtext}>Crea uno nuevo para comenzar</Text>
          </View>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ProjectDetail', { projectId: project.id })
                }
              >
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectDescription}>{project.description}</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Nuevo Proyecto" onPress={handleNewProject} />
        <Button
          title="Configuración"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginTop: SIZES.sm,
  },
  content: {
    padding: SIZES.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.black,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: SIZES.sm,
  },
  projectTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  projectDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SIZES.sm,
  },
  footer: {
    padding: SIZES.lg,
  },
});
