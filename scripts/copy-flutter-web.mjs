import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const source = resolve('apps/anantha_app/build/web');
const target = resolve('public/app');

if (!existsSync(source)) {
  console.error('Flutter web build not found. Run: cd apps/anantha_app && flutter build web --release --base-href=/app/');
  process.exit(1);
}

const stripDebugArtifacts = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      stripDebugArtifacts(full);
      continue;
    }
    if (
      entry.endsWith('.symbols') ||
      entry.endsWith('.map') ||
      entry === 'flutter_service_worker.js'
    ) {
      rmSync(full, { force: true });
    }
  }
};

mkdirSync(dirname(target), { recursive: true });
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
stripDebugArtifacts(target);
console.log(`Copied Flutter web build to ${target}`);
