// Build the static deploy bundle. The game needs NO compilation — this just copies the
// runtime files (index.html + src/ + styles/) into dist/, leaving node_modules, tests, docs,
// and tooling out of the published artifact. AWS Amplify (and any static host) publishes dist/.
// Usage: node tools/build.mjs
import { rm, mkdir, cp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

// Exactly the files the browser loads at runtime.
const RUNTIME = ['index.html', 'src', 'styles'];

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  for (const entry of RUNTIME) {
    await cp(join(ROOT, entry), join(DIST, entry), { recursive: true });
  }

  const listed = await readdir(DIST);
  console.log(`Built static bundle → dist/  (${listed.join(', ')})`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
