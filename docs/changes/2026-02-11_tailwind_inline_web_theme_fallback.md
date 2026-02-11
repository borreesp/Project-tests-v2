# 1. CONTEXTO

Se seguían reportando warnings de `Module not found` en `apps/web/tailwind.config.ts` con múltiples estrategias de import de tokens compartidos (`@packages/ui-tokens`, import relativo y `require` con ruta absoluta).

Objetivo: eliminar definitivamente los warnings de resolución en la fase de configuración de Tailwind/Next, manteniendo la paleta Pulse en web.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/tailwind.config.ts`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna función exportada.

## Funciones modificadas
- Configuración de `theme.extend.colors` en Tailwind: ahora consume un objeto local `webThemeColors` definido en el mismo archivo para evitar resolución de módulos externos durante carga de config.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Se añade constante local `webThemeColors` en `apps/web/tailwind.config.ts`.
- Se elimina dependencia de carga de tokens compartidos en ese archivo de configuración concreto.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto funcional.
- **Capacidades**: sin impacto funcional.
- **Workouts**: sin impacto funcional.
- **Tests**: sin impacto funcional.
- **Ranking**: sin impacto funcional.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO

- ✅ `webThemeColors` local en `apps/web/tailwind.config.ts`: **EN USO**.
- ⚠️ `webThemeColors` en `packages/ui-tokens/src/index.ts`: **EN TRANSICIÓN** para configuración web (se mantiene para consumo compartido en otros puntos y posible reconvergencia futura).
- ❌ Estrategias previas de import en `tailwind.config.ts` (`@packages/ui-tokens`, relativo y require con path absoluto): **DEPRECADAS** por warnings de resolución en entorno objetivo.

# 5. RIESGO DE REFRACTOR FUTURO

- Existe duplicación temporal de valores de color entre `apps/web/tailwind.config.ts` y `packages/ui-tokens/src/index.ts`.
- Requiere reconvergencia futura a fuente única cuando el toolchain permita resolver módulos compartidos sin warnings en fase de config.
- Si cambia la paleta oficial, habrá que actualizar ambos puntos hasta cerrar la transición.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia contratos de datos; solo configuración visual.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
- Cambio limitado a capa frontend web (configuración de estilos).
