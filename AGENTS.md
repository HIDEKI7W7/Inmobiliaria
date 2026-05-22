# 🤖 AGENTS.md - Directrices Globales de Desarrollo y Estándares de Ingeniería

Este archivo define los estándares de ingeniería obligatorios y de alta fidelidad que todos los agentes de IA (incluyendo Antigravity) deben aplicar estrictamente en cualquier desarrollo, refactorización o diseño de este ecosistema y cualquier otro proyecto relacionado.

---

## 🚀 1. Adopción de Skills y Guías Globales (.gemini/antigravity/skills)

Se establece el mandato de que para cualquier tarea de UI/UX, arquitectura, seguridad o manejo de datos, el agente debe consultar activamente y aplicar de forma prioritaria los repositorios de directrices locales ubicados en:
`C:\Users\PC\.gemini\antigravity\skills\`

---

## 🎨 2. Estándares de UI/UX (ui-ux-design-tokens)
* **Referencia Obligatoria:** Consultar `C:\Users\PC\.gemini\antigravity\skills\ui-ux-design-tokens\design-md\` para patrones visuales de alta gama.
* **Estética Premium:** Queda prohibido el uso de colores genéricos o layouts HTML básicos. Toda interfaz web debe verse pulida, moderna y fluida.
* **Temas y Estilos Preferidos:**
  * **Estilo Linear / Supabase:** Fondos oscuros profundos (`#0b0b0f`, `#121214`), bordes semitransparentes finos, acentos vibrantes de color (verde esmeralda, violeta eléctrico), fuentes sans-serif geométricas (Geist, Inter, Outfit).
  * **Estilo Vercel / Resend:** Minimalismo blanco y negro riguroso, tipografías monoespaciadas para etiquetas y datos técnicos, amplios espacios en blanco, y contrastes nítidos.
* **Componentes Responsivos:** Todos los elementos interactivos (botones, modales, menús de navegación, campos de formulario) deben incluir micro-animaciones en hover y focus (`transition-all duration-300`, `scale-[1.02]`), esquinas redondeadas (`rounded-xl` o `rounded-2xl`) y sombras orgánicas suaves.

---

## 🏗️ 3. Estructura y Arquitectura de Código (architecture-clean-hexagonal)
* **Referencia Obligatoria:** Consultar `C:\Users\PC\.gemini\antigravity\skills\architecture-clean-hexagonal\` y `core-engineering-components`.
* **Desacoplamiento Estricto:** Separación clara de responsabilidades en 3 capas de desarrollo para garantizar robustez ante cambios:
  1. **Dominio (Entities/Models):** Lógica pura de negocio, libre de dependencias de frameworks o bases de datos.
  2. **Aplicación (Services/Use Cases):** Casos de uso específicos del sistema, DTOs y validadores de entrada.
  3. **Infraestructura (Controllers/Prisma/Repositories):** Puntos de entrada HTTP, adaptadores de persistencia y servicios externos.
* **Inyección de Dependencias:** Usar constructores fuertemente tipados. Los componentes deben depender de abstracciones (interfaces), no de implementaciones concretas.

---

## 🔒 4. Ciberseguridad y Prevención de Pérdidas (cibersecurity-owasp-hardening)
* **Referencia Obligatoria:** Consultar `C:\Users\PC\.gemini\antigravity\skills\cibersecurity-owasp-hardening\` y `accidental-data-loss-prevention`.
* **Validación Rigurosa:** Todo DTO o entrada del usuario debe ser sanitizada y validada en tiempo de ejecución (ej. usando `class-validator` en NestJS) antes de procesarse.
* **Control de Excepciones:** No exponer trazas de error internas de base de datos al cliente final. Encapsular errores y loggear detalles únicamente del lado del servidor.
* **Seguridad en Rutas Dinámicas (SSR):** Resguardar la hidratación de datos en React y Next.js evitando la pre-renderización en servidor de componentes que dependan de APIs del navegador (ej. Leaflet), mediante carga dinámica asíncrona (`dynamic` con `{ ssr: false }`).

---

## 📊 5. Manejo de Dependencias y Buenas Prácticas de Python/Node (managing-python-dependencies)
* **Referencia Obligatoria:** Consultar `C:\Users\PC\.gemini\antigravity\skills\managing-python-dependencies\` e `ml-best-practices`.
* **Herramientas de Alto Rendimiento:** Utilizar `uv` como gestor de paquetes Python ultrarrápido y seguro de dependencias si un proyecto requiere scripts Python.
* **Caching y Cache-Cleans:** En entornos Next.js propensos a bucles de Webpack o corrupción de caché, asegurar purgas físicas limpias de `.next` y `node_modules/.cache` mediante scripts de automatización de desarrollo (`clean.js`).

---

## 📌 Nota para el Agente:
> [!IMPORTANT]
> Lee este archivo antes de comenzar cualquier tarea de desarrollo. Tu cumplimiento de estas reglas es absoluto e inquebrantable. Cada refactorización o nueva característica de software que desarrolles debe diseñarse con este nivel de calidad premium.
