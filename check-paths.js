
import fs from 'fs';
import path from 'path';

const pathsToCheck = [
  '/mnt/data',
  '/mnt',
  '/app',
  '/app/applet',
  '/app/applet/mnt',
  process.cwd(),
  path.join(process.cwd(), 'mnt'),
  path.join(process.cwd(), 'data'),
];

for (const p of pathsToCheck) {
  try {
    if (fs.existsSync(p)) {
      const stats = fs.statSync(p);
      if (stats.isDirectory()) {
        console.log(`[DIR]  ${p} exists. Contents:`, fs.readdirSync(p));
      } else {
        console.log(`[FILE] ${p} exists.`);
      }
    } else {
      console.log(`[NONE] ${p} does not exist.`);
    }
  } catch (err) {
    console.log(`[ERR]  ${p}: ${err.message}`);
  }
}
