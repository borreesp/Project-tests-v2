# 1. CONTEXTO

Se detectó un error de hidratación en Next.js en el `RootLayout` (`apps/web/app/layout.tsx`) por diferencias entre el HTML SSR y el HTML en cliente. El síntoma reportado incluía atributos inyectados en runtime por extensiones de navegador (por ejemplo `cz-shortcut-listen`) en la etiqueta `<body>`, provocando mismatch de hidratación en React.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**:
  - `apps/web/app/layout.tsx`
- **Funciones añadidas**:
  - Ninguna.
- **Funciones eliminadas**:
  - Ninguna.
- **Funciones modificadas**:
  - `RootLayout`: se añadió `suppressHydrationWarning` en `<body>` para evitar mismatch por atributos no deterministas inyectados del lado cliente.
- **Clases sustituidas**:
  - Ninguna.
- **Propiedades eliminadas o añadidas**:
  - Añadido atributo JSX `suppressHydrationWarning` en `<body>`.
- **Cambios en contratos o DTOs**:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: Sin impacto funcional.
- **Capacidades**: Sin impacto funcional.
- **Workouts**: Sin impacto funcional.
- **Tests**: Sin cambio de reglas de negocio; mejora estabilidad de renderizado SSR/CSR.
- **Ranking**: Sin impacto funcional.
- **Persistencia**: Sin impacto. No hay cambios en base de datos, modelos ni repositorios.

# 4. ESTADO DE USO

- `RootLayout` (`apps/web/app/layout.tsx`)
  - ✅ **EN USO**: layout raíz global de la aplicación web para todas las rutas de `apps/web/app/**`.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede evaluarse eliminar `suppressHydrationWarning` en el futuro si se asegura un entorno de cliente libre de inyección de atributos en `<body>`.
- No depende de legacy de dominio.
- Acoplado a capa de presentación (Next.js App Router), no a dominio.
- No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: No cambia.
- **Respuesta frontend**: No cambia estructura funcional; sólo se tolera mismatch de atributos no críticos en hidratación.
- **Base de datos**: No cambia.
- **Seeds**: No cambia.

# 7. CHECK DE COHERENCIA

- Se confirma que **no se rompe arquitectura hexagonal**.
- Se confirma que **no se rompe separación dominio/aplicación/infrastructure**.
- Se confirma que **no se alteran invariantes de negocio**.
