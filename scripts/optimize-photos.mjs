import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputDir = path.join(process.cwd(), "public", "wedding");
const files = fs
  .readdirSync(inputDir)
  .filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.includes(" 2."));

let before = 0;
let after = 0;
const webpNames = [];

for (const file of files) {
  const input = path.join(inputDir, file);
  const base = file.replace(/\.(jpe?g|png)$/i, "");
  const output = path.join(inputDir, `${base}.webp`);
  const stat = fs.statSync(input);
  before += stat.size;

  // Hero candidates a bit larger; others more aggressive
  const isHeroish = /7646|7656|7669|7670|7683/i.test(file);
  const width = isHeroish ? 1400 : 900;
  const quality = isHeroish ? 72 : 65;

  await sharp(input)
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output);

  after += fs.statSync(output).size;
  webpNames.push(`/wedding/${base}.webp`);
  console.log(`✓ ${file} -> ${base}.webp`);
}

// Remove heavy originals after successful conversion
for (const file of files) {
  fs.unlinkSync(path.join(inputDir, file));
}

fs.writeFileSync(
  path.join(inputDir, "manifest.json"),
  JSON.stringify(webpNames.sort(), null, 2),
);

console.log("\nBefore:", (before / 1024 / 1024).toFixed(1), "MB");
console.log("After:", (after / 1024 / 1024).toFixed(1), "MB");
console.log("Saved:", ((1 - after / before) * 100).toFixed(0), "%");
console.log("Count:", webpNames.length);
