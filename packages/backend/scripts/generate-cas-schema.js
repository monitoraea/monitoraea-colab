// Generates MEA's own entity tables + registry from
// packages/community-assistant-schema, via the vendored schema-gen CLI.
//
// schema-gen emits TypeScript/ESM (import/export, a couple of minimal type
// annotations) — fine for the CAS monorepo's own TS/ts-node tooling, but
// this backend is plain CommonJS JS with no TS toolchain at all. So this
// script runs the CLI to produce .ts files, then transpiles each one to CJS
// with esbuild and deletes the .ts source, leaving only require()-able .js.
//
// Run via `pnpm run schema-gen` from packages/backend whenever
// packages/community-assistant-schema changes.

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCHEMA_DIR = path.join(REPO_ROOT, 'packages/community-assistant-schema');
const SCHEMA_GEN_BIN = path.join(REPO_ROOT, 'packages/community-assistant-schema-gen/dist/index.js');
const OUT_DIR = path.join(REPO_ROOT, 'packages/backend/db/generated');
const REGISTRY_TS = path.join(REPO_ROOT, 'packages/backend/services/cas_registry.ts');

console.log('Running schema-gen against packages/community-assistant-schema...');
execFileSync('node', [
  SCHEMA_GEN_BIN, 'generate',
  '--schema', SCHEMA_DIR,
  '--out', OUT_DIR,
  '--registry', REGISTRY_TS,
  '--server-import', '@community-assistant/server',
], { stdio: 'inherit' });

function transpileToCjs(tsFile) {
  const src = fs.readFileSync(tsFile, 'utf-8');
  const { code } = esbuild.transformSync(src, {
    loader: 'ts',
    format: 'cjs',
    target: 'node18',
  });
  const jsFile = tsFile.replace(/\.ts$/, '.js');
  fs.writeFileSync(jsFile, code, 'utf-8');
  fs.unlinkSync(tsFile);
  console.log(`  ${path.relative(REPO_ROOT, tsFile)} -> ${path.relative(REPO_ROOT, jsFile)}`);
}

console.log('Transpiling generated .ts output to plain CommonJS .js...');
for (const name of fs.readdirSync(OUT_DIR)) {
  if (name.endsWith('.ts')) transpileToCjs(path.join(OUT_DIR, name));
}
transpileToCjs(REGISTRY_TS);

console.log('Done. See packages/backend/db/generated/*.js and packages/backend/services/cas_registry.js');
