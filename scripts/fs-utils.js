import fs from "node:fs";
import path from "node:path";

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function copyFileWithDirs(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

export function backupFile(source, backupRoot, label) {
  if (!fs.existsSync(source)) {
    throw new Error(`Cannot back up missing file: ${source}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupRoot, stamp, label);
  copyFileWithDirs(source, target);
  return target;
}

export function latestBackup(backupRoot, label) {
  if (!fs.existsSync(backupRoot)) {
    return null;
  }

  const candidates = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupRoot, entry.name, label))
    .filter((candidate) => fs.existsSync(candidate))
    .sort();

  return candidates.at(-1) ?? null;
}

export function earliestBackup(backupRoot, label) {
  if (!fs.existsSync(backupRoot)) {
    return null;
  }

  const candidates = fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupRoot, entry.name, label))
    .filter((candidate) => fs.existsSync(candidate))
    .sort();

  return candidates.at(0) ?? null;
}
