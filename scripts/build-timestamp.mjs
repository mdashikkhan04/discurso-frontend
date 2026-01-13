import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const unixTimestamp = Date.now();
const filePath = path.join(__dirname, "../public/build-timestamp.json");

fs.writeFileSync(
  filePath,
  JSON.stringify({ buildTime: unixTimestamp }),
  "utf-8"
);
console.log(
  `Build timestamp written: ${new Date(unixTimestamp).toLocaleString()}`
);
