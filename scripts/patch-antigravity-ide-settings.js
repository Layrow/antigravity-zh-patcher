import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { backupRoot, resources, workspaceRoot } from "./paths.js";
import { backupFile, ensureDir, readJson } from "./fs-utils.js";
import { buildSettingsDomTranslator } from "./settings-dom-translator.js";

const markerStart = "/* antigravityIdeSettingsDomTranslator:start */";
const markerEnd = "/* antigravityIdeSettingsDomTranslator:end */";
const distDir = path.join(workspaceRoot, "dist/ide-settings");
const settingsTranslations = readJson(path.join(workspaceRoot, "translations/antigravity-ide-settings-dom.zh-CN.json"));
const nlsOverrides = readJson(path.join(workspaceRoot, "translations/antigravity-ide-overrides.zh-CN.json"));

const pendingInstalls = [];

function replaceManagedBlock(source, block) {
  const start = source.indexOf(markerStart);
  const end = source.indexOf(markerEnd);
  if (start >= 0 && end > start) {
    return `${source.slice(0, start)}${block}${source.slice(end + markerEnd.length)}`;
  }

  return `${block}\n${source}`;
}

function patchSettingsDomTranslator() {
  if (!fs.existsSync(resources.ideAgentBundle)) {
    throw new Error(`Antigravity IDE agent bundle not found: ${resources.ideAgentBundle}`);
  }

  const backup = backupFile(resources.ideAgentBundle, backupRoot, "ide-jetskiAgent-main.js");
  console.log(`已备份 IDE Settings bundle: ${backup}`);

  const translator = buildSettingsDomTranslator(settingsTranslations);
  const block = `${markerStart}\n${translator}\n${markerEnd}`;
  const original = fs.readFileSync(resources.ideAgentBundle, "utf8");
  const next = replaceManagedBlock(original, block);
  if (next === original) {
    console.log("IDE Settings DOM 翻译注入已是最新。");
    return false;
  }

  writeTargetOrDist(resources.ideAgentBundle, path.join(distDir, "jetskiAgent-main.js"), next, "IDE Settings DOM 翻译");
  return true;
}

function patchNlsMessages() {
  if (!fs.existsSync(resources.ideNlsKeys) || !fs.existsSync(resources.ideNlsMessages)) {
    throw new Error("Antigravity IDE NLS files not found.");
  }

  const backup = backupFile(resources.ideNlsMessages, backupRoot, "ide-nls.messages.json");
  console.log(`已备份 IDE NLS messages: ${backup}`);

  const keys = readJson(resources.ideNlsKeys);
  const messages = readJson(resources.ideNlsMessages);
  let index = 0;
  let patched = 0;

  for (const [moduleName, moduleKeys] of keys) {
    const moduleOverrides = nlsOverrides[moduleName];
    for (const key of moduleKeys) {
      const next = moduleOverrides?.[key];
      if (typeof next === "string" && messages[index] !== next) {
        messages[index] = next;
        patched += 1;
      }
      index += 1;
    }
  }

  if (patched > 0) {
    writeTargetOrDist(resources.ideNlsMessages, path.join(distDir, "nls.messages.json"), JSON.stringify(messages), "IDE NLS messages");
  }
  console.log(`已更新 IDE NLS messages: ${patched} 处`);
  return patched > 0;
}

function writeTargetOrDist(target, fallback, content, label) {
  try {
    fs.writeFileSync(target, content, "utf8");
    console.log(`已写入 ${label}: ${target}`);
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") {
      throw error;
    }

    ensureDir(path.dirname(fallback));
    fs.writeFileSync(fallback, content, "utf8");
    pendingInstalls.push({ fallback, target });
    console.warn(`无法直接写入 ${target}: ${error.code}`);
    console.warn(`已生成待安装文件: ${fallback}`);
  }
}

function isIdeRunning() {
  try {
    return execFileSync("pgrep", ["-if", "Antigravity IDE|antigravity-ide"], { encoding: "utf8" }).trim().length > 0;
  } catch {
    return false;
  }
}

ensureDir(backupRoot);

const running = await isIdeRunning();
if (running) {
  console.warn("检测到 Antigravity IDE 可能正在运行。补丁会写入磁盘，但需要完全退出并重新打开后才会生效。");
}

const domChanged = patchSettingsDomTranslator();
const nlsChanged = patchNlsMessages();

if (!domChanged && !nlsChanged) {
  console.log("IDE Settings 汉化补丁已是最新。");
} else {
  console.log("IDE Settings 汉化补丁完成。请完全退出并重新打开 Antigravity IDE。");
}

if (pendingInstalls.length > 0) {
  console.warn("需要管理员权限安装以下文件：");
  for (const item of pendingInstalls) {
    console.warn(`sudo cp "${item.fallback}" "${item.target}"`);
  }
}
