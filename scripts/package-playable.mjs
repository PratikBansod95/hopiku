import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const outDir = join(root, "playable-package");
const outZip = join(root, "hopiku-playable.zip");

if (!existsSync(dist)) {
  console.error("Run npm run build first.");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(dist, outDir, { recursive: true });

console.log("Playable package ready at:", outDir);
console.log("Zip the CONTENTS of playable-package/ (index.html at root) for YouTube upload.");
console.log("");
console.log("PowerShell:");
console.log(`  Compress-Archive -Path "${join(outDir, "*")}" -DestinationPath "${outZip}" -Force`);
