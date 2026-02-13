# 1. CONTEXTO

Se solicitó que el tooltip no requiera clic para mostrarse en desktop, y que aparezca al pasar el ratón por encima. El objetivo fue mejorar velocidad de lectura y reducir fricción en formularios y métricas.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/components/help-tooltip.tsx`
- `docs/changes/2026-02-13_tooltip_hover_activation.md` (nuevo)

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `HelpTooltip(...)`: se añadió apertura por `onMouseEnter` y cierre por `onMouseLeave` en el contenedor.
- `HelpTooltip(...)`: se añadió apertura por `onFocus` en el botón para accesibilidad por teclado.
- Se mantiene `onClick` para compatibilidad con interacción táctil (mobile tap).

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- No hay cambios en modelos ni contratos.
- No hay cambios en persistencia.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin cambios de lógica; mejora UX de lectura contextual.
- **Capacidades**: sin cambios funcionales.
- **Workouts**: sin cambios de reglas.
- **Tests**: sin cambios de lógica.
- **Ranking**: sin cambios.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO

- ✅ **EN USO** `HelpTooltip(...)`: activación por hover en desktop y focus/teclado.
- ✅ **EN USO** `HelpTooltip(...)`: activación por click/tap mantenida para móvil.
- ⚠️ **EN TRANSICIÓN**: unificación futura de patrones overlay (tooltip/popover) a nivel global de diseño.
- ❌ **DEPRECADA**: ninguna.
- 🗑 **ELIMINADA**: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO

- Riesgo bajo.
- Puede requerir ajustes si se redefine comportamiento estándar de overlays en el design system.
- Potencial acoplamiento leve con eventos de puntero en entornos híbridos (touch + mouse).

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: sí, cambia comportamiento de interacción del tooltip.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- ✅ No se rompe arquitectura hexagonal.
- ✅ No se rompe separación dominio / aplicación / infraestructura.
- ✅ No se alteran invariantes de negocio.
