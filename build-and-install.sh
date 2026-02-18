#!/bin/bash

# 🚀 Script para Compilar y Instalar MultiCamPro
# Proporciona múltiples formas de compilar y instalar en dispositivo

set -e

echo "🚀 MultiCamPro - Build & Install Script"
echo "========================================="
echo ""
echo "Elige tu opción:"
echo ""
echo "1️⃣  Expo Go (Testing Rápido - Recomendado)"
echo "   - Instala app demo en segundos"
echo "   - Perfecto para testing inicial"
echo ""
echo "2️⃣  Compilar APK Completo (EAS Cloud Build)"
echo "   - APK listo para Google Play"
echo "   - Requiere cuenta Expo gratuita"
echo "   - Toma 20-30 minutos"
echo ""
echo "3️⃣  Compilar APK Local (Android SDK)"
echo "   - Si tienes Android SDK instalado"
echo "   - Más rápido si está configurado"
echo ""
read -p "Selecciona opción (1/2/3): " OPTION

case $OPTION in
    1)
        echo ""
        echo "📱 Iniciando Expo Go..."
        echo ""
        echo "PASOS:"
        echo "1. Instala 'Expo Go' en tu dispositivo desde Google Play"
        echo "   (Busca 'Expo Go' en https://play.google.com)"
        echo ""
        echo "2. Ejecutaremos el servidor local:"
        echo "   npm start"
        echo ""
        echo "3. Abre Expo Go en tu dispositivo"
        echo "4. Escanea el código QR que aparecerá"
        echo ""
        read -p "Presiona Enter para continuar..."
        npm start
        ;;
    
    2)
        echo ""
        echo "☁️  Compilando APK con EAS Cloud Build..."
        echo ""
        echo "Esto compilará un APK en los servidores de Expo"
        echo "y te proporcionará un link para descargarlo."
        echo ""
        echo "REQUISITOS:"
        echo "- Cuenta Expo (gratuita)"
        echo "- EAS CLI (ya instalado)"
        echo ""
        read -p "Presiona Enter para continuar..."
        
        # Compilar con EAS Build
        eas build --platform android --profile preview
        
        echo ""
        echo "✅ APK compilado!"
        echo "📥 Descarga el APK del link que aparece arriba"
        echo "📲 Instala en tu dispositivo: adb install app.apk"
        ;;
    
    3)
        echo ""
        echo "🛠️  Compilando APK Localmente..."
        echo ""
        echo "REQUISITOS:"
        echo "- Android SDK 35+"
        echo "- Java 17+"
        echo ""
        
        if ! command -v adb &> /dev/null; then
            echo "❌ Android SDK no encontrado"
            echo ""
            echo "Instala Android SDK:"
            echo "  Ubuntu: sudo apt-get install android-sdk"
            echo "  o descarga desde: https://developer.android.com/studio"
            exit 1
        fi
        
        read -p "Presiona Enter para continuar con compilación local..."
        
        npm run android
        ;;
    
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac

