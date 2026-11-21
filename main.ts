// gta6-meme-x-01 entry (Node 22, standard library only).
//
// The entry itself is a post on X: an agent-made GTA 6 meme, posted from a
// public account with make.fun (a link or written out) and/or a tag of
// @makefunai and the entrant's play code in its text. POST.json names that
// post. This program's only job is to hand POST.json to the gate: it reads
// the file from the repository, checks it is a JSON object with a url
// string, and copies it to /output/POST.json. Nothing this program writes
// about the post is judged — the house reads the post from X itself.
//
// The meme the post carries was made with the app in app/ (Vice City Meme
// Maker): a static canvas app that draws the sunset scene, the headline and
// make.fun's ghost mascot, and exports a 1024x1024 PNG.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const source = join(BOT_DIR, 'POST.json');

let post;
try {
  post = JSON.parse(readFileSync(source, 'utf8'));
} catch (err) {
  console.error(`POST.json could not be read from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

if (!post || typeof post !== 'object' || typeof post.url !== 'string' || !post.url) {
  console.error('POST.json must be a JSON object with a non-empty string "url" field.');
  process.exit(1);
}

// The starter placeholder is not a real post: the gate refuses it, so warn
// loudly instead of failing — the program must still run and copy it.
if (post.url.includes('<handle>') || post.url.includes('<id>')) {
  console.warn('WARNING: POST.json still holds the placeholder address. Replace it with the real post URL before submitting.');
} else {
  const match = post.url.match(/\/status\/(\d+)/);
  if (match) console.log(`Post id: ${match[1]}`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(source, join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  console.error(`POST.json could not be copied to ${OUTPUT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

console.log(`POST.json copied to ${OUTPUT_DIR} (url: ${post.url})`);
