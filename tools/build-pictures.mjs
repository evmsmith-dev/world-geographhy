// Builds the landmark drawings in assets/landmarks/ (one SVG file for each landmark) from tools/pictures/*.mjs.
// Usage: node tools/build-pictures.mjs   (no packages needed)
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {frame, slug} from './pictures/common.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'assets', 'landmarks');
const parts = ['europe', 'africa', 'asia', 'oceania', 'namerica', 'samerica', 'usa'];
fs.mkdirSync(out, {recursive: true});
let n = 0;
for(const p of parts){
  const file = path.join(here, 'pictures', p + '.mjs');
  if(!fs.existsSync(file)) continue;
  const drawings = (await import(file)).default;
  for(const [name, [sky, body]] of Object.entries(drawings)){
    fs.writeFileSync(path.join(out, slug(name) + '.svg'), frame(name, sky, body)); n++;
  }
}
console.log(`${n} drawings written to assets/landmarks/`);
