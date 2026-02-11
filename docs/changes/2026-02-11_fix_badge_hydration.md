# 1. CONTEXTO
En `athlete/dashboard` se renderizaba `Badge` dentro de un `<p>`, pero el componente `Badge` estaba implementado como `<div>`. Eso genera HTML inválido (`<div>` dentro de `<p>`) y deriva en error de hidratación en Next.js.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `apps/web/components/ui/badge.tsx`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `Badge`:
  - Se reemplazó el elemento raíz de `div` a `span`.
  - Se actualizó el tipado de props de `React.HTMLAttributes<HTMLDivElement>` a `React.HTMLAttributes<HTMLSpanElement>`.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO
- **Atletas**: visualización del dashboard sin error de hidratación.
- **Capacidades**: sin cambios de lógica.
- **Workouts**: sin cambios.
- **Tests**: sin cambios.
- **Ranking**: sin cambios.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO
- ? EN USO:
  - `Badge` en `apps/web/components/ui/badge.tsx`, usado en vistas como `apps/web/app/athlete/dashboard/page.tsx`.
- ?? EN TRANSICIÓN:
  - Ninguno.
- ? DEPRECADA (pero mantenida):
  - Ninguna.
- ?? ELIMINADA:
  - Ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo. `span` es semánticamente más correcto para badges inline.
- Si alguna pantalla esperaba comportamiento de bloque explícito, deberá ajustarse con clases CSS específicas, no con semántica inválida.

# 6. CONTRATO EXTERNO AFECTADO
- **API**: no.
- **Respuesta frontend**: no cambia shape, solo render HTML.
- **Base de datos**: no.
- **Seeds**: no.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: ? no afectada.
- Separación dominio/aplicación/infrastructure: ? no afectada.
- Invariantes de negocio: ? no alteradas.
