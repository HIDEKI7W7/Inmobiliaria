# Architectural Decision Record (ADR) - Architectural Audit & Hexagonal Realignment

**ID:** ADR-001  
**Status:** PROPOSED  
**Date:** 2026-05-22  
**Author:** Principal Software Architect  
**Project:** Propio Inmobiliaria (Next.js Frontend & NestJS Backend)  

---

## 📄 Context & Background

This Architectural Decision Record (ADR) compiles a comprehensive, high-fidelity structural audit of the **Propio** real estate ecosystem. The audit evaluates compliance with **AGENTS.md** engineering standards, focusing on 3-layer decoupling (**Domain**, **Application**, and **Infrastructure**), interface-based dependency injection, and cybersecurity hardening.

Currently, the system is designed to prioritize developer velocity and demo resilience (using in-memory fallbacks when PostgreSQL or backend services are unavailable). While this approach provides excellent availability and resistance to environment failures, it introduces severe architectural coupling and security vulnerabilities.

This document details our structural findings, outlines architectural boundaries, presents a secure hexagonal redesign, and provides an actionable migration path.

---

## 📊 Structural Audit & Current State Evaluation

### 1. 🏗️ Capa de Desacoplamiento (Domain, Application, Infrastructure)
* **Compliance Level:** 🟡 **Low-Medium**
* **Audit Findings:**
  * **No Domain Layer:** There is no isolated, pure domain layer. The domain models are defined implicitly via Prisma schema definitions (`@prisma/client`) or dynamically typed JSON schemas. No plain TypeScript entities represent pure business logic or business invariants.
  * **Coupled Application Services:** The backend Services (e.g., `PropertiesService` and `ContractsService`) serve multiple conflicting purposes. They manage application orchestration (use cases), query database clients directly, and store static mock fallbacks with hardcoded filtering logic inside the service class.
  * **No Repository Pattern:** In NestJS, persistence and mock resilience are coupled directly within the service. This breaks the **Single Responsibility Principle (SRP)**. If database technologies change, or mock requirements evolve, core business services must be modified.
  * **Frontend Resiliency Coupling:** The frontend services (e.g., `properties.service.ts`) also implement a double data strategy: querying the NestJS backend via `apiClient` and maintaining local mock objects with complete filtering, sorting, and translation logic as a fallback. This should be isolated into separate data-provider strategies.

### 2. 🔌 Inyección de Dependencias Basada en Interfaces
* **Compliance Level:** 🔴 **Uncompliant**
* **Audit Findings:**
  * In NestJS, services depend directly on concrete classes (`PrismaService`) instead of relying on decoupled repository ports (interfaces).
  * Constructores are strongly typed, which is excellent, but they receive `prisma: PrismaService` directly.
  * This direct dependency makes unit testing without a running PostgreSQL database or Prisma mock generators highly complex and breaks hexagonal boundaries.

### 3. 🔒 Ciberseguridad y Prevención de Pérdidas (OWASP & Hardening)
* **Compliance Level:** 🟡 **Medium-High (With 1 Critical Flaw)**
* **Audit Findings:**
  * **Vulnerabilidad Crítica de Bypass de Autenticación:** Inside `backend/src/modules/auth/auth.guard.ts`, there is an active developer back-door fallback checking for hardcoded developer tokens:
    ```typescript
    if (token === 'mock-admin-token') { ... }
    else if (token === 'mock-agent-token') { ... }
    ```
    There are **no environment check safety-guards** (e.g. `process.env.NODE_ENV !== 'production'`). In a production release, malicious actors could access all administrative routes by sending `Authorization: Bearer mock-admin-token`.
  * **Excellent Input Validation:** DTOs (e.g., `CreatePropertyDto`) strictly utilize `class-validator` and `class-transformer` properties.
  * **Global Sanitization Pipes:** NestJS's `main.ts` is exceptionally hardened with active global pipes containing `whitelist: true`, `forbidNonWhitelisted: true`, and automatic type `transform: true`.
  * **Secure Database Lifecycles:** `app.enableShutdownHooks()` is active, allowing Prisma to safely detach its connection pool during sigterm events.
  * **CORS Settings:** Strictly defined utilizing specific endpoints from the environment with robust fallback defaults.

### 4. 🎨 Estándares de UI/UX (Alineación con AGENTS.md)
* **Compliance Level:** 🟢 **Excellent (High-Fidelity)**
* **Audit Findings:**
  * The landing page (`frontend/src/app/page.tsx`) features premium typography, geometric layouts, dark slate colors (`#04045E`), light green accent borders (`#b9fa3c`), and micro-interactions on cards.
  * Micro-interactions such as `hover:scale-105 transition-transform duration-500` on property cards are consistently declared.
  * Complete responsive grids adapt nicely across viewport limits (mobile, tablet, desktop).

### 5. 📊 Manejo de Dependencias y Caching
* **Compliance Level:** 🟢 **Excellent**
* **Audit Findings:**
  * The codebase includes a robust `clean.js` execution runner designed to safely purge `.next` and `node_modules/.cache` caches, avoiding build loops.

---

## 🏗️ Proposed Clean Hexagonal Architecture

To align both backend and frontend applications with the requirements outlined in **AGENTS.md**, we propose transitioning the backend structure to a strict **Hexagonal Architecture (Ports and Adapters)**.

### 📐 Structural Diagram of Decoupled Layers

```mermaid
graph TD
    subgraph Infrastructure ["Infrastructure Layer (Adapters)"]
        Controller["PropertiesController (API Entrypoint)"]
        PrismaDb["PrismaPropertyRepository (SQL Persistence)"]
        MockDb["InMemoryPropertyRepository (Fallback Resilience)"]
    end
    
    subgraph Application ["Application Layer (Use Cases)"]
        GetProperties["GetPropertiesUseCase"]
        CreateProperty["CreatePropertyUseCase"]
    end

    subgraph Domain ["Domain Layer (Core)"]
        PropertyEntity["Property (Pure Model & Invariants)"]
        IRepo["IPropertyRepository (Port Interface)"]
    end

    Controller -->|Calls| GetProperties
    Controller -->|Calls| CreateProperty
    GetProperties -->|Uses| IRepo
    CreateProperty -->|Uses| IRepo
    IRepo <|.. PrismaDb
    IRepo <|.. MockDb
```

---

## 📁 Recommended Directory Structure

To fulfill this architecture, we will decouple features into a strict domain, application, and infrastructure design.

### Backend Project Redesign (`/backend/src`)

```text
src/
├── app.module.ts
├── main.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/
    └── properties/
        ├── properties.module.ts                 # Binds Use Cases & Repository Providers
        │
        ├── domain/                             # 1. CAPA DOMINIO (Lógica Pura)
        │   ├── entities/
        │   │   └── property.entity.ts           # Pure class with business logic rules
        │   └── repositories/
        │       └── property.repository.interface.ts # Port Interface
        │
        ├── application/                        # 2. CAPA APLICACIÓN (Casos de Uso)
        │   ├── use-cases/
        │   │   ├── get-properties.use-case.ts
        │   │   └── create-property.use-case.ts
        │   └── dto/
        │       └── create-property.dto.ts
        │
        └── infrastructure/                     # 3. CAPA INFRAESTRUCTURA (Física)
            ├── entrypoints/
            │   ├── properties.controller.ts     # Public routes
            │   └── admin-properties.controller.ts # Admin protected routes
            └── persistence/
                ├── prisma-property.repository.ts # Adapter for Prisma PostgreSQL
                └── in-memory-property.repository.ts # Adapter for Resiliency Mock Fallback
```

---

## 💻 Decoupled Code Templates

Below is the concrete implementation plan showing how to refactor the **Properties** module to meet this architectural standard.

### 1. The Domain Entity (`domain/entities/property.entity.ts`)

Pure Domain Model free of framework or library annotations. Encapsulates business domain invariants (e.g., verifying document readiness status).

```typescript
export type PropertyStatus = 'NUEVA_PUBLICACION' | 'LEGAL_VERDE' | 'LEGAL_AMARILLO' | 'RESERVADO' | 'ALQUILADO';

export class Property {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly price: number,
    public readonly area: number,
    public readonly rooms: number,
    public readonly bathrooms: number,
    public readonly location: string,
    public readonly imageUrl: string,
    public status: PropertyStatus,
    public isVerified: boolean,
    public readonly ownerId: string | null,
    public readonly hasFolioReal: boolean,
    public readonly hasCatastro: boolean,
    public readonly hasTestimonio: boolean,
    public readonly hasImpuestosAlDia: boolean,
    public readonly hasPlanoUsoSuelo: boolean,
    public readonly hasCI: boolean,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly createdAt: Date,
  ) {}

  /**
   * Domain Rule: Calculate "Document Status Indicator"
   * Determines if the legal documents are 100% verified.
   */
  public evaluateVerificationStatus(): void {
    const isDocApproved =
      this.hasFolioReal &&
      this.hasCatastro &&
      this.hasTestimonio &&
      this.hasImpuestosAlDia &&
      this.hasPlanoUsoSuelo &&
      this.hasCI;

    this.isVerified = isDocApproved;
    this.status = isDocApproved ? 'LEGAL_VERDE' : 'LEGAL_AMARILLO';
  }
}
```

### 2. The Repository Port (`domain/repositories/property.repository.interface.ts`)

The interface defining the contract. The application layer depends solely on this port.

```typescript
import { Property } from '../entities/property.entity';

export interface IPropertyRepository {
  findAll(filters: any): Promise<Property[]>;
  findById(id: string): Promise<Property | null>;
  save(property: Property): Promise<Property>;
  updateStatus(id: string, status: string, notes?: string): Promise<Property>;
}

export const IPropertyRepositoryToken = Symbol('IPropertyRepository');
```

### 3. The Infrastructure Adapter (`infrastructure/persistence/prisma-property.repository.ts`)

Converts database-specific results to pure domain entities.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPropertyRepository } from '../../domain/repositories/property.repository.interface';
import { Property, PropertyStatus } from '../../domain/entities/property.entity';

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  private readonly logger = new Logger(PrismaPropertyRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: any): Promise<Property[]> {
    const where: any = {};
    if (filters.type) where.type = filters.type.toUpperCase();
    if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

    const items = await this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return items.map(p => this.mapToDomain(p));
  }

  async findById(id: string): Promise<Property | null> {
    const item = await this.prisma.property.findUnique({ where: { id } });
    return item ? this.mapToDomain(item) : null;
  }

  async save(property: Property): Promise<Property> {
    const created = await this.prisma.property.create({
      data: {
        title: property.title,
        description: property.description,
        price: property.price,
        area: property.area,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        location: property.location,
        imageUrl: property.imageUrl,
        isVerified: property.isVerified,
        status: property.status as any,
        ownerId: property.ownerId,
        hasFolioReal: property.hasFolioReal,
        hasCatastro: property.hasCatastro,
        hasTestimonio: property.hasTestimonio,
        hasImpuestosAlDia: property.hasImpuestosAlDia,
        hasPlanoUsoSuelo: property.hasPlanoUsoSuelo,
        hasCI: property.hasCI,
        latitude: property.latitude,
        longitude: property.longitude,
      },
    });
    return this.mapToDomain(created);
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<Property> {
    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        status: status as any,
        observationNotes: notes,
        isVerified: status === 'APROBADO',
      },
    });
    return this.mapToDomain(updated);
  }

  private mapToDomain(db: any): Property {
    return new Property(
      db.id,
      db.title,
      db.description,
      Number(db.price),
      Number(db.area),
      Number(db.rooms),
      Number(db.bathrooms),
      db.location,
      db.imageUrl,
      db.status as PropertyStatus,
      db.isVerified,
      db.ownerId,
      db.hasFolioReal,
      db.hasCatastro,
      db.hasTestimonio,
      db.hasImpuestosAlDia,
      db.hasPlanoUsoSuelo,
      db.hasCI,
      Number(db.latitude),
      Number(db.longitude),
      db.createdAt,
    );
  }
}
```

### 4. The Application Use Case (`application/use-cases/create-property.use-case.ts`)

Orchestrates logic using repositories and domain models. Independent of NestJS controllers or express HTTP objects.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IPropertyRepository, IPropertyRepositoryToken } from '../../domain/repositories/property.repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { CreatePropertyDto } from '../dto/create-property.dto';

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject(IPropertyRepositoryToken)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(dto: CreatePropertyDto): Promise<Property> {
    const property = new Property(
      '', // ID will be auto-generated by the persistence engine
      dto.title,
      dto.description,
      dto.price,
      dto.area,
      dto.rooms,
      dto.bathrooms,
      dto.location,
      dto.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format',
      'NUEVA_PUBLICACION',
      false,
      dto.ownerId || null,
      dto.hasFolioReal || false,
      dto.hasCatastro || false,
      dto.hasTestimonio || false,
      dto.hasImpuestosAlDia || false,
      dto.hasPlanoUsoSuelo || false,
      dto.hasCI || false,
      dto.latitude ?? -17.3895,
      dto.longitude ?? -66.1568,
      new Date(),
    );

    // Apply Domain Rules (Self-auditing property status indicator)
    property.evaluateVerificationStatus();

    // Persist Domain Entity
    return this.propertyRepository.save(property);
  }
}
```

---

## 🔒 Actionable Cybersecurity Recommendations (Hardening Plan)

To comply with `cibersecurity-owasp-hardening`, we propose immediate modifications to the backend's authentication system.

### 🛡️ Guard Verification Fixes (`backend/src/modules/auth/auth.guard.ts`)

Replace the absolute developer backdoor keys with strict environmental checks.

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
+    // 1. Soporte controlado para tokens mock de desarrollo únicamente en entornos locales no-producción
+    const isProd = process.env.NODE_ENV === 'production';
+    if (!isProd) {
+      if (token === 'mock-admin-token') {
+        request.user = {
+          id: 'admin-1',
+          name: 'Administrador Propio',
+          email: 'admin@propio.com.bo',
+          role: 'ADMIN',
+        };
+        return true;
+      } else if (token === 'mock-agent-token') {
+        request.user = {
+          id: 'agent-1',
+          name: 'Agente Estrella',
+          email: 'agent@propio.com.bo',
+          role: 'AGENTE',
+        };
+        return true;
+      }
+    }
```

This prevents external users from bypassing all administrator security checks in production.

---

## 🏁 Decisions & Commitments

1. **Adopt Hexagonal Boundaries:** All future modules will be developed inside the domain/application/infrastructure layers described above.
2. **Interface Injection:** Explicitly declare `Symbol('IRepositoryName')` inside the providers registration files to inject repositories using `@Inject()` decorators in application use cases.
3. **Environment Hardening:** Conditionally filter all development mock credentials and fallbacks inside the guards based on the `NODE_ENV === 'production'` boolean state.
4. **Resiliency Management:** Decouple resilience fallbacks from the application orchestrators. Move in-memory fallbacks to a specific repository implementation adapter (`InMemoryPropertyRepository`), registered dynamically in development or database-down conditions.

---

## 📈 Consequences

* **Positive Benefits:**
  * **Zero Database Coupling:** Testing use cases is extremely fast since repositories can be fully mocked with in-memory adapters.
  * **Improved Unit Tests:** Tests no longer need running servers or database seeds to assert validation rules.
  * **Vulnerability Elimination:** Developer doors are closed on production environments.
  * **Clean Responsibility Scope:** Separate orchestrators (use-cases) and operations, avoiding mixed files.
* **Negative Trade-offs:**
  * **Increased File Count:** Moving from 4 files to 9 files per module increases structural depth and requires more boilerplate code setup during initial bootstrapping.
