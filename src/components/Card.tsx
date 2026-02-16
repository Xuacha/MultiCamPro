import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/utils/constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, onPress }) => {
  return (
    <View style={styles.card} {...(onPress && { onPress })}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.lg,
    padding: SIZES.lg,
    marginVertical: SIZES.md,
    marginHorizontal: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
