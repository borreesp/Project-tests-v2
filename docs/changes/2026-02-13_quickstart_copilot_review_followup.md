# 1. CONTEXTO

Tras la revisión de PR, se detectaron dos observaciones válidas:
1) un assertion de test que no validaba datos reales de plantilla, y
2) duplicación del mapping `SCORE_TYPE_BY_WORKOUT_TYPE` entre módulos, con riesgo de divergencia.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**:
  - `apps/web/app/coach/workouts/_components/workout-template.ts`
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
  - `apps/web/tests/workout-template.test.ts`
- **Funciones añadidas**:
  - No aplica.
- **Funciones eliminadas**:
  - No aplica.
- **Funciones modificadas**:
  - No aplica (se ajustaron constantes/imports y validaciones de test).
- **Clases sustituidas**:
  - No aplica.
- **Propiedades eliminadas o añadidas**:
  - No aplica.
- **Cambios en contratos o DTOs**:
  - No aplica.
- **Cambios técnicos concretos**:
  - Se exporta `SCORE_TYPE_BY_WORKOUT_TYPE` desde `workout-template.ts` como fuente única.
  - `workout-builder.tsx` deja de declarar un duplicado y reutiliza el export compartido.
  - En `workout-template.test.ts` se elimina el check no informativo de “ords por índice” y se reemplaza por validación útil: bloques `WORK` deben tener movimientos.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto.
- **Capacidades**: sin impacto funcional.
- **Workouts**: mejora de mantenibilidad y consistencia de configuración de score por tipo.
- **Tests**: mejora de calidad de aserciones (menos falso positivo).
- **Ranking**: sin impacto.
- **Persistencia**: sin impacto.

# 4. ESTADO DE USO

- `SCORE_TYPE_BY_WORKOUT_TYPE`: ✅ **EN USO** desde `workout-template.ts` y consumido por builder.
- Assertion de unicidad artificial por índice en test: 🗑 **ELIMINADA** por no aportar señal real.
- Validación de `WORK` con movimientos: ✅ **EN USO** en suite de tests de Quick Start.

# 5. RIESGO DE REFRACTOR FUTURO

- Bajo riesgo.
- La centralización reduce drift entre módulos.
- Si cambian reglas de score por tipo, el punto único reduce errores de mantenimiento.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no.
- **Respuesta frontend**: no.
- **Base de datos**: no.
- **Seeds**: no.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
