# Propio - Plataforma Inmobiliaria Inteligente

Este proyecto cuenta con una arquitectura moderna de archivos y separación estricta de responsabilidades entre el Backend (fuente única de verdad) y el Frontend (interfaz de usuario).

---

## Estructura de Directorios

```
propio-inmobiliaria/
├── backend/                   # API en NestJS (Single Source of Truth)
│   ├── src/
│   │   ├── main.ts            # Punto de entrada de la API (CORS, prefijos, pipes)
│   │   ├── app.module.ts      # Módulo raíz del sistema
│   │   ├── prisma/            # Módulo y servicio global de persistencia
│   │   └── modules/           # Módulos organizados por Dominios (Auth, Properties, Leads)
├── frontend/                  # Cliente Web en Next.js (App Router)
│   ├── src/
│   │   ├── app/               # Rutas físicas (enrutamiento de Next.js)
│   │   ├── components/        # Componentes UI (Atómicos y de dominio modular)
│   │   ├── hooks/             # Custom Hooks de React (useProperties, useAuth)
│   │   ├── services/          # Capa HTTP (api.client y servicios de dominio)
│   │   └── styles/            # Estilos globales y tokens de Tailwind CSS
│   └── tailwind.config.js     # Configuración y branding de "Propio"
└── prisma/                    # Modelado y migración central de base de datos
    └── schema.prisma          # Fuente única de verdad de los datos del negocio
```

---

## Cómo Iniciar

### 1. Requisitos Previos
* Node.js v18 o superior instalado.
* Gestor de paquetes `npm`, `yarn` o `pnpm`.

### 2. Levantar el Backend (NestJS)
1. Navegar al directorio del backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias necesarias para NestJS, Prisma y class-validator:
   ```bash
   npm install @nestjs/core @nestjs/common @nestjs/platform-express prisma @prisma/client class-validator class-transformer reflect-metadata typescript @types/node
   ```
3. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run start:dev
   ```
   *El Backend de NestJS se ejecutará en:* `http://localhost:4000/api`

### 3. Levantar el Frontend (Next.js)
1. Navegar al directorio del frontend:
   ```bash
   cd ../frontend
   ```
2. Instalar dependencias de Next.js y Tailwind CSS:
   ```bash
   npm install next react react-dom tailwindcss postcss autoprefixer typescript @types/react @types/react-dom
   ```
3. Iniciar el cliente en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El Frontend de Next.js se ejecutará en:* `http://localhost:3000`

---

## Diseño y Consistencia Visual (Tailwind CSS)

El tema corporativo está configurado en `frontend/tailwind.config.js` y expone los colores corporativos de **Propio**:
* **Azul Principal (`brand.blue`):** `#04045E` (Estabilidad, seguridad y formalidad).
* **Amarillo/Verdoso de acento (`brand.lime`):** `#b9fa3c` (Llamados a la acción dinámicos y modernos).
* **Glassmorphism:** Disponible globalmente mediante la clase `.glass-panel` definida en `frontend/src/styles/globals.css`.
