/**
 * useStreamPreview Hook
 * Manages stream preview and monitoring
 */

import { useState, useCallback, useEffect } from 'react';
import { StreamSession, StreamPreview } from '../types/controller';

interface StreamMetrics {
  bitrate: number;
  frameRate: number;
  latency: number;
  packetLoss: number;
}

interface UseStreamPreviewReturn {
  // State
  previews: StreamPreview[];
  selectedStream: StreamPreview | null;
  metrics: StreamMetrics | null;
  isLoading: boolean;
  
  // Management
  selectStream: (streamId: string) => void;
  addPreview: (stream: StreamSession) => void;
  removePreview: (streamId: string) => void;
  updateMetrics: (metrics: StreamMetrics) => void;
  
  // Monitoring
  startMonitoring: (streamId: string) => void;
  stopMonitoring: (streamId: string) => void;
  
  // Quality adjustment
  increaseQuality: (streamId: string) => void;
  decreaseQuality: (streamId: string) => void;
}

export const useStreamPreview = (): UseStreamPreviewReturn => {
  const [previews, setPreviews] = useState<StreamPreview[]>([]);
  const [selectedStream, setSelectedStreamState] = useState<StreamPreview | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [monitoredStreams, setMonitoredStreams] = useState<Set<string>>(new Set());

  const selectStream = useCallback((streamId: string) => {
    const stream = previews.find(p => p.streamId === streamId) || null;
    setSelectedStreamState(stream);
  }, [previews]);

  const addPreview = useCallback((session: StreamSession) => {
    const preview: StreamPreview = {
      streamId: session.sessionId,
      deviceId: session.deviceId,
      deviceName: `Device ${session.deviceId.slice(-4)}`,
      isLive: true,
      quality: session.quality,
      duration: 0,
    };
    
    setPreviews(prev => {
      const exists = prev.find(p => p.streamId === session.sessionId);
      if (exists) return prev;
      return [...prev, preview];
    });
  }, []);

  const removePreview = useCallback((streamId: string) => {
    setPreviews(prev => prev.filter(p => p.streamId !== streamId));
    if (selectedStream?.streamId === streamId) {
      setSelectedStreamState(null);
    }
  }, [selectedStream]);

  const updateMetrics = useCallback((newMetrics: StreamMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const startMonitoring = useCallback((streamId: string) => {
    setMonitoredStreams(prev => new Set(prev).add(streamId));
  }, []);

  const stopMonitoring = useCallback((streamId: string) => {
    setMonitoredStreams(prev => {
      const next = new Set(prev);
      next.delete(streamId);
      return next;
    });
  }, []);

  const increaseQuality = useCallback((streamId: string) => {
    setPreviews(prev =>
      prev.map(p => {
        if (p.streamId !== streamId) return p;
        
        const qualityLevels = ['low', 'medium', 'high'];
        const currentIndex = qualityLevels.indexOf(p.quality);
        const newQuality = qualityLevels[Math.min(currentIndex + 1, 2)];
        
        return {
          ...p,
          quality: newQuality as any,
        };
      })
    );
  }, []);

  const decreaseQuality = useCallback((streamId: string) => {
    setPreviews(prev =>
      prev.map(p => {
        if (p.streamId !== streamId) return p;
        
        const qualityLevels = ['low', 'medium', 'high'];
        const currentIndex = qualityLevels.indexOf(p.quality);
        const newQuality = qualityLevels[Math.max(currentIndex - 1, 0)];
        
        return {
          ...p,
          quality: newQuality as any,
        };
      })
    );
  }, []);

  // Simulate metrics updates (in real scenario, these would come from WebSocket)
  useEffect(() => {
    if (monitoredStreams.size === 0) return;

    const interval = setInterval(() => {
      setMetrics(prev => {
        if (!prev) return null;
        
        // Simulate bitrate fluctuation
        const bitrate = Math.max(0, prev.bitrate + (Math.random() - 0.5) * 500);
        const packetLoss = Math.max(0, Math.min(5, prev.packetLoss + (Math.random() - 0.5) * 0.5));
        
        return {
          ...prev,
          bitrate,
          packetLoss,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [monitoredStreams]);

  return {
    previews,
    selectedStream,
    metrics,
    isLoading,
    selectStream,
    addPreview,
    removePreview,
    updateMetrics,
    startMonitoring,
    stopMonitoring,
    increaseQuality,
    decreaseQuality,
  };
};
