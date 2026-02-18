import React from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MultiCamPro</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
        
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status</Text>
          <Text style={styles.statusText}>App running successfully</Text>
          <Text style={styles.statusText}>Ready for testing</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Device Info</Text>
          <Text style={styles.infoText}>Platform: Android</Text>
          <Text style={styles.infoText}>Build: Preview APK</Text>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Step 2: Device Testing Ready</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 5,
  },
  footerSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
