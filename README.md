# MultiCamPro

**App de gestión multi dispositivos para la creación de contenido audiovisual**

## Descripción

MultiCamPro es una aplicación multiplataforma (móvil y web) diseñada para facilitar la gestión, captura y coordinación de dispositivos múltiples en la creación de contenido audiovisual profesional. Con soporte para Android, iOS y navegadores web desde una única base de código.

## Tecnologías

- **Framework**: React Native + Expo
- **Lenguaje**: TypeScript
- **Backend**: Firebase (Firestore/Realtime Database)
- **Plataformas**: Android, iOS, Web
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Networking**: Axios + Firebase SDK

## Características Principales

- 📹 Captura de video desde múltiples cámaras
- 🎥 Gestión de contenido audiovisual
- ☁️ Sincronización en tiempo real con Firebase
- 📱 Soporte multiplataforma (móvil y web)
- 🔔 Notificaciones en tiempo real
- 📦 Almacenamiento local y en la nube
- 👥 Gestión de proyectos colaborativos

## Estructura del Proyecto

```
MultiCamPro/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── screens/          # Pantallas de la aplicación
│   ├── context/          # Context API para estado global
│   ├── hooks/            # Custom hooks
│   ├── services/         # Servicios (Firebase, API, etc.)
│   ├── utils/            # Funciones utilitarias
│   ├── types/            # Tipos TypeScript
│   ├── config/           # Configuraciones
│   ├── navigation/       # Configuración de navegación
│   └── App.tsx           # Punto de entrada principal
├── assets/               # Imágenes, iconos, fuentes
├── app.json              # Configuración de Expo
├── tsconfig.json         # Configuración TypeScript
├── babel.config.js       # Configuración Babel
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

## Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI: `npm install -g expo-cli`

### Pasos

1. Clonar el repositorio

```bash
git clone https://github.com/Xuacha/MultiCamPro.git
cd MultiCamPro
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar Firebase (Ver sección de Configuración)

4. Ejecutar la aplicación

```bash
# Para development
npm start

# Para Android
npm run android

# Para iOS
npm run ios

# Para Web
npm run web
```

## Configuración

### Firebase

Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase:

```
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Ejecuta la app en Android
- `npm run ios` - Ejecuta la app en iOS
- `npm run web` - Ejecuta la app en web
- `npm test` - Ejecuta los tests
- `npm run lint` - Verifica el código
- `npm run format` - Formatea el código

## Desarrollo

### Crear un nuevo componente

```bash
# Los componentes van en src/components/
src/components/MiComponente/
├── index.tsx
├── styles.ts
└── MiComponente.types.ts
```

### Crear una nueva pantalla

```bash
# Las pantallas van en src/screens/
src/screens/MiPantalla/
├── index.tsx
├── styles.ts
└── MiPantalla.types.ts
```

## Testing

```bash
npm test
```

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
2. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
3. Push a la rama (`git push origin feature/AmazingFeature`)
4. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Autor

Xuacha

## Changelog

### v1.0.0

- Inicialización del proyecto
- Configuración base de Expo y React Native
- Integración con Firebase
- Estructura de carpetas completa
