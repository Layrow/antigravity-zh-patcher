import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createPackageWithOptions, extractAll, extractFile } from "@electron/asar";
import { backupRoot, resources, workspaceRoot } from "./paths.js";
import { backupFile, earliestBackup, ensureDir, readJson } from "./fs-utils.js";
import { buildSettingsDomTranslator } from "./settings-dom-translator.js";

const translations = readJson(path.join(workspaceRoot, "translations/antigravity-shell.zh-CN.json"));
const settingsTranslations = readJson(path.join(workspaceRoot, "translations/settings-dom.zh-CN.json"));
const distDir = path.join(workspaceRoot, "dist");
const distAsar = path.join(distDir, "antigravity-app.zh-CN.asar");
const filesToPatch = [
  "dist/main.js",
  "dist/menu.js",
  "dist/tray.js",
  "dist/loadingOverlay.js",
  "dist/ideInstall/constants.js",
  "dist/ideInstall/service.js",
  "dist/ideInstall/wizardHtml.js",
  "dist/ipcHandlers.js",
  "dist/updater.js"
];

function replaceLiteral(source, from, to) {
  const singleFrom = `'${from.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
  const singleTo = `'${to.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
  const doubleFrom = JSON.stringify(from);
  const doubleTo = JSON.stringify(to);
  const templateFrom = `\`${from.replaceAll("\\", "\\\\").replaceAll("`", "\\`")}\``;
  const templateTo = `\`${to.replaceAll("\\", "\\\\").replaceAll("`", "\\`")}\``;

  return source
    .split(singleFrom)
    .join(singleTo)
    .split(doubleFrom)
    .join(doubleTo)
    .split(templateFrom)
    .join(templateTo);
}

function countLiteral(source, from) {
  const singleFrom = `'${from.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
  const doubleFrom = JSON.stringify(from);
  const templateFrom = `\`${from.replaceAll("\\", "\\\\").replaceAll("`", "\\`")}\``;
  return (
    source.split(singleFrom).length -
    1 +
    source.split(doubleFrom).length -
    1 +
    source.split(templateFrom).length -
    1
  );
}

function injectSettingsTranslator(unpackedDir) {
  const file = path.join(unpackedDir, "dist/utils.js");
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("antigravityZhSettingsTranslator")) {
    return false;
  }

  const translatorSource = buildSettingsDomTranslator(settingsTranslations);
  const snippet = `
    const antigravityZhSettingsTranslator = ${JSON.stringify(translatorSource)};
    win.webContents.on('did-finish-load', () => {
        void win.webContents.executeJavaScript(antigravityZhSettingsTranslator, true).catch((err) => {
            console.error('[Antigravity zh] Settings translator failed:', err);
        });
    });
`;
  const marker = "    void win.loadURL(url);\n    return win;";
  if (!content.includes(marker)) {
    throw new Error("Could not find createWindow loadURL marker in dist/utils.js");
  }

  content = content.replace(marker, `${snippet}    void win.loadURL(url);\n    return win;`);
  fs.writeFileSync(file, content);
  return true;
}

function assertWritableApp() {
  if (!fs.existsSync(resources.antigravityAsar)) {
    throw new Error(`app.asar not found: ${resources.antigravityAsar}`);
  }
}

function ensureUnpackedSidecar(sourceAsar) {
  const expected = `${sourceAsar}.unpacked`;
  if (fs.existsSync(expected)) {
    return;
  }

  const appUnpacked = `${resources.antigravityAsar}.unpacked`;
  if (!fs.existsSync(appUnpacked)) {
    return;
  }

  fs.symlinkSync(appUnpacked, expected, "dir");
  console.log(`已为备份 asar 创建 unpacked 软链接: ${expected}`);
}

function isPatchedAsar(asarPath) {
  try {
    const utils = extractFile(asarPath, "dist/utils.js").toString("utf8");
    const menu = extractFile(asarPath, "dist/menu.js").toString("utf8");
    const loading = extractFile(asarPath, "dist/loadingOverlay.js").toString("utf8");
    return (
      utils.includes("antigravityZhSettingsTranslator") ||
      menu.includes("新建窗口") ||
      loading.includes("正在启动 Antigravity") ||
      loading.includes("正在加载 Antigravity")
    );
  } catch {
    return false;
  }
}

function findLatestCleanBackup() {
  if (!fs.existsSync(backupRoot)) {
    return null;
  }

  return fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(backupRoot, entry.name, "antigravity-app.asar"))
    .filter((candidate) => fs.existsSync(candidate))
    .sort()
    .reverse()
    .find((candidate) => !isPatchedAsar(candidate)) ?? null;
}

function chooseSourceAsar() {
  if (process.env.ANTIGRAVITY_ZH_SOURCE_ASAR) {
    return process.env.ANTIGRAVITY_ZH_SOURCE_ASAR;
  }

  if (!isPatchedAsar(resources.antigravityAsar)) {
    return resources.antigravityAsar;
  }

  return findLatestCleanBackup() ?? earliestBackup(backupRoot, "antigravity-app.asar") ?? resources.antigravityAsar;
}

function isRunning() {
  try {
    const out = execFileSync("pgrep", ["-if", "/Applications/Antigravity.app|Contents/MacOS/Antigravity"], {
      encoding: "utf8"
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

assertWritableApp();
ensureDir(backupRoot);

if (isRunning()) {
  console.warn("检测到 Antigravity.app 可能正在运行。补丁仍会写入磁盘，但需要完全退出并重新打开后才会生效。");
}

const backup = backupFile(resources.antigravityAsar, backupRoot, "antigravity-app.asar");
console.log(`已备份 app.asar: ${backup}`);
const sourceAsar = chooseSourceAsar();
if (sourceAsar !== resources.antigravityAsar) {
  console.log(`使用备份作为补丁源: ${sourceAsar}`);
  ensureUnpackedSidecar(sourceAsar);
} else {
  console.log(`使用当前 app.asar 作为补丁源: ${sourceAsar}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "antigravity-shell-"));
const unpackedDir = path.join(tempDir, "app");
const patchedAsar = path.join(tempDir, "app.asar");

extractAll(sourceAsar, unpackedDir);

let changedFiles = 0;
let replacements = 0;

for (const relativeFile of filesToPatch) {
  const file = path.join(unpackedDir, relativeFile);
  if (!fs.existsSync(file)) {
    continue;
  }

  let content = fs.readFileSync(file, "utf8");
  const before = content;

  for (const [from, to] of Object.entries(translations)) {
    const count = countLiteral(content, from);
    if (count > 0) {
      content = replaceLiteral(content, from, to);
      replacements += count;
    }
  }

  if (content !== before) {
    fs.writeFileSync(file, content);
    changedFiles += 1;
  }
}

if (injectSettingsTranslator(unpackedDir)) {
  changedFiles += 1;
  replacements += Object.keys(settingsTranslations).length;
}

if (changedFiles === 0) {
  console.log("未发现可替换的壳层文案，未写入新 asar。");
  process.exit(0);
}

await createPackageWithOptions(unpackedDir, patchedAsar, {
  unpack: "{**/*.node,**/bin/**}"
});

ensureDir(distDir);
fs.copyFileSync(patchedAsar, distAsar);

if (process.env.ANTIGRAVITY_ZH_GENERATE_ONLY === "1") {
  console.log(`已生成补丁文件：${distAsar}`);
  console.log("已按要求跳过直接写入 /Applications。");
  process.exit(0);
}

try {
  fs.copyFileSync(patchedAsar, resources.antigravityAsar);
  console.log(`已写入 Antigravity 壳层汉化：${changedFiles} 个文件，${replacements} 处替换。`);
  console.log("请完全退出并重新打开 Antigravity.app 后验证。");
} catch (error) {
  console.warn(`无法直接写入 ${resources.antigravityAsar}: ${error.code ?? error.message}`);
  console.warn(`已生成补丁文件：${distAsar}`);
  console.warn("可在退出 Antigravity 后手动安装：");
  console.warn(`sudo cp "${distAsar}" "${resources.antigravityAsar}"`);
}
