-- Backfill relations.entities for ZCM projects that never got their entity created.
--
-- create_entity('zcm', ...) is only called from Service.createProject()
-- (packages/backend/services/project/index.js), added in commit cf2f162d
-- ("create or update entity for all perspectives", 2026-03-24). Projects created
-- before that date never got an entity row, and any project creation where
-- create_entity() fails after projetos/dorothy_communities already committed
-- (no transaction wraps the steps) is silently left in the same orphaned state.
--
-- Without a relations.entities row:
--   - GET /project/:id/verify throws (services/entity/index.js:598,
--     "Cannot read properties of undefined (reading 'id')")
--   - the org-proponent relation can never be created for that project
--     (services/project/index.js saveDraftInfo silently skips createRelation
--     when getEntityBySpecificId returns null)
--
-- Safe to re-run: only inserts for projects that still have no matching entity.

SELECT create_entity('zcm', p.id, COALESCE(p.nome, 'ZCM #' || p.id))
FROM projetos p
LEFT JOIN relations.entities e
  ON e.entity_type = 'zcm' AND e.entity_id = p.id
WHERE e.id IS NULL;
