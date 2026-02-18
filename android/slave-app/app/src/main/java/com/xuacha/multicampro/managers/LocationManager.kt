package com.xuacha.multicampro.managers

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager as AndroidLocationManager
import android.os.Looper
import androidx.core.content.ContextCompat
import com.google.android.gms.location.*
import kotlinx.coroutines.*

/**
 * Gestor de Ubicación - MultiCamPro
 * 
 * Maneja:
 * - Obtener ubicación actual (single shot)
 * - Tracking continuo de ubicación
 * - Cálculo de distancia y velocidad
 * - Optimización de batería
 */

sealed class LocationEvent {
  data class LocationUpdated(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val accuracy: Float,
    val speed: Float,
    val timestamp: Long
  ) : LocationEvent()

  data class Error(val message: String, val exception: Exception) : LocationEvent()
  
  object LocationReady : LocationEvent()
}

interface LocationListener {
  fun onLocationEvent(event: LocationEvent)
}

class LocationManager(
  private val context: Context,
) {
  private val fusedLocationClient: FusedLocationProviderClient =
    LocationServices.getFusedLocationProviderClient(context)
  
  private val scope = CoroutineScope(Dispatchers.Default + Job())
  private val listeners = mutableSetOf<LocationListener>()

  private var locationCallback: LocationCallback? = null
  private var isTracking = false
  private var lastLocation: Location? = null

  // ========== LISTENERS ==========

  fun addListener(listener: LocationListener) {
    listeners.add(listener)
  }

  fun removeListener(listener: LocationListener) {
    listeners.remove(listener)
  }

  private fun notifyListeners(event: LocationEvent) {
    listeners.forEach { it.onLocationEvent(event) }
  }

  // ========== UBICACIÓN ACTUAL ==========

  /**
   * Obtener ubicación actual (single shot)
   */
  suspend fun getCurrentLocation(): Result<Map<String, Any>> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.ACCESS_FINE_LOCATION) &&
        !hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
      ) {
        return@withContext Result.failure(
          Exception("Location permission not granted")
        )
      }

      val location = suspendCancellableCoroutine { continuation ->
        val locationRequest = LocationRequest.Builder(
          Priority.PRIORITY_HIGH_ACCURACY,
          5000 // 5 segundos
        ).build()

        val locationCallback = object : LocationCallback() {
          override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
              fusedLocationClient.removeLocationUpdates(this)
              continuation.resume(location)
            }
          }

          override fun onLocationAvailability(availability: LocationAvailability) {
            if (!availability.isLocationAvailable) {
              fusedLocationClient.removeLocationUpdates(this)
              continuation.resumeWithException(
                Exception("Location not available")
              )
            }
          }
        }

        fusedLocationClient.requestLocationUpdates(
          locationRequest,
          locationCallback,
          Looper.getMainLooper()
        )
      }

      val locationData = locationToMap(location)
      lastLocation = location
      
      notifyListeners(
        LocationEvent.LocationUpdated(
          latitude = location.latitude,
          longitude = location.longitude,
          altitude = location.altitude,
          accuracy = location.accuracy,
          speed = location.speed,
          timestamp = location.time
        )
      )

      Result.success(locationData)
    } catch (e: Exception) {
      notifyListeners(LocationEvent.Error("Failed to get location", e))
      Result.failure(e)
    }
  }

  // ========== TRACKING CONTINUO ==========

  /**
   * Iniciar tracking continuo de ubicación
   */
  suspend fun startTracking(
    updateIntervalMs: Long = 5000, // 5 segundos
    smallestDisplacementMeters: Float = 10f // Mínimo 10 metros
  ): Result<String> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
        return@withContext Result.failure(
          Exception("Location permission not granted")
        )
      }

      if (isTracking) {
        return@withContext Result.failure(
          Exception("Already tracking")
        )
      }

      val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        updateIntervalMs
      ).apply {
        setMinUpdateDistanceMeters(smallestDisplacementMeters)
        setWaitForAccurateLocation(false)
      }.build()

      locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
          result.lastLocation?.let { location ->
            lastLocation = location
            notifyListeners(
              LocationEvent.LocationUpdated(
                latitude = location.latitude,
                longitude = location.longitude,
                altitude = location.altitude,
                accuracy = location.accuracy,
                speed = location.speed,
                timestamp = location.time
              )
            )
          }
        }
      }

      fusedLocationClient.requestLocationUpdates(
        locationRequest,
        locationCallback!!,
        Looper.getMainLooper()
      )

      isTracking = true
      notifyListeners(LocationEvent.LocationReady)
      
      Result.success("tracking-session-${System.currentTimeMillis()}")
    } catch (e: Exception) {
      notifyListeners(LocationEvent.Error("Failed to start tracking", e))
      Result.failure(e)
    }
  }

  /**
   * Detener tracking continuo
   */
  suspend fun stopTracking(): Result<Unit> = withContext(Dispatchers.IO) {
    return@withContext try {
      if (!isTracking) {
        return@withContext Result.failure(
          Exception("Not tracking")
        )
      }

      locationCallback?.let {
        fusedLocationClient.removeLocationUpdates(it)
      }
      locationCallback = null
      isTracking = false

      Result.success(Unit)
    } catch (e: Exception) {
      notifyListeners(LocationEvent.Error("Failed to stop tracking", e))
      Result.failure(e)
    }
  }

  // ========== UTILIDADES ==========

  /**
   * Obtener última ubicación conocida
   */
  fun getLastLocation(): Map<String, Any>? {
    return lastLocation?.let { locationToMap(it) }
  }

  /**
   * Verificar si está en tracking
   */
  fun isTracking(): Boolean = isTracking

  /**
   * Calcular distancia entre dos puntos (Haversine formula)
   */
  fun calculateDistance(
    lat1: Double,
    lon1: Double,
    lat2: Double,
    lon2: Double
  ): Double {
    val earthRadiusKm = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    val c = 2 * Math.asin(Math.sqrt(a))
    return earthRadiusKm * c
  }

  private fun locationToMap(location: Location): Map<String, Any> {
    return mapOf(
      "latitude" to location.latitude,
      "longitude" to location.longitude,
      "altitude" to location.altitude,
      "accuracy" to location.accuracy,
      "speed" to location.speed,
      "bearing" to location.bearing,
      "timestamp" to location.time,
      "provider" to (location.provider ?: "unknown")
    )
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(
      context,
      permission
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun cleanup() {
    scope.cancel()
    if (isTracking) {
      runBlocking { stopTracking() }
    }
  }
}
