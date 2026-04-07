# Parafarm Neroli, fase 4

Dashboard real conectado a Supabase, sobre la base segura de la fase 2.

## Qué incluye esta fase

- dashboard con consultas reales a gastos, facturas y cuentas
- KPIs calculados por negocio activo
- lista real de facturas a vigilar en ventana de 15 días
- actividad reciente leída desde `account_entries`
- saldos agregados por cuenta y saldo total disponible
- estados vacíos limpios cuando aún no hay datos operativos
- mejora visual del shell privado, topbar, sidebar y cards del panel
- scripts opcionales para cargar y borrar datos demo

## Archivos principales nuevos o revisados

- `src/features/dashboard/queries.ts`
- `src/features/dashboard/mappers.ts`
- `src/features/dashboard/types.ts`
- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/*`
- `supabase/sql/phase3-demo-seed.optional.sql`
- `supabase/sql/phase3-demo-reset.optional.sql`

## Cómo usar esta fase

1. Mantén la base de la fase 2.
2. Sustituye el proyecto por este pack.
3. Ejecuta:

```bash
npm install
npm run build
npm run dev
```

## Si aún no tienes datos reales

La app mostrará estados vacíos elegantes. Eso es normal.

Como todavía no está hecha la fase completa de formularios de gastos y facturas, te dejo dos scripts opcionales para probar el dashboard con datos demo.

### Cargar demo opcional

1. Abre `supabase/sql/phase3-demo-seed.optional.sql`
2. Sustituye `[REPLACE_WITH_BUSINESS_SLUG]`
3. Ejecuta el script en SQL Editor

### Borrar demo opcional

1. Abre `supabase/sql/phase3-demo-reset.optional.sql`
2. Sustituye `[REPLACE_WITH_BUSINESS_SLUG]`
3. Ejecuta el script

## Qué queda para la fase 4

- CRUD real de gastos
- formulario de alta y edición
- filtros y tabla operativa
- adjuntos de gasto
- conexión directa del módulo con el dashboard
