A partir de ahora, TODA modificación de código debe ir acompañada obligatoriamente de documentación estructurada.

REGLA GENERAL
No se puede:
- Crear funciones
- Modificar funciones
- Eliminar funciones
- Sustituir clases
- Cambiar propiedades de modelos
- Cambiar contratos (DTOs, schemas, mappers)
- Alterar lógica de dominio
- Eliminar endpoints
- Modificar persistencia
sin dejar documentación técnica en la carpeta:

/docs/changes/

FORMATO OBLIGATORIO

Cada intervención debe generar un archivo markdown nuevo con nombre:

YYYY-MM-DD_short_title.md

Ejemplo:
2026-02-11_refactor_capacity_service.md

ESTRUCTURA OBLIGATORIA DEL DOCUMENTO

1. CONTEXTO
Qué problema existía o qué objetivo se persigue.

2. CAMBIOS REALIZADOS
Lista clara y técnica de:
- Archivos modificados
- Funciones añadidas
- Funciones eliminadas
- Funciones modificadas
- Clases sustituidas
- Propiedades eliminadas o añadidas
- Cambios en contratos o DTOs

3. IMPACTO EN EL DOMINIO
Explicar cómo afecta a:
- Atletas
- Capacidades
- Workouts
- Tests
- Ranking
- Persistencia

4. ESTADO DE USO
Para cada función/clase afectada indicar:

- ✅ EN USO (dónde se usa)
- ⚠️ EN TRANSICIÓN
- ❌ DEPRECADA (pero mantenida)
- 🗑 ELIMINADA

Si algo queda obsoleto pero no se elimina, debe marcarse como DEPRECADO.

5. RIESGO DE REFRACTOR FUTURO
Indicar si:
- Puede eliminarse en el futuro
- Depende de legacy
- Está acoplado a otra capa
- Requiere migración futura

6. CONTRATO EXTERNO AFECTADO
Indicar si cambia:
- API
- Respuesta frontend
- Base de datos
- Seeds

7. CHECK DE COHERENCIA
Confirmar:
- Que no se rompe arquitectura hexagonal
- Que no se rompe separación dominio/aplicación/infrastructure
- Que no se alteran invariantes de negocio

REGLAS ADICIONALES

- Nunca modificar código sin generar documentación.
- Nunca eliminar código sin dejar constancia histórica.
- Nunca sustituir clases sin explicar por qué.
- Nunca modificar modelos sin explicar impacto en persistencia.
- Si se elimina una propiedad del modelo, documentar qué pasa con los datos existentes.
- Si se reemplaza una función, documentar cuál la sustituye.

Si el cambio es pequeño (ej: bug fix), también debe documentarse.

OBJETIVO
Que dentro de 2 meses se pueda:
- Saber por qué algo existe
- Saber por qué algo se eliminó
- Detectar código muerto
- Planear refactors con seguridad
- Reconstruir decisiones arquitectónicas

Esta regla es obligatoria y prioritaria.

REGLA DE PRE-FLIGHT (OBLIGATORIA)
- No crear PR ni push final si no has ejecutado `preflight.ps1` y ha terminado en PASS.

CIERRE OBLIGATORIO
Al finalizar cada intervención, reportar explícitamente:
- Estado preflight: PASS o FAIL.
- Comando(s) ejecutado(s) para validación.
- Qué checks se ejecutaron.
- Qué checks se omitieron (si aplica) y por qué.
