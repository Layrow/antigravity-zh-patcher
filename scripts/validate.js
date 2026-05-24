import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { workspaceRoot } from "./paths.js";

const checks = [];

function listFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath, predicate);
      return predicate(fullPath) ? [fullPath] : [];
    });
}

function run(label, command, args) {
  checks.push(label);
  execFileSync(command, args, {
    cwd: workspaceRoot,
    stdio: "inherit"
  });
}

function validateJson(file) {
  checks.push(`json ${path.relative(workspaceRoot, file)}`);
  JSON.parse(fs.readFileSync(file, "utf8"));
}

for (const file of listFiles(path.join(workspaceRoot, "scripts"), (file) => file.endsWith(".js"))) {
  run(`node --check ${path.relative(workspaceRoot, file)}`, "node", ["--check", file]);
}

for (const file of listFiles(path.join(workspaceRoot, "scripts"), (file) => file.endsWith(".sh"))) {
  run(`bash -n ${path.relative(workspaceRoot, file)}`, "bash", ["-n", file]);
}

validateJson(path.join(workspaceRoot, "package.json"));
for (const file of listFiles(path.join(workspaceRoot, "translations"), (file) => file.endsWith(".json"))) {
  validateJson(file);
}

console.log(`\n验证通过：${checks.length} 项检查。`);
