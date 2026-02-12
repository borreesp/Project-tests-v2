## 1. CONTEXTO
Tras login se observaba bucle de peticiones `GET /api/v1/me` en frontend.
El patron se manifestaba especialmente en layouts protegidos que usan `useRequireAuth`
con arrays inline de roles permitidos (por ejemplo `["ATHLETE"]`), provocando recargas
continuas de sesion.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `apps/web/lib/use-auth.ts`
  - `docs/changes/2026-02-12_fix_use_require_auth_me_loop.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `useRequireAuth(allowedRoles?)` en `apps/web/lib/use-auth.ts`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: ninguna.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - Se introduce clave estable `allowedRolesKey` basada en contenido de roles.
  - `normalizedAllowedRoles` ahora se deriva de `allowedRolesKey` (split por `|`) en lugar
    de depender de la referencia del array `allowedRoles`.
  - Con esto, el `useEffect` de autenticacion deja de retriggerarse por cada render cuando
    los roles no cambian semanticamente.

## 3. IMPACTO EN EL DOMINIO
- Atletas: evita loops de validacion de sesion tras login y mejora estabilidad de navegacion.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto de reglas de negocio.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `useRequireAuth`:
  - ✅ EN USO en layouts/paginas protegidas web (`athlete`, `coach`, `admin`).
- Dependencia previa por referencia de array `allowedRoles`:
  - 🗑 ELIMINADA (reemplazada por dependencia estable por contenido).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; ajuste de estabilidad en hook de autenticacion.
- Acoplado a convencion de orden de roles en arrays permitidos.
- No depende de legacy de dominio.
- No requiere migracion de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia contrato; mejora comportamiento de consumo.
- Base de datos: no cambia.
- Seeds: no cambian.
- CI/automatizacion: sin cambios directos.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
