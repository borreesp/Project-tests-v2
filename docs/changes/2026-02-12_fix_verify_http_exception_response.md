## 1. CONTEXTO
En `preflight/verify`, el flujo de readiness backend fallaba con `ParentContainsErrorRecordException`
en `Get-HttpStatusCode` al acceder a `$_ .Exception.Response` bajo `Set-StrictMode -Version Latest`.

Problema puntual: no todas las excepciones de `Invoke-WebRequest` exponen la propiedad `Response`,
y el acceso directo hacia que verify abortara antes de evaluar timeout/reintentos de readiness.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `scripts/verify.ps1`
  - `docs/changes/2026-02-12_fix_verify_http_exception_response.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `Get-HttpStatusCode` en `scripts/verify.ps1`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: no aplica.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - En el bloque `catch` de `Get-HttpStatusCode` se reemplaza el acceso directo
    `$_ .Exception.Response` por lectura segura via `PSObject.Properties["Response"]`.
  - Se agrega fallback a `InnerException.Response` cuando existe.
  - Si no hay `Response` disponible, la funcion retorna `null` sin romper verify.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `Get-HttpStatusCode`:
  - ✅ EN USO (invocada por `Wait-BackendReady` y `Run-DbSanityCheck` en `verify.ps1`).
- Manejo previo con acceso directo `$_ .Exception.Response`:
  - 🗑 ELIMINADA (reemplazada por acceso seguro compatible con StrictMode).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; cambio defensivo en capa de automatizacion.
- Depende del shape de excepciones de PowerShell/.NET para `Invoke-WebRequest`.
- Acoplado a infraestructura CI y scripts de verificacion, no a dominio.
- No requiere migracion futura de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/automatizacion: si, mejora robustez del readiness check en preflight/verify.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
