#!/bin/bash

# 🚀 MultiCamPro - Production Launch Master Script
# Ejecuta los 3 pasos necesarios para lanzar la app

set -e

RESET='\033[0m'
BRIGHT='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'

clear

echo -e "${BRIGHT}${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       MultiCamPro v1.0.0 - Production Launch             ║"
echo "║      Los 3 pasos para lanzar a producción                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

echo ""
echo -e "${BRIGHT}Ubicación: $(pwd)${RESET}"
echo ""

# Función para mostrar status
show_status() {
    echo ""
    echo -e "${BRIGHT}${BLUE}═══════════════════════════════════════════════════════════${RESET}"
    echo -e "${BRIGHT}$1${RESET}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${RESET}"
}

# Función para preguntar
confirm() {
    read -p "$(echo -e ${YELLOW})$1 (s/n):${RESET} " -n 1 -r response
    echo
    [[ $response =~ ^[Ss]$ ]]
}

# Menu principal
show_status "MENÚ PRINCIPAL"
echo ""
echo -e "${GREEN}1️⃣  PASO 1: Compilar APK para dispositivo físico${RESET}"
echo "     - Compila la app React Native"
echo "     - Genera APK listo para instalar"
echo ""
echo -e "${GREEN}2️⃣  PASO 2: Testing en dispositivo físico${RESET}"
echo "     - Instala y prueba en Android real"
echo "     - Validar funcionalidades"
echo ""
echo -e "${GREEN}3️⃣  PASO 3: Desplegar backend a producción${RESET}"
echo "     - Lanza servidor Node.js"
echo "     - Configura para producción"
echo ""
echo -e "${YELLOW}0️⃣  VER DOCUMENTACIÓN (leer primero)${RESET}"
echo ""

read -p "Selecciona opción (0/1/2/3) o 'todos' para ejecutar secuencia: " OPTION

case $OPTION in
    0)
        show_status "DOCUMENTACIÓN"
        echo ""
        echo "Archivos de documentación disponibles:"
        echo ""
        echo -e "${GREEN}BUILD_APK_GUIDE.md${RESET}"
        echo "  → Guía completa para compilar APK"
        echo ""
        echo -e "${GREEN}TESTING_DEVICE_GUIDE.md${RESET}"
        echo "  → Checklist completo para testing en dispositivo"
        echo ""
        echo -e "${GREEN}BACKEND_DEPLOYMENT_STEP3.md${RESET}"
        echo "  → Guía de despliegue backend (Render, Railway, Docker)"
        echo ""
        echo "Abre cualquiera con:"
        echo "  cat BUILD_APK_GUIDE.md"
        echo "  cat TESTING_DEVICE_GUIDE.md"
        echo "  cat BACKEND_DEPLOYMENT_STEP3.md"
        ;;
    
    1)
        show_status "PASO 1: Compilar APK"
        echo ""
        echo "Opciones de compilación:"
        echo ""
        echo -e "${GREEN}A) Expo Go (Testing rápido - Recomendado)${RESET}"
        echo "   - Sin compilación"
        echo "   - Instantáneo"
        echo "   - Perfecto para desarrollo"
        echo ""
        echo -e "${GREEN}B) APK Completo (Production)${RESET}"
        echo "   - Compilación completa"
        echo "   - Toma 20-30 minutos"
        echo "   - Distribuible en Google Play"
        echo ""
        
        read -p "Elige A o B: " BUILD_OPTION
        
        if [[ $BUILD_OPTION == "A" || $BUILD_OPTION == "a" ]]; then
            show_status "Iniciando Expo Go"
            echo ""
            echo "1. Asegúrate de tener Expo Go instalado en tu dispositivo"
            echo "   (Google Play Store: busca 'Expo Go')"
            echo ""
            echo "2. Iniciaremos el servidor local..."
            echo ""
            echo "3. Abre Expo Go en tu dispositivo, presiona el botón de "
            echo "   escanear y escanea el código QR que verás"
            echo ""
            read -p "Presiona Enter para continuar..."
            
            cd /workspaces/MultiCamPro
            npm start
        
        elif [[ $BUILD_OPTION == "B" || $BUILD_OPTION == "b" ]]; then
            show_status "Compilando APK Completo"
            echo ""
            echo "Pasos:"
            echo "1. Primero, configura Firebase (si no lo has hecho)"
            echo ""
            
            if [ -z "${EXPO_PUBLIC_FIREBASE_API_KEY}" ]; then
                echo -e "${YELLOW}⚠️  Firebase no configurado${RESET}"
                if confirm "¿Ejecutar script de configuración?"; then
                    bash configure-firebase.sh
                fi
            else
                echo -e "${GREEN}✓ Firebase ya configurado${RESET}"
            fi
            
            echo ""
            echo "2. Compilando con EAS Build..."
            eas build --platform android --profile preview
            echo ""
            echo -e "${GREEN}✓ APK compilado!${RESET}"
            echo "  Descarga el link que aparece arriba"
            echo "  Luego instala con: adb install app.apk"
        fi
        ;;
    
    2)
        show_status "PASO 2: Testing en Dispositivo Físico"
        echo ""
        echo "Lee la guía completa de testing:"
        echo ""
        echo "  cat TESTING_DEVICE_GUIDE.md"
        echo ""
        echo "O abre en editor:"
        echo "  code TESTING_DEVICE_GUIDE.md"
        echo ""
        echo "Checklist rápido:"
        echo "  ☐ Instalar APK en dispositivo"
        echo "  ☐ Abrir app y probar login"
        echo "  ☐ Verificar permisos"
        echo "  ☐ Probar navegación"
        echo "  ☐ Test cloud storage"
        echo "  ☐ Test compartición"
        echo ""
        ;;
    
    3)
        show_status "PASO 3: Desplegar Backend"
        echo ""
        echo "Opciones de deploymen:"
        echo ""
        echo -e "${GREEN}1) Render.com (Gratuito)${RESET}"
        echo "   → Ideal for testing"
        echo ""
        echo -e "${GREEN}2) Railway.app (Recomendado)${RESET}"
        echo "   → Mejor para producción"
        echo ""
        echo -e "${GREEN}3) Despliegue Local${RESET}"
        echo "   → En tu servidor/computadora"
        echo ""
        echo -e "${GREEN}4) Docker${RESET}"
        echo "   → Profesional"
        echo ""
        echo "Lee la guía completa:"
        echo "  cat BACKEND_DEPLOYMENT_STEP3.md"
        echo ""
        ;;
    
    todos)
        show_status "EJECUTANDO 3 PASOS EN SECUENCIA"
        echo ""
        echo "⚠️  Esto ejecutará una secuencia de todas las etapas"
        echo ""
        
        if confirm "¿Continuar?"; then
            echo ""
            show_status "📝 PASO 1: Preparar compilación"
            
            # Instalar dependencias
            echo "Instalando dependencias..."
            cd /workspaces/MultiCamPro
            npm install --legacy-peer-deps > /dev/null 2>&1
            echo -e "${GREEN}✓ Dependencias instaladas${RESET}"
            
            echo ""
            show_status "🔥 Configurar Firebase"
            
            if confirm "¿Configurar Firebase ahora?"; then
                bash configure-firebase.sh
            fi
            
            echo ""
            show_status "💾 PASO 2: Generar APK"
            
            if confirm "¿Compilar APK ahora?"; then
                eas build --platform android --profile preview
            fi
            
            echo ""
            show_status "📱 PASO 3: Instalar en dispositivo"
            
            echo "1. Descarga el APK del link anterior"
            echo "2. Conecta tu dispositivo via USB"
            echo "3. Ejecuta:"
            echo "   adb install -r app.apk"
            echo ""
            
            if confirm "¿Continuar con testing?"; then
                echo ""
                echo "Lee la guía de testing:"
                echo "  cat TESTING_DEVICE_GUIDE.md"
            fi
            
            echo ""
            show_status "🚀 PASO 4: Backend"
            
            if confirm "¿Desplegar backend ahora?"; then
                echo ""
                echo "Lee la guía de despliegue:"
                echo "  cat BACKEND_DEPLOYMENT_STEP3.md"
            fi
        fi
        ;;
    
    *)
        echo -e "${RED}Opción inválida${RESET}"
        exit 1
        ;;
esac

echo ""
echo -e "${BRIGHT}${GREEN}════════════════════════════════════════════════════════════${RESET}"
echo ""

