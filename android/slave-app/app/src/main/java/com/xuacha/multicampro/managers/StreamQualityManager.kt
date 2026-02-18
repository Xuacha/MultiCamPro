package com.xuacha.multicampro.managers

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import kotlinx.coroutines.*

/**
 * Gestor de Calidad de Red - MultiCamPro
 * 
 * Monitorea:
 * - Velocidad de red
 * - Tipo de conexión
 * - Signal strength
 * - Recomendaciones automáticas de calidad
 */

enum class NetworkQuality {
  POOR,      // < 2 Mbps
  FAIR,      // 2-5 Mbps
  GOOD,      // 5-10 Mbps
  EXCELLENT, // > 10 Mbps
  UNKNOWN
}

enum class NetworkType {
  WIFI,
  CELLULAR_4G,
  CELLULAR_5G,
  CELLULAR_3G,
  UNKNOWN,
  OFFLINE
}

data class NetworkStatus(
  val type: NetworkType,
  val quality: NetworkQuality,
  val estimatedBitrate: Int,  // kbps
  val signalStrength: Int,     // 0-100
  val isMetered: Boolean,
  val timestamp: Long = System.currentTimeMillis()
)

sealed class NetworkEvent {
  data class NetworkStatusChanged(val status: NetworkStatus) : NetworkEvent()
  data class QualityRecommended(val quality: String) : NetworkEvent()
  data class NetworkWarning(val message: String) : NetworkEvent()
}

interface NetworkListener {
  fun onNetworkEvent(event: NetworkEvent)
}

class StreamQualityManager(
  private val context: Context,
  private val externalScope: CoroutineScope? = null
) {
  private val connectivityManager =
    context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
  
  private val scope = externalScope ?: CoroutineScope(Dispatchers.Default + Job())
  private val listeners = mutableSetOf<NetworkListener>()

  private var currentStatus: NetworkStatus = NetworkStatus(
    type = NetworkType.UNKNOWN,
    quality = NetworkQuality.UNKNOWN,
    estimatedBitrate = 0,
    signalStrength = 0,
    isMetered = false
  )

  init {
    startMonitoring()
  }

  // ========== LISTENERS ==========

  fun addListener(listener: NetworkListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: NetworkListener) {
    listeners.remove(listener)
  }

  private fun notifyListeners(event: NetworkEvent) {
    listeners.forEach { it.onNetworkEvent(event) }
  }

  // ========== MONITOREO ==========

  /**
   * Iniciar monitoreo de red en segundo plano
   */
  private fun startMonitoring() {
    scope.launch {
      while (isActive) {
        val status = getNetworkStatus()
        
        if (status != currentStatus) {
          currentStatus = status
          notifyListeners(NetworkEvent.NetworkStatusChanged(status))
          
          // Recomendar calidad basada en red
          val recommendedQuality = recommendQuality(status)
          notifyListeners(NetworkEvent.QualityRecommended(recommendedQuality))
        }
        
        delay(5000)  // Revisar cada 5 segundos
      }
    }
  }

  /**
   * Obtener estado actual de la red
   */
  fun getNetworkStatus(): NetworkStatus {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val activeNetwork = connectivityManager.activeNetwork
        val caps = connectivityManager.getNetworkCapabilities(activeNetwork)

        if (caps != null) {
          val (type, bitrate) = when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> {
              Pair(NetworkType.WIFI, 50000)  // ~50 Mbps typical
            }
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
              val downlink = caps.linkDownstreamBandwidthKbps
              when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
                  caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) &&
                  caps.linkDownstreamBandwidthKbps > 50000 -> {
                  Pair(NetworkType.CELLULAR_5G, downlink)
                }
                downlink > 10000 -> Pair(NetworkType.CELLULAR_4G, downlink)
                downlink > 1000 -> Pair(NetworkType.CELLULAR_3G, downlink)
                else -> Pair(NetworkType.CELLULAR_3G, 1000)
              }
            }
            else -> {
              Pair(NetworkType.UNKNOWN, 0)
            }
          }

          val isMetered = !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
          
          return NetworkStatus(
            type = type,
            quality = bitrate.toNetworkQuality(),
            estimatedBitrate = bitrate,
            signalStrength = estimateSignalStrength(type),
            isMetered = isMetered
          )
        }
      }

      // Fallback para versiones antiguas
      return NetworkStatus(
        type = NetworkType.OFFLINE,
        quality = NetworkQuality.UNKNOWN,
        estimatedBitrate = 0,
        signalStrength = 0,
        isMetered = false
      )
    } catch (e: Exception) {
      NetworkStatus(
        type = NetworkType.UNKNOWN,
        quality = NetworkQuality.UNKNOWN,
        estimatedBitrate = 0,
        signalStrength = 0,
        isMetered = false
      )
    }
  }

  /**
   * Recomendar calidad basada en condiciones de red
   */
  fun recommendQuality(status: NetworkStatus = currentStatus): String {
    return when {
      status.type == NetworkType.OFFLINE -> "offline"
      status.estimatedBitrate < 2000 -> "low"
      status.estimatedBitrate < 5000 -> "medium"
      else -> "high"
    }
  }

  /**
   * Obtener recomendación con detalles
   */
  fun getQualityRecommendation(): Map<String, Any> {
    return mapOf(
      "recommended" to recommendQuality(currentStatus),
      "networkType" to currentStatus.type.name,
      "estimatedBitrate" to currentStatus.estimatedBitrate,
      "signalStrength" to currentStatus.signalStrength,
      "isMetered" to currentStatus.isMetered
    )
  }

  /**
   * Verificar si la red es adecuada para streaming
   */
  fun isNetworkAdequateForStreaming(quality: String = "medium"): Boolean {
    val requiredBitrate = when (quality) {
      "low" -> 1000    // 1 Mbps
      "high" -> 10000  // 10 Mbps
      else -> 5000     // 5 Mbps
    }
    
    return currentStatus.estimatedBitrate >= requiredBitrate
  }

  /**
   * Obtener advertencia de red si la hay
   */
  fun getNetworkWarning(): String? {
    return when {
      currentStatus.type == NetworkType.OFFLINE -> {
        "No hay conexión de red"
      }
      currentStatus.isMetered && currentStatus.estimatedBitrate < 5000 -> {
        "Red celular lenta detectada. Considere usar calidad baja"
      }
      currentStatus.signalStrength < 30 -> {
        "Señal débil detectada. La calidad puede verse afectada"
      }
      else -> null
    }
  }

  // ========== UTILIDADES ==========

  private fun Int.toNetworkQuality(): NetworkQuality {
    return when {
      this < 2000 -> NetworkQuality.POOR
      this < 5000 -> NetworkQuality.FAIR
      this < 10000 -> NetworkQuality.GOOD
      else -> NetworkQuality.EXCELLENT
    }
  }

  private fun estimateSignalStrength(type: NetworkType): Int {
    return when (type) {
      NetworkType.WIFI -> {
        // Estimación basada en estado general
        // En producción, usar WifiManager para RSSI real
        75
      }
      NetworkType.CELLULAR_5G -> 85
      NetworkType.CELLULAR_4G -> 70
      NetworkType.CELLULAR_3G -> 50
      else -> 0
    }
  }

  /**
   * Obtener estado actual
   */
  fun getCurrentStatus(): NetworkStatus = currentStatus

  /**
   * Convertir calidad recomendada a bitrate
   */
  fun qualityToBitrate(quality: String): Int {
    return when (quality) {
      "low" -> 1000000    // 1 Mbps
      "high" -> 10000000  // 10 Mbps
      else -> 5000000     // 5 Mbps
    }
  }

  fun cleanup() {
    scope.cancel()
  }
}
