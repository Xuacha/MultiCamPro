import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Button } from '@/components/Button';
import { COLORS, SIZES, FONT_SIZES } from '@/utils/constants';
import { authService } from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const SettingsScreen = ({ navigation }: any) => {
  const { user, setUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      logger.log('Logout successful');
    } catch (error) {
      logger.error('Logout error', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Email</Text>
          <Text style={styles.settingValue}>{user?.email}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Usuario</Text>
          <Text style={styles.settingValue}>{user?.displayName}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notificaciones activadas</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aplicación</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Versión</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Términos de Servicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Política de Privacidad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title="Cerrar Sesión"
          variant="danger"
          onPress={handleLogout}
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    paddingVertical: SIZES.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.black,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
  footer: {
    padding: SIZES.lg,
  },
});
