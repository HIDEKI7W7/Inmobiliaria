# 🛡️ REPORTE DE AUDITORÍA DE SEGURIDAD EXHAUSTIVA
## Proyecto: "Propio" Inmobiliaria · Estándar de Ciberseguridad OWASP Top 10 & AGENTS.md

> **Auditor Líder de Seguridad:** Security Lead Auditor  
> **Fecha de Evaluación:** 22 de Mayo, 2026  
> **Estado General del Proyecto:** 🔴 **CRÍTICO / ALTO RIESGO** (Debido a backdoors activos y almacenamiento inseguro de secretos y tokens)

---

## 🗺️ 1. Ficha Ejecutiva de la Auditoría

Esta auditoría analiza en profundidad los componentes del backend (NestJS) y frontend (Next.js) del ecosistema **Propio**, una plataforma inmobiliaria premium orientada al mercado boliviano. Se han evaluado las capas de red, mecanismos de autenticación, control de accesos, validación de datos en el cliente/servidor, y apego estricto a las directrices de **AGENTS.md** (especialmente en lo referido a hidratación SSR, inyección de dependencias, DTOs y almacenamiento seguro de credenciales).

### Resumen de Hallazgos por Severidad
| Severidad | Cantidad | Descripción General | Estado de Mitigación |
| :--- | :---: | :--- | :---: |
| 🔴 **Crítica** | **2** | Backdoor en AuthGuard, secretos y credenciales en control de versiones. | **Acción Inmediata Requerida** |
| 🟠 **Alta** | **2** | Almacenamiento de tokens JWT en LocalStorage y Cookies no HTTP-Only, DTOs definidos como interfaces (Bypass de validación en runtime). | **Prioridad Alta** |
| 🟡 **Media** | **2** | Ausencia del middleware de seguridad Helmet, falta de validación y sanitización en parámetros de ruta (`ParseUUIDPipe`). | **Prioridad Media** |
| 🟢 **Baja / Cumplido** | **1** | Cumplimiento del estándar de hidratación segura en SSR (Leaflet con importaciones dinámicas asíncronas). | **Aprobado / Monitoreo** |

---

## 📊 2. Tablero de Vulnerabilidades (OWASP Top 10 Mapping)

```mermaid
mindmap
  root((Seguridad Propio))
    A01:2021-Control de Acceso Roto
      Backdoor en AuthGuard
      UUIDs sin sanitizar en rutas
    A02:2021-Fallas Criptograficas
      JWT en LocalStorage
      Transmisión de Cookie expuesta a JS
    A05:2021-Configuracion Insegura
      Ausencia de Helmet en NestJS
      Credenciales en .env.production
    A03:2021-Inyeccion y Fallas de Diseno
      DTOs como interfaces sin class-validator
    Cumplimiento SSR
      Leaflet Seguro en Frontend
```

---

## 🔍 3. Análisis Técnico Detallado e Implementación de Soluciones

### 🔴 Hallazgo 1: Backdoor Crítico de Autenticación en `AuthGuard`
* **Clasificación OWASP:** A01:2021-Broken Access Control & A07:2021-Identification and Authentication Failures.
* **Archivo Afectado:** [auth.guard.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/src/modules/auth/auth.guard.ts#L26-L43)
* **Descripción:** El guard de autenticación contiene tokens "mock" harcodeados (`mock-admin-token` y `mock-agent-token`). Si un atacante envía el encabezado `Authorization: Bearer mock-admin-token`, el backend le concederá permisos de administrador (`ADMIN`) de forma inmediata, saltándose cualquier validación criptográfica del JWT.
* **Impacto:** **CRÍTICO**. Pérdida completa de confidencialidad, integridad y disponibilidad del sistema. Cualquier usuario no autenticado puede tomar control total del panel de administración.

#### Código Vulnerable (`auth.guard.ts`):
```typescript
// 1. Soporte para tokens mock de desarrollo y retrocompatibilidad
if (token === 'mock-admin-token') {
  request.user = {
    id: 'admin-1',
    name: 'Administrador Propio',
    email: 'admin@propio.com.bo',
    role: 'ADMIN',
  };
  return true;
} // ... idem para agent
```

#### Código de Mitigación Propuesto (Diff):
```diff
-    // 1. Soporte para tokens mock de desarrollo y retrocompatibilidad
-    if (token === 'mock-admin-token') {
-      request.user = {
-        id: 'admin-1',
-        name: 'Administrador Propio',
-        email: 'admin@propio.com.bo',
-        role: 'ADMIN',
-      };
-      return true;
-    } else if (token === 'mock-agent-token') {
-      request.user = {
-        id: 'agent-1',
-        name: 'Agente Estrella',
-        email: 'agent@propio.com.bo',
-        role: 'AGENTE',
-      };
-      return true;
-    }
+    // Remoción total de backdoors. Solo se permiten mocks en ambiente de desarrollo local
+    // mediante verificación estricta de la variable de entorno NODE_ENV
+    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_MOCK_TOKENS === 'true') {
+      if (token === 'mock-admin-token') {
+        request.user = { id: 'admin-1', name: 'Admin Dev', email: 'admin@propio.com.bo', role: 'ADMIN' };
+        return true;
+      }
+    }
```

---

### 🔴 Hallazgo 2: Credenciales Sensibles Expuestas en Versionamiento
* **Clasificación OWASP:** A05:2021-Security Misconfiguration.
* **Archivo Afectado:** [.env.production](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/.env.production#L11-L15)
* **Descripción:** Las credenciales de producción para la base de datos centralizada de Neon (PostgreSQL) y el secreto HMAC-SHA256 para firmar/verificar JWTs (`JWT_SECRET`) están registrados físicamente dentro del archivo `.env.production` rastreado por Git.
* **Impacto:** **CRÍTICO**. Si el repositorio se expone o es comprometido, los atacantes obtendrán acceso directo de lectura/escritura a la base de datos de producción de clientes e inmuebles y podrán clonar identidades firmando JWTs válidos.

#### Medidas de Mitigación Obligatorias:
1. Añadir `.env.production` al archivo `.gitignore` de inmediato.
2. Rotar de inmediato las credenciales en Neon PostgreSQL.
3. Cambiar el valor del `JWT_SECRET` en producción.
4. Delegar la inyección de estas variables exclusivamente al proveedor de hosting (ej. Render/Vercel) mediante su consola de administración web segura.
5. Dejar únicamente un archivo de plantilla `.env.example` en el repositorio:
```ini
# .env.example (Safe Template)
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
JWT_SECRET="generate-high-entropy-32-byte-hex-string"
CORS_ALLOWED_ORIGINS="https://tuapp.vercel.app"
PORT=4000
```

---

### 🟠 Hallazgo 3: Almacenamiento Inseguro de JWT (LocalStorage & Cookie no-HTTP-Only)
* **Clasificación OWASP:** A02:2021-Cryptographic Failures & A08:2021-Software and Data Integrity Failures.
* **Archivos Afectados:** [session.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/frontend/src/utils/session.ts#L59-L91) y [login/page.tsx](file:///c:/Users/PC/Desktop/Inmobiliaria/frontend/src/app/login/page.tsx#L38-L45)
* **Descripción:** El frontend almacena el JWT persistido en `localStorage` (`propio_token`) y escribe una cookie por medio de `document.cookie` que carece del flag `HttpOnly`. Esto significa que cualquier script malicioso (XSS inyectado por dependencias de terceros o vulnerabilidades en formularios) puede acceder libremente al token del usuario llamando a `document.cookie` o `localStorage.getItem()`.
* **Impacto:** **ALTO**. Alta probabilidad de robo de sesiones y secuestro de cuentas de agentes, propietarios y administradores si se produce una inyección de scripts.

#### Flujos de Autenticación Comparativos

```carousel
```mermaid
sequenceDiagram
    autonumber
    title FLUJO VULNERABLE ACTUAL (LocalStorage)
    participant Browser as Navegador (Cliente)
    participant LocalStorage as LocalStorage / document.cookie
    participant Backend as NestJS API
    
    Browser->>Backend: POST /api/auth/login (Envía credenciales)
    Backend-->>Browser: Retorna JWT en el cuerpo del JSON (backendToken)
    Browser->>LocalStorage: Guarda token (Accesible para cualquier Javascript!)
    Note over LocalStorage: Vulnerable a Robo XSS
```
<!-- slide -->
```mermaid
sequenceDiagram
    autonumber
    title FLUJO SEGURO PROPUESTO (HTTP-Only Cookie)
    participant Browser as Navegador (Cliente)
    participant NextBFF as Next.js BFF (Server Action / Proxy)
    participant Backend as NestJS API
    
    Browser->>NextBFF: POST /api/auth/login
    NextBFF->>Backend: POST /api/auth/login (Llamada backend segura)
    Backend-->>NextBFF: Retorna JWT en JSON
    Note over NextBFF: Crea Cookie HTTP-Only Segura
    NextBFF-->>Browser: Retorna 200 OK + Cabecera Set-Cookie
    Note over Browser: El navegador guarda la cookie automáticamente.<br/>Ningún script JS puede leerla!
```
```

#### Código de Mitigación: Estrategia de Cookies HTTP-Only en Next.js BFF
Proponemos implementar un endpoint proxy del lado de Next.js (BFF - Backend-for-Frontend) en `/app/api/auth/login/route.ts` que reciba las credenciales, llame al backend y retorne la cookie firmada y segura del lado del servidor:

```typescript
// frontend/src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const API = process.env.BACKEND_API_URL || 'http://localhost:4000/api';

    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ message: data.message || 'Error de acceso' }, { status: response.status });
    }

    const { backendToken, user } = data;

    // Configurar respuesta y establecer Cookie HTTP-Only Segura
    const nextResponse = NextResponse.json({ success: true, user });
    nextResponse.cookies.set('propio_token', backendToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800, // 7 días
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json({ message: 'Error interno en el servidor BFF' }, { status: 500 });
  }
}
```

---

### 🟠 Hallazgo 4: Bypass del Motor de Validación en NestJS (DTOs Definidos como Interfaces)
* **Clasificación OWASP:** A03:2021-Injection & A04:2021-Insecure Design.
* **Archivos Afectados:** [contracts.service.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/src/modules/contracts/contracts.service.ts#L4-L13), [expenses.service.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/src/modules/expenses/expenses.service.ts#L4-L10), [payments.service.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/src/modules/payments/payments.service.ts#L4-L10).
* **Descripción:** En NestJS, las interfaces TypeScript desaparecen en tiempo de ejecución (compilación). Al definir DTOs clave (como contratos, pagos y gastos) utilizando `interface` en lugar de clases decoradas con `class-validator`, la validación global declarada en `main.ts` (`new ValidationPipe()`) es omitida por completo. Cualquier objeto mal estructurado o con propiedades maliciosas inyectadas pasará directo al servicio sin filtros.
* **Impacto:** **ALTO**. Riesgo de ataques de inyección, corrupción de datos en la base de datos relacional Prisma y mass-assignment (asignación masiva de campos).

#### Ejemplo de Refactorización de DTO Inseguro a Seguro (Diff):

```diff
- export interface CreateContractDto {
-   propertyId: string;
-   tenantId: string;
-   ownerId: string;
-   startDate: string;
-   endDate: string;
-   monthlyAmount: number;
-   status?: 'VIGENTE' | 'VENCIDO' | 'RESCINDIDO';
-   observations?: string;
- }
+ import { IsString, IsUUID, IsNumber, IsDateString, IsOptional, IsEnum, IsPositive } from 'class-validator';
+
+ export class CreateContractDto {
+   @IsUUID(4, { message: 'El ID de la propiedad debe ser un UUID válido.' })
+   propertyId: string;
+
+   @IsUUID(4, { message: 'El ID del inquilino debe ser un UUID válido.' })
+   tenantId: string;
+
+   @IsUUID(4, { message: 'El ID del propietario debe ser un UUID válido.' })
+   ownerId: string;
+
+   @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO8601.' })
+   startDate: string;
+
+   @IsDateString({}, { message: 'La fecha final debe tener formato ISO8601.' })
+   endDate: string;
+
+   @IsNumber()
+   @IsPositive({ message: 'El monto mensual debe ser un valor positivo.' })
+   monthlyAmount: number;
+
+   @IsOptional()
+   @IsEnum(['VIGENTE', 'VENCIDO', 'RESCINDIDO'], { message: 'El estado del contrato no es válido.' })
+   status?: 'VIGENTE' | 'VENCIDO' | 'RESCINDIDO';
+
+   @IsOptional()
+   @IsString()
+   observations?: string;
+ }
```

---

### 🟡 Hallazgo 5: Falta de Sanitización y Validación de Parámetros de Ruta
* **Clasificación OWASP:** A01:2021-Broken Access Control & A03:2021-Injection.
* **Archivos Afectados:** Todos los controladores que exponen parámetros de ruta para operaciones de borrado o consulta por ID (`findOne`, `remove`, `deactivateAlert`, etc.).
* **Descripción:** Se asume que los identificadores pasados en las URLs (`/properties/:id`, `/contracts/:id`) son válidos, pero no se valida su estructura antes de pasarlos a las capas de persistencia de datos. Si la base de datos relacional utiliza UUIDv4 para todas sus llaves primarias, pasar cadenas arbitrarias puede causar excepciones no controladas o sobrecargar la capa ORM.
* **Impacto:** **MEDIO**. Posibles fugas de detalles del servidor (errores 500) y vulnerabilidad latente ante manipulaciones de parámetros si se incorporan consultas de base de datos personalizadas en el futuro.

#### Solución Recomendada (Decoración con `ParseUUIDPipe`):
Asegurar que todas las firmas de controladores NestJS fuercen la validación estricta del tipo de dato `UUID` en runtime:

```typescript
// backend/src/modules/properties/properties.controller.ts (Antes)
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.propertiesService.findOne(id);
}

// backend/src/modules/properties/properties.controller.ts (Propuesta Segura)
import { ParseUUIDPipe } from '@nestjs/common';

@Get(':id')
async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  return this.propertiesService.findOne(id);
}
```

---

### 🟡 Hallazgo 6: Ausencia de Cabeceras de Seguridad Críticas (Helmet Middleware)
* **Clasificación OWASP:** A05:2021-Security Misconfiguration.
* **Archivo Afectado:** [main.ts](file:///c:/Users/PC/Desktop/Inmobiliaria/backend/src/main.ts)
* **Descripción:** La aplicación NestJS no hace uso de `helmet` para configurar de manera proactiva cabeceras HTTP que protegen contra vectores comunes como Clickjacking, inyecciones de MIME types y XSS básico.
* **Impacto:** **MEDIO**. Exposición de la aplicación ante ataques de suplantación de identidad en marcos (`iFrame`) y secuestro de clics en el cliente.

#### Plan de Remediación Rápido:
1. Instalar la librería en la carpeta del backend:
   ```bash
   cd backend
   npm install helmet
   ```
2. Registrar el middleware globalmente en `main.ts`:
   ```typescript
   import helmet from 'helmet';
   // ...
   const app = await NestFactory.create(AppModule);
   
   // Habilitar cabeceras de seguridad seguras mediante Helmet
   app.use(helmet());
   ```

---

## 🟢 4. Análisis de Cumplimiento de Hidratación SSR (Leaflet Compliance Check)

* **Referencia de Estándar:** AGENTS.md, Regla 4 (Prevención de Pérdidas de Hidratación y Control de APIs del Navegador).
* **Archivos Evaluados:** 
  - [MapWrapper.tsx](file:///c:/Users/PC/Desktop/Inmobiliaria/frontend/src/components/modules/properties/MapWrapper.tsx)
  - [MiniMap.tsx](file:///c:/Users/PC/Desktop/Inmobiliaria/frontend/src/components/modules/properties/MiniMap.tsx)
  - [page.tsx (Detalle de Propiedades)](file:///c:/Users/PC/Desktop/Inmobiliaria/frontend/src/app/properties/%5Bid%5D/page.tsx)
* **Evaluación:** **100% CUMPLIDO (EXCELENTE)**.
  - La integración con la librería Leaflet (la cual depende directamente del objeto global `window` que no existe en Node.js del lado del servidor) se realiza de forma quirúrgica.
  - Se utiliza `next/dynamic` configurado con `{ ssr: false }` para diferir de forma asíncrona la descarga e inicialización del mapa interactivo al cliente, evitando el colapso del renderizado (Hydration Mismatch Glitch) en Next.js.
  - Las importaciones del paquete `'leaflet'` se ejecutan dentro del hook `useEffect` (`import('leaflet')`), asegurando un encapsulado absoluto en tiempo de ejecución de cliente.

---

## 📅 5. Plan de Mitigación y Cronograma de Trabajo

A continuación se propone un plan organizado por fases para abordar y mitigar el total de las vulnerabilidades encontradas de forma rápida y efectiva.

| Fase | Tarea Específica | Capa | Estimación | Nivel de Riesgo |
| :---: | :--- | :---: | :---: | :---: |
| **Fase 1** | 1. Eliminar tokens mock de `AuthGuard` de producción.<br>2. Rotar contraseñas de Neon y `JWT_SECRET` expuestos.<br>3. Agregar `.env.production` al `.gitignore`. | Backend / Git | **1 día** | 🔴 **Crítico** |
| **Fase 2** | 1. Implementar Next.js BFF Route Handler para la firma de cookies `HttpOnly` en login/registro.<br>2. Refactorizar el almacenamiento de tokens del cliente (eliminar accesos directos a `localStorage` para tokens). | Frontend / BFF | **2 días** | 🟠 **Alto** |
| **Fase 3** | 1. Convertir interfaces DTO de contratos, pagos y gastos a clases robustas con validadores en NestJS.<br>2. Configurar validación de cuerpo para endpoints de autenticación y creación de personal. | Backend | **1.5 días** | 🟠 **Alto** |
| **Fase 4** | 1. Integrar el middleware `helmet` en el arranque de NestJS.<br>2. Proteger parámetros de ruta mediante `ParseUUIDPipe`. | Backend / Config | **0.5 días** | 🟡 **Medio** |

---

## 📌 6. Directrices de Desarrollo Seguro para el Equipo de "Propio"

Para evitar reintroducir estas vulnerabilidades en futuras iteraciones de la plataforma, el equipo de desarrollo debe apegarse estrictamente a las siguientes 3 directrices de ingeniería:

> [!IMPORTANT]
> **1. Queda estrictamente prohibido guardar Tokens JWT en `localStorage` o Cookies del lado del cliente (`document.cookie`)**.
> Toda autenticación de sesión debe orquestarse mediante cookies HTTP-Only y Secure emitidas por el servidor. Esto neutraliza la amenaza de robo de sesiones mediante XSS.

> [!WARNING]
> **2. Ningún secreto comercial ni contraseña debe estar en archivos `.env` bajo control de versiones**.
> Los archivos `.env` locales deben usarse exclusivamente para desarrollo. Para los despliegues en la nube, configure variables de entorno cifradas en el panel del proveedor (Render, Vercel, AWS).

> [!TIP]
> **3. Toda entrada de usuario es hostil por defecto**.
> Siempre utilice clases DTO con validaciones rigurosas (`class-validator`) en lugar de interfaces tipadas as-any, y aplique validación de parámetros de ruta (`ParseUUIDPipe`) para blindar el ORM Prisma.

---
### Fin del Reporte.
*Reporte generado por Security Lead Auditor, autorizado para distribución al equipo técnico de Propio.*
