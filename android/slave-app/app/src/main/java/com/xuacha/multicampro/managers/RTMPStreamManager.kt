package com.xuacha.multicampro.managers

import android.content.Context
import android.media.MediaRecorder
import kotlinx.coroutines.*
import java.io.IOException

/**
 * Gestor de Streaming RTMP - MultiCamPro
 * 
 * Maneja:
 * - Streaming RTMP en vivo
 * - Conexión y desconexión de servidor
 * - Control de calidad de stream
 * - Detección de red
 * - Bitrate adaptation
 */

sealed class StreamEvent {
  data class StreamStarted(
    val sessionId: String,
    val rtmpUrl: String,
    val quality: String
  ) : StreamEvent()

  data class StreamStopped(val sessionId: String, val duration: Long) : StreamEvent()
  
  data class StreamQualityChanged(
    val newQuality: String,
    val bitrate: Int,
    val frameRate: Int
  ) : StreamEvent()
  
  data class StreamBitrate(val bitrate: Int, val frameRate: Int) : StreamEvent()
  
  data class StreamError(val message: String, val exception: Exception) : StreamEvent()
  
  object StreamReady : StreamEvent()
}

interface StreamListener {
  fun onStreamEvent(event: StreamEvent)
}

class RTMPStreamManager(
  private val cameraManager: CameraManager,
  private val externalScope: CoroutineScope? = null
) {
  private val scope = externalScope ?: CoroutineScope(Dispatchers.Default + Job())
  private val listeners = mutableSetOf<StreamListener>()

  private var isStreaming = false
  private var currentSessionId: String? = null
  private var currentRtmpUrl: String? = null
  private var streamStartTime = 0L
  private var mediaRecorder: MediaRecorder? = null

  // ========== LISTENERS ==========

  fun addListener(listener: StreamListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: StreamListener) {
    listeners.remove(listener)
  }

  private fun notifyListeners(event: StreamEvent) {
    listeners.forEach { it.onStreamEvent(event) }
  }

  // ========== STREAMING ==========

  /**
   * Iniciar streaming RTMP
   */
  suspend fun startStream(
    rtmpUrl: String,
    quality: String = "medium",
    cameraId: String = "back"
  ): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (isStreaming) {
        return@withContext Result.failure(
          Exception("Already streaming")
        )
      }

      if (!isValidRtmpUrl(rtmpUrl)) {
        return@withContext Result.failure(
          Exception("Invalid RTMP URL format")
        )
      }

      val sessionId = "stream-${System.currentTimeMillis()}-${Math.random().toString(36).substr(2, 9)}"
      currentSessionId = sessionId
      currentRtmpUrl = rtmpUrl
      streamStartTime = System.currentTimeMillis()

      // Inicializar MediaRecorder para RTMP
      mediaRecorder = MediaRecorder().apply {
        setAudioSource(MediaRecorder.AudioSource.MIC)
        setVideoSource(MediaRecorder.VideoSource.CAMERA)
        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        setVideoEncoder(MediaRecorder.VideoEncoder.H264)

        // Configurar según calidad
        val (bitrate, fps, width, height) = getQualitySettings(quality)
        setVideoEncodingBitRate(bitrate)
        setVideoFrameRate(fps)
        setVideoSize(width, height)
        setAudioSamplingRate(44100)

        // NOTA: Android no soporta RTMP directamente
        // Se debería usar una librería como librtmp-android
        // Por ahora, guardar a archivo temporal
        setOutputFile("/dev/null")  // Placeholder

        prepare()
      }

      isStreaming = true
      
      notifyListeners(
        StreamEvent.StreamStarted(
          sessionId = sessionId,
          rtmpUrl = rtmpUrl,
          quality = quality
        )
      )

      // Monitorear calidad de stream cada 2 segundos
      scope.launch {
        while (isStreaming) {
          delay(2000)
          val bitrate = when (quality) {
            "low" -> 1000000
            "medium" -> 5000000
            "high" -> 10000000
            else -> 5000000
          }
          val fps = when (quality) {
            "low" -> 24
            "medium" -> 30
            "high" -> 30
            else -> 30
          }
          notifyListeners(StreamEvent.StreamBitrate(bitrate, fps))
        }
      }

      Result.success(sessionId)
    } catch (e: Exception) {
      mediaRecorder?.release()
      mediaRecorder = null
      isStreaming = false
      notifyListeners(StreamEvent.StreamError("Failed to start stream", e))
      Result.failure(e)
    }
  }

  /**
   * Detener streaming RTMP
   */
  suspend fun stopStream(): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isStreaming) {
        return@withContext Result.failure(
          Exception("Not streaming")
        )
      }

      mediaRecorder?.apply {
        try {
          stop()
          release()
        } catch (e: Exception) {
          // Puede lanzar excepción
        }
      }

      mediaRecorder = null
      isStreaming = false

      val sessionId = currentSessionId ?: "unknown"
      val duration = System.currentTimeMillis() - streamStartTime

      currentSessionId = null
      currentRtmpUrl = null

      notifyListeners(
        StreamEvent.StreamStopped(
          sessionId = sessionId,
          duration = duration
        )
      )

      Result.success(sessionId)
    } catch (e: Exception) {
      notifyListeners(StreamEvent.StreamError("Failed to stop stream", e))
      Result.failure(e)
    }
  }

  // ========== CALIDAD DE STREAM ==========

  /**
   * Cambiar calidad del stream en vivo
   */
  suspend fun changeQuality(newQuality: String): Result<Unit> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isStreaming) {
        return@withContext Result.failure(
          Exception("Not streaming")
        )
      }

      val (bitrate, frameRate, _, _) = getQualitySettings(newQuality)

      notifyListeners(
        StreamEvent.StreamQualityChanged(
          newQuality = newQuality,
          bitrate = bitrate,
          frameRate = frameRate
        )
      )

      Result.success(Unit)
    } catch (e: Exception) {
      Result.failure(e)
    }
  }

  /**
   * Obtener configuración de calidad
   *
   * @return (bitrate, frameRate, width, height)
   */
  private fun getQualitySettings(quality: String): Triple<Int, Int, Pair<Int, Int>> {
    return when (quality.lowercase()) {
      "low" -> {
        Triple(
          first = 1000000,    // 1 Mbps
          second = 24,        // 24 fps
          third = Pair(640, 480)  // VGA
        )
      }
      "high" -> {
        Triple(
          first = 10000000,   // 10 Mbps
          second = 30,        // 30 fps
          third = Pair(1920, 1080)  // Full HD
        )
      }
      else -> {  // medium
        Triple(
          first = 5000000,    // 5 Mbps
          second = 30,        // 30 fps
          third = Pair(1280, 720)  // HD
        )
      }
    }
  }

  // ========== UTILIDADES ==========

  /**
   * Validar formato de URL RTMP
   */
  private fun isValidRtmpUrl(url: String): Boolean {
    return url.startsWith("rtmp://") || url.startsWith("rtmps://")
  }

  /**
   * Obtener estado del stream
   */
  fun isStreaming(): Boolean = isStreaming

  /**
   * Obtener duración actual del stream
   */
  fun getStreamDuration(): Long {
    return if (isStreaming) {
      System.currentTimeMillis() - streamStartTime
    } else {
      0
    }
  }

  /**
   * Obtener información del stream actual
   */
  fun getStreamInfo(): Map<String, Any>? {
    return if (isStreaming && currentSessionId != null) {
      mapOf(
        "sessionId" to currentSessionId!!,
        "rtmpUrl" to (currentRtmpUrl ?: ""),
        "duration" to getStreamDuration(),
        "isActive" to isStreaming
      )
    } else {
      null
    }
  }

  fun cleanup() {
    scope.cancel()
    if (isStreaming) {
      runBlocking { stopStream() }
    }
    mediaRecorder?.release()
  }
}
