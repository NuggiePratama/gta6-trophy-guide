// Leonida Trophy Guide: the hand-in program (Node 22, standard library only).
// The guide itself is plain static files in app/ — an offline checklist and
// roadmap for the 55 GTA VI trophies that opens at app/index.html. This
// program copies app/ and screenshots/ from beside this file into the output
// directory and writes output/dossier.json, the summary the judge reads
// (screenshots, first-load bytes, and the source outline), using the vendored
// make.fun library. Leave vendor/makefun-frontend.ts exactly as the kit
// shipped it: the scorer rebuilds the dossier with its own copy and compares
// the two byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const shotsDir = join(repoRoot, 'screenshots');

function clearContentsOnly(dir) {
  // Empty the directory's contents, never the directory itself: the grader
  // hands us the directory and expects it to still be there afterwards.
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handIn() {
  clearContentsOnly(destination);
  cpSync(join(repoRoot, 'app'), join(destination, 'app'), { recursive: true });
  const outShots = join(destination, 'screenshots');
  mkdirSync(outShots, { recursive: true });
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, outShots, { recursive: true });
  }
  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
  // the bytes; the others refuse an entry the scorer would refuse (more than
  // 4 screenshots or one over 256 KiB; more than 993 files and directories
  // in app/ or 48 MiB of app files: app/ counts beside /output's own
  // 1000-entry cap, its screenshots/ and dossier.json).
  const dossier = buildDossier(destination, DOSSIER_CAPS);
  writeFileSync(join(destination, 'dossier.json'), dossier);
}

handIn();
