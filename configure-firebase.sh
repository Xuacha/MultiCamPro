#!/bin/bash

# 🔧 Script para Configurar Firebase en MultiCamPro
# Este script te ayuda a obtener y configurar tus credenciales de Firebase

set -e

echo "🔥 Configuración de Firebase para MultiCamPro"
echo "=============================================="
echo ""
echo "Este script te guiará para obtener y configurar Firebase."
echo ""

# Verificar si el archivo .env ya existe
if [ -f ".env" ]; then
    echo "⚠️  Archivo .env encontrado."
    read -p "¿Deseas continuar y actualizar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operación cancelada."
        exit 0
    fi
fi

echo ""
echo "📋 PASOS para obtener credenciales de Firebase:"
echo "================================================"
echo ""
echo "1. Ve a https://console.firebase.google.com"
echo "2. Crea un nuevo proyecto o selecciona uno existente"
echo "3. Ve a Configuración del Proyecto (⚙️) > General"
echo "4. Desplázate a 'Tus aplicaciones' y selecciona la app Android"
echo "5. Copia la configuración JSON (apiKey, authDomain, etc.)"
echo ""
echo "O busca 'firebaseConfig' en tu archivo google-services.json"
echo ""

# Leer credenciales del usuario
echo "Ingresa tus credenciales de Firebase:"
echo "========================================"
echo ""

read -p "API Key: " API_KEY
read -p "Auth Domain (ej: proyecto.firebaseapp.com): " AUTH_DOMAIN
read -p "Project ID (ej: mi-proyecto-abc123): " PROJECT_ID
read -p "Storage Bucket (ej: mi-proyecto.appspot.com): " STORAGE_BUCKET
read -p "Messaging Sender ID (solo números): " MESSAGING_SENDER_ID
read -p "App ID (ej: 1:123456:android:abcdef): " APP_ID
read -p "Database URL (ej: https://proyecto.firebaseio.com): " DATABASE_URL

# Crear archivo .env
cat > .env << EOF
# Variables de entorno para Firebase
# Configurado para MultiCamPro
EXPO_PUBLIC_FIREBASE_API_KEY=${API_KEY}
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${AUTH_DOMAIN}
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${STORAGE_BUCKET}
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${MESSAGING_SENDER_ID}
EXPO_PUBLIC_FIREBASE_APP_ID=${APP_ID}
EXPO_PUBLIC_FIREBASE_DATABASE_URL=${DATABASE_URL}

# Variables para Backend (Paso 3)
# Descomenta después de obtener estas credenciales
# FIREBASE_SERVICE_ACCOUNT_KEY_FILE=./firebase-key.json
# SIGNALING_SERVER_URL=http://localhost:3000
# NODE_ENV=development
EOF

echo ""
echo "✅ Archivo .env creado exitosamente!"
echo ""
echo "Variables almacenadas:"
echo "  - API Key: ${API_KEY:0:10}..."
echo "  - Project ID: ${PROJECT_ID}"
echo "  - Auth Domain: ${AUTH_DOMAIN}"
echo ""
echo "📝 Siguiente: Ejecuta 'npm start' para compilar la app"
echo ""

