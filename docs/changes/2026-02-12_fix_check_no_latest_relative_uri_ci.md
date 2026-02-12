## 1. CONTEXTO
En CI Linux, `scripts/check-no-latest-deps.ps1` fallaba con:
`Exception calling "MakeRelativeUri"... "This operation is not supported for a relative URI."`

El error ocurria al calcular rutas relativas para reportar violaciones de dependencias
con `latest`, bloqueando preflight antes de terminar validaciones.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `scripts/check-no-latest-deps.ps1`
  - `docs/changes/2026-02-12_fix_check_no_latest_relative_uri_ci.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `Get-RelativePath` en `scripts/check-no-latest-deps.ps1`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: no aplica.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - Se elimina el uso de `System.Uri.MakeRelativeUri`.
  - Se implementa resolucion relativa robusta cross-platform con:
    - `Push-Location $baseFullPath`
    - `Resolve-Path -LiteralPath $targetFullPath -Relative`
    - normalizacion de prefijo `./` o `.\`.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto funcional de negocio.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `Get-RelativePath`:
  - ✅ EN USO (utilizada por el check de dependencias `no-latest`).
- Implementacion previa con `MakeRelativeUri`:
  - 🗑 ELIMINADA (reemplazada por resolucion relativa compatible Linux/Windows).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; cambio en tooling de verificacion.
- Acoplado al comportamiento de `Resolve-Path` en PowerShell.
- No depende de legacy de dominio.
- No requiere migracion futura de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/automatizacion: si, elimina fallo espurio en check de dependencias.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
