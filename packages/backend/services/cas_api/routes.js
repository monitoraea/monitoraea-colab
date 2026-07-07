// Mounts @community-assistant/server's generic entity/schema CRUD router at
// /cas_api (auto-mounted here by the per-service loop in services/routes.js,
// since 'cas_api' is listed in services/index.js).
//
// No auth wrapper: createCASRouter has no auth check of its own by design
// (same as how apps/example mounts it in the CAS repo) — this phase is a
// single internal admin form behind the app's own login gate, not a
// public/multi-tenant surface yet. Revisit once WG-based access control
// (a later phase) is wired in.

const path = require("path");
const express = require("express");
const { createCASRouter } = require("@community-assistant/server");
const db = require("../cas_db");
const { getEntityTable, relationHandlers } = require("../cas_registry");

const router = express.Router();

const uploadDir = path.resolve(__dirname, "../../uploads/cas");

// Credentialed-CORS handling for this router lives in index.js (registered
// ahead of the app-wide `cors()`, which would otherwise terminate every
// OPTIONS preflight itself before it ever reaches this nested router) — see
// the comment there for why.

router.use(
  "/uploads",
  express.static(uploadDir)
);

router.use(
  createCASRouter({
    db,
    schemaDir: path.resolve(__dirname, "../../../community-assistant-schema"),
    uploadDir,
    registry: { getEntityTable, relationHandlers },
  })
);

module.exports = router;
