package com.xuacha.multicampro.managers

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Gestor de Audio - MultiCamPro
 * 
 * Maneja:
 * - Grabación de audio
 * - Control de calidad de audio
 * - Control de volumen
 * - Detectión de audio
 */

sealed class AudioEvent {
  data class AudioStarted(val sessionId: String) : AudioEvent()
  data class AudioStopped(val filePath: String, val duration: Long) : AudioEvent()
  data class AudioLevel(val level: Int) : AudioEvent()  // 0-10 scale
  data class Error(val message: String, val exception: Exception) : AudioEvent()
  object AudioReady : AudioEvent()
}

interface AudioListener {
  fun onAudioEvent(event: AudioEvent)
}

class AudioManager(
  private val context: Context,
) {
  private val scope = CoroutineScope(Dispatchers.Default + Job())
  private val listeners = mutableSetOf<AudioListener>()

  private var mediaRecorder: MediaRecorder? = null
  private var isRecording = false
  private var currentRecordingFile: File? = null
  private var recordingStartTime = 0L

  // ========== LISTENERS ==========

  fun addListener(listener: AudioListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: AudioListener) {
    listeners.remove(listener)
  }

  private fun notifyListeners(event: AudioEvent) {
    listeners.forEach { it.onAudioEvent(event) }
  }

  // ========== GRABACIÓN ==========

  /**
   * Iniciar grabación de audio
   */
  suspend fun startRecording(
    quality: String = "high",  // low, medium, high
    maxDurationMs: Long? = null
  ): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.RECORD_AUDIO)) {
        return@withContext Result.failure(
          Exception("Audio permission not granted")
        )
      }

      if (isRecording) {
        return@withContext Result.failure(
          Exception("Already recording")
        )
      }

      currentRecordingFile = createAudioFile()
      val sessionId = UUID.randomUUID().toString()

      mediaRecorder = MediaRecorder().apply {
        setAudioSource(MediaRecorder.AudioSource.MIC)
        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)

        // Configurar calidad de audio
        when (quality) {
          "low" -> {
            setAudioEncodingBitRate(64000)  // 64 kbps
            setAudioSamplingRate(16000)     // 16 kHz
          }
          "medium" -> {
            setAudioEncodingBitRate(128000) // 128 kbps
            setAudioSamplingRate(32000)     // 32 kHz
          }
          "high" -> {
            setAudioEncodingBitRate(256000) // 256 kbps
            setAudioSamplingRate(44100)     // 44.1 kHz
          }
        }

        setOutputFile(currentRecordingFile!!.absolutePath)
        
        prepare()
        start()
      }

      isRecording = true
      recordingStartTime = System.currentTimeMillis()
      
      notifyListeners(AudioEvent.AudioStarted(sessionId = sessionId))

      // Si se especifica duración máxima, detener automáticamente
      if (maxDurationMs != null && maxDurationMs > 0) {
        scope.launch {
          delay(maxDurationMs)
          stopRecording()
        }
      }

      // Monitorear nivel de audio cada 500ms
      scope.launch {
        while (isRecording) {
          delay(500)
          mediaRecorder?.let { recorder ->
            try {
              val amplitude = recorder.maxAmplitude
              // Convertir a escala 0-10
              val level = if (amplitude > 0) {
                ((Math.log10((amplitude.toDouble() / 32768.0)).toFloat() + 1.0f) * 5.0f).toInt()
                  .coerceIn(0, 10)
              } else {
                0
              }
              notifyListeners(AudioEvent.AudioLevel(level))
            } catch (e: Exception) {
              // Silencio si hay error
            }
          }
        }
      }

      Result.success(sessionId)
    } catch (e: Exception) {
      mediaRecorder?.release()
      mediaRecorder = null
      isRecording = false
      notifyListeners(AudioEvent.Error("Failed to start recording", e))
      Result.failure(e)
    }
  }

  /**
   * Detener grabación de audio
   */
  suspend fun stopRecording(): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isRecording) {
        return@withContext Result.failure(
          Exception("Not recording")
        )
      }

      mediaRecorder?.apply {
        try {
          stop()
          release()
        } catch (e: Exception) {
          // El recorder puede lanzar excepción si no estaba grabando
        }
      }

      mediaRecorder = null
      isRecording = false

      val audioFile = currentRecordingFile
      currentRecordingFile = null

      if (audioFile != null) {
        val duration = System.currentTimeMillis() - recordingStartTime
        
        notifyListeners(
          AudioEvent.AudioStopped(
            filePath = audioFile.absolutePath,
            duration = duration
          )
        )
        
        Result.success(audioFile.absolutePath)
      } else {
        Result.failure(Exception("No recording file found"))
      }
    } catch (e: Exception) {
      notifyListeners(AudioEvent.Error("Failed to stop recording", e))
      Result.failure(e)
    }
  }

  // ========== UTILIDADES ==========

  /**
   * Pausa la grabación (Android 7.0+)
   */
  suspend fun pauseRecording(): Result<Unit> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isRecording) {
        return@withContext Result.failure(
          Exception("Not recording")
        )
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        mediaRecorder?.pause()
        Result.success(Unit)
      } else {
        Result.failure(
          Exception("Pause not supported on Android < 7.0")
        )
      }
    } catch (e: Exception) {
      Result.failure(e)
    }
  }

  /**
   * Reanudar grabación (Android 7.0+)
   */
  suspend fun resumeRecording(): Result<Unit> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isRecording) {
        return@withContext Result.failure(
          Exception("Not recording")
        )
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        mediaRecorder?.resume()
        Result.success(Unit)
      } else {
        Result.failure(
          Exception("Resume not supported on Android < 7.0")
        )
      }
    } catch (e: Exception) {
      Result.failure(e)
    }
  }

  /**
   * Obtener duración actual de la grabación
   */
  fun getCurrentDuration(): Long {
    return if (isRecording) {
      System.currentTimeMillis() - recordingStartTime
    } else {
      0
    }
  }

  /**
   * Verificar si está grabando
   */
  fun isRecording(): Boolean = isRecording

  private fun createAudioFile(): File {
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val storageDir = context.getExternalFilesDir("audio")
    return File.createTempFile("AUDIO_${timestamp}_", ".m4a", storageDir)
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(
      context,
      permission
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun cleanup() {
    scope.cancel()
    if (isRecording) {
      runBlocking { stopRecording() }
    }
    mediaRecorder?.release()
  }
}
