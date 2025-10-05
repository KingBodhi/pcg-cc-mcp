# Phase 1 – Brand Projects 2.0

_Date: October 2, 2025_

Phase 1 delivers the first production slice for brand projects, introducing structured pods, an asset catalog, and pod-aware tasks. These capabilities build on the Phase 0 storage foundations and unlock the rest of the roadmap (agents, social suite, client portal).

## What Shipped

### Database & Backend
- New `project_pods` and `project_assets` tables with SQLx models, migrations, and CRUD routes (`/api/projects/:id/pods`, `/api/projects/:id/assets`).
- Tasks can now reference pods (`tasks.pod_id`). All task routes enforce pod/project correspondence and emit updated types.
- `generate_types` includes the new models so TypeScript stays in sync.

### Frontend
- Task creation/edit dialogs support selecting a pod; the create & start flow respects pod context.
- Project detail view surfaces pods and assets with inline create/delete flows.
- Brand assets table now links assets to pods, tracks scopes/categories, and provides quick removal.

### Developer Experience
- `sqlx` cache regenerated (`cargo sqlx prepare`), so offline builds succeed.
- TypeScript + Rust checks run cleanly (`cargo check`, `pnpm run frontend:check`).

## Migration & Rollout Checklist

1. **Apply migrations**
   ```bash
   sqlx migrate run
   ```
   (Generated schema file: `crates/db/migrations/20251002090000_create_project_pods_and_assets.sql`)

2. **Regenerate types**
   ```bash
   cargo run --bin generate_types
   ```

3. **Rebuild frontend** to pick up new task form fields.

4. **Seed data** (optional): create pods per brand engagement, then backfill assets (logos, guides, transcripts) via the new dialog or API routes.

## Next Steps
- Harden pod role-based access (Phase 2 wallet & permissions).
- Extend asset ingestion to cover call transcripts and automation outputs.
- Wire pods into task board filters and reporting.

