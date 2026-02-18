import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RecordingStatus } from '../types/controller';

interface RecordingControlsProps {
  deviceId: string;
  onStartRecording?: (quality: string) => Promise<void>;
  onStopRecording?: () => Promise<void>;
  onPauseRecording?: () => Promise<void>;
  onResumeRecording?: () => Promise<void>;
  isEnabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  deviceId,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  isEnabled = true,
}) => {
  const [status, setStatus] = useState<RecordingStatus>(RecordingStatus.IDLE);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== RecordingStatus.RECORDING) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!isEnabled || !onStartRecording) return;
    
    setIsLoading(true);
    try {
      await onStartRecording('high');
      setStatus(RecordingStatus.RECORDING);
      setDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!isEnabled || !onStopRecording) return;
    
    setIsLoading(true);
    try {
      await onStopRecording();
      setStatus(RecordingStatus.STOPPED);
      setDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseRecording = async () => {
    if (!isEnabled || !onPauseRecording) return;
    
    setIsLoading(true);
    try {
      await onPauseRecording();
      setStatus(RecordingStatus.PAUSED);
    } catch (error) {
      console.error('Failed to pause recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeRecording = async () => {
    if (!isEnabled || !onResumeRecording) return;
    
    setIsLoading(true);
    try {
      await onResumeRecording();
      setStatus(RecordingStatus.RECORDING);
    } catch (error) {
      console.error('Failed to resume recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isRecording = status === RecordingStatus.RECORDING;
  const isPaused = status === RecordingStatus.PAUSED;

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={[styles.statusBar, isRecording && styles.statusBarActive]}>
        {isRecording && <Text style={styles.recIndicator}>● REC</Text>}
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonGroup}>
        {status === RecordingStatus.IDLE || status === RecordingStatus.STOPPED ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton, !isEnabled && styles.buttonDisabled]}
            onPress={handleStartRecording}
            disabled={isLoading || !isEnabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonLabel}>⏺️ Start Recording</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            {isRecording && (
              <TouchableOpacity
                style={[styles.button, styles.pauseButton]}
                onPress={handlePauseRecording}
                disabled={isLoading}
              >
                <Text style={styles.buttonLabel}>⏸️ Pause</Text>
              </TouchableOpacity>
            )}

            {isPaused && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleResumeRecording}
                disabled={isLoading}
              >
                <Text style={styles.buttonLabel}>▶️ Resume</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopRecording}
              disabled={isLoading}
            >
              <Text style={styles.buttonLabel}>⏹️ Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Debug Info */}
      {isRecording || isPaused ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>{status.toUpperCase()}</Text>
          {isRecording && (
            <>
              <Text style={styles.infoLabel}>Size:</Text>
              <Text style={styles.infoValue}>~{Math.round(duration * 100 / 100)} MB</Text>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statusBarActive: {
    backgroundColor: '#FFEBEE',
  },
  recIndicator: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  duration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  infoValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '600',
    marginTop: 2,
  },
});
