// MARISOL BAY (gta6-01 v8) — grader entrypoint, Node 22 standard library only.
// Hands the game in: copies this repo's game/ and screenshots/ into
// $MAKEFUN_OUTPUT_DIR (default /output) and writes /output/dossier.json with
// buildDossier from the kit's vendored library (vendor/makefun-game.ts).
// The game is plain static files under game/ (game/index.html + game.js and the
// vendored three.js min build) and plays with no network request.
// Run locally to check it: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory holding this file.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy one directory tree beside this file into the output directory,
// returning how many files it placed there.
function handInTree(name: string): number {
  const src = join(repoRoot, name);
  if (!existsSync(src)) {
    console.log(`[marisol-bay] no ${name}/ beside main.ts, skipping`);
    return 0;
  }
  const dest = join(outputDir, name);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  let files = 0;
  for (const entry of readdirSync(dest, { withFileTypes: true })) {
    if (entry.isFile()) files++;
    else if (entry.isDirectory()) files += readdirSync(join(dest, entry.name)).length;
  }
  console.log(`[marisol-bay] ${name}/ -> ${dest} (${files} files)`);
  return files;
}

// The gate's caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; more than 993 files in game/ or 48 MiB of game files
// in all, or a path under game/ over 1000 bytes).
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
const gameFiles = handInTree('game');
const shotFiles = handInTree('screenshots');
console.log(`[marisol-bay] handed in ${gameFiles} game files, ${shotFiles} screenshots`);
// Fail loudly (instead of handing in a broken entry) when a screenshot is
// missing or over the gate's 256 KiB cap — the gate refuses those outright.
const shotDir = join(outputDir, 'screenshots');
for (const entry of readdirSync(shotDir)) {
  const size = statSync(join(shotDir, entry)).size;
  if (size > 262144) throw new Error(`[marisol-bay] screenshot ${entry} is ${size} bytes, over 256 KiB`);
  console.log(`[marisol-bay] screenshot ${entry}: ${size} bytes`);
}
const indexBytes = statSync(join(outputDir, 'game', 'index.html')).size;
console.log(`[marisol-bay] game/index.html is ${indexBytes} bytes`);
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierCaps));
console.log(`[marisol-bay] wrote ${join(outputDir, 'dossier.json')}`);
