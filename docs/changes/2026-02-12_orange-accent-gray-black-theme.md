# 1. CONTEXTO

Se solicitó ajustar la identidad visual para usar un esquema cromático más sobrio y profesional, con **naranja como color de acento** y **grises/negro como base de fondos**, reemplazando la orientación previa azul/cyan.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/app/globals.css`
- `packages/ui-tokens/src/index.ts`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Ninguna función de negocio; únicamente variables de tema y tokens visuales.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- No se alteraron propiedades de modelos de dominio/persistencia.

## Cambios en contratos o DTOs
- Ninguno.

## Detalle técnico de estilo
- `--primary`, `--accent`, `--ring`, `--warning` migrados a naranja (`#F5760B`).
- Fondos base migrados a negro/grises (`#000000`, `#404040`, `#C0C0C0` como referencia de contraste en texto secundario).
- Tokens de `ui-tokens` alineados al mismo sistema cromático.

# 3. IMPACTO EN EL DOMINIO

- **Atletas:** sin impacto funcional.
- **Capacidades:** sin cambios en cálculo ni representación semántica de datos.
- **Workouts:** sin impacto funcional.
- **Tests:** sin impacto funcional.
- **Ranking:** sin impacto de reglas, solo cambio visual.
- **Persistencia:** sin cambios.

# 4. ESTADO DE USO

- ✅ EN USO: tokens de color en `globals.css` y `packages/ui-tokens/src/index.ts` consumidos por componentes UI.
- ⚠️ EN TRANSICIÓN: posibles pantallas no migradas al 100% a primitives/tokens.
- ❌ DEPRECADA: no aplica.
- 🗑 ELIMINADA: no aplica.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede requerir ajuste fino adicional de contraste por vista para mantener WCAG AA en todos los casos.
- Está acoplado al sistema de utilidades Tailwind y variables CSS; conviene auditoría visual global posterior.

# 6. CONTRATO EXTERNO AFECTADO

- **API:** No.
- **Respuesta frontend:** Sí, solo estilo visual (sin alterar estructura de datos).
- **Base de datos:** No.
- **Seeds:** No.

# 7. CHECK DE COHERENCIA

- Arquitectura hexagonal: ✅ intacta.
- Separación dominio/aplicación/infrastructure: ✅ intacta.
- Invariantes de negocio: ✅ sin alteraciones.
