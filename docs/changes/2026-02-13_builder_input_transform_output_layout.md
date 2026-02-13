1. CONTEXTO

El builder de tests no comunicaba claramente el flujo de producto (Input → Transform → Output) y la app tenía una sensación de ancho limitado en pantallas grandes. El objetivo de esta intervención fue reforzar la jerarquía visual del builder y ampliar el contenedor global para una experiencia más profesional sin alterar lógica de negocio.

2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `apps/web/app/layout.tsx`
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - `RootLayout`: ajuste de `max-width` y paddings laterales del contenedor principal.
  - `WorkoutBuilder` (render JSX): reorganización visual de columnas y rotulado explícito de secciones Input/Transform/Output.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - No hay cambios en modelos ni entidades de dominio.
- Cambios en contratos o DTOs:
  - Ninguno.

3. IMPACTO EN EL DOMINIO

- Atletas: sin cambios funcionales.
- Capacidades: sin cambios de cálculo; se añade placeholder visual de preview en OUTPUT.
- Workouts: sin cambios en reglas ni persistencia; mejora de legibilidad del flujo de configuración.
- Tests: sin cambios de negocio; mejora de UX en el builder.
- Ranking: sin cambios.
- Persistencia: sin cambios.

4. ESTADO DE USO

- ✅ EN USO: `RootLayout` sigue siendo el layout global de la app web y ahora aplica mayor ancho máximo.
- ✅ EN USO: `WorkoutBuilder` mantiene su flujo operativo y ahora presenta secciones explícitas:
  - INPUT · Movements Library
  - TRANSFORM · Configuración y lógica de transformación
  - OUTPUT · Validación y preview
- ⚠️ EN TRANSICIÓN: el bloque OUTPUT incorpora un placeholder de capacidades, preparado para integrar la preview real en tareas futuras.
- ❌ DEPRECADA: ninguna.
- 🗑 ELIMINADA: ninguna.

5. RIESGO DE REFRACTOR FUTURO

- El placeholder de OUTPUT puede eliminarse o reemplazarse cuando exista el motor de preview real.
- La sección TRANSFORM aún convive con navegación por pasos (step state), por lo que podría desacoplarse más adelante para mostrar Input/Transform/Output simultáneamente de forma completa.
- Cambios de layout están acoplados a Tailwind classes del componente; bajo riesgo de dominio, riesgo bajo-medio de UI refactor.

6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambian contratos; solo presentación visual.
- Base de datos: no cambia.
- Seeds: no cambian.

7. CHECK DE COHERENCIA

- Se confirma que no se rompe arquitectura hexagonal.
- Se confirma que no se rompe separación dominio/aplicación/infrastructure.
- Se confirma que no se alteran invariantes de negocio.
