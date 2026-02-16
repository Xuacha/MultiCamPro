import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { COLORS, SIZES, FONT_SIZES } from '@/utils/constants';
import { authService, userService } from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setLoading: setAuthLoading } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        setError('Por favor completa todos los campos');
        return;
      }

      const firebaseUser = await authService.signIn(email, password);
      const user = await userService.getUser(firebaseUser.uid);

      if (user) {
        setUser(user);
      }

      logger.log('Login successful', email);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      logger.error('Login error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MultiCamPro</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextField
          label="Email"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
        />

        <TextField
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          secureTextEntry
        />

        <Button
          title={loading ? 'Cargando...' : 'Iniciar Sesión'}
          onPress={handleLogin}
          disabled={loading}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SIZES.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    marginBottom: SIZES.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginTop: SIZES.sm,
  },
  error: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginBottom: SIZES.md,
    padding: SIZES.md,
    backgroundColor: '#ffebee',
    borderRadius: SIZES.md,
  },
  link: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    marginTop: SIZES.md,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
