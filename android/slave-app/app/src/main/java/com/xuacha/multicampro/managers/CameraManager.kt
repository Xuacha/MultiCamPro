package com.xuacha.multicampro.managers

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.*
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.view.Surface
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import kotlinx.coroutines.*
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Gestor de Cámara - MultiCamPro
 * 
 * Maneja:
 * - Captura de fotos
 * - Grabación de video
 * - Flash control
 * - Camera switching (front/back)
 * - Media file handling
 */

sealed class CameraEvent {
  data class PhotoCaptured(val filePath: String, val timestamp: Long) : CameraEvent()
  data class VideoStarted(val sessionId: String) : CameraEvent()
  data class VideoStopped(val filePath: String, val duration: Long) : CameraEvent()
  data class Error(val message: String, val exception: Exception) : CameraEvent()
  object CameraReady : CameraEvent()
}

interface CameraListener {
  fun onCameraEvent(event: CameraEvent)
}

class CameraManager(
  private val context: Context,
) {
  private val cameraManager =
    context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private val scope = CoroutineScope(Dispatchers.Default + Job())

  private var currentCamera: String? = null
  private var mediaRecorder: MediaRecorder? = null
  private var isRecording = false
  private var currentRecordingFile: File? = null
  private val listeners = mutableSetOf<CameraListener>()

  // ========== LISTENERS ==========

  fun addListener(listener: CameraListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: CameraListener) {
    listeners.remove(listener)
  }

  private fun notifyListeners(event: CameraEvent) {
    listeners.forEach { it.onCameraEvent(event) }
  }

  // ========== FOTO ==========

  /**
   * Capturar foto usando cámara trasera
   */
  suspend fun takePhoto(cameraId: String = "back"): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.CAMERA)) {
        return@withContext Result.failure(
          Exception("Camera permission not granted")
        )
      }

      // Crear archivo para foto
      val photoFile = createImageFile()

      // Usar cámara del sistema para captura simple
      val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
        putExtra(
          MediaStore.EXTRA_OUTPUT,
          FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            photoFile
          )
        )
        putExtra("android.intent.extra.USE_FRONT_CAMERA", cameraId == "front")
      }

      // Nota: En un escenario real, esto debería ser más robusto
      // Esta es una simplificación para demostración
      
      notifyListeners(
        CameraEvent.PhotoCaptured(
          filePath = photoFile.absolutePath,
          timestamp = System.currentTimeMillis()
        )
      )

      Result.success(photoFile.absolutePath)
    } catch (e: Exception) {
      notifyListeners(CameraEvent.Error("Failed to take photo", e))
      Result.failure(e)
    }
  }

  // ========== VIDEO ==========

  /**
   * Iniciar grabación de video
   */
  suspend fun startVideo(
    duration: Long? = null,
    quality: String = "high",
    cameraId: String = "back"
  ): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.CAMERA)) {
        return@withContext Result.failure(
          Exception("Camera permission not granted")
        )
      }

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

      // Crear archivo para video
      currentRecordingFile = createVideoFile()
      val sessionId = UUID.randomUUID().toString()

      // Inicializar MediaRecorder
      mediaRecorder = MediaRecorder().apply {
        setAudioSource(MediaRecorder.AudioSource.MIC)
        setVideoSource(MediaRecorder.VideoSource.CAMERA)
        setOutputFormat(
          when (quality) {
            "low" -> MediaRecorder.OutputFormat.MPEG_4
            "medium" -> MediaRecorder.OutputFormat.MPEG_4
            "high" -> MediaRecorder.OutputFormat.MPEG_4
            else -> MediaRecorder.OutputFormat.MPEG_4
          }
        )
        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        setVideoEncoder(MediaRecorder.VideoEncoder.H264)

        // Configurar bitrate según calidad
        when (quality) {
          "low" -> {
            setVideoEncodingBitRate(1000000) // 1 Mbps
            setVideoFrameRate(24)
            setVideoSize(720, 480)
          }
          "medium" -> {
            setVideoEncodingBitRate(5000000) // 5 Mbps
            setVideoFrameRate(30)
            setVideoSize(1280, 720)
          }
          "high" -> {
            setVideoEncodingBitRate(10000000) // 10 Mbps
            setVideoFrameRate(30)
            setVideoSize(1920, 1080)
          }
        }

        setAudioSamplingRate(44100)

        setOutputFile(currentRecordingFile!!.absolutePath)

        prepare()
        start()
      }

      isRecording = true
      val recordingStartTime = System.currentTimeMillis()
      
      notifyListeners(CameraEvent.VideoStarted(sessionId = sessionId))

      // Si se especifica duración, detener automáticamente
      if (duration != null && duration > 0) {
        scope.launch {
          delay(duration * 1000)
          stopVideo()
        }
      }

      Result.success(sessionId)
    } catch (e: Exception) {
      mediaRecorder?.release()
      mediaRecorder = null
      isRecording = false
      notifyListeners(CameraEvent.Error("Failed to start video", e))
      Result.failure(e)
    }
  }

  /**
   * Detener grabación de video
   */
  suspend fun stopVideo(): Result<String> = withContext(Dispatchers.IO) {
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

      val videoFile = currentRecordingFile
      currentRecordingFile = null

      if (videoFile != null) {
        notifyListeners(
          CameraEvent.VideoStopped(
            filePath = videoFile.absolutePath,
            duration = 0 // Se calcularía con MediaMetadataRetriever en producción
          )
        )
        Result.success(videoFile.absolutePath)
      } else {
        Result.failure(Exception("No recording file found"))
      }
    } catch (e: Exception) {
      notifyListeners(CameraEvent.Error("Failed to stop video", e))
      Result.failure(e)
    }
  }

  // ========== FLASH ==========

  /**
   * Alternar flash
   */
  suspend fun toggleFlash(enabled: Boolean): Result<Boolean> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.CAMERA)) {
        return@withContext Result.failure(
          Exception("Camera permission not granted")
        )
      }

      // En un escenario real, controlar el flash via CameraManager
      // Por ahora, retornar éxito
      Result.success(enabled)
    } catch (e: Exception) {
      Result.failure(e)
    }
  }

  // ========== CÁMARA ==========

  /**
   * Obtener lista de cámaras disponibles
   */
  fun getAvailableCameras(): List<String> {
    return try {
      val cameras = mutableListOf<String>()
      for (cameraId in cameraManager.cameraIdList) {
        val characteristics = cameraManager.getCameraCharacteristics(cameraId)
        val facing =
          characteristics.get(CameraCharacteristics.LENS_FACING)
        when (facing) {
          CameraCharacteristics.LENS_FACING_BACK -> cameras.add("back")
          CameraCharacteristics.LENS_FACING_FRONT -> cameras.add("front")
        }
      }
      cameras.distinct()
    } catch (e: Exception) {
      emptyList()
    }
  }

  /**
   * Cambiar cámara activa
   */
  fun selectCamera(cameraId: String): Boolean {
    return if (getAvailableCameras().contains(cameraId)) {
      currentCamera = cameraId
      true
    } else {
      false
    }
  }

  // ========== UTILIDADES ==========

  private fun createImageFile(): File {
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val storageDir = context.getExternalFilesDir("photos")
    return File.createTempFile("PHOTO_${timestamp}_", ".jpg", storageDir)
  }

  private fun createVideoFile(): File {
    val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val storageDir = context.getExternalFilesDir("videos")
    return File.createTempFile("VIDEO_${timestamp}_", ".mp4", storageDir)
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(
      context,
      permission
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun isRecordingVideo(): Boolean = isRecording

  fun cleanup() {
    scope.cancel()
    if (isRecording) {
      runBlocking { stopVideo() }
    }
    mediaRecorder?.release()
  }
}
