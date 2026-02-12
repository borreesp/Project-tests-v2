# 2026-02-12_expand-web-layout-width

## 1. CONTEXTO
La app web estaba renderizando el contenido principal con un contenedor global `max-w-6xl` y navegación de tabs limitada a `max-w-4xl`. En desktop y pantallas grandes esto generaba una sensación de columna estrecha y baja densidad visual en módulos coach/athlete/auth.

Objetivo: ampliar el ancho utilizable en toda la app web, manteniendo centrado, comportamiento responsivo en mobile y límites razonables en desktop/2xl.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**
  - `apps/web/app/layout.tsx`
  - `apps/web/components/role-tabs.tsx`

- **Funciones añadidas**
  - Ninguna.

- **Funciones eliminadas**
  - Ninguna.

- **Funciones modificadas**
  - `RootLayout` (ajuste de clases del contenedor global principal).
  - `RoleTabs` (ajuste de clases del wrapper de tabs para alinearlo con el ancho global).

- **Clases sustituidas**
  - No se sustituyeron clases TypeScript/React.

- **Propiedades eliminadas o añadidas**
  - No aplica (sin cambios de modelos/datos).

- **Cambios en contratos o DTOs**
  - Ninguno.

- **Detalle técnico de layout (antes/después)**
  - Antes: `main` con `mx-auto max-w-6xl p-6`.
  - Después: `main` con `mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 2xl:px-10`.
  - Tabs globales antes: `max-w-4xl`.
  - Tabs globales después: `w-full max-w-screen-2xl`.

- **Pantallas revisadas por impacto del layout global**
  - Coach: Overview, Athletes, Workouts, builder (new/edit).
  - Athlete: dashboard/workouts/ranking/detalle workout.
  - Auth: login/register invite.
  - Navegación compartida: role tabs.

- **Decisiones de breakpoints**
  - `sm/md`: se mantiene compacto vía `px-4`/`sm:px-6`.
  - `lg`: se abre más contenido (`lg:px-8`).
  - `2xl`: máximo ancho de pantalla 2xl con padding controlado (`max-w-screen-2xl` + `2xl:px-10`).

## 3. IMPACTO EN EL DOMINIO
- **Atletas**: sin cambio de lógica; mejor legibilidad y densidad en vistas de atleta.
- **Capacidades**: sin impacto funcional.
- **Workouts**: sin cambio de reglas; mejor uso de ancho para tablas/builder.
- **Tests**: sin cambio en scoring/validación; mejora visual en listado/edición.
- **Ranking**: sin impacto funcional.
- **Persistencia**: sin cambios (no DB, no migraciones, no seeds).

## 4. ESTADO DE USO
- ✅ **EN USO** `RootLayout` (`apps/web/app/layout.tsx`): contenedor global activo para todas las rutas web.
- ✅ **EN USO** `RoleTabs` (`apps/web/components/role-tabs.tsx`): navegación superior con ancho alineado al layout global.
- ⚠️ **EN TRANSICIÓN**: no aplica.
- ❌ **DEPRECADA**: no aplica.
- 🗑 **ELIMINADA**: no aplica.

## 5. RIESGO DE REFRACTOR FUTURO
- Puede ajustarse en el futuro si se introduce un componente `<Container />` único para todo el sistema.
- Acoplamiento bajo: cambios concentrados en wrappers visuales globales.
- No depende de legacy de backend.
- No requiere migración de datos.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: no.
- **Respuesta frontend**: no cambia contrato de datos; solo presentación/layout.
- **Base de datos**: no.
- **Seeds**: no.

## 7. CHECK DE COHERENCIA
- Se mantiene arquitectura hexagonal (solo capa web/presentación).
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
