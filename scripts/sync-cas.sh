#!/bin/bash
# Syncs vendored @community-assistant/* packages + schema/ from the live CAS
# repo into this repo, mirroring how packages/dorothy-dna-services is vendored.
#
# Run manually whenever pulling in CAS updates, and before each Docker build
# (the Docker build context only sees files already committed inside this
# repo, not the CAS repo living elsewhere on the host).
#
# Each vendored package is rebuilt in the CAS repo first, so the vendored
# copy's dist/ is immediately require()-able without a TypeScript toolchain
# here.

set -euo pipefail

CAS_REPO="/home/ricardo-zylbergeld/projects/CAS/DEV"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building CAS packages..."
(cd "$CAS_REPO/packages/backend" && pnpm run build) || true   # dts step fails harmlessly today; dist/lib.js still gets written
(cd "$CAS_REPO/packages/frontend" && pnpm run build)
(cd "$CAS_REPO/packages/schema-gen" && pnpm run build)

echo "Syncing @community-assistant/server -> packages/community-assistant-server"
rsync -a --delete --exclude node_modules --exclude uploads \
  "$CAS_REPO/packages/backend/" "$REPO_ROOT/packages/community-assistant-server/"

echo "Syncing @community-assistant/client -> packages/community-assistant-client"
rsync -a --delete --exclude node_modules \
  "$CAS_REPO/packages/frontend/" "$REPO_ROOT/packages/community-assistant-client/"

echo "Syncing @community-assistant/schema-gen -> packages/community-assistant-schema-gen"
rsync -a --delete --exclude node_modules \
  "$CAS_REPO/packages/schema-gen/" "$REPO_ROOT/packages/community-assistant-schema-gen/"

# Unlike server/client, schema-gen is invoked directly via absolute path
# (node .../dist/index.js), not required as an npm dependency of another
# package — so it needs its own real node_modules for its runtime deps
# (js-yaml, glob), which the rsync above deliberately excludes.
echo "Installing community-assistant-schema-gen's own runtime dependencies..."
(cd "$REPO_ROOT/packages/community-assistant-schema-gen" && pnpm install --prod --no-lockfile)

# packages/community-assistant-schema is NOT synced here (deliberately, as of
# this script's D.4 revision). It's now an independently owned copy — seeded
# once from the CAS repo's schema/colegiado, evolved directly inside
# monitoraea-colab from here on (the rest of Part B: remaining colegiado
# fields, the 18 indicator FDs, etc.). Re-running this script will never
# touch or overwrite it again. Regenerate db/generated/+the registry after
# editing it via `pnpm run schema-gen` from packages/backend
# (packages/backend/scripts/generate-cas-schema.js).

# @community-assistant/core is a pnpm "workspace:^" dependency that only
# resolves inside the CAS monorepo itself. It's harmless to drop here: the
# server package's build inlines it (tsup noExternal), and the client
# package only ever references it via `import type` (erased at compile
# time) — so neither vendored copy actually needs it installed as a real
# package outside the CAS workspace.
echo "Stripping workspace-only @community-assistant/core dependency from vendored package.json files..."
for pkg in community-assistant-server community-assistant-client; do
  jq 'del(.dependencies["@community-assistant/core"])' \
    "$REPO_ROOT/packages/$pkg/package.json" > "$REPO_ROOT/packages/$pkg/package.json.tmp"
  mv "$REPO_ROOT/packages/$pkg/package.json.tmp" "$REPO_ROOT/packages/$pkg/package.json"
done

echo "Done. Re-run 'pnpm install' in packages/backend and packages/front to pick up any dependency changes."
